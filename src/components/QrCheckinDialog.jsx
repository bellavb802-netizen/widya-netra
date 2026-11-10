import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { QrCode, ExternalLink, Copy, Check } from "lucide-react";
import { getCheckinUrl } from "@/lib/checkinUrl";

export default function QrCheckinDialog() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const checkinUrl = getCheckinUrl();

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(checkinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <Button variant="outline" className="h-9 text-sm" onClick={() => setOpen(true)}>
        <QrCode className="w-4 h-4 mr-1" /> QR Check-in
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">QR Check-in Pengunjung</DialogTitle>
            <DialogDescription className="text-xs">
              Cetak atau tampilkan QR ini di pintu masuk. Pengunjung memindainya dengan kamera ponsel,
              mengisi data, dan kunjungan otomatis tercatat di Data Pengunjung.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-2">
            <div className="p-4 rounded-xl border border-border bg-background">
              <QRCodeSVG value={checkinUrl} size={208} level="M" />
            </div>
            <p className="mt-3 text-[11px] font-mono text-muted-foreground break-all text-center px-2">{checkinUrl}</p>
            <div className="flex gap-2 mt-4 w-full">
              <Button variant="outline" className="flex-1 h-9 text-xs" onClick={copyUrl}>
                {copied ? <Check className="w-4 h-4 mr-1 text-primary" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? "Tersalin" : "Salin Tautan"}
              </Button>
              <Button className="flex-1 h-9 text-xs" onClick={() => window.open(checkinUrl, "_blank")}>
                <ExternalLink className="w-4 h-4 mr-1" /> Buka Halaman
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-4">
              {import.meta.env.DEV
                ? "Untuk penggunaan lokal, sambungkan ponsel ke Wi-Fi yang sama dengan komputer. Jika tidak terbuka, periksa izin firewall."
                : "QR menggunakan domain aplikasi. Pastikan aplikasi sudah dipublikasikan agar dapat dipindai pengunjung."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}