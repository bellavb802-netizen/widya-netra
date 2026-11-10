import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Library, ScanLine, Loader2, CheckCircle2, RefreshCw, BadgeCheck } from "lucide-react";

const TUJUAN_OPTIONS = [
  "Membaca di Tempat",
  "Meminjam Buku",
  "Mengembalikan Buku",
  "Riset / Tugas",
  "Mengurus Kartu Anggota",
  "Lainnya",
];

const EMPTY_FORM = { nama_lengkap: "", asal_instansi: "", no_hp: "", tujuan_kunjungan: "" };

export default function CheckIn() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");
  const memberId = new URLSearchParams(window.location.search).get("mid") || "";
  const [member, setMember] = useState(null);
  const [memberLoading, setMemberLoading] = useState(Boolean(memberId));

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (!memberId) return;
    (async () => {
      try {
        const { data } = await base44.get(`/anggota/${memberId}`);
        if (data) {
          const anggota = {
            ...data,
            nama: data.nama_lengkap,
          };
          setMember(anggota);
          setForm((p) => ({
            ...p,
            nama_lengkap: anggota.nama || p.nama_lengkap,
            asal_instansi: anggota.jabatan
              ? `Dinkominfo — ${anggota.jabatan}`
              : p.asal_instansi,
          }));
        }
      } catch {
        setError("Kode anggota tidak dikenali. Silakan isi data manual.");
      } finally {
        setMemberLoading(false);
      }
    })();
  }, [memberId]);

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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground mb-3">
            <Library className="w-7 h-7" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-foreground leading-tight">
            Perpustakaan Widya Netra
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Dinas Komunikasi dan Informatika Kabupaten Banyumas
          </p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-display font-bold text-lg text-foreground">Kunjungan Tercatat</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Terima kasih, <span className="font-semibold text-foreground">{done.nama}</span>. Selamat berkunjung!
            </p>
            <p className="text-[11px] text-muted-foreground mt-3">{done.waktu} WIB</p>
            <Button variant="outline" className="w-full mt-6 h-10 text-sm" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> Daftarkan Kunjungan Lain
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <ScanLine className="w-4 h-4 text-primary" />
              <h2 className="font-display font-bold text-base text-foreground">Check-in Pengunjung</h2>
            </div>

            {memberLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat data anggota…
              </div>
            )}

            {member && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 mb-4">
                <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-foreground">
                  Check-in sebagai anggota: <span className="font-semibold">{member.nama}</span>
                </p>
              </div>
            )}

            <div className="grid gap-4">
              <div>
                <Label htmlFor="nama_lengkap" className="text-xs font-semibold mb-1.5 block">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nama_lengkap"
                  value={form.nama_lengkap}
                  onChange={(e) => setField("nama_lengkap", e.target.value)}
                  className="h-11 text-sm"
                  placeholder="Nama lengkap Anda"
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="asal_instansi" className="text-xs font-semibold mb-1.5 block">
                  Asal Instansi
                </Label>
                <Input
                  id="asal_instansi"
                  value={form.asal_instansi}
                  onChange={(e) => setField("asal_instansi", e.target.value)}
                  className="h-11 text-sm"
                  placeholder="mis. Dinkominfo / SMKN 1 / Umum"
                />
              </div>

              <div>
                <Label htmlFor="no_hp" className="text-xs font-semibold mb-1.5 block">
                  No HP
                </Label>
                <Input
                  id="no_hp"
                  type="tel"
                  value={form.no_hp}
                  onChange={(e) => setField("no_hp", e.target.value)}
                  className="h-11 text-sm"
                  placeholder="08xx-xxxx-xxxx"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Tujuan Kunjungan</Label>
                <Select value={form.tujuan_kunjungan} onValueChange={(v) => setField("tujuan_kunjungan", v)}>
                  <SelectTrigger className="h-11 text-sm">
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

              <Button type="submit" className="w-full h-11 text-sm" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                {saving ? "Menyimpan…" : "Simpan Kunjungan"}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center mt-4">
              Data kunjungan Anda otomatis tercatat di buku kunjungan perpustakaan.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}