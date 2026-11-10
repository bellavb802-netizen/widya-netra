import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  return (
    <AuthLayout
      icon={Mail}
      title="Lupa password?"
      subtitle="Pengaturan ulang password akun"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />
          Kembali ke halaman masuk
        </Link>
      }
    >
      <p className="text-sm text-muted-foreground text-center">
        Hubungi administrator untuk mengatur ulang password akun Anda.
      </p>
    </AuthLayout>
  );
}
