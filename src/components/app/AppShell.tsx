import { Link, useRouterState, Outlet, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Swords, MessagesSquare, Lightbulb, TrendingUp,
  FileText, Sparkles, Mic, Settings as SettingsIcon, Menu, Bell, Search, LogOut, Activity
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/api/auth.functions";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { AdvisorPanel } from "@/components/app/advisor-panel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { globalSearch } from "@/lib/api/search.functions";
import { getNotifications, markNotificationRead, clearAllNotifications } from "@/lib/api/notifications.functions";
import { toast } from "sonner";

const navItems = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/competitors", label: "Competitors", icon: Swords },
  { to: "/customers", label: "Customers", icon: MessagesSquare },
  { to: "/opportunities", label: "Opportunities", icon: Lightbulb },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/assistant", label: "Nora (AI)", icon: Sparkles },
  { to: "/voice", label: "Nora (Voice)", icon: Mic },
  { to: "/jobs", label: "Job History", icon: Activity },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = (notifications || []).filter(n => !n?.is_read).length;
  
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    getNotifications().then(setNotifications);
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 2) {
      setIsSearching(true);
      const results = await globalSearch({ data: { query: q } });
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleClearNotifications = async () => {
    await clearAllNotifications();
    setNotifications(n => n.map(x => ({ ...x, is_read: true })));
    toast.success("Notifications cleared");
  };

  // Safe access — may not have auth context in dev mode
  let user = { name: "User", email: "" };
  let business: { name?: string; plan?: string; auditsUsed?: number; auditsLimit?: number } | null = null;
  try {
    const auth = useAuth();
    if (auth?.user) user = auth.user;
    if (auth?.business) business = auth.business;
  } catch {
    // Auth context not available — use defaults
  }

  const initials = (user?.name || "User")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Skip to content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Nexora AI</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Growth OS</div>
          </div>
        </div>
        <nav className="p-3 space-y-1" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-3 right-3 rounded-xl glass p-3">
          <div className="text-xs font-medium capitalize">{business?.plan ?? "Free"} plan</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {business ? `${business.auditsUsed ?? 0} of ${business.auditsLimit ?? 5} audits used this month` : "Connect your store to start"}
          </div>
          {(!business?.plan || business.plan === "free") && (
            <Button size="sm" className="w-full mt-2 bg-gradient-primary border-0">Upgrade</Button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 flex items-center px-4 gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation menu">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input 
              placeholder="Ask anything or search…" 
              className="pl-9 bg-muted/50 border-border" 
              aria-label="Search" 
              value={searchQuery}
              onChange={handleSearch}
            />
            {searchQuery.length > 2 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-2 z-50">
                {isSearching ? (
                  <div className="text-sm text-muted-foreground p-2">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((r, i) => (
                      <div key={i} className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm">
                        <span className="text-xs uppercase text-primary font-bold mr-2">{r.type}</span>
                        {r.title}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-2">No results found</div>
                )}
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={handleClearNotifications}>Clear all</Button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {(!notifications || notifications.length === 0) ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">All caught up!</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={cn("p-3 border-b border-border/50 text-sm", !n.is_read ? "bg-muted/50" : "")}>
                        <div className="font-medium text-xs mb-1 uppercase text-primary">{n.type}</div>
                        <div className="font-semibold">{n.title}</div>
                        <div className="text-muted-foreground mt-0.5">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <AdvisorPanel />
    </div>
  );
}
