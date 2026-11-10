import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const APP_CHECKIN_URL = 'https://widya-netra-dinkominfo-banyumas-co-486b3abe.base44.app/check-in';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    let body = {};
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Body JSON tidak valid." }, { status: 400 });
    }

    const memberId = String(body.member_id || "").trim();

    // Mode lookup: cari data anggota dari kode QR — hanya membaca, tanpa membuat record
    if (body.mode === "lookup") {
      if (!memberId) {
        return Response.json({ error: "Kode anggota tidak valid." }, { status: 400 });
      }
      const anggota = await svc.entities.Anggota.get(memberId).catch(() => null);
      if (!anggota) {
        return Response.json({ error: "Anggota tidak ditemukan." }, { status: 404 });
      }
      return Response.json({
        ok: true,
        anggota: {
          id: anggota.id,
          nama: anggota.nama || "",
          nip: anggota.nip || "",
          jabatan: anggota.jabatan || "",
        },
      });
    }

    let nama = String(body.nama_lengkap || "").trim().slice(0, 120);
    let instansi = String(body.asal_instansi || "").trim().slice(0, 120);
    let noHp = String(body.no_hp || "").trim().slice(0, 20);
    const tujuan = String(body.tujuan_kunjungan || "").trim().slice(0, 60);

    // Check-in via QR anggota: isi data otomatis dari data anggota (database utama)
    let viaAnggota = false;
    if (memberId) {
      const anggota = await svc.entities.Anggota.get(memberId).catch(() => null);
      if (anggota) {
        viaAnggota = true;
        nama = String(anggota.nama || nama).trim().slice(0, 120);
        let bidangNama = "";
        if (anggota.bidang_id) {
          const bidang = await svc.entities.Bidang.get(anggota.bidang_id).catch(() => null);
          if (bidang) bidangNama = bidang.nama || "";
        }
        instansi = (bidangNama || anggota.jabatan || instansi).trim().slice(0, 120);
        noHp = String(anggota.no_telp || noHp).trim().slice(0, 20);
      }
    }

    if (!nama) {
      return Response.json({ error: "Nama lengkap wajib diisi." }, { status: 400 });
    }

    // Record tersimpan permanen di entity Pengunjung — sama dengan halaman Data Pengunjung
    const pengunjung = await svc.entities.Pengunjung.create({
      nama_lengkap: nama,
      asal_instansi: instansi,
      no_hp: noHp,
      tujuan_kunjungan: tujuan,
    });

    return Response.json({
      ok: true,
      pengunjung_id: pengunjung.id,
      via_anggota: viaAnggota,
    });
  } catch (error) {
    return Response.json({ error: error.message || "Gagal memproses check-in." }, { status: 500 });
  }
}