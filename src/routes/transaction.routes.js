// routes/depositWebhook.js
import express from "express";
import User from "../models/User.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";

const router = express.Router();

router.post(
  "/webhook",
  catchAsynch(async (req, res, next) => {
    const event = req.body;

    // Vérifie le type d'événement
    if (event.event === "charge.completed") {
      const tx = event.data;
      const { customer, amount, currency } = tx;

      const user = await User.findOne({ email: customer.email });
      if (!user) return res.status(404).send("User not found");

      // Créditer le wallet
      user.wallet.balance += amount;
      await user.save();

      console.log(
        `Wallet mis à jour pour ${user.email}, +${amount} ${currency}`
      );
    }

    res.status(200).send("ok");
  })
);

export default router;
