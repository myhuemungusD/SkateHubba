import Navigation from "../components/Navigation";
import BackgroundCarousel from "../components/BackgroundCarousel";
import EmailSignup from "../components/EmailSignup";
import { DonorRecognition } from "../components/DonorRecognition";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Shield, Zap, Users, MapPin, Video, Gamepad2, Award } from "lucide-react";

// Fetch real stats from backend
function useAppStats() {
  return useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
    retry: false,
  });
}

export default function Home() {
  const { data: stats } = useAppStats();

  // Use real stats if available, otherwise show conservative estimates
  const displayStats = {
    users: stats?.totalUsers || "Growing",
    spots: stats?.totalSpots || "50+",
    battles: stats?.totalBattles || "Active",
  };

  return (
    <BackgroundCarousel className="text-white">
      <Navigation />

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6">
        {/* Graffiti Background - More prominent */}
        <div className="absolute inset-0 bg-[url('/graffiti-wall.jpg')] bg-cover bg-center opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/90" />

        <div className="relative z-10 max-w-5xl mx-auto space-y-8 flex flex-col items-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 text-sm text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Platform Active • Beta Access Available</span>
          </div>

          {/* Centered SkateHubba Logo */}
          <h1
            className="text-6xl md:text-8xl font-extrabold tracking-tight text-orange-500 drop-shadow-[0_4px_8px_rgba(255,102,0,0.4)]"
            style={{ fontFamily: "'Permanent Marker', cursive" }}
          >
            SkateHubba
          </h1>

          <p className="text-2xl md:text-3xl font-bold text-white">
            Own Your Tricks. <span className="text-orange-400">Play SKATE Anywhere.</span>
          </p>

          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Remote S.K.A.T.E. battles, spot check-ins, and leaderboards. Built for real skaters.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <a
              href="/signin"
              className="bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold px-8 py-4 rounded-lg shadow-lg transition-all hover:scale-105 hover:shadow-orange-500/25 text-center"
            >
              Get Started Free
            </a>
            <a
              href="/specs"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-lg font-semibold px-8 py-4 rounded-lg border border-white/20 transition-all hover:scale-105 text-center"
            >
              View Platform Specs
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Real-time Multiplayer</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span>Free to Join</span>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE STATS */}
      <section className="py-16 bg-black/90 border-y border-orange-500/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="flex justify-center mb-3">
                <Users className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{displayStats.users}</div>
              <div className="text-gray-400">Active Skaters</div>
            </div>
            <div className="p-6">
              <div className="flex justify-center mb-3">
                <MapPin className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{displayStats.spots}</div>
              <div className="text-gray-400">Skate Spots Mapped</div>
            </div>
            <div className="p-6">
              <div className="flex justify-center mb-3">
                <Gamepad2 className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{displayStats.battles}</div>
              <div className="text-gray-400">SKATE Battles</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="py-24 bg-gradient-to-b from-zinc-900 to-black text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Built for Real Skaters</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Every feature designed by skaters, for skaters. No gimmicks—just the tools you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Gamepad2,
                title: "Remote S.K.A.T.E.",
                desc: "Challenge anyone, anywhere. 24-hour trick response windows with real-time voting.",
              },
              {
                icon: MapPin,
                title: "Spot Check-ins",
                desc: "Discover and check in at legendary spots worldwide. Earn rep at iconic locations.",
              },
              {
                icon: Video,
                title: "Video Clips",
                desc: "Upload tricks, build your video portfolio, and showcase your progression.",
              },
              {
                icon: Award,
                title: "Leaderboards",
                desc: "Compete for top rankings. Track your stats and climb the global ladder.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-black/60 border border-orange-400/20 p-8 rounded-xl hover:border-orange-400/50 transition-all hover:scale-[1.02] group"
              >
                <f.icon className="w-10 h-10 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-black border-t border-orange-500/10">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Account",
                desc: "Sign up free with email or Google. Takes 30 seconds.",
              },
              {
                step: "02",
                title: "Start Playing",
                desc: "Find nearby spots, challenge friends to SKATE, or join open battles.",
              },
              {
                step: "03",
                title: "Build Your Legacy",
                desc: "Track your wins, climb leaderboards, and connect with skaters worldwide.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 mb-4">
                  <span className="text-orange-500 font-bold text-xl">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIGNUP CTA */}
      <section
        id="signup"
        className="py-24 bg-gradient-to-b from-orange-600/10 to-black text-center border-t border-orange-400/10"
      >
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4 text-white">Ready to Skate?</h2>
          <p className="text-gray-400 mb-8">
            Join the platform. Get beta access and exclusive updates.
          </p>
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
            <EmailSignup />
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="py-16 bg-black border-t border-orange-500/10">
        <div className="max-w-4xl mx-auto px-6">
          <DonorRecognition />
          <div className="text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-6">Follow the Movement</h3>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { href: "https://instagram.com/SkateHubba_app", icon: "📸", label: "Instagram" },
                { href: "https://www.tiktok.com/@skatehubba_app", icon: "🎵", label: "TikTok" },
                {
                  href: "https://www.youtube.com/channel/UCwpWreJbWngkaLVsdOIKyUQ",
                  icon: "📺",
                  label: "YouTube",
                },
                { href: "mailto:hello@skatehubba.com", icon: "✉️", label: "Contact" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 transition-all text-gray-300 hover:text-white"
                >
                  <span>{social.icon}</span>
                  <span>{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-gray-500 bg-black border-t border-orange-400/10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-6 mb-4 text-sm">
            <a href="/specs" className="hover:text-orange-400 transition-colors">
              Specs
            </a>
            <a href="/donate" className="hover:text-orange-400 transition-colors">
              Support
            </a>
            <a
              href="mailto:hello@skatehubba.com"
              className="hover:text-orange-400 transition-colors"
            >
              Contact
            </a>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()}{" "}
            <span className="text-orange-400 font-semibold">SkateHubba</span> — Own Your Tricks.
          </p>
        </div>
      </footer>
    </BackgroundCarousel>
  );
}
