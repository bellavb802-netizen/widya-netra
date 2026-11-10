import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import PrintDataButton from "@/components/PrintDataButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus, Pencil, Trash2, Search, Loader2, Inbox, Undo2, ArrowLeftRight,
} from "lucide-react";

const todayStr = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => {
  const dt = new Date(d); dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

export default function Transaksi() {
  const [params] = useSearchParams();
  const { toast } = useToast();
  const [tab, setTab] = useState(params.get("aksi") === "kembali" ? "kembali" : "pinjam");
  const [peminjaman, setPeminjaman] = useState([]);
  const [anggota, setAnggota] = useState([]);
  const [buku, setBuku] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, a, b] = await Promise.all([
        base44.get("/transaksi"),
        base44.get("/anggota"),
        base44.get("/buku"),
      ]);
      setPeminjaman((p.data || []).map((row) => ({
        ...row,
        id: String(row.id),
        anggota_id: String(row.id_anggota),
        buku_id: String(row.id_buku),
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
      setBuku((b.data || []).map((row) => ({
        ...row,
        id: String(row.id),
        judul: row.judul_buku,
        jumlah: row.jumlah_eksemplar,
      })));
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal memuat data", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const anggotaOptions = useMemo(() => anggota.map((a) => ({ value: a.id, label: `${a.nama}${a.nip ? " · " + a.nip : ""}` })), [anggota]);
  const bukuTersedia = useMemo(() => buku.filter((b) => (b.tersedia ?? 0) > 0), [buku]);
  const bukuOptions = useMemo(() => bukuTersedia.map((b) => ({ value: b.id, label: `${b.judul} (${b.tersedia} tersedia)` })), [bukuTersedia]);

  const filteredPinjam = useMemo(() => {
    if (!query.trim()) return peminjaman;
    const q = query.toLowerCase();
    return peminjaman.filter((p) =>
      (p.anggota_nama || "").toLowerCase().includes(q) ||
      (p.buku_judul || "").toLowerCase().includes(q)
    );
  }, [peminjaman, query]);

  const dipinjamList = filteredPinjam.filter((p) => p.status === "dipinjam");

  const openCreate = () => {
    setEditing(null);
    setForm({
      anggota_id: "",
      buku_id: "",
      tanggal_pinjam: todayStr(),
      tanggal_kembali_rencana: addDays(todayStr(), 7),
      catatan: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      anggota_id: row.anggota_id,
      buku_id: row.buku_id,
      tanggal_pinjam: row.tanggal_pinjam,
      tanggal_kembali_rencana: row.tanggal_kembali_rencana,
      catatan: row.catatan || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.anggota_id || !form.buku_id) {
      toast({ variant: "destructive", title: "Validasi", description: "Anggota dan buku wajib dipilih." });
      return;
    }
    setSaving(true);
    try {
      const ang = anggota.find((a) => a.id === form.anggota_id);
      const bk = buku.find((b) => b.id === form.buku_id);
      const payload = {
        id_anggota: form.anggota_id,
        id_buku: form.buku_id,
        tanggal_pinjam: form.tanggal_pinjam,
        kembali_rencana: form.tanggal_kembali_rencana,
        catatan: form.catatan || "",
      };
      if (editing) {
        await base44.put(`/transaksi/${editing.id}`, { ...payload, status: editing.status });
        toast({ title: "Transaksi diperbarui" });
      } else {
        await base44.post("/transaksi", payload);
        toast({ title: "Peminjaman dicatat", description: `${bk?.judul} — ${ang?.nama}` });
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal menyimpan", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleKembali = async (row) => {
    try {
      const late = row.tanggal_kembali_rencana < todayStr();
      await base44.put(`/transaksi/${row.id}`, {
        status: "dikembalikan",
        kembali_aktual: todayStr(),
      });
      toast({
        title: "Buku dikembalikan",
        description: late ? "Pengembalian terlambat." : "Tepat waktu.",
        variant: late ? "destructive" : "default",
      });
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal memproses", description: e.message });
    }
  };

  const handleDelete = async () => {
    try {
      await base44.delete(`/transaksi/${deleteId}`);
      toast({ title: "Transaksi dihapus" });
      setDeleteId(null);
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal menghapus", description: e.message });
    }
  };

  return (
    <div>
      <PageHeader title="Transaksi" subtitle="Pencatatan peminjaman dan pengembalian buku.">
        <PrintDataButton
          title="Daftar Transaksi Peminjaman"
          subtitle="Transaksi Peminjaman & Pengembalian Buku"
          rows={peminjaman}
          landscape
          columns={[
            { label: "Anggota", key: "anggota_nama" },
            { label: "Buku", key: "buku_judul" },
            { label: "Tgl. Pinjam", key: "tanggal_pinjam" },
            { label: "Rencana Kembali", key: "tanggal_kembali_rencana" },
            { label: "Kembali Aktual", key: "tanggal_kembali_aktual" },
            { label: "Status", key: "status" },
            { label: "Catatan", key: "catatan" },
          ]}
        />
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pinjam" className="text-xs"><ArrowLeftRight className="w-3.5 h-3.5 mr-1" /> Peminjaman</TabsTrigger>
          <TabsTrigger value="kembali" className="text-xs"><Undo2 className="w-3.5 h-3.5 mr-1" /> Pengembalian</TabsTrigger>
        </TabsList>

        <TabsContent value="pinjam">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari anggota / buku…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Button onClick={openCreate} className="h-9 text-sm"><Plus className="w-4 h-4 mr-1" /> Pinjam Buku</Button>
          </div>
          <TransaksiTable
            rows={filteredPinjam}
            loading={loading}
            onEdit={openEdit}
            onDelete={(id) => setDeleteId(id)}
            onKembali={handleKembali}
          />
        </TabsContent>

        <TabsContent value="kembali">
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center"><Undo2 className="w-5 h-5 text-accent" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Pengembalian Buku</p>
                  <p className="text-xs text-muted-foreground">{dipinjamList.length} buku sedang dipinjam. Klik "Kembalikan" untuk memproses.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <TransaksiTable
            rows={dipinjamList}
            loading={loading}
            onEdit={openEdit}
            onDelete={(id) => setDeleteId(id)}
            onKembali={handleKembali}
            kembaliMode
          />
        </TabsContent>
      </Tabs>

      {/* Form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Peminjaman" : "Pinjam Buku Baru"}</DialogTitle>
            <DialogDescription className="text-xs">Pilih anggota dan buku, tentukan tanggal kembali rencana.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-2">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Anggota <span className="text-destructive">*</span></Label>
              <Select value={form.anggota_id || ""} onValueChange={(v) => setForm((p) => ({ ...p, anggota_id: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Pilih anggota…" /></SelectTrigger>
                <SelectContent>
                  {anggotaOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Buku <span className="text-destructive">*</span></Label>
              <Select value={form.buku_id || ""} onValueChange={(v) => setForm((p) => ({ ...p, buku_id: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Pilih buku yang tersedia…" /></SelectTrigger>
                <SelectContent>
                  {bukuOptions.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">Tidak ada buku tersedia.</p>
                  ) : bukuOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Tanggal Pinjam</Label>
                <Input type="date" value={form.tanggal_pinjam || ""} onChange={(e) => setForm((p) => ({ ...p, tanggal_pinjam: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Kembali Rencana</Label>
                <Input type="date" value={form.tanggal_kembali_rencana || ""} onChange={(e) => setForm((p) => ({ ...p, tanggal_kembali_rencana: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Catatan</Label>
              <Input value={form.catatan || ""} onChange={(e) => setForm((p) => ({ ...p, catatan: e.target.value }))} className="h-9 text-sm" placeholder="Opsional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus transaksi ini?</DialogTitle>
            <DialogDescription className="text-xs">Stok buku akan dikembalikan jika status masih dipinjam.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransaksiTable({ rows, loading, onEdit, onDelete, onKembali, kembaliMode }) {
  const today = todayStr();
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/60 hover:bg-secondary/60">
            <TableHead className="text-[11px] uppercase text-muted-foreground">No</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Anggota</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Buku</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Pinjam</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Kembali Rencana</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
            <TableHead className="text-right text-[11px] uppercase text-muted-foreground">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
              <Inbox className="w-6 h-6 mx-auto mb-2 opacity-40" /><p className="text-sm">Tidak ada data.</p>
            </TableCell></TableRow>
          ) : rows.map((r, i) => {
            const late = r.status === "dipinjam" && r.tanggal_kembali_rencana < today;
            return (
              <TableRow key={r.id} className="text-sm">
                <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium text-foreground">{r.anggota_nama || "-"}</TableCell>
                <TableCell className="text-foreground">{r.buku_judul || "-"}</TableCell>
                <TableCell className="text-xs">{r.tanggal_pinjam || "-"}</TableCell>
                <TableCell className="text-xs">
                  {r.tanggal_kembali_rencana || "-"}
                  {late && <span className="block text-[10px] text-amber-600 font-semibold">Terlambat</span>}
                </TableCell>
                <TableCell><StatusPill value={r.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {kembaliMode || r.status === "dipinjam" ? (
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onKembali(r)}>
                        <Undo2 className="w-3.5 h-3.5 mr-1" /> Kembalikan
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(r)} title="Edit"><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(r.id)} title="Hapus"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}