import crypto from "crypto";
import Newsletter from "../models/NewsLetter.models.js";
import { AppError } from "../utils/appError.utils.js";

class NewsletterService {
  subscribe = async (email) => {
    const existing = await Newsletter.findOne({ email }).select(
      "+confirmationToken"
    );
    if (existing) {
      throw new AppError("Email already subscribed", 400);
    }

    const token = crypto.randomBytes(20).toString("hex");

    const newsletter = await Newsletter.create({
      email,
      confirmationToken: token,
    });

    return { newsletter, token };
  };

  confirmSubscription = async (token) => {
    const subscriber = await Newsletter.findOne({
      confirmationToken: token,
    }).select("+confirmationToken");

    if (!subscriber) {
      throw new AppError("Invalid confirmation token", 400);
    }

    subscriber.isConfirmed = true;
    subscriber.confirmationToken = undefined;
    await subscriber.save();

    return subscriber;
  };
}

export default new NewsletterService();
