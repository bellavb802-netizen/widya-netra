import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import StatCard from "@/components/StatCard";
import KategoriTerpopuler from "@/components/landing/KategoriTerpopuler";
import StatistikBulananChart from "@/components/landing/StatistikBulananChart";
import { Library, BookOpen, ArrowLeftRight, Users, Loader2 } from "lucide-react";

const BG_IMAGE = "https://media.base44.com/images/public/6aa9ece40be2f0fe1b848307/0c47e51dc_ChatGPTImage22Sep20260742331.png";

export default function StatistikPublik() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await base44.get("/statistik/publik");
        setStats(data);
      } catch (error) {
        setLoadError(error.response?.data?.error || error.message || "Gagal memuat statistik.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="relative py-12 px-4">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${BG_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-[#083358]/20" />
        <div className="relative z-10 max-w-5xl mx-auto flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      </section>
    );
  }

  if (loadError) {
    return <p role="alert" className="py-8 text-center text-sm text-destructive">{loadError}</p>;
  }
  if (!stats?.ok) return null;

  const buku = stats.statistikBuku || {};

  return (
    <section className="relative py-12 px-4">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />
      <div className="absolute inset-0 bg-[#083358]/20" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white text-center">
          Statistik Perpustakaan
        </h2>
        <p className="text-center text-sm text-white/85 mt-2">
          Ringkasan koleksi, keanggotaan, dan aktivitas literasi Widya Netra.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mt-8">
          <StatCard label="Total Koleksi Buku" value={buku.totalBuku || 0} hint={`${buku.totalEksemplar || 0} eksemplar`} icon={Library} tone="primary" />
          <StatCard label="Buku Tersedia" value={buku.tersedia || 0} hint="Siap dipinjam" icon={BookOpen} tone="success" />
          <StatCard label="Peminjaman Berjalan" value={buku.pinjamBerjalan || 0} hint="Sedang dipinjam" icon={ArrowLeftRight} tone="accent" />
          <StatCard label="Anggota Aktif" value={stats.statistikAnggota?.anggotaAktif || 0} hint="Status aktif" icon={Users} tone="light" />
        </div>

        <StatistikBulananChart tahun={stats.tahun} data={stats.statistikBulanan || []} />
        <KategoriTerpopuler items={stats.kategoriTerpopuler || []} />
      </div>
    </section>
  );
}