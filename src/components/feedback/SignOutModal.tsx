import React from 'react';
import { Logo } from '../icons/Logo';
import { Button } from '../common/Button';

export const SignOutModal: React.FC<{
  isOpen: boolean;
  onSignIn: () => void;
}> = ({ isOpen, onSignIn }) => {
  if (!isOpen) return null;

  return (
    <div className="out">
      <Logo height={40} />
      <h1>You’re signed out</h1>
      <p className="sub">Your cameras keep recording while you’re away.</p>
      <Button variant="white" onClick={onSignIn}>
        Sign back in
      </Button>
    </div>
  );
};
