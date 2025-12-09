'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

interface ImageUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number;
  type?: 'product' | 'user';
  disabled?: boolean;
}

export function ImageUpload({
  label = 'Upload Image',
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024,
  type,
  disabled = false,
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > maxSize) {
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    setUploading(true);

    setTimeout(() => {
      setUploading(false);
    }, 2000);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {label}
          </Typography>

          <input
            type="file"
            accept={accept}
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={disabled || uploading}
          />

          {!preview ? (
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: disabled || uploading ? 'default' : 'pointer',
                '&:hover': {
                  borderColor: disabled || uploading ? 'divider' : 'primary.main',
                  bgcolor: disabled || uploading ? 'transparent' : 'action.hover',
                },
              }}
              onClick={() => {
                if (!disabled && !uploading) {
                  fileInputRef.current?.click();
                }
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Click to select an image or drag and drop
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported formats: JPG, PNG, GIF, WEBP (Max {maxSize / 1024 / 1024}MB)
              </Typography>
            </Box>
          ) : (
            <Box>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 300,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  sizes="100vw"
                  style={{ objectFit: 'contain' }}
                  unoptimized
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || uploading}
                  startIcon={<ImageIcon />}
                >
                  Change Image
                </Button>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={disabled || uploading || !selectedFile}
                  startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemove}
                  disabled={disabled || uploading}
                >
                  Remove
                </Button>
              </Box>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </Typography>
              )}
            </Box>
          )}

          {type && (
            <Typography variant="caption" color="text.secondary">
              Upload type: {type}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

