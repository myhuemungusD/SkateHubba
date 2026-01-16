import BackgroundCarousel from "../components/BackgroundCarousel";
import Navigation from "../components/Navigation";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { CheckCircle, Shield, Zap } from "lucide-react";

export default function UnifiedLanding() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Progressive disclosure with intersection observer
  useEffect(() => {
    if (!isClient) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".fade-in-section").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isClient]);

  if (!isClient) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-[#181818] text-white">
        <h1 className="text-2xl font-bold">SkateHubba</h1>
      </main>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#121212] overflow-x-hidden">
      <BackgroundCarousel className="text-white min-h-screen w-full">
        <Navigation />
        {/* Hero Section */}
        <div className="relative z-10 w-full">
          <section className="pt-24 pb-12 py-16 md:py-24">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center animate-in">
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 text-sm text-green-400 mb-8">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Platform Active</span>
                </div>

                <h1
                  className="text-5xl md:text-6xl font-extrabold mb-6 text-white"
                  style={{ fontFamily: "'Permanent Marker', cursive" }}
                >
                  SkateHubba
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Remote S.K.A.T.E. battles, spot check-ins, and leaderboards. Built for real
                  skaters.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 mb-12">
                  <Link href="/feed">
                    <button
                      className="bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold px-8 py-4 rounded-lg shadow-lg transition-transform hover:scale-105"
                      data-testid="button-enter"
                    >
                      Enter Platform
                    </button>
                  </Link>
                  <Link href="/specs">
                    <button
                      className="bg-zinc-800 hover:bg-zinc-700 text-white text-lg font-bold px-8 py-4 rounded-lg shadow-lg transition-transform hover:scale-105"
                      data-testid="button-specs"
                    >
                      View Specs
                    </button>
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 mb-10 text-sm text-gray-300 px-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Secure Auth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Free to Play</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>Real-time Battles</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="relative py-8 px-6 border-t border-white/10 z-10 bg-black/40 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto text-center space-y-4">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} SkateHubba — Own Your Tricks.
              </p>
              <div className="flex justify-center items-center gap-4">
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-mono text-gray-400 border border-zinc-700">
                  Beta
                </span>
                <div className="flex items-center gap-2 text-xs text-green-500 font-mono">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  API: OK
                </div>
              </div>
            </div>
          </footer>
        </div>
      </BackgroundCarousel>

      <style>{`
        .animate-in {
          animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
