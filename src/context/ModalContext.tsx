import React, { createContext, useContext, useState, useCallback } from 'react';

export type ActiveModal =
  | { type: 'none' }
  | { type: 'addCamera' }
  | { type: 'connectProperty' }
  | { type: 'addMember' }
  | { type: 'inviteGuest' }
  | { type: 'pinKeypad'; tab: 'access' | 'duress' }
  | { type: 'faceEnrol' }
  | { type: 'govId' }
  | { type: 'reportIncident'; preCamIndex?: number }
  | { type: 'createReportFromEvent'; eventIndex: number }
  | { type: 'trackResponse'; eventIndex: number }
  | { type: 'renameProperty'; placeId: string }
  | { type: 'deviceDetails'; deviceName: string }
  | { type: 'accessPass'; connectedId: string }
  | { type: 'editField'; field: 'name' | 'phone' | 'email' }
  | { type: 'plans' }
  | { type: 'commandCenter' };

interface ModalContextType {
  modal: ActiveModal;
  openModal: (modal: ActiveModal) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<ActiveModal>({ type: 'none' });

  const openModal = useCallback((newModal: ActiveModal) => {
    setModal(newModal);
  }, []);

  const closeModal = useCallback(() => {
    setModal({ type: 'none' });
  }, []);

  return (
    <ModalContext.Provider value={{ modal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModals = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModals must be used within a ModalProvider');
  }
  return context;
};
