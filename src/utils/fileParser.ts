import Papa from "papaparse";
import * as XLSX from "xlsx";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ParsedTransaction {
  id: string;
  date: string;
  note: string;
  amount: number;
  type: "expense" | "income";
  bucket?: string;
  originalRow: Record<string, unknown>;
}

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const parseStatementFile = async (
  file: File,
): Promise<ParsedTransaction[]> => {
  const extension = file.name.split(".").pop()?.toLowerCase();

  let rows: unknown[][] = [];
  if (extension === "csv") {
    rows = await parseCSVTo2DArray(file);
  } else if (extension === "xlsx" || extension === "xls") {
    rows = await parseExcelTo2DArray(file);
  } else {
    throw new Error("Unsupported file format. Please use CSV or Excel.");
  }

  // Clean empty rows
  rows = rows.filter(
    (row) =>
      row &&
      row.some((cell) => cell !== null && cell !== "" && cell !== undefined),
  );

  if (rows.length === 0) return [];

  try {
    // Attempt AI mapping if API key is present
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      return await mapWithAI(rows);
    } else {
      console.warn("No Gemini API key found. Using fallback parser.");
      return mapWithFallback(rows);
    }
  } catch (error) {
    console.error("AI Mapping failed, using fallback:", error);
    return mapWithFallback(rows);
  }
};

const parseCSVTo2DArray = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as string[][]),
      error: (error) => reject(error),
    });
  });
};

const parseExcelTo2DArray = async (file: File): Promise<unknown[][]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
};

async function mapWithAI(rows: unknown[][]): Promise<ParsedTransaction[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
  });

  const prompt = `
  Analyze this 2D array representing a bank statement or transaction export file.
  Identify all valid transaction rows. 
  Ignore any headers, footers, blank rows, or summary metadata (like opening/closing balances).
  A valid transaction must have a clear date, a description/note, and a non-zero amount.
  
  Format your response EXACTLY as a raw JSON array of arrays (no markdown blocks, no text).
  Each inner array must represent a valid transaction with exactly these 5 elements, in this specific order:
  [ originalRowIndex (number), "YYYY-MM-DD" (string), "expense" or "income" (string), amount (positive number), "Description" (string) ]
  
  Example Output:
  [
    [1, "2024-01-05", "expense", 45.00, "Starbucks Coffee"],
    [3, "2024-01-06", "income", 1500.00, "Payroll Deposit"]
  ]
  
  File Data:
  ${JSON.stringify(rows)}
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  let parsedArray: unknown[];
  try {
    const cleaned = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    parsedArray = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "AI failed to parse the statement into the expected schema.",
    );
  }

  if (!Array.isArray(parsedArray)) {
    throw new Error("AI did not return a valid array of transactions.");
  }

  const transactions: ParsedTransaction[] = [];
  const headerRow = rows[0] || [];

  for (let i = 0; i < parsedArray.length; i++) {
    const aiTx = parsedArray[i];
    if (!Array.isArray(aiTx) || aiTx.length < 5) continue;

    const [rowIndex, dateStr, typeStr, amountNum, noteStr] = aiTx;

    const parsedDate = parseRobustDate(String(dateStr));
    if (!parsedDate) continue;

    const amount = Math.abs(Number(amountNum) || 0);
    if (amount === 0) continue;

    // Preserve original raw columns mapping
    let originalRowData: Record<string, unknown> = {};
    if (
      typeof rowIndex === "number" &&
      rowIndex >= 0 &&
      rowIndex < rows.length
    ) {
      originalRowData = (rows[rowIndex] as any[]).reduce(
        (acc: Record<string, unknown>, val: unknown, idx: number) => {
          const key = String(headerRow[idx] || `col_${idx}`);
          acc[key] = val;
          return acc;
        },
        {},
      );
    }

    transactions.push({
      id: `tx_${Date.now()}_${i}`,
      date: parsedDate,
      note: String(noteStr).trim() || "Unknown",
      amount,
      type: typeStr === "income" ? "income" : "expense",
      originalRow: originalRowData,
    });
  }

  return transactions;
}

// Fallback logic manually searches for common keywords in headers
const mapWithFallback = (rows: unknown[][]): ParsedTransaction[] => {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h || "").toLowerCase());

  const dateCol = headers.findIndex((h) => /date|dt/.test(h));
  const descCol = headers.findIndex((h) =>
    /desc|narration|particulars|remarks/.test(h),
  );
  const debitCol = headers.findIndex((h) => /debit|dr|withdrawal/.test(h));
  const amountCol = headers.findIndex((h) => /^amount$|^amt$/.test(h));

  const dCol = dateCol >= 0 ? dateCol : 0;
  const nCol = descCol >= 0 ? descCol : 1;
  const aCol = debitCol >= 0 ? debitCol : amountCol >= 0 ? amountCol : 2;

  return rows.slice(1).reduce<ParsedTransaction[]>((acc, r, i) => {
    const rawDate = String(r[dCol] || "");
    const parsedDate = parseRobustDate(rawDate);
    if (!parsedDate) return acc; // ignore non-transaction rows

    const amount = cleanAmount(r[aCol]);
    if (amount <= 0) return acc;

    acc.push({
      id: `tx_${i}_${Date.now()}`,
      date: parsedDate,
      note: String(r[nCol] || "").trim(),
      amount,
      type: "expense",
      originalRow: (r as any[]).reduce(
        (rowAcc: Record<string, unknown>, val, idx) => {
          rowAcc[String(headers[idx] || `col_${idx}`)] = val;
          return rowAcc;
        },
        {},
      ),
    });
    return acc;
  }, []);
};

const cleanAmount = (val: unknown): number => {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const str = String(val)
    .replace(/,/g, "")
    .replace(/[^0-9.-]/g, "");
  return Math.abs(parseFloat(str)) || 0;
};

const parseRobustDate = (dateStr: string): string | null => {
  if (!dateStr || typeof dateStr !== "string") return null;
  let d = new Date(dateStr);
  if (isNaN(d.getTime()) && dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      // Try DD/MM/YYYY
      d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
  }
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  return null; // No fallback
};
