"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, AlertCircle } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: "book" | "alert";
}

export function EmptyState({
  title = "Buku Tabungan Belum Tersedia",
  description = "Buku tabungan Anda akan dibuat setelah Anda menjadi anggota koperasi yang terverifikasi.",
  icon = "book",
}: EmptyStateProps) {
  const Icon = icon === "book" ? BookOpen : AlertCircle;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
