import React from "react";
import { getLocalFileUrl } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import FileViewerDialog from "@/components/FileViewerDialog";
import { BookOpen } from "lucide-react";

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
      <p className="text-sm text-foreground font-medium">{value || "-"}</p>
    </div>
  );
}

export default function BukuDetailDialog({ buku, open, onOpenChange }) {
  if (!buku) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="bg-primary -mx-6 -mt-6 px-6 py-4 border-b border-primary">
          <DialogTitle className="font-display text-lg pr-6 text-white">{buku.judul}</DialogTitle>
          <DialogDescription className="text-xs text-white/80">Detail buku Perpustakaan Widya Netra.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Sampul */}
          <div className="w-28 aspect-[3/4] rounded-lg overflow-hidden border border-border bg-secondary shrink-0 mx-auto sm:mx-0">
            {buku.cover_url ? (
              <img src={getLocalFileUrl(buku.cover_url)} alt={buku.judul} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex flex-col items-center justify-center p-2 text-center">
                <BookOpen className="w-6 h-6 text-primary-foreground/70 mb-1" />
                <p className="font-display font-bold text-[10px] leading-snug text-primary-foreground line-clamp-4">
                  {buku.judul}
                </p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 grid grid-cols-2 gap-3 content-start">
            <Info label="Penulis" value={buku.penulis} />
            <Info label="Penerbit" value={buku.penerbit} />
            <Info label="Tahun Terbit" value={buku.tahun_terbit} />
            <Info label="Kategori" value={buku.kategori} />
            <Info label="Kode DDC" value={buku.kode_ddc} />
            <Info label="ISBN" value={buku.isbn} />
            <Info label="Lokasi Rak" value={buku.lokasi} />
            <Info label="Stok" value={`${buku.tersedia ?? 0} dari ${buku.jumlah ?? 0} tersedia`} />
          </div>
        </div>

        {/* Deskripsi */}
        {buku.deskripsi && (
          <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-3.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Deskripsi</p>
            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{buku.deskripsi}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 -mx-6 -mb-6 px-6 py-3 bg-primary rounded-b-lg">
          <p className="text-[11px] text-white/80">Klik buku untuk membaca di aplikasi.</p>
          {buku.file_url ? (
            <FileViewerDialog
              fileUrl={getLocalFileUrl(buku.file_url)}
              fileName={buku.judul}
              label="Baca Buku"
              triggerClassName="bg-accent text-accent-foreground hover:bg-accent/90"
            />
          ) : (
            <span className="text-[11px] text-white/80">Berkas belum tersedia</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}