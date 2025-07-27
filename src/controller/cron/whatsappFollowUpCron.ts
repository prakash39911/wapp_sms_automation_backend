import cron from "node-cron";
import { processFollowUp } from "../../utils/FollowUpMessages";

// This function will be called from index.ts to start the jobs
export const startWhatsAppCronJobs = () => {
  // Run this job every hour
  cron.schedule("*/2 * * * *", async () => {
    console.log("Running scheduled whatsapp follow-up job...");

    const twoDaysAgo = new Date(new Date().getTime() - 1 * 60 * 1000);
    const oneWeekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find users who haven't replied to the Bait message
    await processFollowUp(
      "bait_message_sent",
      twoDaysAgo,
      "Hey,\n just checking if you're still planning your trip? 😊\nLet us know !",
      "completed"
    );

    // Find users who haven't replied to the main message
    await processFollowUp(
      "awaiting_main_message_reply",
      twoDaysAgo,
      "Hey,\n just checking if you're still planning your trip? 😊\nLet us know if you need options — happy to help!",
      "no_reply_1"
    );

    // Find users who haven't replied to the first follow-up
    await processFollowUp(
      "no_reply_1",
      twoDaysAgo,
      "Hi,\n just wanted to check if you're still interested in planning your trip with us?",
      "no_reply_2"
    );

    // Find users who haven't replied to the second follow-up
    await processFollowUp(
      "no_reply_2",
      twoDaysAgo,
      "Final follow-up! 😊\nLet us know if you're still looking — happy to help whenever you're ready.",
      "completed"
    );

    // Find users for weekly follow-up
    await processFollowUp(
      "not_interested",
      oneWeekAgo,
      "Planning a trip soon?\nWe can help you get the best seats and rates! Ping us anytime ✈️🚆",
      "completed"
    );
  });
};
