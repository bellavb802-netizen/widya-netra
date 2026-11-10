import React from "react";
import EntityManager from "@/components/EntityManager";
import PageHeader from "@/components/PageHeader";

export default function Bidang() {
  return (
    <div>
      <PageHeader title="Bidang" subtitle="Kelola data bidang / unit kerja pada Dinkominfo Banyumas." />
      <EntityManager
        entityName="Bidang"
        title="Bidang"
        searchKeys={["nama", "kode", "kepala"]}
        columns={[
          { key: "nama", label: "Nama Bidang", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span> },
          { key: "kode", label: "Kode" },
          { key: "kepala", label: "Kepala Bidang" },
          { key: "deskripsi", label: "Deskripsi", render: (r) => <span className="text-muted-foreground line-clamp-1">{r.deskripsi || "-"}</span> },
        ]}
        formFields={[
          { key: "nama", label: "Nama Bidang", required: true, placeholder: "Bidang Pelayanan Publik" },
          { key: "kode", label: "Kode", placeholder: "BPP" },
          { key: "kepala", label: "Kepala Bidang", placeholder: "Nama kepala bidang" },
          { key: "deskripsi", label: "Deskripsi", type: "textarea", full: true, placeholder: "Uraian tugas bidang…" },
        ]}
      />
    </div>
  );
}