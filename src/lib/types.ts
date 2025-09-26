export type User = {
  id: string;
  username: string;
  name: string;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reportId?: string;
  reportData?: ReportData | null;
  error?: string;
};

export type ReportData = {
  fileName: string;
  pdfData: string; // base64
  size: number;
  date: string;
  type: string;
};
