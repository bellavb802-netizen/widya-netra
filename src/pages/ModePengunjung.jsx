import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Library, Search, ClipboardList, Moon, Sun } from "lucide-react";
import BukuPublikList from "@/components/visitor/BukuPublikList";
import FormKunjungan from "@/components/visitor/FormKunjungan";

export default function ModePengunjung() {
  const [buku, setBuku] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [kategori, setKategori] = useState("Semua");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await base44.get("/buku");
        setBuku((data || []).map((row) => ({
          ...row,
          judul: row.judul_buku,
          cover_url: row.cover_buku,
          file_url: row.file_buku,
          isbn: row.no_isbn,
          jumlah: row.jumlah_eksemplar,
          lokasi: row.lokasi_rak,
        })));
      } catch (error) {
        setLoadError(error.response?.data?.error || error.message || "Gagal memuat katalog buku.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kategoriList = useMemo(
    () => ["Semua", ...new Set(buku.map((b) => (b.kategori || "").trim()).filter(Boolean))],
    [buku]
  );

  const filtered = useMemo(() => {
    let rows = buku;
    if (kategori !== "Semua") rows = rows.filter((b) => b.kategori === kategori);
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((b) =>
        (b.judul || "").toLowerCase().includes(q) ||
        (b.penulis || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [buku, query, kategori]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 sm:gap-4">
          <Link to="/pengunjung" className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Library className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="font-display font-extrabold text-sm text-foreground">Widya Netra</p>
              <p className="text-[10px] text-muted-foreground">Dinkominfo Banyumas</p>
            </div>
          </Link>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="order-3 sm:order-none w-full sm:flex-1 min-w-0"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari judul buku, penulis..."
                className="h-10 rounded-full pl-11 pr-24 text-sm bg-secondary/60 border-border"
              />
              <Button
                type="submit"
                className="absolute right-1 top-1 h-8 rounded-full px-5 text-xs font-bold"
              >
                Cari
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-3 ml-auto shrink-0">
            <Button
              onClick={() => setDialogOpen(true)}
              className="h-9 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-bold"
            >
              <ClipboardList className="w-4 h-4 mr-1.5" /> Tambah Kunjungan
            </Button>
          </div>
        </div>

        {/* Kategori */}
        <nav className="max-w-6xl mx-auto px-4 pb-2.5 flex items-center gap-2 overflow-x-auto">
          {kategoriList.map((k) => (
            <button
              key={k}
              onClick={() => setKategori(k)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                kategori === k
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              {k}
            </button>
          ))}
        </nav>
      </header>

      {/* Konten */}
      <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1">
        <h1 className="font-display font-extrabold text-xl text-foreground mb-5">
          {kategori === "Semua" ? "Koleksi Buku" : kategori}
        </h1>
        <BukuPublikList buku={filtered} loading={loading} error={loadError} />
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-5 text-center text-xs">
        © {new Date().getFullYear()} Widya Netra — Dinas Komunikasi dan Informatika Kabupaten Banyumas
      </footer>

      {/* Tombol mode gelap */}
      <button
        onClick={toggleDark}
        title={dark ? "Mode terang" : "Mode gelap"}
        className="fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Dialog tambah kunjungan */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Tambah Kunjungan</DialogTitle>
            <DialogDescription className="text-xs">
              Catat kunjungan Anda di buku tamu perpustakaan.
            </DialogDescription>
          </DialogHeader>
          <FormKunjungan bare />
        </DialogContent>
      </Dialog>
    </div>
  );
}