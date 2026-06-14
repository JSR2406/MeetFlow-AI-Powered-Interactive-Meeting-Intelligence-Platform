import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to MeetFlow",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left: branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 w-[480px] bg-brand text-white relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-purple-700 opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC4zIiBvcGFjaXR5PSIwLjIiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <span className="font-bold text-xl">MeetFlow</span>
          </div>
        </div>
        <div className="relative z-10">
          <blockquote className="text-xl font-medium leading-relaxed mb-4">
            &ldquo;MeetFlow turned our chaotic standups into structured sprints. Action items are extracted automatically — it&apos;s like having an EA in every meeting.&rdquo;
          </blockquote>
          <div>
            <p className="font-semibold">Sarah Chen</p>
            <p className="text-white/70 text-sm">VP Engineering, Acme Corp</p>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
