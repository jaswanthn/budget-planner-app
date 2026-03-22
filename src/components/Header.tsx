import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from "react-router-dom";
import { TodayIcon, BucketsIcon, TransactionsIcon, ReviewIcon, ProfileIcon, LogoutIcon } from "./icons";

const tabConfig = [
  {
    path: "/",
    label: "Today",
    icon: TodayIcon,
  },
  {
    path: "/buckets",
    label: "Buckets",
    icon: BucketsIcon,
  },
  {
    path: "/transactions",
    label: "Transactions",
    icon: TransactionsIcon,
  },
  {
    path: "/review",
    label: "Review",
    icon: ReviewIcon,
  },
  {
    path: "/profile",
    label: "Profile",
    icon: ProfileIcon,
  },
];

export default function HeaderTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Navigation Tabs */}
        <div className="flex flex-1 items-center justify-center max-w-3xl">
          <Tabs value={location.pathname} onValueChange={(v) => navigate(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-10 bg-slate-100/80 rounded-lg p-1 shadow-inner">
              {tabConfig.map((tab) => (
                <TabsTrigger
                  key={tab.path}
                  value={tab.path}
                  className="flex items-center justify-center gap-1.5 px-2 py-1 text-[13px] font-semibold
                             data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-transparent
                             text-slate-500 hover:text-slate-900 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                             rounded-md border border-transparent"
                >
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                    <tab.icon />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Logout Button */}
        <div className="flex items-center">
          <button
            onClick={async () => {
              await import("@/api/auth.api").then(m => m.signOut());
              window.location.reload();
            }}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80
                       transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Logout"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
