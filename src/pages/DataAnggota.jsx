import React, { useEffect, useState } from "react";
import EntityManager from "@/components/EntityManager";
import PageHeader from "@/components/PageHeader";
import { base44 } from "@/api/base44Client";
import StatusPill from "@/components/StatusPill";
import PrintDataButton from "@/components/PrintDataButton";
import { useToast } from "@/components/ui/use-toast";

export default function DataAnggota() {
  const [bidangOptions, setBidangOptions] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadBidang = async () => {
      try {
        const { data } = await base44.get("/bidang");
        setBidangOptions((data || []).map((row) => ({ value: String(row.id), label: row.nama_bidang })));
      } catch (error) {
        toast({ variant: "destructive", title: "Gagal memuat bidang", description: error.message });
      }
    };
    loadBidang();
  }, [toast]);

  const bidangLabel = (id) => bidangOptions.find((b) => b.value === id)?.label || "-";

  return (
    <div>
      <PageHeader title="Data Anggota" subtitle="Master data anggota / pegawai perpustakaan.">
        <PrintDataButton
          title="Daftar Anggota Perpustakaan"
          subtitle="Data Anggota"
          entityName="Anggota"
          columns={[
            { label: "Nama", key: "nama" },
            { label: "NIP", key: "nip" },
            { label: "Jabatan", key: "jabatan" },
            { label: "Bidang", value: (r) => bidangLabel(r.bidang_id) },
            { label: "No. Telepon", key: "no_telp" },
            { label: "Email", key: "email" },
            { label: "Tgl. Daftar", key: "tanggal_daftar" },
            { label: "Status", key: "status" },
            { label: "Alamat", key: "alamat" },
          ]}
        />
      </PageHeader>
      <EntityManager
        entityName="Anggota"
        title="Anggota"
        searchKeys={["nama", "nip", "jabatan", "email"]}
        defaultValues={{ status: "aktif", tanggal_daftar: new Date().toISOString().slice(0, 10) }}
        columns={[
          { key: "nama", label: "Nama", render: (r) => (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground shrink-0">
                {r.nama?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{r.nama}</p>
                <p className="text-[11px] text-muted-foreground">{r.nip || "-"}</p>
              </div>
            </div>
          ) },
          { key: "jabatan", label: "Jabatan" },
          { key: "bidang_id", label: "Bidang", render: (r) => bidangLabel(r.bidang_id) },
          { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
        ]}
        formFields={[
          { key: "nama", label: "Nama Lengkap", required: true, full: true, placeholder: "Nama anggota / pegawai" },
          { key: "nip", label: "NIP", placeholder: "198501012010011001" },
          { key: "jabatan", label: "Jabatan", placeholder: "Staff / Pejabat" },
          { key: "bidang_id", label: "Bidang", type: "select", options: bidangOptions, placeholder: "Pilih bidang" },
          { key: "no_telp", label: "No. Telepon", placeholder: "08xx-xxxx-xxxx" },
          { key: "email", label: "Email", type: "email", placeholder: "nama@dinkominfo.banyumas.go.id" },
          { key: "tanggal_daftar", label: "Tanggal Daftar", type: "date" },
          { key: "status", label: "Status", type: "select", options: [{ value: "aktif", label: "Aktif" }, { value: "nonaktif", label: "Nonaktif" }] },
          { key: "alamat", label: "Alamat", type: "textarea", full: true },
        ]}
      />
    </div>
  );
}