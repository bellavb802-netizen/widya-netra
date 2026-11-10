import React from "react";
import BukuCard from "@/components/visitor/BukuCard";
import { Inbox } from "lucide-react";

export default function BukuPublikList({ buku = [], loading = false, error = "" }) {
  const gridClass = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4";

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="aspect-[3/4] bg-secondary animate-pulse" />
            <div className="p-2.5 space-y-1.5">
              <div className="h-3 bg-secondary rounded animate-pulse" />
              <div className="h-2.5 w-2/3 bg-secondary rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 py-8 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (buku.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-16 text-center">
        <Inbox className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">Tidak ada buku yang ditemukan.</p>
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {buku.map((b) => (
        <BukuCard key={b.id} buku={b} />
      ))}
    </div>
  );
}