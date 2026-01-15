import { type ReactNode, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  MapPin, 
  Scan, 
  ShoppingBag, 
  User, 
  Trophy, 
  Search, 
  LogOut,
  Gamepad2,
  Package
} from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import { LayoutProvider } from "../../context/LayoutContext";
import { Button } from "../ui/button";
import CartDrawer from "../cart/CartDrawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { ProfileSearch } from "../search/ProfileSearch";

interface DashboardLayoutProps {
  children: ReactNode;
}

// Mobile bottom nav items
const mobileNavItems = [
  { label: "Hub", href: "/feed", icon: Home },
  { label: "Spots", href: "/map", icon: MapPin },
  { label: "AR", href: "/trickmint", icon: Scan },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
  { label: "Me", href: "/checkins", icon: User },
];

// Desktop top nav items
const desktopNavItems = [
  { label: "Hub", href: "/feed", icon: Home },
  { label: "Map", href: "/map", icon: MapPin },
  { label: "Play SKATE", href: "/skate-game", icon: Gamepad2 },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
  { label: "Closet", href: "/closet", icon: Package },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const auth = useAuth();
  const user = auth?.user ?? null;
  const profile = auth?.profile ?? null;
  const signOut = auth?.signOut;
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      await signOut?.();
    } catch {
      // Best-effort logout
    } finally {
      setLocation('/');
    }
  }, [signOut, setLocation]);

  const profileLabel = profile?.displayName ?? user?.email?.split('@')[0] ?? "Profile";

  return (
    <LayoutProvider isDashboard={true}>
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
        {/* Desktop top header */}
        <header className="hidden md:block sticky top-0 z-50 bg-neutral-900 border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/feed">
              <span 
                className="text-2xl font-bold text-[#ff6a00] cursor-pointer"
                style={{ fontFamily: "'Permanent Marker', cursive" }}
              >
                SkateHubba
              </span>
            </Link>

            {/* Nav items */}
            <nav className="flex items-center gap-1">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${
                        isActive
                          ? "bg-[#ff6a00] text-black hover:bg-[#e55f00]"
                          : "text-gray-300 hover:bg-neutral-800 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Right side: Search, Cart, Profile */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:bg-neutral-800 hover:text-white"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-4 h-4 mr-2" />
                Find Skaters
              </Button>

              <CartDrawer />

              <Link href="/checkins">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:bg-neutral-800 hover:text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  {profileLabel}
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:bg-neutral-800 hover:text-white"
                onClick={() => void handleLogout()}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 border-t border-neutral-800 bg-neutral-950/95 pb-[env(safe-area-inset-bottom)] z-50"
          role="navigation"
          aria-label="Dashboard navigation"
        >
          <div className="mx-auto flex max-w-md items-center justify-between px-2 py-2">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "text-yellow-400"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Search Modal */}
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogContent className="bg-[#232323] border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-orange-500">Find Skaters</DialogTitle>
              <DialogDescription className="text-gray-400">
                Search for skaters by their username to view their profile and send challenges
              </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
              <ProfileSearch />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutProvider>
  );
}
