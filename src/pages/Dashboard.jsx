import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Library, Users, ArrowLeftRight, AlertTriangle, Plus, Undo2,
  ChevronRight, Loader2, CreditCard,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [buku, setBuku] = useState([]);
  const [anggota, setAnggota] = useState([]);
  const [pinjam, setPinjam] = useState([]);
  const [pengunjung, setPengunjung] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_koleksi_buku: 0,
    anggota_aktif: 0,
    peminjaman_berjalan: 0,
    jatuh_tempo: 0,
  });
  const [statsError, setStatsError] = useState("");
  const statsErrorNotified = useRef(false);

  useEffect(() => {
    let active = true;
    const refreshStats = async () => {
      try {
        const { data } = await base44.get("/dashboard/stats");
        if (!active) return;
        setDashboardStats(data);
        setStatsError("");
        statsErrorNotified.current = false;
      } catch (error) {
        if (!active) return;
        const message = error.response?.data?.error || error.message || "Tidak dapat memuat statistik dashboard.";
        setStatsError(message);
        if (!statsErrorNotified.current) {
          toast({ variant: "destructive", title: "Gagal memuat statistik dashboard", description: message });
          statsErrorNotified.current = true;
        }
      }
    };

    (async () => {
      setLoading(true);
      try {
        const [b, a, p, v] = await Promise.all([
          base44.get("/buku"),
          base44.get("/anggota"),
          base44.get("/transaksi"),
          base44.get("/pengunjung"),
        ]);
        if (!active) return;
        setBuku((b.data || []).map((row) => ({
          ...row,
          jumlah: row.jumlah_eksemplar,
        })));
        setAnggota((a.data || []).map((row) => ({
          ...row,
          status: row.status?.toLowerCase(),
        })));
        setPinjam((p.data || []).map((row) => ({
          ...row,
          anggota_nama: row.nama_anggota,
          buku_judul: row.judul_buku,
          tanggal_kembali_rencana: row.kembali_rencana,
          tanggal_kembali_aktual: row.kembali_aktual,
        })));
        setPengunjung((v.data || []).map((row) => ({
          ...row,
          created_date: row.waktu_checkin,
        })));
        await refreshStats();
      } catch (e) {
        if (active) {
          toast({ variant: "destructive", title: "Gagal memuat dashboard", description: e.message });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    const intervalId = window.setInterval(refreshStats, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [toast]);

  const chartData = useMemo(() => {
    const year = new Date().getFullYear();
    const buckets = Array.from({ length: 12 }, (_, i) => ({ month: monthNames[i], pinjam: 0, kembali: 0, pengunjung: 0 }));
    pengunjung.forEach((v) => {
      if (!v.created_date) return;
      const d = new Date(v.created_date);
      if (d.getFullYear() === year) buckets[d.getMonth()].pengunjung += 1;
    });
    pinjam.forEach((p) => {
      if (!p.tanggal_pinjam) return;
      const d = new Date(p.tanggal_pinjam);
      if (d.getFullYear() === year) {
        buckets[d.getMonth()].pinjam += 1;
        if (p.status === "dikembalikan" && p.tanggal_kembali_aktual) {
          const kd = new Date(p.tanggal_kembali_aktual);
          if (kd.getFullYear() === year) buckets[kd.getMonth()].kembali += 1;
        }
      }
    });
    return buckets;
  }, [pinjam, pengunjung]);

  const recent = pinjam.slice(0, 6);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Ringkasan administrasi perpustakaan digital Widya Netra." />

      {/* Hero metric bento */}
      {statsError && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          Statistik belum diperbarui: {statsError}
        </p>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        <StatCard label="Total Koleksi Buku" value={dashboardStats.total_koleksi_buku} hint={`${buku.length} judul`} icon={Library} tone="primary" onClick={() => navigate("/data-buku")} />
        <StatCard label="Anggota Aktif" value={dashboardStats.anggota_aktif} hint={`${anggota.length} terdaftar`} icon={Users} tone="light" onClick={() => navigate("/data-anggota")} />
        <StatCard label="Peminjaman Berjalan" value={dashboardStats.peminjaman_berjalan} hint="Sedang dipinjam" icon={ArrowLeftRight} tone="accent" onClick={() => navigate("/transaksi")} />
        <StatCard label="Jatuh Tempo" value={dashboardStats.jatuh_tempo} hint="Perlu tindakan" icon={AlertTriangle} tone="accent" onClick={() => navigate("/transaksi")} />
      </div>

      {/* Main stage 65/35 */}
      <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-4 lg:gap-5 mb-5">
        {/* Left */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Aksi Cepat Transaksi</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={() => navigate("/transaksi?aksi=pinjam")} className="h-auto py-4 justify-start bg-accent text-accent-foreground hover:bg-accent/90">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-white/20 flex items-center justify-center"><Plus className="w-5 h-5" /></div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Pinjam Buku Baru</p>
                    <p className="text-[11px] opacity-90">Buat transaksi peminjaman</p>
                  </div>
                </div>
              </Button>
              <Button onClick={() => navigate("/transaksi?aksi=kembali")} variant="outline" className="h-auto py-4 justify-start border-primary/20 hover:bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center"><Undo2 className="w-5 h-5 text-primary" /></div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-foreground">Pengembalian Buku</p>
                    <p className="text-[11px] text-muted-foreground">Proses pengembalian</p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="font-display text-base">Aktivitas Sirkulasi Terkini</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => navigate("/riwayat")}>
                Lihat semua <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">Belum ada aktivitas.</p>
                ) : recent.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center shrink-0">
                      <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{p.buku_judul || "-"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{p.anggota_nama || "-"} · {p.tanggal_pinjam}</p>
                    </div>
                    <StatusPill value={p.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Ringkas Master Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Kategori Terpopuler</p>
                <div className="space-y-1.5">
                  {(() => {
                    const counts = {};
                    buku.forEach((b) => { if (b.kategori) counts[b.kategori] = (counts[b.kategori] || 0) + 1; });
                    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
                    if (top.length === 0) return <p className="text-xs text-muted-foreground">Belum ada kategori.</p>;
                    const max = top[0][1];
                    return top.map(([k, v]) => (
                      <div key={k}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-foreground">{k}</span>
                          <span className="text-muted-foreground">{v}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(v / max) * 100}%` }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Anggota Baru</p>
                <div className="space-y-2">
                  {anggota.slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold text-secondary-foreground shrink-0">
                        {a.nama?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">{a.nama}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{a.jabatan || a.nip || "Anggota"}</p>
                      </div>
                    </div>
                  ))}
                  {anggota.length === 0 && <p className="text-xs text-muted-foreground">Belum ada anggota.</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => navigate("/kartu-anggota")} variant="outline" className="w-full h-auto py-4 justify-start border-accent/30 hover:bg-accent/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-accent/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-accent" /></div>
              <div className="text-left">
                <p className="font-bold text-sm text-foreground">Cetak Kartu Anggota</p>
                <p className="text-[11px] text-muted-foreground">Cetak instan kartu anggota</p>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Bottom chart */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display text-base">Statistik Bulanan {new Date().getFullYear()}</CardTitle>
            <p className="text-[11px] text-muted-foreground">Peminjaman, pengembalian, dan kunjungan pengunjung per bulan</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => navigate("/laporan")}>
            Ekspor laporan <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="pinjam" name="Pinjam" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="kembali" name="Kembali" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="pengunjung" name="Pengunjung" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}