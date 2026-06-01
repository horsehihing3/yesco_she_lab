import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';

export type DialogType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface CustomDialogProps {
  open: boolean;
  type: DialogType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

const getDialogConfig = (type: DialogType) => {
  switch (type) {
    case 'success':
      return {
        icon: <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main' }} />,
        color: 'success.main',
        defaultTitle: '완료',
      };
    case 'error':
      return {
        icon: <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />,
        color: 'error.main',
        defaultTitle: '오류',
      };
    case 'warning':
      return {
        icon: <WarningAmberIcon sx={{ fontSize: 48, color: 'warning.main' }} />,
        color: 'warning.main',
        defaultTitle: '경고',
      };
    case 'info':
      return {
        icon: <InfoOutlinedIcon sx={{ fontSize: 48, color: 'info.main' }} />,
        color: 'info.main',
        defaultTitle: '알림',
      };
    case 'confirm':
      return {
        icon: <HelpOutlineIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
        color: 'primary.main',
        defaultTitle: '확인',
      };
  }
};

const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  type,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  onClose,
}) => {
  const config = getDialogConfig(type);
  const isConfirmDialog = type === 'confirm';

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={isConfirmDialog ? handleCancel : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: 360,
        },
      }}
    >
      <DialogTitle sx={{ pb: 0, pr: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {config.icon}
          <Box component="span" sx={{ fontWeight: 600 }}>
            {title || config.defaultTitle}
          </Box>
        </Box>
        <IconButton
          onClick={isConfirmDialog ? handleCancel : onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'grey.500',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <DialogContentText
          sx={{
            mt: 2,
            color: 'text.primary',
            whiteSpace: 'pre-line',
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {isConfirmDialog ? (
          <>
            <Button
              onClick={handleCancel}
              variant="outlined"
              color="inherit"
              sx={{ minWidth: 80 }}
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              color="primary"
              sx={{ minWidth: 80 }}
              autoFocus
            >
              {confirmText}
            </Button>
          </>
        ) : (
          <Button
            onClick={onClose}
            variant="contained"
            color={type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'primary'}
            sx={{ minWidth: 80 }}
            autoFocus
          >
            {confirmText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CustomDialog;
