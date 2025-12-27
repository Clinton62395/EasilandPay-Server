import TransactionService from "../services/transaction.service.js";

// ============================================
// CREATE TRANSACTION
// ============================================
export const createTransaction = async (req, res, next) => {
  try {
    const transaction = await TransactionService.createTransaction(req.body);

    res.status(201).json({
      status: "success",
      message: "Transaction created successfully",
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE TRANSACTION STATUS
// ============================================
export const updateTransactionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, metadata } = req.body;

    const transaction = await TransactionService.updateTransactionStatus(
      id,
      status,
      metadata
    );

    res.status(200).json({
      status: "success",
      message: "Transaction status updated successfully",
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET TRANSACTION BY ID
// ============================================
export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await TransactionService.getTransactionById(id);

    res.status(200).json({
      status: "success",
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET TRANSACTION BY REFERENCE
// ============================================
export const getTransactionByReference = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const transaction = await TransactionService.getTransactionByReference(
      reference
    );

    res.status(200).json({
      status: "success",
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET USER TRANSACTIONS
// ============================================
export const getUserTransactions = async (req, res, next) => {
  try {
    const { type, status, startDate, endDate, page, limit } = req.query;
    const filters = { type, status, startDate, endDate };

    const uid = req.user.user || req.user.userId;
    const result = await TransactionService.getUserTransactions(
      uid,
      filters,
      page,
      limit
    );

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET ALL TRANSACTIONS (ADMIN)
// ============================================
export const getAllTransactions = async (req, res, next) => {
  try {
    const {
      user,
      userId,
      type,
      status,
      startDate,
      endDate,
      search,
      page,
      limit,
    } = req.query;
    const filters = {
      user: user || userId,
      type,
      status,
      startDate,
      endDate,
      search,
    };

    const result = await TransactionService.getAllTransactions(
      filters,
      page,
      limit
    );

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET USER TRANSACTION SUMMARY
// ============================================
export const getUserTransactionSummary = async (req, res, next) => {
  try {
    const uid = req.user.user || req.user.userId;
    const summary = await TransactionService.getUserTransactionSummary(uid);

    res.status(200).json({
      status: "success",
      data: { summary },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET TRANSACTION STATISTICS (ADMIN)
// ============================================
export const getTransactionStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await TransactionService.getTransactionStatistics(
      startDate,
      endDate
    );

    res.status(200).json({
      status: "success",
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CREDIT WALLET
// ============================================
export const creditWallet = async (req, res, next) => {
  try {
    const { amountInKobo, description, metadata } = req.body;

    const uid = req.user.user || req.user.userId;
    const transaction = await TransactionService.creditWallet(
      uid,
      amountInKobo,
      description,
      metadata
    );

    res.status(201).json({
      status: "success",
      message: "Wallet credited successfully",
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DEBIT WALLET
// ============================================
export const debitWallet = async (req, res, next) => {
  try {
    const { amountInKobo, description, metadata } = req.body;

    const uid = req.user.user || req.user.userId;
    const transaction = await TransactionService.debitWallet(
      uid,
      amountInKobo,
      description,
      metadata
    );

    res.status(201).json({
      status: "success",
      message: "Wallet debited successfully",
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// PAY COMMISSION (ADMIN)
// ============================================
export const payCommission = async (req, res, next) => {
  try {
    const { realtorId, amountInKobo, originalTransactionId, metadata } =
      req.body;

    const transaction = await TransactionService.payCommission(
      realtorId,
      amountInKobo,
      originalTransactionId,
      metadata
    );

    res.status(201).json({
      status: "success",
      message: "Commission paid successfully",
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REFUND TRANSACTION (ADMIN)
// ============================================
export const refundTransaction = async (req, res, next) => {
  try {
    const { user, amountInKobo, originalTransactionId, metadata } = req.body;

    const transaction = await TransactionService.refundTransaction(
      user,
      amountInKobo,
      originalTransactionId,
      metadata
    );

    res.status(201).json({
      status: "success",
      message: "Refund processed successfully",
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CANCEL TRANSACTION
// ============================================
export const cancelTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await TransactionService.cancelTransaction(id);

    res.status(200).json({
      status: "success",
      message: "Transaction cancelled successfully",
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};
