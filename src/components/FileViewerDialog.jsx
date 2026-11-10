import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { FileText, Loader2 } from "lucide-react";

export default function FileViewerDialog({ fileUrl, fileName, label = "Baca File", triggerClassName = "" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleOpen = (o) => {
    setOpen(o);
    if (o) setLoading(true);
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className={`h-7 gap-1.5 rounded-md px-2 text-[11px] font-medium ${triggerClassName}`}
        onClick={() => handleOpen(true)}
      >
        <FileText className="w-3.5 h-3.5" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-display text-base truncate pr-6">{fileName || "Pembaca Berkas"}</DialogTitle>
            <DialogDescription className="text-[11px]">
              Berkas hanya dapat dibaca di aplikasi dan tidak dapat diunduh.
            </DialogDescription>
          </DialogHeader>
          <div
            className="relative h-[68vh] rounded-lg overflow-hidden border border-border bg-secondary"
            onContextMenu={(e) => e.preventDefault()}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <iframe
              src={`${fileUrl}#toolbar=0&navpanes=0`}
              title={fileName || "Pembaca berkas"}
              className="w-full h-full"
              onLoad={() => setLoading(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}