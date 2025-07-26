import * as xlsx from "xlsx";

export const parseExcelFile = (filePath: string) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawData = xlsx.utils.sheet_to_json<Record<string, any>>(worksheet);

  const users = rawData
    .map((row, index) => {
      const keys = Object.keys(row).reduce((acc, key) => {
        acc[key.toLowerCase().trim()] = row[key];
        return acc;
      }, {} as Record<string, any>);

      const name = keys["name"];
      let whatsappNumber = keys["whatsapp number"];

      if (!name || !whatsappNumber) {
        console.warn(`Row ${index + 2} is missing required fields.`);
        return null;
      }

      whatsappNumber = whatsappNumber.toString().trim();
      if (!whatsappNumber.startsWith("+")) {
        whatsappNumber = "+" + whatsappNumber;
      }

      return { name, whatsappNumber };
    })
    .filter(Boolean);

  console.log("Parsed users:", users);
  return users;
};
