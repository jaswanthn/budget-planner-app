export interface ParsedTransaction {
  amount: number;
  merchant: string;
  date: number;
  account?: string;
  type: "expense" | "income";
  originalBody: string;
}

// Common patterns for Indian Banks (HDFC, SBI, ICICI, etc.)
// "Rs. 1234.00 debited from a/c **1234 to MERCHANT on 22-01-25..."
// "Sent Rs. 500.00 to FRIEND..."
// "Acct XX123 Debited INR 300.00..."

export function parseSms(body: string, date: number): ParsedTransaction | null {
  const cleanBody = body.toLowerCase().replace(/\n/g, " ");

  // 1. Check if it's a transaction
  const isDebit =
    cleanBody.includes("debited") ||
    cleanBody.includes("spent") ||
    cleanBody.includes("sent") ||
    cleanBody.includes("paid");
  const isCredit =
    cleanBody.includes("credited") || cleanBody.includes("received");

  if (!isDebit && !isCredit) return null;

  // 2. Extract Amount
  // Matches: Rs. 123, INR 123, Rs 123.00
  const amountRegex = /(?:rs\.?|inr)\s*([\d,]+(?:\.\d{2})?)/i;
  const amountMatch = body.match(amountRegex);

  if (!amountMatch) return null;

  const amountStr = amountMatch[1].replace(/,/g, "");
  const amount = parseFloat(amountStr);

  if (isNaN(amount)) return null;

  // 3. Extract Merchant (Rudimentary)
  // "to <Merchant>" or "at <Merchant>"
  let merchant = "Unknown Merchant";
  const merchantRegex =
    /(?:to|at)\s+([a-zA-Z0-9\s\.]+?)(?:\s+(?:on|from|thru|via|ref)|$)/i;
  const merchantMatch = body.match(merchantRegex);
  if (merchantMatch && merchantMatch[1]) {
    merchant = merchantMatch[1].trim();
  }

  // Ignore OTPs or purely informational
  if (body.includes("OTP") || body.includes("running balance")) return null;

  return {
    amount: amount,
    merchant: merchant,
    date: date,
    type: isCredit ? "income" : "expense",
    originalBody: body,
  };
}
