import { Worker } from "bullmq";
import fs from "fs";
import { WhatsappConversation } from "../models/whatsapp.model";
import { parseExcelFile } from "../utils/extractDataFromFile";
import { messageQueue } from "./queue";
import { sendWhatsappMessage } from "../utils/whatsappFunctions";
import connectDB from "./db";
import { config } from "dotenv";

config();

// Establish the database connection first
connectDB().then(() => {
  const userProcessingWorker = new Worker(
    "user-processing",
    async (job) => {
      const { filePath } = job.data;

      try {
        const users = parseExcelFile(filePath);

        if (!users || users.length === 0) {
          console.log("No users found in the file.");
          return;
        }

        // 1. Prepare bulk operations for Mongoose
        const bulkOps = users
          .map((user) => {
            if (!user || !user.whatsappNumber) {
              return null; // Skip invalid entries
            }
            return {
              updateOne: {
                filter: { whatsappNumber: user.whatsappNumber },
                update: {
                  $set: {
                    name: user.name,
                    state: "pending",
                  },
                },
                upsert: true, // Insert if not found, update if found
              },
            };
          })
          .filter((op) => op !== null); // Filter out any null operations

        if (bulkOps.length > 0) {
          await WhatsappConversation.bulkWrite(bulkOps);
          console.log(`✅ Successfully upserted ${bulkOps.length} users.`);
        }

        // 2. Retrieve all user IDs that were just processed
        const whatsappNumbers = users
          .map((user) => user?.whatsappNumber)
          .filter(Boolean);
        const processedUsers = await WhatsappConversation.find({
          whatsappNumber: { $in: whatsappNumbers },
        }).select("_id");

        // 3. Add jobs to the message queue in bulk
        if (processedUsers.length > 0) {
          const messageJobs = processedUsers.map((user) => ({
            name: "send-whatsapp",
            data: { userId: user._id },
          }));
          await messageQueue.addBulk(messageJobs);
          console.log(`✅ Enqueued ${messageJobs.length} bait message jobs.`);
        }
      } catch (error) {
        console.error("Error processing user list:", error);
        throw error; // BullMQ will handle retries
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

  userProcessingWorker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} in user-processing completed.`);
  });

  userProcessingWorker.on("failed", (job, err) => {
    console.error(
      `[Worker] Job ${job?.id} in user-processing failed: ${err.message}`
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
        const conversation = await WhatsappConversation.findById(userId);

        if (!conversation) {
          throw new Error(`Conversation with id ${userId} not found.`);
        }

        await sendWhatsappMessage(
          conversation.whatsappNumber,
          "Hello, Chandra ! How are you ? Just Asking !"
        );

        // OPTIMIZED: Use a single findByIdAndUpdate operation
        await WhatsappConversation.findByIdAndUpdate(userId, {
          $set: {
            state: "bait_message_sent",
            lastMessageTimestamp: new Date(),
          },
          $push: {
            conversationHistory: {
              message: "Initial bait message sent.",
              from: "bot",
              timestamp: new Date(),
            },
          },
        });
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
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );

  whatsappMessageWorker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} in message-sending completed.`);
  });

  whatsappMessageWorker.on("failed", (job, err) => {
    console.error(
      `[Worker] Job ${job?.id} in message-sending failed: ${err.message}`
    );
  });

  console.log("Whatsapp message processing worker started...");
});
