import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Bidang from "@/pages/Bidang";
import DataBuku from "@/pages/DataBuku";
import DataAnggota from "@/pages/DataAnggota";
import DataPengunjung from "@/pages/DataPengunjung";
import Transaksi from "@/pages/Transaksi";
import KartuAnggota from "@/pages/KartuAnggota";
import Riwayat from "@/pages/Riwayat";
import Laporan from "@/pages/Laporan";
import Pengaturan from "@/pages/Pengaturan";
import CheckIn from "@/pages/CheckIn";
import ModePengunjung from "@/pages/ModePengunjung";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError && authError.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />
      <Route path="/check-in" element={<CheckIn />} />
      <Route path="/pengunjung" element={<ModePengunjung />} />
      <Route path="/" element={<Landing />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bidang" element={<Bidang />} />
          <Route path="/data-buku" element={<DataBuku />} />
          <Route path="/data-anggota" element={<DataAnggota />} />
          <Route path="/data-pengunjung" element={<DataPengunjung />} />
          <Route path="/transaksi" element={<Transaksi />} />
          <Route path="/kartu-anggota" element={<KartuAnggota />} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="/laporan" element={<Laporan />} />
          <Route path="/pengaturan" element={<Pengaturan />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;