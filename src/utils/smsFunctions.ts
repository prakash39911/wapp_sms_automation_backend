import { twilioClient } from "../config/twilio";
const { MessagingResponse } = require("twilio").twiml;

export async function sendSMS(to: string, message: string) {
  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log("SMS sent successfully:", response.body);
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
}

// messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,

export const replyViaSms = function (res: any, message: string) {
  const twiml = new MessagingResponse();

  twiml.message(message);

  res.type("text/xml").send(twiml.toString());
};
