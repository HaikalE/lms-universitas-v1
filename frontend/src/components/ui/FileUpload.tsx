import React, { useCallback, useState, useRef } from 'react';
import { CloudArrowUpIcon, DocumentIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  previewUrl?: string;
  error?: string;
}

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onFilesSelected?: (files: File[]) => void;
  onUploadComplete?: (uploadedFiles: UploadedFile[]) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  accept = '*/*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  onFilesSelected,
  onUploadComplete,
  className = '',
  disabled = false,
  label = 'Upload Files',
  description = 'Drag and drop files here, or click to browse'
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)}`;
    }
    
    if (accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const isValidType = acceptedTypes.some(type => {
        if (type.includes('*')) {
          const baseType = type.split('/')[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type || file.name.toLowerCase().endsWith(type.replace(/\./g, ''));
      });
      
      if (!isValidType) {
        return `File type not supported. Accepted types: ${accept}`;
      }
    }
    
    return null;
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: File[] = [];
    const newUploadedFiles: UploadedFile[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      const id = Math.random().toString(36).substring(2, 9);
      
      if (error) {
        newUploadedFiles.push({
          id,
          file,
          progress: 0,
          status: 'error',
          error
        });
      } else {
        validFiles.push(file);
        
        // Create preview for images
        let previewUrl: string | undefined;
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
        }
        
        newUploadedFiles.push({
          id,
          file,
          progress: 0,
          status: 'uploading',
          previewUrl
        });
      }
    });

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    
    if (validFiles.length > 0) {
      onFilesSelected?.(validFiles);
      
      // Simulate upload progress
      validFiles.forEach((file, index) => {
        const fileId = newUploadedFiles.find(uf => uf.file === file && uf.status === 'uploading')?.id;
        if (!fileId) return;
        
        simulateUpload(fileId);
      });
    }
  }, [uploadedFiles.length, maxFiles, maxSize, accept, onFilesSelected]);

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setUploadedFiles(prev => 
          prev.map(file => 
            file.id === fileId 
              ? { ...file, progress: 100, status: 'completed' }
              : file
          )
        );
      } else {
        setUploadedFiles(prev => 
          prev.map(file => 
            file.id === fileId 
              ? { ...file, progress }
              : file
          )
        );
      }
    }, 300);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles, disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [processFiles]);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type.includes('pdf')) {
      return '📄';
    } else if (file.type.includes('word')) {
      return '📝';
    } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      return '📊';
    } else if (file.type.includes('powerpoint') || file.type.includes('presentation')) {
      return '📑';
    }
    return '📁';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
            : isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
        `}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="sr-only"
          aria-describedby="file-upload-description"
        />
        
        <CloudArrowUpIcon className={`w-12 h-12 mx-auto mb-4 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
        
        <h3 className={`text-lg font-medium mb-2 ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
          {label}
        </h3>
        
        <p id="file-upload-description" className={`text-sm ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
          {description}
        </p>
        
        <p className={`text-xs mt-2 ${disabled ? 'text-gray-300' : 'text-gray-400'}`}>
          Max file size: {formatFileSize(maxSize)} • Max files: {maxFiles}
        </p>
      </div>

      {/* File List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {uploadedFiles.map((uploadedFile) => (
              <motion.div
                key={uploadedFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`
                  flex items-center p-3 rounded-lg border
                  ${uploadedFile.status === 'error' 
                    ? 'border-red-200 bg-red-50' 
                    : uploadedFile.status === 'completed'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white'
                  }
                `}
              >
                {/* File Icon/Preview */}
                <div className="flex-shrink-0 mr-3">
                  {uploadedFile.previewUrl ? (
                    <img
                      src={uploadedFile.previewUrl}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center text-2xl">
                      {getFileIcon(uploadedFile.file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                  
                  {uploadedFile.status === 'uploading' && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadedFile.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(uploadedFile.progress)}% uploaded
                      </p>
                    </div>
                  )}
                  
                  {uploadedFile.status === 'error' && uploadedFile.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {uploadedFile.error}
                    </p>
                  )}
                  
                  {uploadedFile.status === 'completed' && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Upload completed
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-3">
                  {uploadedFile.previewUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(uploadedFile.previewUrl, '_blank');
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Preview file"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(uploadedFile.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    aria-label="Remove file"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;