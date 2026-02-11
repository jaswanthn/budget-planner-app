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
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Navigation Tabs */}
        <div className="flex flex-1 items-center justify-center max-w-4xl">
          <Tabs value={location.pathname} onValueChange={(v) => navigate(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 rounded-lg p-1">
              {tabConfig.map((tab) => (
                <TabsTrigger
                  key={tab.path}
                  value={tab.path}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium
                             data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md
                             text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors
                             rounded-md"
                >
                  <div className="flex items-center gap-2">
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
            className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium
                       text-muted-foreground hover:text-foreground hover:bg-accent
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
