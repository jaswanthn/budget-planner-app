import { Card, CardContent } from "@/components/ui/card";

interface Props {
  spent: number;
  spendableBudget: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function MonthlySpendCard({ spent, spendableBudget }: Props) {
  const pct = spendableBudget > 0 ? Math.min((spent / spendableBudget) * 100, 100) : 0;
  const isOver = spent > spendableBudget;

  const barColor = pct < 70 ? "bg-emerald-500" : pct < 90 ? "bg-amber-500" : "bg-rose-500";
  const labelColor = isOver ? "text-rose-600" : "text-slate-700";

  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Monthly Spend
          </span>
          <span className={`text-xs font-bold ${isOver ? "text-rose-600" : "text-emerald-600"}`}>
            {isOver ? "Over budget!" : `${Math.round(pct)}% used`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className={`text-xl font-bold tracking-tight ${labelColor}`}>
              {fmt(spent)}
            </div>
            <div className="text-xs text-muted-foreground">spent this month</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-400">
              {fmt(spendableBudget)}
            </div>
            <div className="text-xs text-muted-foreground">target</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
