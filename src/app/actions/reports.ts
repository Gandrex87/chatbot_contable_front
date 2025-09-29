"use server";

import { Pool } from 'pg';
import type { ReportData } from "@/lib/types";

const pool = new Pool({
  host: process.env.DB_HOST || '10.1.0.188', // ← localhost
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'n8n', // ← Cambiar
  user: process.env.DB_USER || 'n8n',          // ← Cambiar  
  password: process.env.DB_PASSWORD || 'testpostgrespass33'   // ← Cambiar
});

export async function getReportData(reportId: string): Promise<{ 
  success: true; 
  data: ReportData 
} | { 
  success: false; 
  error: string 
}> {
  console.log(`Fetching report data for ID: ${reportId}`);

  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          id, file_name, report_name, report_type,
          start_date, end_date, file_size, pdf_data,
          created_at, download_count
        FROM holded_reports 
        WHERE id = $1 
        AND (expires_at IS NULL OR expires_at > NOW())
      `, [reportId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Reporte no encontrado o expirado' };
      }

      const report = result.rows[0];
      
      // Incrementar contador de descargas
      await client.query(
        'UPDATE holded_reports SET download_count = download_count + 1 WHERE id = $1',
        [reportId]
      );

      // Procesar pdf_data desde PostgreSQL
      let pdfData = '';
      if (report.pdf_data) {
        if (typeof report.pdf_data === 'string') {
          pdfData = report.pdf_data;
        } else if (Buffer.isBuffer(report.pdf_data)) {
          pdfData = report.pdf_data.toString('utf8');
        } else if (report.pdf_data.data && Array.isArray(report.pdf_data.data)) {
          // Si es Buffer object con array de bytes
          pdfData = Buffer.from(report.pdf_data.data).toString('utf8');
        }
      }

      // Verificar que el PDF sea válido (magic bytes)
      if (pdfData) {
        try {
          const buffer = Buffer.from(pdfData, 'base64');
          if (!buffer.subarray(0, 4).equals(Buffer.from('%PDF'))) {
            return { success: false, error: 'El archivo no es un PDF válido' };
          }
        } catch (e) {
          return { success: false, error: 'Error procesando datos del PDF' };
        }
      } else {
        return { success: false, error: 'No se encontraron datos del PDF' };
      }

      const reportData: ReportData = {
        fileName: report.file_name,
        pdfData: pdfData,
        size: report.file_size,
        date: report.created_at.toISOString(),
        type: report.report_name
      };

      return { success: true, data: reportData };

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    
    if (error instanceof Error) {
      // Errores específicos de conexión
      if (error.message.includes('ECONNREFUSED')) {
        return { success: false, error: 'No se puede conectar a la base de datos' };
      }
      if (error.message.includes('authentication failed')) {
        return { success: false, error: 'Error de autenticación de base de datos' };
      }
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'Error interno del servidor' };
  }
}