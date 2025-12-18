import User from "../models/Auth.models.js";
import Commission from "../models/Commission.models.js";
import Property from "../models/Property.models.js";
import Transaction from "../models/Transaction.moddels.js";
import { AppError } from "../utils/appError.utils.js";

class CommissionService {
  /**
   * Calculate pending commission amount
   */
  calculatePendingCommission(commission) {
    return commission.totalCommissionInKobo - commission.paidCommissionInKobo;
  }

  /**
   * Update commission status based on paid amount
   */
  updateCommissionStatus(commission) {
    if (commission.paidCommissionInKobo >= commission.totalCommissionInKobo) {
      commission.status = "PAID";
    } else if (commission.paidCommissionInKobo > 0) {
      commission.status = "PARTIAL";
    } else {
      commission.status = "PENDING";
    }

    commission.updatedAt = new Date();
    return commission;
  }

  /**
   * Create a new commission record
   */
  async createCommission(data) {
    const commission = await Commission.create(data);
    this.updateCommissionStatus(commission);
    await commission.save();

    await commission.populate([
      { path: "realtorId", select: "firstName lastName email" },
      { path: "propertyId", select: "title priceInKobo location" },
      { path: "transactionId", select: "amount reference" },
    ]);

    return commission;
  }

  /**
   * Get all commissions with filters
   */
  async getAllCommissions(query) {
    const {
      realtorId,
      propertyId,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
    } = query;

    const filter = {};
    if (realtorId) filter.realtorId = realtorId;
    if (propertyId) filter.propertyId = propertyId;
    if (status) filter.status = status;
    if (minAmount || maxAmount) {
      filter.totalCommissionInKobo = {};
      if (minAmount) filter.totalCommissionInKobo.$gte = parseInt(minAmount);
      if (maxAmount) filter.totalCommissionInKobo.$lte = parseInt(maxAmount);
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const commissions = await Commission.find(filter)
      .populate("realtorId", "firstName lastName email")
      .populate("propertyId", "title priceInKobo")
      .populate("transactionId", "amount reference")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Commission.countDocuments(filter);
    return {
      commissions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    };
  }

  /**
   * Get commission by ID
   */
  async getCommissionById(id) {
    const commission = await Commission.findById(id)
      .populate("realtorId", "firstName lastName email phone")
      .populate("propertyId", "title priceInKobo location")
      .populate("transactionId", "amount reference status")
      .populate("withdrawalRequests.approvedBy", "firstName lastName");

    if (!commission) throw new AppError("Commission not found", 404);
    return commission;
  }

  /**
   * Get commissions for a specific realtor
   */
  async getRealtorCommissions(realtorId, query) {
    const { status, startDate, endDate, page = 1, limit = 10 } = query;

    const filter = { realtorId };
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const commissions = await Commission.find(filter)
      .populate("propertyId", "title priceInKobo")
      .populate("transactionId", "amount reference")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Commission.countDocuments(filter);

    // Calculate totals
    const totals = await Commission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$realtorId",
          totalCommission: { $sum: "$totalCommissionInKobo" },
          paidCommission: { $sum: "$paidCommissionInKobo" },
          pendingCommission: {
            $sum: {
              $subtract: ["$totalCommissionInKobo", "$paidCommissionInKobo"],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      commissions,
      totals: totals[0] || {
        totalCommission: 0,
        paidCommission: 0,
        pendingCommission: 0,
        count: 0,
      },
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    };
  }

  /**
   * Add commission payment
   */
  async addCommissionPayment(id, paymentData) {
    const { amountInKobo, paymentMethod, reference, notes } = paymentData;

    const commission = await Commission.findById(id);
    if (!commission) throw new AppError("Commission not found", 404);

    // Check if payment exceeds remaining commission
    const pendingCommission = this.calculatePendingCommission(commission);
    if (amountInKobo > pendingCommission) {
      throw new AppError(
        `Payment amount (${
          amountInKobo / 100
        } NGN) exceeds pending commission (${pendingCommission / 100} NGN)`,
        400
      );
    }

    // Add payment record
    commission.payments.push({
      amountInKobo,
      paymentMethod,
      reference,
      notes,
      paidAt: new Date(),
    });

    // Update paid amount
    commission.paidCommissionInKobo += amountInKobo;
    this.updateCommissionStatus(commission);

    await commission.save();
    return commission;
  }

  /**
   * Submit a withdrawal request
   */
  async submitWithdrawalRequest(realtorId, amountInKobo, bankDetails) {
    // Get realtor's total pending commissions
    const commissions = await Commission.find({
      realtorId,
      status: { $in: ["PENDING", "PARTIAL"] },
    });

    const totalPending = commissions.reduce((sum, comm) => {
      return sum + (comm.totalCommissionInKobo - comm.paidCommissionInKobo);
    }, 0);

    if (amountInKobo > totalPending) {
      throw new AppError(
        `Insufficient commission. Available: ${totalPending / 100} NGN`,
        400
      );
    }

    // Create withdrawal request
    const withdrawalRequest = {
      amountInKobo,
      bankDetails,
      status: "PENDING",
      requestedAt: new Date(),
    };

    // Find or create commission summary for realtor
    let commissionSummary = await Commission.findOne({
      realtorId,
      isSummary: true,
    });

    if (!commissionSummary) {
      commissionSummary = await Commission.create({
        realtorId,
        isSummary: true,
        withdrawalRequests: [withdrawalRequest],
      });
    } else {
      commissionSummary.withdrawalRequests.push(withdrawalRequest);
      await commissionSummary.save();
    }

    return commissionSummary;
  }

  /**
   * Process withdrawal request (approve/reject)
   */
  async processWithdrawalRequest(requestId, action, adminId, rejectionReason) {
    const commission = await Commission.findOne({
      "withdrawalRequests._id": requestId,
    });

    if (!commission) throw new AppError("Withdrawal request not found", 404);

    const request = commission.withdrawalRequests.id(requestId);
    if (!request) throw new AppError("Withdrawal request not found", 404);

    if (request.status !== "PENDING") {
      throw new AppError(
        `Request already ${request.status.toLowerCase()}`,
        400
      );
    }

    if (action === "APPROVE") {
      // Check if realtor has enough pending commission
      const realtorCommissions = await Commission.find({
        realtorId: commission.realtorId,
        status: { $in: ["PENDING", "PARTIAL"] },
        isSummary: { $ne: true },
      });

      const totalPending = realtorCommissions.reduce((sum, comm) => {
        return sum + (comm.totalCommissionInKobo - comm.paidCommissionInKobo);
      }, 0);

      if (request.amountInKobo > totalPending) {
        throw new AppError(
          `Realtor has insufficient pending commission. Available: ${
            totalPending / 100
          } NGN`,
          400
        );
      }

      request.status = "APPROVED";
      request.approvedBy = adminId;
      request.approvedAt = new Date();
    } else if (action === "REJECT") {
      request.status = "REJECTED";
      request.rejectionReason = rejectionReason;
      request.approvedBy = adminId;
      request.approvedAt = new Date();
    } else {
      throw new AppError("Invalid action. Use APPROVE or REJECT", 400);
    }

    await commission.save();
    return { commission, request };
  }

  /**
   * Mark withdrawal as processed/paid
   */
  async markWithdrawalProcessed(requestId, transactionId, paymentDetails) {
    const commission = await Commission.findOne({
      "withdrawalRequests._id": requestId,
    });

    if (!commission) throw new AppError("Withdrawal request not found", 404);

    const request = commission.withdrawalRequests.id(requestId);
    if (!request) throw new AppError("Withdrawal request not found", 404);

    if (request.status !== "APPROVED") {
      throw new AppError("Only approved requests can be processed", 400);
    }

    // Update withdrawal request
    request.status = "PROCESSED";
    request.processedAt = new Date();
    request.transactionId = transactionId;
    request.paymentDetails = paymentDetails;

    // Update commission payments for individual commissions
    const realtorCommissions = await Commission.find({
      realtorId: commission.realtorId,
      status: { $in: ["PENDING", "PARTIAL"] },
      isSummary: { $ne: true },
    });

    let remainingAmount = request.amountInKobo;

    for (const comm of realtorCommissions) {
      if (remainingAmount <= 0) break;

      const pending = this.calculatePendingCommission(comm);
      const paymentAmount = Math.min(pending, remainingAmount);

      if (paymentAmount > 0) {
        // Add payment to individual commission
        comm.payments.push({
          amountInKobo: paymentAmount,
          paymentMethod: "BANK_TRANSFER",
          reference: `WITHDRAWAL_${requestId}`,
          notes: `Withdrawal processed for request ${requestId}`,
          paidAt: new Date(),
        });

        comm.paidCommissionInKobo += paymentAmount;
        this.updateCommissionStatus(comm);
        await comm.save();

        remainingAmount -= paymentAmount;
      }
    }

    await commission.save();

    // Create transaction record
    const transaction = await Transaction.create({
      user: commission.realtorId,
      amount: request.amountInKobo,
      type: "COMMISSION",
      status: "SUCCESS",
      reference: `COMM_WITHDRAWAL_${requestId}`,
      description: `Commission withdrawal processed`,
      metadata: {
        withdrawalRequestId: requestId,
        paymentDetails: request.paymentDetails,
        bankDetails: request.bankDetails,
      },
    });

    return { commission, request, transaction };
  }

  /**
   * Get commission statistics
   */
  async getCommissionStats(filters = {}) {
    const { startDate, endDate, realtorId } = filters;

    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    if (realtorId) match.realtorId = realtorId;
    match.isSummary = { $ne: true };

    const stats = await Commission.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCommissions: { $sum: "$totalCommissionInKobo" },
          paidCommissions: { $sum: "$paidCommissionInKobo" },
          pendingCommissions: {
            $sum: {
              $subtract: ["$totalCommissionInKobo", "$paidCommissionInKobo"],
            },
          },
          count: { $sum: 1 },
          byStatus: {
            $push: {
              status: "$status",
              amount: "$totalCommissionInKobo",
            },
          },
        },
      },
      {
        $project: {
          totalCommissions: 1,
          paidCommissions: 1,
          pendingCommissions: 1,
          count: 1,
          byStatus: {
            $reduce: {
              input: "$byStatus",
              initialValue: { PENDING: 0, PARTIAL: 0, PAID: 0 },
              in: {
                PENDING: {
                  $cond: [
                    { $eq: ["$$this.status", "PENDING"] },
                    { $add: ["$$value.PENDING", "$$this.amount"] },
                    "$$value.PENDING",
                  ],
                },
                PARTIAL: {
                  $cond: [
                    { $eq: ["$$this.status", "PARTIAL"] },
                    { $add: ["$$value.PARTIAL", "$$this.amount"] },
                    "$$value.PARTIAL",
                  ],
                },
                PAID: {
                  $cond: [
                    { $eq: ["$$this.status", "PAID"] },
                    { $add: ["$$value.PAID", "$$this.amount"] },
                    "$$value.PAID",
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    // Get top realtors by commission
    const topRealtors = await Commission.aggregate([
      { $match: { ...match, isSummary: { $ne: true } } },
      {
        $group: {
          _id: "$realtorId",
          totalCommission: { $sum: "$totalCommissionInKobo" },
          paidCommission: { $sum: "$paidCommissionInKobo" },
          propertyCount: { $addToSet: "$propertyId" },
        },
      },
      {
        $project: {
          realtorId: "$_id",
          totalCommission: 1,
          paidCommission: 1,
          pendingCommission: {
            $subtract: ["$totalCommission", "$paidCommission"],
          },
          propertyCount: { $size: "$propertyCount" },
        },
      },
      { $sort: { totalCommission: -1 } },
      { $limit: 10 },
    ]);

    // Populate realtor details
    if (topRealtors.length > 0) {
      const realtorIds = topRealtors.map((r) => r.realtorId);
      const realtors = await User.find(
        { _id: { $in: realtorIds } },
        "firstName lastName email phone"
      );

      const realtorMap = realtors.reduce((map, realtor) => {
        map[realtor._id.toString()] = realtor;
        return map;
      }, {});

      topRealtors.forEach((realtor) => {
        realtor.realtorDetails =
          realtorMap[realtor.realtorId.toString()] || null;
      });
    }

    // Get withdrawal requests stats
    const withdrawalStats = await Commission.aggregate([
      { $unwind: "$withdrawalRequests" },
      {
        $match: {
          "withdrawalRequests.status": {
            $in: ["PENDING", "APPROVED", "PROCESSED"],
          },
        },
      },
      {
        $group: {
          _id: "$withdrawalRequests.status",
          totalAmount: { $sum: "$withdrawalRequests.amountInKobo" },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      overall: stats[0] || {
        totalCommissions: 0,
        paidCommissions: 0,
        pendingCommissions: 0,
        count: 0,
        byStatus: { PENDING: 0, PARTIAL: 0, PAID: 0 },
      },
      topRealtors,
      withdrawalStats,
    };
  }

  /**
   * Calculate commission for a property sale
   */
  async calculatePropertyCommission(
    propertyId,
    saleAmount,
    commissionPercentage
  ) {
    const property = await Property.findById(propertyId);
    if (!property) throw new AppError("Property not found", 404);

    const realtor = await User.findById(property.assignedRealtorId);
    if (!realtor) throw new AppError("Realtor not found", 404);

    const commissionAmount = Math.round(
      saleAmount * (commissionPercentage / 100)
    );

    return {
      realtorId: realtor._id,
      propertyId: property._id,
      saleAmount,
      commissionPercentage,
      commissionAmount,
      description: `Commission for property sale: ${property.title}`,
    };
  }
}

export default new CommissionService();
