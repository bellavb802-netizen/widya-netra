import React, { useEffect, useMemo, useState } from "react";
import { base44, getLocalFileUrl } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import FileViewerDialog from "@/components/FileViewerDialog";
import { Plus, Pencil, Trash2, Search, Loader2, Inbox } from "lucide-react";

const API_ENTITIES = {
  Peminjaman: "transaksi",
};

const FIELD_NAMES = {
  Bidang: { nama: "nama_bidang", kepala: "kepala_bidang" },
  Buku: {
    judul: "judul_buku",
    isbn: "no_isbn",
    jumlah: "jumlah_eksemplar",
    lokasi: "lokasi_rak",
    cover_url: "cover_buku",
    file_url: "file_buku",
  },
  Anggota: { nama: "nama_lengkap", bidang_id: "id_bidang", no_telp: "no_telepon" },
  Peminjaman: {
    anggota_id: "id_anggota",
    buku_id: "id_buku",
    tanggal_kembali_rencana: "kembali_rencana",
  },
};

const toApiField = (entityName, key) => FIELD_NAMES[entityName]?.[key] || key;
const toApiPath = (entityName) => API_ENTITIES[entityName] || entityName.toLowerCase();

const mapApiRow = (entityName, row) => {
  const fields = Object.entries(FIELD_NAMES[entityName] || {});
  const mapped = { ...row };
  fields.forEach(([uiField, apiField]) => {
    if (apiField in row) mapped[uiField] = row[apiField];
  });

  if (entityName === "Pengunjung" && row.waktu_checkin) {
    mapped.created_date = row.waktu_checkin;
  }
  if (entityName === "Peminjaman") {
    mapped.anggota_nama = row.nama_anggota || row.anggota_nama;
    mapped.buku_judul = row.judul_buku || row.buku_judul;
    mapped.tanggal_kembali_aktual = row.tanggal_kembali_aktual;
  }
  if (entityName === "Anggota" && typeof row.status === "string") {
    mapped.status = row.status.toLowerCase();
  }
  if (entityName === "Anggota" && row.id_bidang != null) {
    mapped.bidang_id = String(row.id_bidang);
  }
  return mapped;
};

const mapApiPayload = (entityName, payload) =>
  Object.fromEntries(Object.entries(payload).map(([key, value]) => [toApiField(entityName, key), value]));

