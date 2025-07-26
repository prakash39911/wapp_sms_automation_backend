import { Queue } from "bullmq";

const redisConfig = {
  host: "127.0.0.1",
  port: 6379,
};

export const userQueue = new Queue("user-processing", {
  connection: redisConfig,
});

export const messageQueue = new Queue("message-sending", {
  connection: redisConfig,
});

// Listen for connection events
userQueue
  .waitUntilReady()
  .then(() => {
    console.log("✅ userQueue connected to Redis");
  })
  .catch((err) => {
    console.error("❌ Failed to connect userQueue to Redis:", err);
  });

messageQueue
  .waitUntilReady()
  .then(() => {
    console.log("✅ messageQueue connected to Redis");
  })
  .catch((err) => {
    console.error("❌ Failed to connect messageQueue to Redis:", err);
  });
