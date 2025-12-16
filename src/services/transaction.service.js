import mongoose from "mongoose";
import { AppError } from "../utils/appError.utils.js";
import Transaction from "../models/Transaction.moddels.js";
import Wallet from "../models/Wallet.models.js";



class TransactionService {
  // ============================================
  // CREATE TRANSACTION
  // ============================================

  async createTransaction(transactionData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { userId, type, amountInKobo, description, metadata } =
        transactionData;

      // 1. Validate amount
      if (!Number.isInteger(amountInKobo) || amountInKobo <= 0) {
        throw new AppError(
          "Invalid amount. Must be a positive integer (kobo)",
          400
        );
      }

      // 2. Generate unique reference
      const reference = Transaction.generateReference(type, userId);

      // 3. Check if reference exists (idempotency)
      const exists = await Transaction.referenceExists(reference);
      if (exists) {
        throw new AppError("Transaction reference already exists", 409);
      }

      // 4. Get wallet
      const wallet = await Wallet.findOne({ userId }).session(session);
      if (!wallet) {
        throw new AppError("Wallet not found", 404);
      }

      // 5. Check balance for DEBIT transactions
      if (type === "DEBIT" && wallet.balanceInKobo < amountInKobo) {
        throw new AppError("Insufficient wallet balance", 400);
      }

      // 6. Calculate new balance
      let newBalance = wallet.balanceInKobo;
      if (type === "CREDIT" || type === "COMMISSION" || type === "REFUND") {
        newBalance += amountInKobo;
      } else if (type === "DEBIT") {
        newBalance -= amountInKobo;
      }

      // 7. Create transaction
      const [transaction] = await Transaction.create(
        [
          {
            userId,
            type,
            amountInKobo,
            reference,
            description,
            balanceAfter: newBalance,
            metadata: {
              ...metadata,
              initiatedAt: new Date(),
            },
          },
        ],
        { session }
      );

      // 8. Update wallet balance
      wallet.balanceInKobo = newBalance;
      await wallet.save({ session });

      // 9. Commit transaction
      await session.commitTransaction();

      return transaction;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ============================================
  // UPDATE TRANSACTION STATUS
  // ============================================

  async updateTransactionStatus(transactionId, status, metadata = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await Transaction.findById(transactionId).session(
        session
      );
      if (!transaction) {
        throw new AppError("Transaction not found", 404);
      }

      if (transaction.status !== "PENDING") {
        throw new AppError("Cannot update non-pending transaction", 400);
      }

      const wallet = await Wallet.findOne({
        userId: transaction.userId,
      }).session(session);
      if (!wallet) {
        throw new AppError("Wallet not found", 404);
      }

      // Update transaction status
      transaction.status = status;
      transaction.metadata = {
        ...transaction.metadata,
        ...metadata,
      };

      if (status === "SUCCESS") {
        transaction.metadata.completedAt = new Date();
      } else if (status === "FAILED") {
        transaction.metadata.failedAt = new Date();

        // Revert wallet balance if transaction failed
        if (
          transaction.type === "CREDIT" ||
          transaction.type === "COMMISSION" ||
          transaction.type === "REFUND"
        ) {
          wallet.balanceInKobo -= transaction.amountInKobo;
        } else if (transaction.type === "DEBIT") {
          wallet.balanceInKobo += transaction.amountInKobo;
        }

        transaction.balanceAfter = wallet.balanceInKobo;
      }

      await transaction.save({ session });
      await wallet.save({ session });

      await session.commitTransaction();

      return transaction;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ============================================
  // GET TRANSACTION BY ID
  // ============================================

  async getTransactionById(transactionId) {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      throw new AppError("Invalid transaction ID", 400);
    }

    const transaction = await Transaction.findById(transactionId)
      .populate("userId", "firstName lastName email")
      .populate("metadata.propertyId", "title")
      .populate("metadata.planId", "name");

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    return transaction;
  }

  // ============================================
  // GET TRANSACTION BY REFERENCE
  // ============================================

  async getTransactionByReference(reference) {
    const transaction = await Transaction.findOne({ reference })
      .populate("userId", "firstName lastName email")
      .populate("metadata.propertyId", "title")
      .populate("metadata.planId", "name");

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    return transaction;
  }

  // ============================================
  // GET USER TRANSACTIONS
  // ============================================

  async getUserTransactions(userId, filters = {}, page = 1, limit = 20) {
    const { type, status, startDate, endDate } = filters;
    const query = { userId };

    if (type) query.type = type;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("metadata.propertyId", "title")
        .populate("metadata.planId", "name")
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 }),
      Transaction.countDocuments(query),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    };
  }

  // ============================================
  // GET ALL TRANSACTIONS (ADMIN)
  // ============================================

  async getAllTransactions(filters = {}, page = 1, limit = 20) {
    const { userId, type, status, startDate, endDate, search } = filters;
    const query = {};

    if (userId) query.userId = userId;
    if (type) query.type = type;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("userId", "firstName lastName email role")
        .populate("metadata.propertyId", "title")
        .populate("metadata.planId", "name")
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 }),
      Transaction.countDocuments(query),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    };
  }

  // ============================================
  // GET USER TRANSACTION SUMMARY
  // ============================================

  async getUserTransactionSummary(userId) {
    const summary = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "SUCCESS",
        },
      },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amountInKobo" },
          count: { $sum: 1 },
        },
      },
    ]);

    const wallet = await Wallet.findOne({ userId });

    return {
      currentBalance: wallet ? wallet.balanceInKobo : 0,
      summary,
    };
  }

  // ============================================
  // GET TRANSACTION STATISTICS (ADMIN)
  // ============================================

  async getTransactionStatistics(startDate, endDate) {
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage =
      Object.keys(dateFilter).length > 0
        ? { $match: { createdAt: dateFilter } }
        : { $match: {} };

    const [totalStats, typeStats, statusStats, recentTransactions] =
      await Promise.all([
        Transaction.aggregate([
          matchStage,
          {
            $group: {
              _id: null,
              totalTransactions: { $sum: 1 },
              totalAmount: { $sum: "$amountInKobo" },
              successfulTransactions: {
                $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, 1, 0] },
              },
              failedTransactions: {
                $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] },
              },
            },
          },
        ]),
        Transaction.aggregate([
          matchStage,
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
              totalAmount: { $sum: "$amountInKobo" },
            },
          },
        ]),
        Transaction.aggregate([
          matchStage,
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        Transaction.find()
          .populate("userId", "firstName lastName email")
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

    return {
      total: totalStats[0] || {},
      byType: typeStats,
      byStatus: statusStats,
      recentTransactions,
    };
  }

  // ============================================
  // CREDIT WALLET (FUNDING)
  // ============================================

  async creditWallet(userId, amountInKobo, description, metadata = {}) {
    return await this.createTransaction({
      userId,
      type: "CREDIT",
      amountInKobo,
      description: description || "Wallet funding",
      metadata,
    });
  }

  // ============================================
  // DEBIT WALLET (WITHDRAWAL/PAYMENT)
  // ============================================

  async debitWallet(userId, amountInKobo, description, metadata = {}) {
    return await this.createTransaction({
      userId,
      type: "DEBIT",
      amountInKobo,
      description: description || "Wallet debit",
      metadata,
    });
  }

  // ============================================
  // PAY COMMISSION
  // ============================================

  async payCommission(
    realtorId,
    amountInKobo,
    originalTransactionId,
    metadata = {}
  ) {
    return await this.createTransaction({
      userId: realtorId,
      type: "COMMISSION",
      amountInKobo,
      description: "Commission payment",
      metadata: {
        ...metadata,
        originalTransactionId,
      },
    });
  }

  // ============================================
  // REFUND TRANSACTION
  // ============================================

  async refundTransaction(
    userId,
    amountInKobo,
    originalTransactionId,
    metadata = {}
  ) {
    return await this.createTransaction({
      userId,
      type: "REFUND",
      amountInKobo,
      description: "Refund",
      metadata: {
        ...metadata,
        originalTransactionId,
      },
    });
  }

  // ============================================
  // CANCEL TRANSACTION
  // ============================================

  async cancelTransaction(transactionId) {
    return await this.updateTransactionStatus(transactionId, "CANCELLED", {
      cancelledAt: new Date(),
    });
  }
}

export default new TransactionService();