export default function EntityManager({
  entityName,
  title,
  subtitle,
  columns,
  formFields,
  searchKeys = [],
  emptyLabel,
  defaultValues = {},
  extraActions,
  transformOnSave,
  realtime = false,
}) {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const apiPath = toApiPath(entityName);

  const load = async () => {
    setLoading(true);
    try {
      const response = await base44.get("/" + apiPath);
      const data = Array.isArray(response.data) ? response.data : response.data?.data;
      if (!Array.isArray(data)) {
        throw new Error("Format respons API tidak valid.");
      }
      setRows(data.map((row) => mapApiRow(entityName, row)));
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal memuat data", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (!realtime) return undefined;
    const intervalId = window.setInterval(load, 5000);
    return () => window.clearInterval(intervalId);
  }, [apiPath, entityName, realtime]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)));
  }, [rows, query]);

  const openCreate = () => {
    setEditing(null);
    const init = { ...defaultValues };
    formFields.forEach((f) => { if (!(f.key in init)) init[f.key] = f.default ?? ""; });
    setForm(init);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const init = {};
    formFields.forEach((f) => { init[f.key] = row[f.key] ?? f.default ?? ""; });
    setForm(init);
    setDialogOpen(true);
  };

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    const missing = formFields.find((f) => f.required && !String(form[f.key] ?? "").trim());
    if (missing) {
      toast({ variant: "destructive", title: "Validasi", description: `${missing.label} wajib diisi.` });
      return;
    }
    setSaving(true);
    try {
      const payload = mapApiPayload(entityName, transformOnSave ? transformOnSave(form) : { ...form });
      const hasFiles = entityName === "Buku" && Object.values(payload).some((value) => value instanceof File);
      const requestPayload = hasFiles ? new FormData() : payload;
      if (hasFiles) {
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            requestPayload.append(key, value);
          }
        });
      }
      if (editing) {
        await base44.put("/" + apiPath + "/" + editing.id, requestPayload);
        toast({ title: "Data diperbarui" });
      } else {
        await base44.post("/" + apiPath, requestPayload);
        toast({ title: "Data ditambahkan" });
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal menyimpan", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.delete("/" + apiPath + "/" + deleteId);
      toast({ title: "Data dihapus" });
      setDeleteId(null);
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal menghapus", description: e.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Cari ${title.toLowerCase()}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
        <Button onClick={openCreate} className="h-9 text-sm">
          <Plus className="w-4 h-4 mr-1" /> Tambah {title}
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/60 hover:bg-secondary/60">
              <TableHead className="w-10 text-center text-[11px]">No</TableHead>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.headClassName || "text-[11px] uppercase tracking-wide text-muted-foreground"}>{c.label}</TableHead>
              ))}
              <TableHead className="text-right text-[11px] uppercase tracking-wide text-muted-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="h-32 text-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="h-32 text-center text-muted-foreground">
                  <Inbox className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{emptyLabel || `Belum ada ${title.toLowerCase()}.`}</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row, i) => (
                <TableRow key={row.id} className="text-sm">
                  <TableCell className="text-center text-xs text-muted-foreground">{i + 1}</TableCell>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.cellClassName || ""}>
                      {c.render ? c.render(row) : (String(row[c.key] ?? "-"))}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {extraActions?.(row)}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(row.id)} title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? `Edit ${title}` : `Tambah ${title}`}</DialogTitle>
            <DialogDescription className="text-xs">Lengkapi data di bawah ini lalu simpan.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 max-h-[60vh] overflow-y-auto">
            {formFields.map((f) => (
              <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
                <Label htmlFor={f.key} className="text-xs font-semibold mb-1.5 block">
                  {f.label}{f.required && <span className="text-destructive"> *</span>}
                </Label>
                {f.type === "select" ? (
                  <Select value={String(form[f.key] ?? "")} onValueChange={(v) => setField(f.key, v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={f.placeholder || "Pilih…"} /></SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "file" ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <Input
                        id={f.key}
                        type="file"
                        accept={f.accept || "application/pdf"}
                        className="h-9 text-sm file:text-xs"
                        disabled={uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(true);
                          try {
                            setField(f.key, file);
                            toast({ title: "File siap diunggah", description: file.name });
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                      {uploading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
                    </div>
                    {form[f.key] ? (
                      <div className="mt-1.5">
                        {form[f.key] instanceof File
                          ? <span className="text-xs text-muted-foreground">{form[f.key].name}</span>
                          : <FileViewerDialog fileUrl={getLocalFileUrl(form[f.key])} label="File tersimpan — baca" />}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground mt-1">{f.placeholder || "Pilih file untuk diunggah."}</p>
                    )}
                  </div>
                ) : f.type === "image" ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-20 rounded-md border border-border bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                        {form[f.key] ? (
                          <FileImage file={form[f.key]} />
                        ) : (
                          <span className="text-[10px] text-muted-foreground text-center px-1">No image</span>
                        )}
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          id={f.key}
                          type="file"
                          accept={f.accept || "image/*"}
                          className="h-9 text-sm file:text-xs"
                          disabled={uploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading(true);
                            try {
                              setField(f.key, file);
                              toast({ title: "Cover siap diunggah", description: file.name });
                            } finally {
                              setUploading(false);
                              e.target.value = "";
                            }
                          }}
                        />
                        {uploading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
                      </div>
                    </div>
                    {form[f.key] && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs mt-1.5 text-destructive hover:text-destructive"
                        onClick={() => setField(f.key, "")}
                      >
                        Hapus cover
                      </Button>
                    )}
                    {!form[f.key] && <p className="text-[11px] text-muted-foreground mt-1">{f.placeholder || "Pilih gambar cover buku."}</p>}
                  </div>
                ) : f.type === "textarea" ? (
                  <Textarea id={f.key} value={form[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)} rows={3} className="text-sm" placeholder={f.placeholder} />
                ) : (
                  <Input
                    id={f.key}
                    type={f.type || "text"}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className="h-9 text-sm"
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data ini?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">Tindakan ini tidak dapat dibatalkan. Data akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null} Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FileImage({ file }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!(file instanceof File)) {
      setSrc(getLocalFileUrl(file));
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return <img src={src} alt="preview" className="w-full h-full object-cover" />;
}