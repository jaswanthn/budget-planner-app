import { supabase } from "@/lib/supabase";

export async function createTransaction(input: {
  bucketId: string;
  amount: number;
  note?: string;
  occurredAt: string;
  type?: "expense" | "income";
}) {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      bucket_id: input.bucketId,
      amount: input.amount,
      note: input.note,
      occurred_at: input.occurredAt,
      type: input.type,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createTransactions(
  inputs: {
    bucketId: string;
    amount: number;
    note?: string;
    occurredAt: string;
    type?: "expense" | "income";
  }[],
) {
  console.log(
    `[API] Inserting ${inputs.length} transactions individually... ${inputs}`,
  );

  // Using a loop with individual awaits to be safest against any batching issues,
  // though Promise.all would be faster. Individual awaits ensure we see exactly where it fails.
  const results = [];
  for (const input of inputs) {
    const result = await createTransaction(input);
    results.push(result);
  }

  console.log(`[API] All ${inputs.length} individual inserts complete.`);
  return results;
}

export async function deleteTransaction(id: string | number) {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
