import multer from "multer";
import path from "path";
import fs from "fs";

// Define the destination for uploaded files
const uploadPath = path.join(__dirname, "..", "uploads");

// Ensure the upload directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const excelMimeTypes = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (excelMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files are allowed!"), false);
  }
};

export const uploadExcel = multer({
  storage,
  fileFilter,
});
