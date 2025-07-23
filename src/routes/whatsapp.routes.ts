import { Router } from "express";
import {
  handleIncomingMessage,
  verifyWebhook,
} from "../controller/webhook/whatsapp";

const router = Router();

// Webhook for WhatsApp
router.get("/webhook", verifyWebhook);
router.post("/webhook", handleIncomingMessage);

export default router;
