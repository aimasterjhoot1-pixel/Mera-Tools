// Mock api.ts for Jest tests
import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 300000,
});

export interface UploadResponse {
  fileId: string;
  pages?: number;
  metadata: {
    size: number;
    name: string;
    type: string;
  };
}

export interface ProcessResponse {
  jobId?: string;
  fileId: string;
  downloadUrl?: string;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function downloadFile(fileId: string, filename: string): Promise<void> {
  const response = await api.get(`/download/${fileId}`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function mergePDFs(fileIds: string[], options?: { order?: number[] }): Promise<ProcessResponse> {
  const response = await api.post<ProcessResponse>('/merge', {
    fileIds,
    options,
  });
  return response.data;
}

export async function splitPDF(
  fileId: string,
  ranges: Array<{ start: number; end: number }>
): Promise<ProcessResponse> {
  const response = await api.post<ProcessResponse>('/split', {
    fileId,
    ranges,
  });
  return response.data;
}

export async function compressPDF(
  fileId: string,
  quality: 'high' | 'medium' | 'low'
): Promise<ProcessResponse> {
  const response = await api.post<ProcessResponse>('/compress', {
    fileId,
    quality,
  });
  return response.data;
}

export async function convertDocument(
  fileId: string,
  targetFormat: string,
  options?: Record<string, unknown>
): Promise<ProcessResponse> {
  const response = await api.post<ProcessResponse>('/convert', {
    fileId,
    targetFormat,
    options,
  });
  return response.data;
}

export async function signPDF(
  fileId: string,
  signature: string,
  page: number,
  x: number,
  y: number,
  scale: number
): Promise<ProcessResponse> {
  const response = await api.post<ProcessResponse>('/sign', {
    fileId,
    signature,
    page,
    x,
    y,
    scale,
  });
  return response.data;
}

export async function redactPDF(
  fileId: string,
  redactions: Array<{ page: number; x: number; y: number; width: number; height: number }>
): Promise<ProcessResponse> {
  const response = await api.post<ProcessResponse>('/redact', {
    fileId,
    redactions,
  });
  return response.data;
}

export async function protectPDF(
  fileId: string,
  action: 'encrypt' | 'decrypt',
  password?: string
): Promise<ProcessResponse> {
  const response = await api.post<ProcessResponse>('/protect', {
    fileId,
    action,
    password,
  });
  return response.data;
}

export async function fillForm(fileId: string, fields: Record<string, unknown>): Promise<ProcessResponse> {
  const response = await api.post<ProcessResponse>('/form/fill', {
    fileId,
    fields,
  });
  return response.data;
}

export async function ocrPDF(fileId: string, options?: { language?: string }): Promise<{ text: string }> {
  const response = await api.post<{ text: string }>('/ocr', {
    fileId,
    options,
  });
  return response.data;
}

export default api;

