import express from "express";
import { flutterwaveWebhook } from "../utils/flw.webhook.js";
import { Router } from "express";

const router = express.Router();

router.post("/flutterwave", flutterwaveWebhook);

export default router;
