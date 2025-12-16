import dotenv from "dotenv";
import { catchAsynch } from "../utils/catchAsynch.utils.js";

dotenv.config();

export const initializePayment = catchAsynch(async (req, res, next) => {
  const { amount } = req.body; // En naira
  const reference = `TXN_${Date.now()}_${req.user.id}`;

  // 1. Create pending transaction
  await Transaction.create({
    userId: req.user.id,
    type: "CREDIT",
    amountInKobo: amount * 100,
    reference,
    status: "PENDING",
  });

  // 2. Initialize Paystack
  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email: req.user.email,
      amount: amount * 100,
      reference,
      callback_url: process.env.FRONTEND_CALLBACK,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  res.json({
    authorization_url: response.data.data.authorization_url,
    reference,
  });
});
