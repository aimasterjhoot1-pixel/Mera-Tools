import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export interface UploadedFile {
  id: string;
  file: File;
  url?: string;
  size: number;
  name: string;
  type: string;
}

interface FileUploaderProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  className?: string;
}

export default function FileUploader({
  onFilesSelected,
  accept = { 'application/pdf': ['.pdf'] },
  multiple = false,
  maxSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 10,
  className = '',
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          errors.forEach((error: { code: string; message: string }) => {
            if (error.code === 'file-too-large') {
              toast.error(`File ${file.name} is too large. Max size: ${maxSize / 1024 / 1024}MB`);
            } else if (error.code === 'file-invalid-type') {
              toast.error(`File ${file.name} has invalid type`);
            } else {
              toast.error(`Error uploading ${file.name}: ${error.message}`);
            }
          });
        });
      }

      if (acceptedFiles.length === 0) return;

      const uploadedFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        size: file.size,
        name: file.name,
        type: file.type,
      }));

      onFilesSelected(uploadedFiles);
      setIsDragging(false);
    },
    [onFilesSelected, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize,
    maxFiles,
  });

  return (
    <div
      {...getRootProps()}
      className={`drag-zone ${isDragActive || isDragging ? 'drag-zone-active' : ''} ${className}`}
      onMouseEnter={() => setIsDragging(true)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <input {...getInputProps()} aria-label="File upload input" />
      <motion.div
        animate={{ scale: isDragActive ? 1.05 : 1 }}
        className="flex flex-col items-center justify-center space-y-4"
      >
        <div className="text-6xl">📁</div>
        <div>
          <p className="text-lg font-medium text-gray-700 mb-1">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-500">
            or click to browse
          </p>
        </div>
        <p className="text-xs text-gray-400">
          Max {maxSize / 1024 / 1024}MB per file
          {multiple && ` • Max ${maxFiles} files`}
        </p>
      </motion.div>
    </div>
  );
}