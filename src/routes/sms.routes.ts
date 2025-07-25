import Router from "express";
import {
  handleSendSMS,
  handleStartConversation,
} from "../controller/sms.controller";
import { handleIncomingSMS } from "../controller/webhook/sms";

const router = Router();

// Start-conversation route
router.post("/start-conversation", handleStartConversation);

// Send sms route
router.post("/sendSms", handleSendSMS);

// Webhook for incoming SMS
router.post("/webhook", handleIncomingSMS);

export default router;
