"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, ServerCrash } from "lucide-react";
import { getReportData } from "@/app/actions/reports";
import type { ReportData } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type PdfDownloaderProps = {
  reportId: string;
  onReportDataLoaded: (data: ReportData | null) => void;
};

export function PdfDownloader({
  reportId,
  onReportDataLoaded,
}: PdfDownloaderProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFetchReport = () => {
    startTransition(async () => {
      setError(null);
      setReportData(null);
      const result = await getReportData(reportId);
      if (result.success) {
        setReportData(result.data);
        onReportDataLoaded(result.data);
      } else {
        setError(result.error);
        onReportDataLoaded(null);
      }
    });
  };

  const handleDownload = () => {
    if (!reportData) return;

    // Decode base64
    const byteCharacters = atob(reportData.pdfData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });

    // Trigger download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = reportData.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (error) {
    return (
      <div className="mt-2 text-sm text-destructive flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
        <ServerCrash className="h-4 w-4"/>
        <span>Error: {error}</span>
      </div>
    );
  }

  if (reportData) {
    return (
      <Card className="mt-4 bg-secondary">
        <CardHeader className="p-4">
            <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5"/> Reporte Generado
            </CardTitle>
            <CardDescription>{reportData.fileName}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Tamaño:</strong> {(reportData.size / 1024).toFixed(2)} KB</p>
                <p><strong>Fecha:</strong> {format(new Date(reportData.date), "PPPpp", { locale: es })}</p>
                <p><strong>Tipo:</strong> {reportData.type}</p>
            </div>
            <Button onClick={handleDownload} className="w-full mt-4">
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button onClick={handleFetchReport} disabled={isPending} className="mt-4 w-full" variant="secondary">
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Obteniendo reporte...
        </>
      ) : (
        "Obtener PDF"
      )}
    </Button>
  );
}
