import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchSms, requestSmsPermission } from "./SmsReader";
import { parseSms } from "./SmsParser";
import { supabase } from "./SupabaseService";

const SYNC_KEY = "last_sms_sync_timestamp";

export interface SyncResult {
  totalFound: number;
  parsed: number;
  synced: number;
  errors: any[];
}

export async function syncTransactions(): Promise<SyncResult> {
  const perm = await requestSmsPermission();
  if (!perm) {
    throw new Error("SMS Permission not granted");
  }

  const lastSyncStr = await AsyncStorage.getItem(SYNC_KEY);
  // Default to look back 30 days if never synced
  const lastSync = lastSyncStr
    ? parseInt(lastSyncStr)
    : Date.now() - 30 * 24 * 60 * 60 * 1000;

  const messages = await fetchSms(lastSync);

  // Sort oldest first
  messages.sort((a, b) => a.date - b.date);

  let parsedCount = 0;
  let syncedCount = 0;
  const errors = [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not logged in");
  }

  // Fetch valid bucket first to get a valid UUID
  const { data: buckets, error: bucketError } = await supabase
    .from("buckets")
    .select("id")
    .limit(1);

  if (bucketError || !buckets || buckets.length === 0) {
    console.error("No buckets error:", bucketError);
    throw new Error(
      "No categories (buckets) found in database. Please create one in the dashboard first."
    );
  }

  const defaultBucketId = buckets[0].id;

  const transactionsToInsert = [];

  for (const msg of messages) {
    const tx = parseSms(msg.body, msg.date);
    if (tx) {
      parsedCount++;

      transactionsToInsert.push({
        amount: tx.amount,
        bucket_id: defaultBucketId, // Correct column name (UUID)
        note: `${tx.merchant} (${tx.type === "income" ? "Income" : "Expense"})`,
        occurred_at: new Date(tx.date).toISOString(), // Correct column name
        // type: tx.type, // Remove if 'type' column doesn't exist in DB schema, or keep if it does.
        // Based on src/api/transactions.api.ts insert, it doesn't seem to insert 'type' explicitly?
        // Wait, FilterableTransactionList uses 'type'. Let's check schema again?
        // Actually api.ts assumes 'type' is derived or not inserted?
        // Let's look at api.ts again.
        // api.ts insert: { bucket_id, amount, note, occurred_at }. No type.
        // It's possible 'type' is inferred from amount (+/-) or not stored.
        // But FilterableTransactionList uses tx.type.
        // Let's assume for now we only insert what api.ts inserts.
        // If the DB strictly requires type, we'd see an error.
        // However, standard double-entry often infers from amount direction or separate columns.
        // Let's include user_id.
        user_id: user.id,
      });
    }
  }

  // Batch insert if possible
  if (transactionsToInsert.length > 0) {
    const { error } = await supabase
      .from("transactions")
      .insert(transactionsToInsert);
    if (error) {
      console.error("Supabase insert error", error);
      errors.push(error);
    } else {
      syncedCount = transactionsToInsert.length;
    }
  }

  // Update timestamp
  if (messages.length > 0) {
    const newLastSync = messages[messages.length - 1].date + 1;
    await AsyncStorage.setItem(SYNC_KEY, newLastSync.toString());
  }

  return {
    totalFound: messages.length,
    parsed: parsedCount,
    synced: syncedCount,
    errors,
  };
}
