import React from "react";
import { getLocalFileUrl } from "@/api/base44Client";
import EntityManager from "@/components/EntityManager";
import PageHeader from "@/components/PageHeader";
import FileViewerDialog from "@/components/FileViewerDialog";
import PrintDataButton from "@/components/PrintDataButton";

export default function DataBuku() {
  return (
    <div>
      <PageHeader title="Data Buku" subtitle="Master data koleksi buku perpustakaan digital.">
        <PrintDataButton
          title="Daftar Koleksi Buku"
          subtitle="Data Buku"
          entityName="Buku"
          landscape
          columns={[
            { label: "Judul", key: "judul" },
            { label: "Penulis", key: "penulis" },
            { label: "Penerbit", key: "penerbit" },
            { label: "Tahun", key: "tahun_terbit" },
            { label: "Kategori", key: "kategori" },
            { label: "Kode DDC", key: "kode_ddc" },
            { label: "ISBN", key: "isbn" },
            { label: "Jumlah", key: "jumlah" },
            { label: "Tersedia", key: "tersedia" },
            { label: "Lokasi Rak", key: "lokasi" },
          ]}
        />
      </PageHeader>
      <EntityManager
        entityName="Buku"
        title="Buku"
        searchKeys={["judul", "penulis", "kode_ddc", "kategori"]}
        defaultValues={{ jumlah: 1, tersedia: 1 }}
        transformOnSave={(form) => ({
          ...form,
          tahun_terbit: form.tahun_terbit ? Number(form.tahun_terbit) : null,
          jumlah: Number(form.jumlah) || 0,
          tersedia: Number(form.tersedia) || 0,
        })}
        columns={[
          { key: "cover_url", label: "Cover", render: (r) => r.cover_url ? (
            <img src={getLocalFileUrl(r.cover_url)} alt={r.judul} className="w-9 h-12 object-cover rounded border border-border" />
          ) : <span className="text-xs text-muted-foreground">-</span> },
          { key: "judul", label: "Judul", render: (r) => <span className="font-semibold text-foreground">{r.judul}</span> },
          { key: "penulis", label: "Penulis" },
          { key: "kategori", label: "Kategori", render: (r) => r.kategori ? <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium">{r.kategori}</span> : "-" },
          { key: "tahun_terbit", label: "Tahun" },
          { key: "file_url", label: "File Buku", render: (r) => r.file_url ? (
            <FileViewerDialog fileUrl={getLocalFileUrl(r.file_url)} fileName={r.judul} label="Baca Buku" />
          ) : <span className="text-xs text-muted-foreground">-</span> },
          { key: "tersedia", label: "Ketersediaan", render: (r) => (
            <span className="text-xs">
              <span className="font-semibold text-foreground">{r.tersedia ?? 0}</span>
              <span className="text-muted-foreground"> / {r.jumlah ?? 0} eks.</span>
            </span>
          ) },
        ]}
        formFields={[
          { key: "judul", label: "Judul Buku", required: true, full: true, placeholder: "Pengantar Teknologi Informasi" },
          { key: "penulis", label: "Penulis", placeholder: "Nama penulis" },
          { key: "penerbit", label: "Penerbit", placeholder: "Nama penerbit" },
          { key: "tahun_terbit", label: "Tahun Terbit", type: "number", placeholder: "2024" },
          { key: "kode_ddc", label: "Kode DDC", placeholder: "mis. 004.21" },
          { key: "kategori", label: "Kategori", placeholder: "Komputer, Hukum, …" },
          { key: "isbn", label: "No ISBN", placeholder: "mis. 978-602-xxxx-xx-x" },
          { key: "jumlah", label: "Jumlah Eksemplar", type: "number" },
          { key: "tersedia", label: "Tersedia", type: "number" },
          { key: "lokasi", label: "Lokasi Rak", placeholder: "Rak A-3" },
          { key: "cover_url", label: "Cover Buku", type: "image", full: true, placeholder: "Unggah gambar cover (JPG/PNG)." },
          { key: "file_url", label: "Upload File Buku (PDF)", type: "file", full: true, placeholder: "Format PDF, maksimal ukuran wajar." },
          { key: "deskripsi", label: "Deskripsi", type: "textarea", full: true },
        ]}
      />
    </div>
  );
}