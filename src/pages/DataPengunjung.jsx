import React from "react";
import EntityManager from "@/components/EntityManager";
import PageHeader from "@/components/PageHeader";
import QrCheckinDialog from "@/components/QrCheckinDialog";
import PrintDataButton from "@/components/PrintDataButton";

const formatWaktu = (d) =>
  d
    ? new Date(d).toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        timeZone: "Asia/Jakarta",
      })
    : "-";

export default function DataPengunjung() {
  return (
    <div>
      <PageHeader title="Data Pengunjung" subtitle="Buku kunjungan pegawai dan tamu perpustakaan.">
        <>
          <QrCheckinDialog />
          <PrintDataButton
            title="Buku Kunjungan Perpustakaan"
            subtitle="Data Pengunjung"
            entityName="Pengunjung"
            columns={[
              { label: "Nama Lengkap", key: "nama_lengkap" },
              { label: "Asal Instansi", key: "asal_instansi" },
              { label: "No HP", key: "no_hp" },
              { label: "Tujuan Kunjungan", key: "tujuan_kunjungan" },
              { label: "Waktu Check-in", value: (r) => formatWaktu(r.created_date) },
            ]}
          />
        </>
      </PageHeader>
      <EntityManager
        entityName="Pengunjung"
        title="Pengunjung"
        searchKeys={["nama_lengkap", "asal_instansi", "no_hp", "tujuan_kunjungan"]}
        realtime
        columns={[
          { key: "nama_lengkap", label: "Nama Lengkap", render: (r) => <span className="font-semibold text-foreground">{r.nama_lengkap}</span> },
          { key: "asal_instansi", label: "Asal Instansi" },
          { key: "no_hp", label: "No HP" },
          { key: "tujuan_kunjungan", label: "Tujuan Kunjungan", render: (r) => r.tujuan_kunjungan ? <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium">{r.tujuan_kunjungan}</span> : "-" },
          { key: "created_date", label: "Waktu Check-in", render: (r) => <span className="text-xs text-muted-foreground">{formatWaktu(r.created_date)}</span> },
        ]}
        formFields={[
          { key: "nama_lengkap", label: "Nama Lengkap", required: true, placeholder: "Nama lengkap pengunjung" },
          { key: "asal_instansi", label: "Asal Instansi", placeholder: "mis. Dinkominfo / Disdukcapil" },
          { key: "no_hp", label: "No HP", placeholder: "08xx-xxxx-xxxx" },
          { key: "tujuan_kunjungan", label: "Tujuan Kunjungan", type: "select", full: true, options: [
            { value: "Membaca di Tempat", label: "Membaca di Tempat" },
            { value: "Meminjam Buku", label: "Meminjam Buku" },
            { value: "Mengembalikan Buku", label: "Mengembalikan Buku" },
            { value: "Riset / Tugas", label: "Riset / Tugas" },
            { value: "Mengurus Kartu Anggota", label: "Mengurus Kartu Anggota" },
            { value: "Lainnya", label: "Lainnya" },
          ] },
        ]}
      />
    </div>
  );
}