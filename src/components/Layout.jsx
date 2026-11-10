import React, { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Library,
  Users,
  ArrowLeftRight,
  CreditCard,
  History,
  FileBarChart,
  Settings,
  BookOpenCheck,
  Menu,
  LogOut,
  Search,
  ChevronDown,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/bidang", label: "Bidang", icon: Building2 },
  { to: "/data-buku", label: "Data Buku", icon: Library },
  { to: "/data-anggota", label: "Data Anggota", icon: Users },
  { to: "/data-pengunjung", label: "Data Pengunjung", icon: Users },
  { to: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { to: "/kartu-anggota", label: "Kartu Anggota", icon: CreditCard },
  { to: "/riwayat", label: "Riwayat", icon: History },
  { to: "/laporan", label: "Laporan", icon: FileBarChart },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings },
];

const MOBILE_NAV = [
  { to: "/dashboard", label: "Beranda", icon: LayoutDashboard, end: true },
  { to: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { to: "/data-buku", label: "Buku", icon: Library },
  { to: "/data-anggota", label: "Anggota", icon: Users },
];

function NavList({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border shrink-0">
      <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
        <BookOpenCheck className="w-5 h-5 text-sidebar-primary-foreground" />
      </div>
      <div className="leading-tight min-w-0">
        <p className="font-display font-extrabold text-sm text-sidebar-primary-foreground truncate">Widya Netra</p>
        <p className="text-[10px] text-sidebar-foreground/60 truncate">Dinkominfo Banyumas</p>
      </div>
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const session = getSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const currentLabel =
    NAV_ITEMS.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label ||
    "Widya Netra";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sesi lokal dihapus, tetapi server belum merespons logout",
        description: error.message,
      });
    }
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-30">
        <Brand />
        <div className="flex-1 overflow-y-auto py-4">
          <p className="px-6 mb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Menu Utama
          </p>
          <NavList />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-accent-foreground">
              {session?.name?.[0] || "A"}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-xs font-semibold text-sidebar-primary-foreground truncate">{session?.name || "Administrator"}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">Petugas Perpustakaan</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar (drawer) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0 bg-sidebar text-sidebar-foreground">
          <SheetHeader className="p-0">
            <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
          </SheetHeader>
          <Brand />
          <div className="overflow-y-auto py-4 h-[calc(100%-4rem)]">
            <NavList onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 bg-card border-b border-border flex items-center gap-3 px-4 lg:px-6">
          <button
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-secondary text-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpenCheck className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
          <div className="hidden lg:block">
            <h2 className="font-display font-bold text-base text-foreground leading-tight">{currentLabel}</h2>
            <p className="text-[11px] text-muted-foreground">Widya Netra — Perpustakaan Digital Dinkominfo Banyumas</p>
          </div>

          <div className="flex-1" />

          {/* Quick search */}
          <div className="hidden md:flex relative w-56 lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari buku / anggota…"
              className="pl-9 h-9 text-sm bg-secondary border-transparent focus-visible:bg-card"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  navigate(`/data-buku?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
                }
              }}
            />
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-full border border-border hover:bg-secondary transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                {session?.name?.[0] || "A"}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-foreground">{session?.name || "Administrator"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-md shadow-lg z-40 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">{session?.name || "Administrator"}</p>
                    <p className="text-[11px] text-muted-foreground">Petugas Perpustakaan</p>
                  </div>
                  <button
                    onClick={() => { setProfileOpen(false); navigate("/pengaturan"); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary text-left"
                  >
                    <Settings className="w-4 h-4" /> Pengaturan
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 text-left"
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 min-w-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-card border-t border-border flex items-center justify-around h-16 px-2 no-print">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )
                }
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}