import { twilioClient } from "../config/twilio";

export async function sendSMS(to: string, message: string) {
  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: to,
    });

    console.log("SMS sent successfully:", response);
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
}
