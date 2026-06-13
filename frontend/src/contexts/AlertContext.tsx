import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import CustomDialog, { DialogType } from '../components/common/CustomDialog';

interface AlertOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

interface AlertContextType {
  showAlert: (type: DialogType, message: string, options?: AlertOptions) => Promise<boolean>;
  showSuccess: (message: string, options?: AlertOptions) => Promise<boolean>;
  showError: (message: string, options?: AlertOptions) => Promise<boolean>;
  showWarning: (message: string, options?: AlertOptions) => Promise<boolean>;
  showInfo: (message: string, options?: AlertOptions) => Promise<boolean>;
  // 2번째 인자로 AlertOptions 또는 레거시 onConfirm 콜백(확인 시 실행) 허용.
  showConfirm: (message: string, options?: AlertOptions | (() => void)) => Promise<boolean>;
}

interface DialogState {
  open: boolean;
  type: DialogType;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  resolve?: (value: boolean) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    type: 'info',
    message: '',
  });

  const showAlert = useCallback((type: DialogType, message: string, options?: AlertOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        type,
        message,
        title: options?.title,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        resolve,
      });
    });
  }, []);

  const showSuccess = useCallback((message: string, options?: AlertOptions) => {
    return showAlert('success', message, options);
  }, [showAlert]);

  const showError = useCallback((message: string, options?: AlertOptions) => {
    return showAlert('error', message, options);
  }, [showAlert]);

  const showWarning = useCallback((message: string, options?: AlertOptions) => {
    return showAlert('warning', message, options);
  }, [showAlert]);

  const showInfo = useCallback((message: string, options?: AlertOptions) => {
    return showAlert('info', message, options);
  }, [showAlert]);

  const showConfirm = useCallback((message: string, options?: AlertOptions | (() => void)) => {
    // 레거시 콜백 형태 지원: showConfirm(msg, () => onConfirm()). 확인 시 콜백 실행(미await 호출부 복구).
    if (typeof options === 'function') {
      const onConfirm = options;
      return showAlert('confirm', message).then((ok) => { if (ok) onConfirm(); return ok; });
    }
    return showAlert('confirm', message, options);
  }, [showAlert]);

  const handleClose = useCallback(() => {
    dialogState.resolve?.(false);
    setDialogState((prev) => ({ ...prev, open: false }));
  }, [dialogState]);

  const handleConfirm = useCallback(() => {
    dialogState.resolve?.(true);
  }, [dialogState]);

  const handleCancel = useCallback(() => {
    dialogState.resolve?.(false);
  }, [dialogState]);

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
      }}
    >
      {children}
      <CustomDialog
        open={dialogState.open}
        type={dialogState.type}
        message={dialogState.message}
        title={dialogState.title}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onClose={handleClose}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export default AlertContext;
