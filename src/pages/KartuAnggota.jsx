import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { base44, getLocalFileUrl } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Printer, Search, CreditCard, Loader2, Camera } from "lucide-react";
import { getCheckinUrl } from "@/lib/checkinUrl";

export default function KartuAnggota() {
  const { toast } = useToast();
  const [anggota, setAnggota] = useState([]);
  const [bidang, setBidang] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, b] = await Promise.all([
          base44.get("/anggota"),
          base44.get("/bidang"),
        ]);
        setAnggota((a.data || []).map((row) => ({
          ...row,
          id: String(row.id),
          nama: row.nama_lengkap,
          bidang_id: String(row.id_bidang || ""),
          no_telp: row.no_telepon,
          status: row.status?.toLowerCase(),
        })));
        setBidang((b.data || []).map((row) => ({
          ...row,
          id: String(row.id),
          nama: row.nama_bidang,
        })));
      } catch (e) {
        toast({ variant: "destructive", title: "Gagal memuat", description: e.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return anggota;
    const q = query.toLowerCase();
    return anggota.filter((a) => (a.nama || "").toLowerCase().includes(q) || (a.nip || "").toLowerCase().includes(q));
  }, [anggota, query]);

  const selected = anggota.find((a) => a.id === selectedId);
  const bidangNama = (id) => bidang.find((b) => b.id === id)?.nama || "-";

  const handlePrint = () => {
    if (!selected) { toast({ variant: "destructive", title: "Pilih anggota dulu" }); return; }
    window.print();
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("foto_anggota", file);
      const response = await base44.post(`/anggota/${selected.id}/foto`, data);
      const fotoUrl = response.data.foto_url;
      setAnggota((prev) => prev.map((a) => (a.id === selected.id ? { ...a, foto_url: fotoUrl } : a)));
      toast({ title: "Foto profil diperbarui" });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal mengunggah foto", description: err.message });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <PageHeader title="Kartu Anggota" subtitle="Cetak kartu anggota perpustakaan digital.">
        <Button onClick={handlePrint} className="no-print" disabled={!selected}>
          <Printer className="w-4 h-4 mr-1" /> Cetak Kartu
        </Button>
      </PageHeader>

      <div className="no-print grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* Picker */}
        <Card>
          <CardContent className="p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari nama / NIP…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            {loading ? (
              <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
            ) : (
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {filtered.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-md text-left transition-colors ${selectedId === a.id ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary border border-transparent"}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground shrink-0">
                      {a.nama?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{a.nama}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{a.nip || a.jabatan || "Anggota"}</p>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Tidak ditemukan.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-dashed">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-4 min-h-[280px]">
            {selected ? (
              <>
                <MemberCard anggota={selected} bidangNama={bidangNama(selected.bidang_id)} />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading
                      ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      : <Camera className="w-3.5 h-3.5 mr-1.5" />}
                    {uploading ? "Mengunggah…" : "Unggah Foto Profil"}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadPhoto}
                  />
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Pilih anggota untuk melihat pratinjau kartu.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Print area */}
      {selected && (
        <div className="print-area">
          <MemberCard anggota={selected} bidangNama={bidangNama(selected.bidang_id)} />
        </div>
      )}
    </div>
  );
}

function MemberCard({ anggota, bidangNama }) {
  const memberId = (anggota.id || "").slice(-8).toUpperCase();
  const checkinUrl = getCheckinUrl(anggota.id);
  const aktif = anggota.status !== "nonaktif";
  return (
    <div className="relative w-[340px] rounded-xl overflow-hidden shadow-xl bg-white border border-border">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full overflow-hidden opacity-[0.18] pointer-events-none select-none">
        <img
          src="https://media.base44.com/images/public/6a9fadbf6a80a70d486b3abe/760b19efc_HF_Vp0i0_400x400.png"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      {/* Header */}
      <div className="relative bg-primary text-primary-foreground px-4 py-3.5 overflow-hidden">
        <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-accent/25 blur-xl" />
        <div className="absolute left-0 bottom-0 h-1 w-full bg-accent" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center font-display font-extrabold text-sm">WN</div>
            <div className="leading-tight">
              <p className="font-display font-extrabold text-sm">Widya Netra</p>
              <p className="text-[9px] opacity-80">Dinkominfo Kab. Banyumas</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] tracking-[0.22em] opacity-75">KARTU ANGGOTA</p>
            <p className="font-mono text-[13px] font-bold leading-tight">{memberId}</p>
          </div>
        </div>
      </div>
      {/* Body */}
      <div className="p-4 flex gap-3.5">
        <div className="w-[84px] h-[104px] rounded-lg bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-accent/60">
          {anggota.foto_url ? (
            <img src={getLocalFileUrl(anggota.foto_url)} alt={anggota.nama} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display font-extrabold text-3xl text-muted-foreground">{anggota.nama?.[0]?.toUpperCase() || "?"}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold text-lg text-foreground leading-tight line-clamp-2">{anggota.nama}</p>
          <p className="text-[11px] font-semibold text-accent mb-2 truncate">{anggota.jabatan || bidangNama}</p>
          <div className="space-y-1">
            <Row label="NIP" value={anggota.nip || "-"} />
            <Row label="Bidang" value={bidangNama} />
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className="px-4 pb-4 pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-end gap-2">
          <div className="p-1 rounded-md border border-border bg-background shrink-0">
            <QRCodeSVG value={checkinUrl} size={52} level="M" />
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-wide text-muted-foreground">No. Anggota</p>
            <p className="font-mono text-[10px] font-bold text-foreground">{memberId}</p>
            <p className="text-[8px] text-muted-foreground mt-0.5">Scan untuk check-in</p>
          </div>
        </div>
        <div className="text-right space-y-1.5">
          <div>
            <p className="text-[8px] uppercase tracking-wide text-muted-foreground">Terdaftar</p>
            <p className="text-[10px] font-semibold text-foreground">{anggota.tanggal_daftar || "-"}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-wide text-muted-foreground">Status</p>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${aktif ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {aktif ? "AKTIF" : "NONAKTIF"}
            </span>
          </div>
        </div>
      </div>
      {/* Aksen kuning di bawah garis QR */}
      <div className="h-2 w-full bg-yellow-400" />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-1.5 text-[11px]">
      <span className="text-muted-foreground w-14 shrink-0">{label}</span>
      <span className="text-foreground font-medium truncate">: {value}</span>
    </div>
  );
}