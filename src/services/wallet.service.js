import Wallet from "../models/Wallet.models.js";

class WalletService {
  async getWallet(userId) {
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) throw new AppError("Wallet not found", 404);
    return wallet;
  }

  async fundWallet(userId, amount, reference) {
    const wallet = await this.getWallet(userId);

    wallet.balance += amount;
    await wallet.save();

    await Transaction.create({
      user: userId,
      amount,
      type: "CREDIT",
      status: "SUCCESS",
      reference,
      description: "Wallet funded",
    });

    return wallet;
  }

  async debitWallet(userId, amount, description = "Payment") {
    const wallet = await this.getWallet(userId);

    if (wallet.balance < amount) {
      throw new AppError("Insufficient balance", 400);
    }

    wallet.balance -= amount;
    await wallet.save();

    await Transaction.create({
      user: userId,
      amount,
      type: "DEBIT",
      status: "SUCCESS",
      description,
    });

    return wallet;
  }

  async holdInEscrow(userId, amount, propertyId) {
    const wallet = await this.getWallet(userId);

    if (wallet.balance < amount) {
      throw new AppError("Insufficient wallet balance", 400);
    }

    wallet.balance -= amount;
    wallet.escrowBalance += amount;
    await wallet.save();

    await Transaction.create({
      user: userId,
      amount,
      type: "ESCROW",
      status: "HOLD",
      description: "Funds moved to escrow",
      property: propertyId,
    });

    return wallet;
  }
}

export default new WalletService();
