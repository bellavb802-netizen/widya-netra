import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusPill from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Printer, Download, Loader2, Inbox, FileBarChart, ArrowLeftRight, Library, Users } from "lucide-react";

export default function Laporan() {
  const { toast } = useToast();
  const [peminjaman, setPeminjaman] = useState([]);
  const [buku, setBuku] = useState([]);
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const [p, b, a] = await Promise.all([
          base44.get("/transaksi"),
          base44.get("/buku"),
          base44.get("/anggota"),
        ]);
        setPeminjaman((p.data || []).map((row) => ({
          ...row,
          anggota_nama: row.nama_anggota,
          buku_judul: row.judul_buku,
          tanggal_kembali_rencana: row.kembali_rencana,
          tanggal_kembali_aktual: row.kembali_aktual,
        })));
        setBuku(b.data || []);
        setAnggota(a.data || []);
      } catch (e) {
        toast({ variant: "destructive", title: "Gagal memuat", description: e.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return peminjaman.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (from && p.tanggal_pinjam < from) return false;
      if (to && p.tanggal_pinjam > to) return false;
      return true;
    });
  }, [peminjaman, from, to, status]);

  const totalPinjam = filtered.length;
  const totalDikembalikan = filtered.filter((p) => p.status === "dikembalikan").length;
  const totalTerlambat = filtered.filter((p) => p.status === "terlambat" || (p.status === "dipinjam" && p.tanggal_kembali_rencana < new Date().toISOString().slice(0, 10))).length;
  const totalDipinjam = filtered.filter((p) => p.status === "dipinjam").length;

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const header = ["No", "Anggota", "Buku", "Tgl Pinjam", "Kembali Rencana", "Kembali Aktual", "Status"];
    const lines = filtered.map((r, i) => [i + 1, r.anggota_nama, r.buku_judul, r.tanggal_pinjam, r.tanggal_kembali_rencana, r.tanggal_kembali_aktual || "-", r.status].map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-sirkulasi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Laporan diunduh" });
  };

  return (
    <div>
      <PageHeader title="Laporan" subtitle="Laporan sirkulasi perpustakaan dengan filter periode dan status.">
        <Button variant="outline" onClick={handleDownload} className="no-print"><Download className="w-4 h-4 mr-1" /> Unduh CSV</Button>
        <Button onClick={handlePrint} className="no-print"><Printer className="w-4 h-4 mr-1" /> Cetak</Button>
      </PageHeader>

      {/* Filters */}
      <Card className="no-print mb-5">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Dari Tanggal</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Sampai Tanggal</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="dipinjam">Dipinjam</SelectItem>
                  <SelectItem value="dikembalikan">Dikembalikan</SelectItem>
                  <SelectItem value="terlambat">Terlambat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="h-9 text-sm w-full" onClick={() => { setFrom(""); setTo(""); setStatus("all"); }}>Reset Filter</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5 no-print">
        <StatCard label="Total Transaksi" value={totalPinjam} icon={ArrowLeftRight} tone="primary" />
        <StatCard label="Dipinjam" value={totalDipinjam} icon={Library} tone="light" />
        <StatCard label="Dikembalikan" value={totalDikembalikan} icon={Users} tone="success" />
        <StatCard label="Terlambat / Jatuh Tempo" value={totalTerlambat} icon={FileBarChart} tone="accent" />
      </div>

      {/* Table */}
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
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground"><Inbox className="w-6 h-6 mx-auto mb-2 opacity-40" /><p className="text-sm">Tidak ada data pada filter ini.</p></TableCell></TableRow>
              ) : filtered.map((r, i) => (
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

      {/* Print */}
      <div className="print-area">
        <div className="p-8 text-black">
          <div className="border-b-2 border-black pb-3 mb-4">
            <h1 className="text-lg font-bold">Widya Netra — Dinkominfo Kabupaten Banyumas</h1>
            <p className="text-sm">Laporan Sirkulasi Perpustakaan</p>
            <p className="text-xs">Periode: {from || "awal"} s/d {to || "akhir"} · Status: {status === "all" ? "Semua" : status}</p>
            <p className="text-xs">Dicetak: {new Date().toLocaleString("id-ID")}</p>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
            <div><b>Total:</b> {totalPinjam}</div>
            <div><b>Dipinjam:</b> {totalDipinjam}</div>
            <div><b>Dikembalikan:</b> {totalDikembalikan}</div>
            <div><b>Terlambat:</b> {totalTerlambat}</div>
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
              {filtered.map((r, i) => (
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
        </div>
      </div>
    </div>
  );
}