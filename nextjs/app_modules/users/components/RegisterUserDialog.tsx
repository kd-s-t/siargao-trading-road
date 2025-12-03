import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Alert,
  Typography,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useRef, useState, useEffect } from 'react';
import { UserFormData } from '../types';
import { MIN_PASSWORD_LENGTH } from '../constants';
import { authService } from '@/lib/auth';

interface RegisterUserDialogProps {
  open: boolean;
  registering: boolean;
  error: string;
  formData: UserFormData;
  onClose: () => void;
  onRegister: () => void;
  onFormDataChange: (data: UserFormData) => void;
  onErrorDismiss: () => void;
}

export function RegisterUserDialog({
  open,
  registering,
  error,
  formData,
  onClose,
  onRegister,
  onFormDataChange,
  onErrorDismiss,
}: RegisterUserDialogProps) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setLogoFile(null);
      setBannerFile(null);
      setLogoPreview(null);
      setBannerPreview(null);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  }, [open]);

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onErrorDismiss();
        setTimeout(() => onFormDataChange({ ...formData, logo_url: undefined }), 0);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        onErrorDismiss();
        setTimeout(() => onFormDataChange({ ...formData, logo_url: undefined }), 0);
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onErrorDismiss();
        setTimeout(() => onFormDataChange({ ...formData, banner_url: undefined }), 0);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        onErrorDismiss();
        setTimeout(() => onFormDataChange({ ...formData, banner_url: undefined }), 0);
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const result = await authService.uploadImage(logoFile);
      onFormDataChange({ ...formData, logo_url: result.url });
    } catch {
      onErrorDismiss();
      setTimeout(() => {
        onFormDataChange({ ...formData, logo_url: undefined });
      }, 0);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadBanner = async () => {
    if (!bannerFile) return;
    setUploadingBanner(true);
    try {
      const result = await authService.uploadImage(bannerFile);
      onFormDataChange({ ...formData, banner_url: result.url });
    } catch {
      onErrorDismiss();
      setTimeout(() => {
        onFormDataChange({ ...formData, banner_url: undefined });
      }, 0);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    onFormDataChange({ ...formData, logo_url: undefined });
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    onFormDataChange({ ...formData, banner_url: undefined });
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Register New User</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={onErrorDismiss}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Role *</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value as 'supplier' | 'store';
                onFormDataChange({ 
                  ...formData, 
                  role: newRole
                });
              }}
              label="Role *"
            >
              <MenuItem value="supplier">Supplier</MenuItem>
              <MenuItem value="store">Store</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Name *"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Password *"
            type="password"
            value={formData.password}
            onChange={(e) => onFormDataChange({ ...formData, password: e.target.value })}
            required
            helperText={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
          />
          <TextField
            fullWidth
            label="Phone *"
            value={formData.phone}
            onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Facebook"
            type="url"
            value={formData.facebook || ''}
            onChange={(e) => onFormDataChange({ ...formData, facebook: e.target.value || undefined })}
          />
          <TextField
            fullWidth
            label="Instagram"
            type="url"
            value={formData.instagram || ''}
            onChange={(e) => onFormDataChange({ ...formData, instagram: e.target.value || undefined })}
          />
          <TextField
            fullWidth
            label="Twitter/X"
            type="url"
            value={formData.twitter || ''}
            onChange={(e) => onFormDataChange({ ...formData, twitter: e.target.value || undefined })}
          />
          <TextField
            fullWidth
            label="LinkedIn"
            type="url"
            value={formData.linkedin || ''}
            onChange={(e) => onFormDataChange({ ...formData, linkedin: e.target.value || undefined })}
          />
          <TextField
            fullWidth
            label="YouTube"
            type="url"
            value={formData.youtube || ''}
            onChange={(e) => onFormDataChange({ ...formData, youtube: e.target.value || undefined })}
          />
          <TextField
            fullWidth
            label="TikTok"
            type="url"
            value={formData.tiktok || ''}
            onChange={(e) => onFormDataChange({ ...formData, tiktok: e.target.value || undefined })}
          />
          <TextField
            fullWidth
            label="Website"
            type="url"
            value={formData.website || ''}
            onChange={(e) => onFormDataChange({ ...formData, website: e.target.value || undefined })}
          />

          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Logo (Optional)
            </Typography>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              style={{ display: 'none' }}
            />
            {logoPreview ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={logoPreview}
                    sx={{ width: 80, height: 80 }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">{logoFile?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {logoFile ? `${(logoFile.size / 1024).toFixed(2)} KB` : ''}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo || registering}
                  >
                    Remove
                  </Button>
                </Box>
                {!formData.logo_url && (
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={handleUploadLogo}
                    disabled={uploadingLogo || registering}
                    fullWidth
                    size="small"
                  >
                    {uploadingLogo ? <CircularProgress size={20} /> : 'Upload Logo'}
                  </Button>
                )}
                {formData.logo_url && (
                  <Typography variant="caption" color="success.main">
                    Logo uploaded successfully
                  </Typography>
                )}
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                disabled={uploadingLogo || registering}
                size="small"
              >
                Select Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  style={{ display: 'none' }}
                />
              </Button>
            )}
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Banner (Optional)
            </Typography>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerSelect}
              style={{ display: 'none' }}
            />
            {bannerPreview ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="img"
                    src={bannerPreview}
                    alt="Banner preview"
                    sx={{
                      width: 120,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 1,
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">{bannerFile?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {bannerFile ? `${(bannerFile.size / 1024).toFixed(2)} KB` : ''}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemoveBanner}
                    disabled={uploadingBanner || registering}
                  >
                    Remove
                  </Button>
                </Box>
                {!formData.banner_url && (
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={handleUploadBanner}
                    disabled={uploadingBanner || registering}
                    fullWidth
                    size="small"
                  >
                    {uploadingBanner ? <CircularProgress size={20} /> : 'Upload Banner'}
                  </Button>
                )}
                {formData.banner_url && (
                  <Typography variant="caption" color="success.main">
                    Banner uploaded successfully
                  </Typography>
                )}
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                disabled={uploadingBanner || registering}
                size="small"
              >
                Select Banner
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerSelect}
                  style={{ display: 'none' }}
                />
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={registering}>
          Cancel
        </Button>
        <Button onClick={onRegister} variant="contained" disabled={registering}>
          {registering ? 'Registering...' : 'Register'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

