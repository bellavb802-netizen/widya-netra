import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, LogIn, Library } from "lucide-react";
import SiteFooter from "@/components/landing/SiteFooter";
import StatistikPublik from "@/components/landing/StatistikPublik";

const BG_IMAGE = "https://media.base44.com/images/public/6a9fadbf6a80a70d486b3abe/917389ed5_ftoo2jpg.jpeg";
const EMBLEM = "https://media.base44.com/images/public/6aa9ece40be2f0fe1b848307/ee6b074ff_LOGOBANYUMASBARU.png";
const GALERI_1 = "https://media.base44.com/images/public/6a9fadbf6a80a70d486b3abe/c86c6c7af_WhatsAppImage2026-09-15at074120.jpeg";
const GALERI_2 = "https://media.base44.com/images/public/6a9fadbf6a80a70d486b3abe/af5e06202_WhatsAppImage2026-09-15at0741181.jpeg";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header sticky — tidak ikut geser saat scroll */}
      <header className="sticky top-0 z-50 bg-[#0e3053]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between gap-4 px-5 sm:px-8 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0">
              <img src={EMBLEM} alt="Lambang Kabupaten Banyumas" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight min-w-0">
              <p className="font-bold text-white text-sm sm:text-base truncate">
                Dinas Komunikasi dan Informatika
              </p>
              <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                Pemerintah Kabupaten Banyumas
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="rounded-md font-bold border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white shrink-0"
          >
            <Link to="/login">
              <LogIn className="w-4 h-4 mr-2" /> Login
            </Link>
          </Button>
        </div>
      </header>

      {/* Bagian judul dengan latar foto perpustakaan (background fixed) */}
      <section className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundAttachment: "fixed" }}
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-16 min-h-[70vh]">
          <h1 className="font-serif font-bold tracking-[0.28em] text-white text-xl sm:text-2xl">
            PERPUSTAKAAN
          </h1>
          <p className="font-serif font-black text-4xl sm:text-6xl text-white mt-2">
            WIDYA NETRA
          </p>

          {/* Pembatas dengan ikon buku */}
          <div className="flex items-center gap-3 w-full max-w-md mt-6">
            <div className="h-px flex-1 bg-white/40" />
            <BookOpen className="w-5 h-5 text-white shrink-0" />
            <div className="h-px flex-1 bg-white/40" />
          </div>

          <p className="italic text-white/85 text-sm sm:text-base text-center mt-5">
            Membaca Membuka Wawasan, Literasi Menggerakkan Perubahan
          </p>

          <Button
            asChild
            size="lg"
            className="h-11 px-8 rounded-md font-bold bg-[#0e3053] text-white hover:bg-[#0e3053]/85 mt-8"
          >
            <Link to="/pengunjung">
              <Library className="w-4 h-4 mr-2" /> Lihat Koleksi Buku
            </Link>
          </Button>
        </div>
      </section>

      {/* Galeri dengan latar gambar buku biru */}
      <section className="relative py-10 px-4">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(https://media.base44.com/images/public/6aa9ece40be2f0fe1b848307/0c47e51dc_ChatGPTImage22Sep20260742331.png)" }}
        />
        <div className="absolute inset-0 bg-[#083358]/20" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white text-center mb-6">
            Profil Perpustakaan
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
              <figure className="rounded-xl overflow-hidden shadow-lg ring-1 ring-white/20">
                <img src={GALERI_1} alt="Perpustakaan Widya Netra" className="w-full h-full object-cover aspect-[4/3]" />
              </figure>
              <figure className="rounded-xl overflow-hidden shadow-lg ring-1 ring-white/20">
                <img src={GALERI_2} alt="Logo Perpustakaan Widya Netra" className="w-full h-full object-cover aspect-[4/3]" />
              </figure>
            </div>
            <div className="lg:col-span-3 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 p-5">
              <p className="text-sm sm:text-base text-white leading-relaxed">
                Perpustakaan Widya Netra hadir sebagai wadah literasi modern berbasis digital yang dirancang untuk mendukung penguatan pengetahuan, transparansi informasi, serta peningkatan budaya membaca di lingkungan pemerintah daerah maupun masyarakat umum. Dengan slogan "Membaca Membuka Wawasan, Literasi Menggerakkan Perubahan", kami menyediakan akses informasi yang mudah, cepat, dan inklusif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistik publik — hanya tampilan, tanpa akses ke data */}
      <StatistikPublik />

      {/* Footer */}
      <div className="mt-auto">
        <SiteFooter />
      </div>
    </div>
  );
}