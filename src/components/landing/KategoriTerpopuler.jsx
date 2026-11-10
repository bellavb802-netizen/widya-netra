import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function KategoriTerpopuler({ items = [] }) {
  const max = items[0]?.jumlah || 1;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base">Ringkasan Master Data</CardTitle>
        <p className="text-[11px] text-muted-foreground">Sebaran koleksi berdasarkan kategori terpopuler</p>
      </CardHeader>
      <CardContent>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Kategori Terpopuler
        </p>
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada kategori.</p>
          ) : (
            items.map((k) => (
              <div key={k.nama}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{k.nama}</span>
                  <span className="text-muted-foreground">{k.jumlah}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(k.jumlah / max) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}