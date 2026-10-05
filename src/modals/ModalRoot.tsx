import React from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Toast } from '../components/feedback/Toast';
import { ConfirmModal } from '../components/feedback/ConfirmModal';
import { SignOutModal } from '../components/feedback/SignOutModal';
import { AddCameraWizard } from './AddCameraWizard';
import { ConnectPropertyWizard, AddMemberModal, InviteGuestModal } from './ConnectPropertyWizard';
import { SecurityPinModal, FaceEnrolmentWizard } from './SecurityPinModal';
import { GovIdVerificationModal } from './GovIdVerificationModal';
import { ReportIncidentModal, CreateReportFromEventModal, TrackResponseModal } from './IncidentModals';
import { RenamePropertyModal, DeviceDetailsModal, AccessPassModal, EditFieldModal } from './DetailsModals';
import { PlansModal } from './PlansModal';
import { CommandCenterModal } from './CommandCenterModal';
import { useModals } from '../context/ModalContext';

export const ModalRoot: React.FC = () => {
  const {
    toastMessage,
    toastVisible,
    confirmState,
    closeConfirm,
    signedOut,
    setSignedOut,
    toast
  } = useApp();
  const { modal, closeModal } = useModals();

  return createPortal(
    <>
      {/* Toast Notification Banner */}
      <Toast message={toastMessage} visible={toastVisible} />

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        title={confirmState.title}
        body={confirmState.body}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmState.onConfirm}
        danger={confirmState.danger}
      />

      {/* Sign Out Fullscreen Overlay */}
      <SignOutModal
        isOpen={signedOut}
        onSignIn={() => {
          setSignedOut(false);
          toast('Welcome back');
        }}
      />

      {/* Modals and Wizards */}
      <AddCameraWizard />
      <ConnectPropertyWizard />
      <AddMemberModal />
      <InviteGuestModal />
      <SecurityPinModal />
      <FaceEnrolmentWizard />
      <GovIdVerificationModal />
      <ReportIncidentModal />
      <CreateReportFromEventModal />
      <TrackResponseModal />
      <RenamePropertyModal />
      <DeviceDetailsModal />
      <AccessPassModal />
      <EditFieldModal />
      <PlansModal isOpen={modal.type === 'plans'} onClose={closeModal} />
      <CommandCenterModal isOpen={modal.type === 'commandCenter'} onClose={closeModal} />
    </>,
    document.body
  );
};
