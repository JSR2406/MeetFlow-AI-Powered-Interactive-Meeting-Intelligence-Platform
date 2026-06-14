"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Search, Filter, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function MeetingSearchFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const status = searchParams.get("status") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handleSearch = () => updateParam("q", q);
  const clearSearch = () => { setQ(""); updateParam("q", ""); };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search meetings..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-shadow"
        />
        {q && (
          <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-secondary/30">
        <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2 shrink-0" />
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParam("status", opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              status === opt.value
                ? "bg-brand text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-background"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
