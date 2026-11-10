import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const mapRow = (entityName, row) => ({
  ...row,
  ...(entityName === "Buku" && {
    judul: row.judul_buku,
    isbn: row.no_isbn,
    jumlah: row.jumlah_eksemplar,
    lokasi: row.lokasi_rak,
  }),
  ...(entityName === "Anggota" && {
    nama: row.nama_lengkap,
    bidang_id: row.id_bidang == null ? "" : String(row.id_bidang),
    no_telp: row.no_telepon,
  }),
  ...(entityName === "Bidang" && {
    nama: row.nama_bidang,
    kepala: row.kepala_bidang,
  }),
  ...(entityName === "Pengunjung" && {
    created_date: row.waktu_checkin,
  }),
  ...(entityName === "Peminjaman" && {
    anggota_id: row.id_anggota,
    anggota_nama: row.nama_anggota,
    buku_id: row.id_buku,
    buku_judul: row.judul_buku,
    tanggal_kembali_rencana: row.kembali_rencana,
    tanggal_kembali_aktual: row.kembali_aktual,
  }),
});

const esc = (v) =>
  String(v ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export default function PrintDataButton({
  title,
  subtitle,
  columns,
  rows = null,
  entityName = null,
  landscape = false,
  className = "",
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const apiPath = {
    Peminjaman: "transaksi",
    Buku: "buku",
    Anggota: "anggota",
    Bidang: "bidang",
    Pengunjung: "pengunjung",
  }[entityName] || entityName?.toLowerCase();

  const handlePrint = async () => {
    setLoading(true);
    try {
      const response = rows ? null : await base44.get(`/${apiPath}`);
      const data = rows ?? (Array.isArray(response.data) ? response.data.map((row) => mapRow(entityName, row)) : []);
      const now = new Date().toLocaleString("id-ID", {
        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });
      const header = columns.map((c) => `<th>${esc(c.label)}</th>`).join("");
      const body = data
        .map(
          (r, i) =>
            `<tr><td>${i + 1}</td>${columns
              .map((c) => `<td>${esc(c.value ? c.value(r, i) : r[c.key])}</td>`)
              .join("")}</tr>`
        )
        .join("");
      const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; }
  .kop { text-align: center; border-bottom: 3px double #0f2c59; padding-bottom: 8px; margin-bottom: 12px; }
  .kop h1 { font-size: 15px; margin: 0; letter-spacing: 1px; text-transform: uppercase; }
  .kop p { font-size: 11px; margin: 3px 0 0; color: #475569; }
  h2 { font-size: 13px; margin: 0; text-align: center; text-transform: uppercase; letter-spacing: .5px; }
  .meta { font-size: 10px; color: #64748b; text-align: center; margin: 3px 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th, td { border: 1px solid #cbd5e1; padding: 4px 6px; vertical-align: top; }
  th { background: #0f2c59; color: #fff; text-align: left; }
  tr:nth-child(even) td { background: #f8fafc; }
  tfoot td { border: none; text-align: right; font-size: 10px; color: #64748b; padding-top: 6px; }
</style></head><body>
<div class="kop"><h1>Widya Netra</h1><p>Dinas Komunikasi dan Informatika Kabupaten Banyumas</p></div>
<h2>${esc(title)}</h2>
<p class="meta">${esc(subtitle || "")} &nbsp;•&nbsp; Dicetak: ${esc(now)} &nbsp;•&nbsp; Total: ${data.length} data</p>
<table><thead><tr><th style="width:26px">No</th>${header}</tr></thead><tbody>${body}</tbody>
<tfoot><tr><td colspan="${columns.length + 1}">Dicetak melalui aplikasi Widya Netra</td></tr></tfoot></table>
</body></html>`;
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 300);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data cetak",
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handlePrint} disabled={loading} className={`h-9 text-sm ${className}`}>
      {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Printer className="w-4 h-4 mr-1" />} Cetak Semua
    </Button>
  );
}