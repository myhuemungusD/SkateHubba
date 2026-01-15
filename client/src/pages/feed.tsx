import { Link } from "wouter";
import { useAuth } from "../context/AuthProvider";
import { MapPin, Gamepad2, Trophy, Package, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const quickActions = [
  {
    title: "Play S.K.A.T.E.",
    description: "Challenge a skater or practice tricks",
    icon: Gamepad2,
    href: "/skate-game",
    color: "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500",
    iconColor: "text-yellow-500",
  },
  {
    title: "Explore Spots",
    description: "Find legendary skate spots near you",
    icon: MapPin,
    href: "/map",
    color: "bg-blue-500/10 border-blue-500/30 hover:border-blue-500",
    iconColor: "text-blue-500",
  },
  {
    title: "Leaderboard",
    description: "See who's on top this week",
    icon: Trophy,
    href: "/leaderboard",
    color: "bg-orange-500/10 border-orange-500/30 hover:border-orange-500",
    iconColor: "text-orange-500",
  },
  {
    title: "Your Closet",
    description: "Check your gear and collectibles",
    icon: Package,
    href: "/closet",
    color: "bg-purple-500/10 border-purple-500/30 hover:border-purple-500",
    iconColor: "text-purple-500",
  },
];

export default function FeedPage() {
  const auth = useAuth();
  const profile = auth?.profile;
  const displayName = profile?.displayName || auth?.user?.email?.split('@')[0] || "Skater";

  return (
    <div className="min-h-full bg-neutral-950 text-white">
      {/* Hero Banner */}
      <div 
        className="relative h-48 md:h-64 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/hero-768.webp')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/70 to-neutral-950" />
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-2xl md:text-4xl font-bold">
            Welcome back, <span className="text-orange-500">{displayName}</span>
          </h1>
          <p className="text-gray-400 mt-1">Ready to shred?</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Actions Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card className={`${action.color} bg-neutral-900 border cursor-pointer transition-all hover:scale-[1.02] h-full`}>
                    <CardHeader className="pb-2">
                      <Icon className={`w-8 h-8 ${action.iconColor}`} />
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-base text-white">{action.title}</CardTitle>
                      <CardDescription className="text-gray-400 text-sm mt-1">
                        {action.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Stats Overview */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Your Stats
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-orange-500">0</p>
                <p className="text-sm text-gray-400 mt-1">Games Played</p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-500">0</p>
                <p className="text-sm text-gray-400 mt-1">Wins</p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-blue-500">0</p>
                <p className="text-sm text-gray-400 mt-1">Spots Visited</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl p-6 border border-orange-500/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Start a S.K.A.T.E. Game</h3>
              <p className="text-gray-300 mt-1">Challenge friends or practice against AI</p>
            </div>
            <Link href="/skate-game">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8">
                Play Now
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
