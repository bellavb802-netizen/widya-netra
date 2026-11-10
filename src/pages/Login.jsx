import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpenCheck, Lock, User } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(username.trim(), password);
      setLoading(false);
      if (result.success) {
        const dest = location.state?.from || "/dashboard";
        navigate(dest, { replace: true });
      } else {
        setError(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-civic-grid bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Crest header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
            <BookOpenCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display font-extrabold text-xl text-foreground text-center leading-tight">
            Widya Netra
          </h1>
          <p className="text-xs text-muted-foreground text-center mt-0.5">
            Dinkominfo Kabupaten Banyumas
          </p>
        </div>

        <Card className="border-border shadow-xl shadow-primary/5">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="font-display text-lg font-bold">Masuk Sistem</CardTitle>
            <CardDescription className="text-xs">
              Masuk dengan username dan password yang terdaftar pada database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="pl-9 h-10 text-sm"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="pl-9 h-10 text-sm"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-10 text-sm font-semibold">
                {loading ? "Memproses…" : "Masuk sebagai Pengelola"}
              </Button>
              <p className="text-center text-sm">
                <Link to="/" className="text-primary hover:underline">
                  Kembali ke halaman utama
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          © {new Date().getFullYear()} Dinas Komunikasi dan Informatika Kabupaten Banyumas
        </p>
      </div>
    </div>
  );
}