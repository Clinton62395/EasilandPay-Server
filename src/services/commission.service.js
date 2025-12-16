

/**
 * Calcul du montant de commission en attente
 */
export const calculatePendingCommission = (commission) =>
  commission.totalCommissionInKobo - commission.paidCommissionInKobo;

/**
 * Met à jour le statut d'une commission
 */
export const updateCommissionStatus = (commission) => {
  if (commission.paidCommissionInKobo >= commission.totalCommissionInKobo) {
    commission.status = "PAID";
  } else if (commission.paidCommissionInKobo > 0) {
    commission.status = "PARTIAL";
  } else {
    commission.status = "PENDING";
  }
};

/**
 * Soumettre une demande de retrait pour un realtor
 */
export const submitWithdrawalRequest = async (commission, amountInKobo) => {
  const pending = calculatePendingCommission(commission);
  if (amountInKobo > pending) {
    throw new Error(`Insufficient commission. Available: ${pending / 100} NGN`);
  }

  // Ajouter la demande de retrait
  commission.withdrawalRequests.push({
    amountInKobo,
    status: "PENDING",
    requestedAt: new Date(),
  });

  await commission.save();
  return commission;
};

/**
 * Approuver ou rejeter une demande de retrait
 */
export const processWithdrawalRequest = async (
  commission,
  requestId,
  action,
  adminId,
  rejectionReason
) => {
  const request = commission.withdrawalRequests.id(requestId);
  if (!request) throw new Error("Withdrawal request not found");
  if (request.status !== "PENDING")
    throw new Error(`Request already ${request.status.toLowerCase()}`);

  if (action === "APPROVED") {
    request.status = "APPROVED";
    request.approvedBy = adminId;
    request.approvedAt = new Date();
  } else if (action === "REJECTED") {
    request.status = "REJECTED";
    request.rejectionReason = rejectionReason;
    request.approvedBy = adminId;
    request.approvedAt = new Date();
  } else {
    throw new Error("Invalid action. Use APPROVED or REJECTED");
  }

  await commission.save();
  return commission;
};

/**
 * Marquer un retrait comme payé
 */
export const markWithdrawalProcessed = async (
  commission,
  requestId,
  transactionId
) => {
  const request = commission.withdrawalRequests.id(requestId);
  if (!request) throw new Error("Withdrawal request not found");
  if (request.status !== "APPROVED")
    throw new Error("Only approved requests can be processed");

  // Mise à jour retrait
  request.status = "PROCESSED";
  request.processe;
};
