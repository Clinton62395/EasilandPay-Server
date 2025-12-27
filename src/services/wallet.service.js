import Transaction from "../models/Transaction.moddels.js";
import Wallet from "../models/Wallet.models.js";
import { AppError } from "../utils/appError.utils.js";

class WalletService {
  async getWallet(user) {
    const wallet = await Wallet.findOne({ user });
    if (!wallet) throw new AppError("Wallet not found", 404);
    return wallet;
  }

  async fundWallet(user, amount, reference) {
    const wallet = await this.getWallet(user);

    wallet.balance += amount;
    await wallet.save();

    await Transaction.create({
      user,
      amount,
      type: "WALLET_DEPOSIT",
      status: "SUCCESS",
      reference,
      description: "Wallet funded",
    });

    return wallet;
  }

  async debitWallet(user, amount, description = "Payment") {
    const wallet = await this.getWallet(user);

    if (wallet.balance < amount) {
      throw new AppError("Insufficient balance", 400);
    }

    wallet.balance -= amount;
    await wallet.save();

    await Transaction.create({
      user,
      amount,
      type: "WALLET_WITHDRAWAL",
      status: "SUCCESS",
      description,
    });

    return wallet;
  }

  async holdInEscrow(user, amount, propertyId) {
    const wallet = await this.getWallet(user);

    if (wallet.balance < amount) {
      throw new AppError("Insufficient wallet balance", 400);
    }

    wallet.balance -= amount;
    wallet.escrowBalance += amount;
    await wallet.save();

    await Transaction.create({
      user,
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
