// ─────────────────────────────────────────────────────────────────────────────
// src/components/modals/LogoutDialog.tsx
// Confirmation dialog for user logout action.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import ConfirmationDialog from './ConfirmationDialog';
import { useAuth } from '@hooks';

interface LogoutDialogProps {
  visible: boolean;
  onClose: () => void;
}

const LogoutDialog: React.FC<LogoutDialogProps> = ({ visible, onClose }) => {
  const { logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <ConfirmationDialog
      visible={visible}
      title="Sign Out"
      message="Are you sure you want to sign out of your account?"
      confirmLabel="Sign Out"
      cancelLabel="Cancel"
      confirmVariant="danger"
      isLoading={isLoading}
      onConfirm={handleLogout}
      onCancel={onClose}
    />
  );
};

export default LogoutDialog;
