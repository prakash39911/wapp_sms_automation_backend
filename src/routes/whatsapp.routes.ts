import { Router } from "express";
import {
  handleIncomingMessage,
  verifyWebhook,
} from "../controller/webhook/whatsapp";
import {
  sendWappMessage,
  startConversation,
} from "../controller/whatsapp.controller";

const router = Router();

// Webhook for WhatsApp
router.get("/webhook", verifyWebhook);
router.post("/webhook", handleIncomingMessage);

//send a message to a user
router.post("/send-message", sendWappMessage);

// Start Conversation with a user, reached us using form or chat on our website.
router.post("/start-conversation", startConversation);

export default router;
