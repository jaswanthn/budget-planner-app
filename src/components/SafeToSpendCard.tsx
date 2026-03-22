import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface SafeToSpendProps {
  amount: number;
  remaining: number;
  daysLeft: number;
}

export default function SafeToSpendCard({
  amount,
  remaining,
  daysLeft
}: SafeToSpendProps) {
  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden relative group">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Safe to spend today
              </CardTitle>
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-slate-400 cursor-help hover:text-slate-700 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Your "Safe to Spend" is calculated based on your Income minus Fixed Expenses, distributed over the remaining days of the month.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        <div>
           <div className="text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
             ₹{amount.toLocaleString()}
           </div>
        </div>

        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Budget Remaining</span>
            <span className="font-semibold text-slate-700">₹{remaining.toLocaleString()}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (remaining > 0 ? 100 : 0))}%` }} />
          </div>
          <div className="flex justify-end">
            <div className="px-2 py-0.5 rounded text-slate-500 text-[11px] font-medium bg-slate-50">
              {daysLeft} days left
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
