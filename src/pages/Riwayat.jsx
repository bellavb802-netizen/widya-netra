import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Printer, Download, Search, Loader2, Inbox } from "lucide-react";

export default function Riwayat() {
  const { toast } = useToast();
  const [peminjaman, setPeminjaman] = useState([]);
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anggotaId, setAnggotaId] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [p, a] = await Promise.all([
          base44.get("/transaksi"),
          base44.get("/anggota"),
        ]);
        setPeminjaman((p.data || []).map((row) => ({
          ...row,
          anggota_id: String(row.id_anggota),
          anggota_nama: row.nama_anggota,
          buku_judul: row.judul_buku,
          tanggal_kembali_rencana: row.kembali_rencana,
          tanggal_kembali_aktual: row.kembali_aktual,
        })));
        setAnggota((a.data || []).map((row) => ({
          ...row,
          id: String(row.id),
          nama: row.nama_lengkap,
        })));
      } catch (e) {
        toast({ variant: "destructive", title: "Gagal memuat", description: e.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows = useMemo(() => {
    let r = peminjaman;
    if (anggotaId !== "all") r = r.filter((p) => p.anggota_id === anggotaId);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((p) => (p.buku_judul || "").toLowerCase().includes(q) || (p.anggota_nama || "").toLowerCase().includes(q));
    }
    return r;
  }, [peminjaman, anggotaId, query]);

  const selectedAnggota = anggota.find((a) => a.id === anggotaId);

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const header = ["No", "Anggota", "Buku", "Tgl Pinjam", "Kembali Rencana", "Kembali Aktual", "Status"];
    const lines = rows.map((r, i) => [i + 1, r.anggota_nama, r.buku_judul, r.tanggal_pinjam, r.tanggal_kembali_rencana, r.tanggal_kembali_aktual || "-", r.status].map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riwayat-peminjaman-${(selectedAnggota?.nama || "semua").replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "File diunduh" });
  };

  return (
    <div>
      <PageHeader title="Riwayat Peminjaman" subtitle="Histori peminjaman per anggota / pegawai. Dapat dicetak dan diunduh.">
        <Button variant="outline" onClick={handleDownload} className="no-print"><Download className="w-4 h-4 mr-1" /> Unduh CSV</Button>
        <Button onClick={handlePrint} className="no-print"><Printer className="w-4 h-4 mr-1" /> Cetak</Button>
      </PageHeader>

      <div className="no-print flex flex-col sm:flex-row gap-3 mb-4">
        <div className="sm:w-72">
          <Select value={anggotaId} onValueChange={setAnggotaId}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Semua anggota" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Anggota</SelectItem>
              {anggota.map((a) => <SelectItem key={a.id} value={a.id}>{a.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari buku / anggota…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </div>

      <Card className="no-print">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                <TableHead className="text-[11px] uppercase text-muted-foreground">No</TableHead>
                <TableHead className="text-[11px] uppercase text-muted-foreground">Anggota</TableHead>
                <TableHead className="text-[11px] uppercase text-muted-foreground">Buku</TableHead>
                <TableHead className="text-[11px] uppercase text-muted-foreground">Pinjam</TableHead>
                <TableHead className="text-[11px] uppercase text-muted-foreground">Kembali Rencana</TableHead>
                <TableHead className="text-[11px] uppercase text-muted-foreground">Kembali Aktual</TableHead>
                <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground"><Inbox className="w-6 h-6 mx-auto mb-2 opacity-40" /><p className="text-sm">Tidak ada riwayat.</p></TableCell></TableRow>
              ) : rows.map((r, i) => (
                <TableRow key={r.id} className="text-sm">
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium text-foreground">{r.anggota_nama || "-"}</TableCell>
                  <TableCell className="text-foreground">{r.buku_judul || "-"}</TableCell>
                  <TableCell className="text-xs">{r.tanggal_pinjam || "-"}</TableCell>
                  <TableCell className="text-xs">{r.tanggal_kembali_rencana || "-"}</TableCell>
                  <TableCell className="text-xs">{r.tanggal_kembali_aktual || "-"}</TableCell>
                  <TableCell><StatusPill value={r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Print area */}
      <div className="print-area">
        <PrintReport rows={rows} title={selectedAnggota ? `Riwayat Peminjaman — ${selectedAnggota.nama}` : "Riwayat Peminjaman Semua Anggota"} />
      </div>
    </div>
  );
}

function PrintReport({ rows, title }) {
  return (
    <div className="p-8 text-black">
      <div className="border-b-2 border-black pb-3 mb-4">
        <h1 className="text-lg font-bold">Widya Netra — Dinkominfo Kabupaten Banyumas</h1>
        <p className="text-sm">{title}</p>
        <p className="text-xs">Dicetak: {new Date().toLocaleString("id-ID")}</p>
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="border border-black px-2 py-1 text-left">No</th>
            <th className="border border-black px-2 py-1 text-left">Anggota</th>
            <th className="border border-black px-2 py-1 text-left">Buku</th>
            <th className="border border-black px-2 py-1 text-left">Pinjam</th>
            <th className="border border-black px-2 py-1 text-left">Kembali Rencana</th>
            <th className="border border-black px-2 py-1 text-left">Kembali Aktual</th>
            <th className="border border-black px-2 py-1 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td className="border border-black px-2 py-1">{i + 1}</td>
              <td className="border border-black px-2 py-1">{r.anggota_nama}</td>
              <td className="border border-black px-2 py-1">{r.buku_judul}</td>
              <td className="border border-black px-2 py-1">{r.tanggal_pinjam}</td>
              <td className="border border-black px-2 py-1">{r.tanggal_kembali_rencana}</td>
              <td className="border border-black px-2 py-1">{r.tanggal_kembali_aktual || "-"}</td>
              <td className="border border-black px-2 py-1">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs mt-4 text-right">Total: {rows.length} transaksi</p>
    </div>
  );
}