import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Katalog publik untuk mode pengunjung — hanya bidang katalog, hanya baca
    const books = await svc.entities.Buku.list("-judul", 500);
    const data = (books || []).map((b) => ({
      id: b.id,
      judul: b.judul || "",
      penulis: b.penulis || "",
      penerbit: b.penerbit || "",
      tahun_terbit: b.tahun_terbit ?? null,
      kategori: b.kategori || "",
      cover_url: b.cover_url || "",
      kode_ddc: b.kode_ddc || "",
      lokasi: b.lokasi || "",
      jumlah: b.jumlah ?? 0,
      tersedia: b.tersedia ?? 0,
      file_url: b.file_url || "",
      deskripsi: b.deskripsi || "",
    }));

    return Response.json({ ok: true, buku: data });
  } catch (error) {
    return Response.json({ error: error.message || "Gagal memuat daftar buku." }, { status: 500 });
  }
}