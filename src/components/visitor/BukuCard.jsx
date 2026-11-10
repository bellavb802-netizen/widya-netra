import React, { useState } from "react";
import { getLocalFileUrl } from "@/api/base44Client";
import BukuDetailDialog from "@/components/visitor/BukuDetailDialog";
import { BookOpen } from "lucide-react";

export default function BukuCard({ buku }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left w-full rounded-lg border border-border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          {buku.cover_url ? (
            <img src={getLocalFileUrl(buku.cover_url)} alt={buku.judul} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex flex-col items-center justify-center p-3 text-center">
              <BookOpen className="w-7 h-7 text-primary-foreground/70 mb-2" />
              <p className="font-display font-bold text-[11px] leading-snug text-primary-foreground line-clamp-4">
                {buku.judul}
              </p>
            </div>
          )}
          {buku.kategori && (
            <span className="absolute top-2 left-2 inline-flex items-center rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-[10px] font-bold">
              {buku.kategori}
            </span>
          )}
        </div>
        <div className="p-2.5 bg-primary">
          <p className="text-xs font-semibold text-white line-clamp-2 leading-snug" title={buku.judul}>
            {buku.judul}
          </p>
          <p className="text-[11px] text-white/80 truncate mt-0.5">{buku.penulis || "-"}</p>
          <div className="flex items-center justify-between mt-2 gap-1">
            <span className="text-[10px] font-medium text-white/90 truncate">
              {buku.tersedia > 0 ? `Tersedia ${buku.tersedia}` : "Sedang dipinjam"}
            </span>
            <span className="text-[10px] font-semibold bg-accent text-accent-foreground rounded px-2 py-0.5 shrink-0">Detail</span>
          </div>
        </div>
      </button>

      <BukuDetailDialog buku={buku} open={open} onOpenChange={setOpen} />
    </>
  );
}