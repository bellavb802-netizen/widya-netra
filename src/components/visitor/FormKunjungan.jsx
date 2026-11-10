import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, RefreshCw, ScanLine } from "lucide-react";

const TUJUAN_OPTIONS = [
  "Membaca di Tempat",
  "Meminjam Buku",
  "Mengembalikan Buku",
  "Riset / Tugas",
  "Mengurus Kartu Anggota",
  "Lainnya",
];

const EMPTY_FORM = { nama_lengkap: "", asal_instansi: "", no_hp: "", tujuan_kunjungan: "" };

export default function FormKunjungan({ bare = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nama_lengkap.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await base44.post("/pengunjung", {
        nama_lengkap: form.nama_lengkap.trim(),
        asal_instansi: form.asal_instansi.trim(),
        no_hp: form.no_hp.trim(),
        tujuan_kunjungan: form.tujuan_kunjungan,
      });
      setDone({
        nama: form.nama_lengkap.trim(),
        waktu: new Date().toLocaleString("id-ID", {
          dateStyle: "full",
          timeStyle: "short",
          timeZone: "Asia/Jakarta",
        }),
      });
    } catch (err) {
      setError(err.message || "Gagal menyimpan kunjungan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setDone(null);
    setError("");
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm max-w-lg mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-lg text-foreground">Kunjungan Tercatat</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Terima kasih, <span className="font-semibold text-foreground">{done.nama}</span>. Selamat berkunjung!
        </p>
        <p className="text-[11px] text-muted-foreground mt-3">{done.waktu} WIB</p>
        <Button variant="outline" className="mt-6 h-10 text-sm" onClick={reset}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Daftarkan Kunjungan Lain
        </Button>
      </div>
    );
  }

  const wrapperClass = bare
    ? ""
    : "rounded-2xl border border-border bg-card p-6 shadow-sm max-w-lg mx-auto";

  return (
    <form onSubmit={submit} className={wrapperClass}>
      <div className="flex items-center gap-2 mb-5">
        <ScanLine className="w-4 h-4 text-primary" />
        <h2 className="font-display font-bold text-base text-foreground">Tambah Kunjungan</h2>
      </div>

      <div className="grid gap-4">
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">
            Nama Lengkap <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.nama_lengkap}
            onChange={(e) => setField("nama_lengkap", e.target.value)}
            className="h-10 text-sm"
            placeholder="Nama lengkap Anda"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Asal Instansi</Label>
          <Input
            value={form.asal_instansi}
            onChange={(e) => setField("asal_instansi", e.target.value)}
            className="h-10 text-sm"
            placeholder="mis. Dinkominfo / SMKN 1 / Umum"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">No HP</Label>
          <Input
            type="tel"
            value={form.no_hp}
            onChange={(e) => setField("no_hp", e.target.value)}
            className="h-10 text-sm"
            placeholder="08xx-xxxx-xxxx"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Tujuan Kunjungan</Label>
          <Select value={form.tujuan_kunjungan} onValueChange={(v) => setField("tujuan_kunjungan", v)}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Pilih tujuan kunjungan" />
            </SelectTrigger>
            <SelectContent>
              {TUJUAN_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button type="submit" className="w-full h-10 text-sm" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
          {saving ? "Menyimpan…" : "Simpan Kunjungan"}
        </Button>
      </div>
    </form>
  );
}