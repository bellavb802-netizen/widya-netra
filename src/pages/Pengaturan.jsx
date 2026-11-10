import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Save, Loader2, Building2, UserCog } from "lucide-react";

export default function Pengaturan() {
  const { toast } = useToast();
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: list } = await base44.get("/pengaturan");
        if (list && list.length > 0) {
          setRecord(list[0]);
          setForm(list[0]);
        } else {
          const { data: created } = await base44.post("/pengaturan", {
            nama_instansi: "Dinas Komunikasi dan Informatika Kabupaten Banyumas",
            nama_aplikasi: "Widya Netra",
            denda_per_hari: 1000,
          });
          setRecord(created);
          setForm(created);
        }
      } catch (e) {
        toast({ variant: "destructive", title: "Gagal memuat pengaturan", description: e.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, denda_per_hari: Number(form.denda_per_hari) || 0 };
      const { data: updated } = await base44.put(`/pengaturan/${record.id}`, payload);
      setRecord(updated);
      toast({ title: "Pengaturan disimpan" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal menyimpan", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <PageHeader title="Pengaturan" subtitle="Konfigurasi identitas instansi dan aplikasi perpustakaan." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Identitas Instansi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nama Instansi" value={form.nama_instansi} onChange={(v) => setField("nama_instansi", v)} />
            <Field label="Nama Aplikasi" value={form.nama_aplikasi} onChange={(v) => setField("nama_aplikasi", v)} />
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Alamat</Label>
              <Textarea value={form.alamat || ""} onChange={(e) => setField("alamat", e.target.value)} rows={2} className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" value={form.email || ""} onChange={(v) => setField("email", v)} />
              <Field label="No. Telepon" value={form.no_telp || ""} onChange={(v) => setField("no_telp", v)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2"><UserCog className="w-4 h-4 text-accent" /> Pejabat & Operasional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Kepala Perpustakaan" value={form.kepala_perpustakaan || ""} onChange={(v) => setField("kepala_perpustakaan", v)} />
            <Field label="NIP Kepala" value={form.nip_kepala || ""} onChange={(v) => setField("nip_kepala", v)} />
            <Field label="URL Logo" value={form.logo_url || ""} onChange={(v) => setField("logo_url", v)} />
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Denda per Hari (Rp)</Label>
              <Input type="number" value={form.denda_per_hari ?? 0} onChange={(e) => setField("denda_per_hari", e.target.value)} className="h-9 text-sm" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-5">
        <Button onClick={handleSave} disabled={saving} className="min-w-40">
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-xs font-semibold mb-1.5 block">{label}</Label>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm" />
    </div>
  );
}