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
      user: userId,
      type, // expected values: "WALLET_DEPOSIT" (top-up) or "WALLET_WITHDRAWAL" (withdrawal)
      amountInKobo,
      reference,
      status: "PENDING", // IMPORTANT: pas de wallet update ici
      description: metadata.description || `${type} via Flutterwave`,
      metadata: {
        paymentGateway: "FLUTTERWAVE",
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
      // 1. Charger la transaction
      const transaction = await Transaction.findById(transactionId).session(
        session
      );
      if (!transaction) throw new Error("Transaction not found");

      // 2. Idempotence
      if (transaction.status !== "PENDING") {
        return transaction;
      }

      // 3. VALIDATIONS FLUTTERWAVE (OBLIGATOIRE)
      if (flutterwaveData.status !== "successful") {
        throw new Error("Payment not successful");
      }

      if (flutterwaveData.tx_ref !== transaction.metadata.tx_ref) {
        throw new Error("tx_ref mismatch");
      }

      if (flutterwaveData.currency !== "NGN") {
        throw new Error("Invalid currency");
      }

      if (flutterwaveData.amount * 100 !== transaction.amountInKobo) {
        throw new Error("Amount mismatch");
      }

      // 4. Charger le wallet
      const wallet = await Wallet.findOne({ user: transaction.user }).session(
        session
      );
      if (!wallet) throw new Error("Wallet not found");

      // 5. Crédit wallet (WALLET_DEPOSIT uniquement)
      if (transaction.type === "WALLET_DEPOSIT") {
        wallet.balance += transaction.amountInKobo;
        wallet.totalDeposited += transaction.amountInKobo;
        wallet.lastTransactionAt = new Date();

        transaction.balanceAfter = wallet.balance;
      }

      // 6. Mettre à jour la transaction
      transaction.status = "SUCCESS";
      transaction.metadata.paymentGateway = "FLUTTERWAVE";
      transaction.metadata.gatewayReference = flutterwaveData.id;
      transaction.metadata.gatewayResponse = flutterwaveData;
      transaction.metadata.completedAt = new Date();

      // 7. Sauvegarder
      await wallet.save({ session });
      await transaction.save({ session });
      await session.commitTransaction();

      return transaction;
    } catch (error) {
      await session.abortTransaction();
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
      // 1. Conversion et validation
      const amountInKobo = Math.round(amountInNaira * 100);
      if (amountInKobo < 100) {
        throw new Error("Minimum withdrawal is 1 NGN");
      }

      // 2. Charger le wallet
      const wallet = await Wallet.findOne({ user: userId }).session(session);
      if (!wallet) throw new Error("Wallet not found");

      if (wallet.balance < amountInKobo) {
        throw new Error("Insufficient balance");
      }

      // 3. Débit immédiat (PENDING)
      const oldBalance = wallet.balance;
      wallet.balance -= amountInKobo;
      wallet.totalWithdrawn += amountInKobo;
      wallet.lastTransactionAt = new Date();

      // 4. Créer la transaction
      const reference = Transaction.generateReference(
        "WALLET_WITHDRAWAL",
        userId
      );

      const [transaction] = await Transaction.create(
        [
          {
            user: userId,
            type: "WALLET_WITHDRAWAL",
            amountInKobo,
            reference,
            status: "PENDING",
            balanceAfter: wallet.balance,
            description: `Withdrawal to ${bankDetails.accountNumber}`,
            metadata: {
              paymentGateway: "FLUTTERWAVE",
              bankDetails,
              initiatedAt: new Date(),
              oldBalance,
            },
          },
        ],
        { session }
      );

      // 5. Sauvegarder
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

      // 🔁 REMBOURSEMENT si retrait wallet
      if (transaction.type === "WALLET_WITHDRAWAL") {
        const wallet = await Wallet.findOne({
          user: transaction.user,
        }).session(session);

        if (!wallet) throw new Error("Wallet not found for refund");

        wallet.balance += transaction.amountInKobo;
        wallet.totalWithdrawn -= transaction.amountInKobo;
        wallet.lastTransactionAt = new Date();

        // Audit
        transaction.balanceAfter = wallet.balance;

        await wallet.save({ session });
        console.log(`Wallet refunded: +${transaction.amountInKobo} kobo`);
      }

      // ❌ ANNULATION
      transaction.status = "CANCELLED";
      transaction.metadata.cancelledAt = new Date();
      transaction.metadata.errorMessage = reason;

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
