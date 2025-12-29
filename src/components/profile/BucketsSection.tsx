import { useState } from "react";
import { useBudgetStore } from "@/data/useBudgetStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function BucketsSection() {
  const { data, setBucketLimit } = useBudgetStore();
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const handleChange = (id: string, value: string) => {
    setEditing((prev) => ({ ...prev, [id]: value }));
    setError((prev) => ({ ...prev, [id]: "" }));
  };

  const handleSave = async (id: string) => {
    const raw = editing[id] ?? String(data.buckets.find((b) => b.id === id)?.limit ?? "0");
    const num = Math.round(Number(raw || 0));
    if (Number.isNaN(num) || num < 0) {
      setError((prev) => ({ ...prev, [id]: "Enter a valid non-negative number" }));
      return;
    }
    // if unchanged, do nothing
    const current = data.buckets.find((b) => b.id === id)?.limit ?? 0;
    if (num === current) {
      setSaved((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [id]: false })), 1500);
      return;
    }

    setSaving((prev) => ({ ...prev, [id]: true }));
    try {
      await setBucketLimit(id, num);
      setSaved((prev) => ({ ...prev, [id]: true }));
      setEditing((prev) => ({ ...prev, [id]: "" }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [id]: false })), 1500);
    } catch (e: any) {
      setError((prev) => ({ ...prev, [id]: e?.message || "Failed to save" }));
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleCancel = (id: string) => {
    setEditing((prev) => ({ ...prev, [id]: "" }));
    setError((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle>Bucket Limits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.buckets.length === 0 && (
          <p className="text-sm text-muted-foreground">No buckets found.</p>
        )}

        {data.buckets.map((b) => {
          const progress = b.limit > 0 ? Math.min(Math.round((b.spent / b.limit) * 100), 100) : 0;
          return (
            <div key={b.id} className="p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{b.name}</div>
                    {saved[b.id] && (
                      <div className="text-sm text-green-600">Saved ✓</div>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground mb-2">
                    Spent: ₹{b.spent.toLocaleString()} / Limit: ₹{b.limit.toLocaleString()}
                  </div>

                  <Progress value={progress} className="h-3 rounded-full" />
                </div>

                <div className="flex items-center gap-3 md:w-80">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span>
                    <Input
                      type="number"
                      value={editing[b.id] ?? b.limit.toString()}
                      onChange={(e) => handleChange(b.id, e.target.value)}
                      className="pl-8 h-10"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSave(b.id)}
                      disabled={saving[b.id]}
                      className="px-4"
                    >
                      {saving[b.id] ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" onClick={() => handleCancel(b.id)} className="px-3">
                      Cancel
                    </Button>
                  </div>
                </div>

                {error[b.id] && (
                  <div className="text-xs text-red-600 md:col-span-2">{error[b.id]}</div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
