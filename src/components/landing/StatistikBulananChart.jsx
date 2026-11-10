import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatistikBulananChart({ tahun, data = [] }) {
  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base">Statistik Bulanan {tahun}</CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Peminjaman, pengembalian, dan kunjungan pengunjung per bulan
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="pinjam" name="Pinjam" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="kembali" name="Kembali" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pengunjung" name="Pengunjung" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}