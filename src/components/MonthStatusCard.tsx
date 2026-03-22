import {
  Card,
  CardContent
} from "@/components/ui/card";

interface Props {
  status: "on_track" | "tight" | "critical";
}

const STATUS_MAP = {
  on_track: {
    label: "On track",
    color: "text-emerald-600",
    bg: "bg-emerald-100"
  },
  tight: {
    label: "Tight",
    color: "text-amber-600",
    bg: "bg-amber-100"
  },
  critical: {
    label: "Overshooting",
    color: "text-rose-600",
    bg: "bg-rose-100"
  }
};

export default function MonthStatusCard({ status }: Props) {
  const s = STATUS_MAP[status];

  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-3 sm:p-4 flex items-center justify-between">
        <div>
           <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
             Month Status
           </div>
           <div className={`text-base font-bold tracking-tight ${s.color} flex items-center gap-1.5`}>
             {s.label}
           </div>
        </div>
        
        <div className={`size-8 rounded-full flex items-center justify-center ${s.bg}`}>
           {status === 'on_track' && (
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={s.color}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
           )}
           {status === 'tight' && (
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={s.color}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
           )}
           {status === 'critical' && (
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={s.color}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
