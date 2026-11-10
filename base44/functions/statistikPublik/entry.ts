import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// Statistik publik untuk halaman beranda — hanya angka agregat, tanpa data pribadi
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const [buku, anggota, pinjam, pengunjung] = await Promise.all([
      svc.entities.Buku.list("-created_date", 500),
      svc.entities.Anggota.list("-created_date", 500),
      svc.entities.Peminjaman.list("-created_date", 500),
      svc.entities.Pengunjung.list("-created_date", 500),
    ]);

    const tahun = new Date().getFullYear();

    // Statistik buku (tanpa jatuh tempo)
    const totalBuku = buku.length;
    const totalEksemplar = buku.reduce((s, b) => s + (b.jumlah || 0), 0);
    const tersedia = buku.reduce((s, b) => s + (b.tersedia || 0), 0);
    const pinjamBerjalan = pinjam.filter((p) => p.status === "dipinjam").length;

    // Statistik anggota aktif
    const anggotaAktif = anggota.filter((a) => a.status === "aktif").length;

    // Statistik bulanan tahun berjalan
    const bulanan = MONTHS.map((month) => ({ month, pinjam: 0, kembali: 0, pengunjung: 0 }));
    pengunjung.forEach((v) => {
      if (!v.created_date) return;
      const d = new Date(v.created_date);
      if (d.getFullYear() === tahun) bulanan[d.getMonth()].pengunjung += 1;
    });
    pinjam.forEach((p) => {
      if (!p.tanggal_pinjam) return;
      const d = new Date(p.tanggal_pinjam);
      if (d.getFullYear() !== tahun) return;
      bulanan[d.getMonth()].pinjam += 1;
      if (p.status === "dikembalikan" && p.tanggal_kembali_aktual) {
        const kd = new Date(p.tanggal_kembali_aktual);
        if (kd.getFullYear() === tahun) bulanan[kd.getMonth()].kembali += 1;
      }
    });

    // Ringkasan master data — hanya kategori terpopuler
    const hitung = {};
    buku.forEach((b) => {
      if (b.kategori) hitung[b.kategori] = (hitung[b.kategori] || 0) + 1;
    });
    const kategoriTerpopuler = Object.entries(hitung)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([nama, jumlah]) => ({ nama, jumlah }));

    return Response.json({
      ok: true,
      tahun,
      statistikBuku: { totalBuku, totalEksemplar, tersedia, pinjamBerjalan },
      statistikAnggota: { anggotaAktif },
      statistikBulanan: bulanan,
      kategoriTerpopuler,
    });
  } catch (error) {
    return Response.json({ error: error.message || "Gagal memuat statistik." }, { status: 500 });
  }
}