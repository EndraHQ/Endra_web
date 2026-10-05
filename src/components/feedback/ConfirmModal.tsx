import React from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  danger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  body,
  confirmLabel,
  onConfirm,
  danger = true
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'red' : 'white'}
            onClick={() => {
              onClose();
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="sub" style={{ margin: 0 }}>
        {body}
      </p>
    </Modal>
  );
};
