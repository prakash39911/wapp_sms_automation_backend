import { Request, Response } from "express";
import { userQueue } from "../config/queue";

export default async function handleFileUpload(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  try {
    // Add a job to the queue with the path to the uploaded file
    console.log("✅ Adding job to userQueue");
    await userQueue.add("process-user-list", { filePath: req.file.path });

    // Immediately respond to the frontend
    res.status(202).json({
      message: "File uploaded successfully. Processing will begin shortly.",
    });
  } catch (error) {
    console.error("Error While Processing the Excel File", error);
    res.status(500).json({ message: "Failed to Process file." });
  }
}
