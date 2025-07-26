import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import whatsappRoute from "./routes/whatsapp.routes";
import smsRoute from "./routes/sms.routes";
import { startWhatsAppCronJobs } from "./controller/cron/whatsappFollowUpCron";
import fileUploadRoute from "./routes/file.routes";
import { startSmsCronJobs } from "./controller/cron/smsFollowUpCron";

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

startWhatsAppCronJobs();
startSmsCronJobs();

app.get("/health", (req: Request, res: Response) => {
  res.send("Server is running Successfully");
});

app.use("/api/whatsapp", whatsappRoute);
app.use("/api/sms", smsRoute);
app.use("/api/file", fileUploadRoute);

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`);
});
