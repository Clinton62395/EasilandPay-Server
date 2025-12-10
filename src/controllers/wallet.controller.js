import WalletService from "../services/wallet.service.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";

export const getWallet = catchAsynch(async (req, res) => {
  const wallet = await WalletService.getUserWallet(req.user.id);
  res.status(200).json({ success: true, data: wallet });
});

export const deposit = catchAsynch(async (req, res) => {
  const { amount } = req.body;
  const wallet = await WalletService.deposit(req.user.id, amount);
  res.status(200).json({ success: true, data: wallet });
});

export const moveToEscrow = catchAsynch(async (req, res) => {
  const { amount, propertyId } = req.body;

  const wallet = await WalletService.moveToEscrow(
    req.user.id,
    propertyId,
    amount
  );
  res.status(200).json({ success: true, data: wallet });
});

export const releaseEscrow = catchAsynch(async (req, res) => {
  const { propertyId, sellerId, realtorId } = req.body;

  const result = await WalletService.releaseEscrow(
    req.user.id,
    propertyId,
    sellerId,
    realtorId
  );

  res.status(200).json({ success: true, data: result });
});

export const withdraw = catchAsynch(async (req, res) => {
  const { amount } = req.body;
  const wallet = await WalletService.withdraw(req.user.id, amount);
  res.status(200).json({ success: true, data: wallet });
});
