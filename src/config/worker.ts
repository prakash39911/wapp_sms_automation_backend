import { Worker } from "bullmq";
import fs from "fs";
import { WhatsappConversation } from "../models/whatsapp.model";
import { parseExcelFile } from "../utils/extractDataFromFile";
import { messageQueue } from "./queue";
import { sendWhatsappMessage } from "../utils/whatsappFunctions";
import connectDB from "./db";
import { config } from "dotenv";

config(); // Load environment variables from .env file

// Establish the database connection first
connectDB().then(() => {
  const userProcessingWorker = new Worker(
    "user-processing",
    async (job) => {
      const { filePath } = job.data;

      try {
        const users = parseExcelFile(filePath);

        for (const user of users) {
          if (!user) {
            continue; // Use continue to skip to the next iteration
          }

          const whatsappNumber = user["whatsappNumber"];
          const name = user.name;

          // 1. Update or insert user in the database
          const updatedUser = await WhatsappConversation.findOneAndUpdate(
            { whatsappNumber },
            { name, state: "pending" },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          // 2. Add a job to a separate queue for sending the WhatsApp message
          await messageQueue.add("send-whatsapp", { userId: updatedUser._id });
        }
      } catch (error) {
        console.error("Error processing user list:", error);
        throw error; // BullMQ will handle retries based on your queue settings
      } finally {
        // Clean up the uploaded file
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.error("Error deleting file:", unlinkError);
        }
      }
    },
    {
      connection: {
        host: "127.0.0.1",
        port: 6379,
      },
    }
  );

  userProcessingWorker.on("completed", (job, result) => {
    console.log(
      `[Worker] Job ${job.id} in user-processing completed successfully.`
    );
  });

  userProcessingWorker.on("failed", (job, err) => {
    console.error(
      `[Worker] Job ${job?.id} in user-processing failed with error: ${err.message}`
    );
  });

  console.log("User processing worker started...");
});

connectDB().then(() => {
  const whatsappMessageWorker = new Worker(
    "message-sending",
    async (job) => {
      const { userId } = job.data;

      try {
        await connectDB();

        const user = await WhatsappConversation.findById(userId);

        if (!user) {
          throw new Error(`User with id ${userId} not found.`);
        }

        const messageSent = await sendWhatsappMessage(
          user.whatsappNumber,
          "Hello, this is a bait message to start the conversation."
        );
        user.state = "bait_message_sent";
        user.conversationHistory.push({
          message: "Initial bait message sent.",
          from: "bot",
          timestamp: new Date(),
        });
        await user.save();
      } catch (error) {
        console.error(`Failed to send Bait message to user ${userId}:`, error);
        throw error;
      }
    },
    {
      connection: {
        host: "127.0.0.1",
        port: 6379,
      },
      // We are adding rate limiting here to avoid spamming the WhatsApp API
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // per second
      },
    }
  );

  whatsappMessageWorker.on("completed", (job) => {
    console.log(
      `[Worker] Job ${job.id} in message-sending completed successfully.`
    );
  });

  whatsappMessageWorker.on("failed", (job, err) => {
    console.error(
      `[Worker] Job ${job?.id} in message-sending failed with error: ${err.message}`
    );
  });

  console.log("Whatsapp message processing worker started...");
});
