import React from "react";
import { Facebook, Instagram, Youtube, Globe, Phone, Mail } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="bg-[#083358] text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Kolom kiri — Judul + Peta + Alamat */}
        <div className="flex flex-col">
          <p className="font-bold text-sm sm:text-base mb-3">
            Dinas Komunikasi dan Informatika Kabupaten Banyumas
          </p>
          <div className="rounded-lg overflow-hidden ring-1 ring-white/15">
            <iframe
              title="Lokasi Dinkominfo Kabupaten Banyumas"
              src="https://maps.google.com/maps?q=H6GH%2BWW%20Sokanegara%20Banyumas%20Jawa%20Tengah&output=embed"
              className="w-full h-44 border-0"
              loading="lazy"
            />
          </div>
          <p className="text-xs text-white/80 leading-relaxed mt-3">
            Jl. Masjid No.8, Purwokerto, Sokanegara, Kec. Purwokerto Tim., Kabupaten Banyumas, Jawa Tengah 53115
          </p>
        </div>

        {/* Kolom tengah — MEDIA SOSIAL */}
        <div className="flex flex-col">
          <h3 className="font-bold text-sm tracking-wide mb-4">MEDIA SOSIAL</h3>
          <ul className="flex flex-col gap-3.5">
            <li>
              <a href="https://www.facebook.com/share/1FT2drTniQ/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-white hover:text-white/80 transition-colors">
                <Facebook className="w-4 h-4 shrink-0" />
                <span>Dinkominfo Kab Banyumas</span>
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/dinkominfo_kab.banyumas?stkn=ZG1hNXJwaXZibHg5" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-white hover:text-white/80 transition-colors">
                <Instagram className="w-4 h-4 shrink-0" />
                <span>@dinkominfo_kab.banyumas</span>
              </a>
            </li>
            <li>
              <a href="https://youtube.com/@dinaskominfokabupatenbanyumas?si=W1LpGZ-obPXpv19i" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-white hover:text-white/80 transition-colors">
                <Youtube className="w-4 h-4 shrink-0" />
                <span>DINAS KOMINFO Kabupaten Banyumas</span>
              </a>
            </li>
            <li>
              <a href="https://dinkominfo.banyumaskab.go.id/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-white hover:text-white/80 transition-colors">
                <Globe className="w-4 h-4 shrink-0" />
                <span>dinkominfo.banyumaskab.go.id</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Kolom kanan — HOTLINE */}
        <div className="flex flex-col">
          <h3 className="font-bold text-sm tracking-wide mb-4">HOTLINE</h3>
          <ul className="flex flex-col gap-3.5">
            <li className="flex items-center gap-3 text-sm text-white">
              <Phone className="w-4 h-4 shrink-0" />
              <span>(0281) 632338</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-white">
              <Mail className="w-4 h-4 shrink-0" />
              <span>dinkominfo@banyumaskab.go.id</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-3.5 text-center text-[11px] text-white/60">
        © {new Date().getFullYear()} Dinas Komunikasi dan Informatika Kabupaten Banyumas
      </div>
    </footer>
  );
}