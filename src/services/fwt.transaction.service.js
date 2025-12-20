// services/transaction.service.js
import mongoose from "mongoose";
import Transaction from "../models/Transaction.moddels.js";
import Wallet from "../models/Wallet.models.js";

/**
 * SERVICE SIMPLIFIE - 3 règles :
 * 1. Une méthode = une action précise
 * 2. Toujours valider avant d'écrire
 * 3. Le wallet change SEULEMENT ici
 */
class TransactionService {
  // ====================================
  // 1. CRÉER UNE TRANSACTION PENDING (pour Flutterwave)
  // ====================================
  async createPendingForFlutterwave(
    userId,
    type,
    amountInNaira,
    metadata = {}
  ) {
    // Convertir Naira → Kobo (votre système)
    const amountInKobo = Math.round(amountInNaira * 100);

    // Valider le minimum
    if (amountInKobo < 100) {
      throw new Error("Minimum amount is 1 NGN (100 kobo)");
    }

    // Générer référence unique
    const reference = Transaction.generateReference(type, userId);

    // Vérifier si référence existe déjà
    const exists = await Transaction.referenceExists(reference);
    if (exists) {
      throw new Error("Duplicate transaction reference");
    }

    // Créer la transaction PENDING
    const transaction = await Transaction.create({
      userId,
      type, // "CREDIT" pour top-up, "DEBIT" pour withdrawal
      amountInKobo,
      reference,
      status: "PENDING", // IMPORTANT: pas de wallet update ici
      description: metadata.description || `${type} via Flutterwave`,
      metadata: {
        paymentGateway: "flutterwave",
        initiatedAt: new Date(),
        ...metadata,
      },
    });

    return transaction;
  }

  // ====================================
  // 2. VALIDER UN WEBHOOK RÉUSSI (charge.completed)
  // ====================================
  async processSuccessfulPayment(transactionId, flutterwaveData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Trouver la transaction
      const transaction = await Transaction.findById(transactionId).session(
        session
      );
      if (!transaction) throw new Error("Transaction not found");

      // 2. Vérifier qu'elle est bien PENDING
      if (transaction.status !== "PENDING") {
        console.log(`Transaction ${transactionId} already processed`);
        return transaction;
      }

      // 3. Trouver le wallet
      const wallet = await Wallet.findOne({ user: transaction.userId }).session(
        session
      );
      if (!wallet) throw new Error("Wallet not found");

      // 4. CRÉDITER le wallet (seulement pour type "CREDIT")
      if (transaction.type === "CREDIT") {
        // Vérifier solde avant
        const oldBalance = wallet.balance;

        // Ajouter au solde
        wallet.balance += transaction.amountInKobo;
        wallet.totalDeposits += transaction.amountInKobo;
        wallet.lastTransactionAt = new Date();
        wallet.transactions.push(transaction._id);

        // Calculer nouveau solde
        transaction.balanceAfter = wallet.balance;

        console.log(`Wallet credited: ${oldBalance} → ${wallet.balance} kobo`);
      }
      // Pour "DEBIT", le wallet a déjà été débité à l'initiation

      // 5. Mettre à jour la transaction
      transaction.status = "SUCCESS";
      transaction.metadata = {
        ...transaction.metadata,
        gatewayResponse: flutterwaveData,
        gatewayId: flutterwaveData.id,
        completedAt: new Date(),
      };

      // 6. Sauvegarder tout
      await wallet.save({ session });
      await transaction.save({ session });
      await session.commitTransaction();

      console.log(`✅ Transaction ${transaction.reference} completed`);
      return transaction;
    } catch (error) {
      await session.abortTransaction();
      console.error("Failed to process payment:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ====================================
  // 3. TRAITER UN RETRAIT (débit immédiat + pending)
  // ====================================
  async processWithdrawal(userId, amountInNaira, bankDetails) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Convertir et valider
      const amountInKobo = Math.round(amountInNaira * 100);
      if (amountInKobo < 100) throw new Error("Minimum 1 NGN");

      // 2. Trouver et vérifier le wallet
      const wallet = await Wallet.findOne({ user: userId }).session(session);
      if (!wallet) throw new Error("Wallet not found");
      if (wallet.balance < amountInKobo)
        throw new Error("Insufficient balance");

      // 3. DÉBITER IMMÉDIATEMENT (tu as raison de le faire maintenant)
      const oldBalance = wallet.balance;
      wallet.balance -= amountInKobo;
      wallet.totalWithdrawals += amountInKobo;
      wallet.lastTransactionAt = new Date();

      // 4. Créer la transaction
      const reference = Transaction.generateReference("DEBIT", userId);
      const transaction = await Transaction.create(
        [
          {
            userId,
            type: "DEBIT",
            amountInKobo,
            reference,
            status: "PENDING", // PENDING car pas encore confirmé par Flutterwave
            balanceAfter: wallet.balance,
            description: `Withdrawal to ${bankDetails.accountNumber}`,
            metadata: {
              paymentGateway: "flutterwave",
              bankDetails,
              initiatedAt: new Date(),
              oldBalance, // Pour debug
            },
          },
        ],
        { session }
      );

      // 5. Lier la transaction au wallet
      wallet.transactions.push(transaction[0]._id);

      // 6. Sauvegarder
      await wallet.save({ session });
      await session.commitTransaction();

      console.log(
        `Withdrawal initiated: ${oldBalance} → ${wallet.balance} kobo`
      );
      return transaction[0];
    } catch (error) {
      await session.abortTransaction();
      console.error("Withdrawal failed:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ====================================
  // 4. ANNULER UNE TRANSACTION (si webhook failed)
  // ====================================
  async cancelPendingTransaction(transactionId, reason) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await Transaction.findById(transactionId).session(
        session
      );
      if (!transaction) throw new Error("Transaction not found");

      if (transaction.status !== "PENDING") {
        console.log(`Cannot cancel, status is ${transaction.status}`);
        return transaction;
      }

      // REMBOURSER le wallet si c'était un DEBIT
      if (transaction.type === "DEBIT") {
        const wallet = await Wallet.findOne({
          user: transaction.userId,
        }).session(session);
        if (wallet) {
          wallet.balance += transaction.amountInKobo; // Remboursement
          wallet.totalWithdrawals -= transaction.amountInKobo; // Corriger le total
          await wallet.save({ session });
          console.log(`Wallet refunded: +${transaction.amountInKobo} kobo`);
        }
      }

      // Marquer comme FAILED
      transaction.status = "FAILED";
      transaction.metadata.error = reason;
      transaction.metadata.cancelledAt = new Date();

      await transaction.save({ session });
      await session.commitTransaction();

      console.log(
        `❌ Transaction ${transaction.reference} cancelled: ${reason}`
      );
      return transaction;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ====================================
  // 5. TROUVER PAR RÉFÉRENCE FLUTTERWAVE
  // ====================================
  async findByFlutterwaveReference(gatewayReference) {
    return await Transaction.findOne({
      "metadata.gatewayReference": gatewayReference,
    });
  }
}

// Export simple
export default new TransactionService();
