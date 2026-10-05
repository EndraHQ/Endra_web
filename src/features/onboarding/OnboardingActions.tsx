import React from 'react';

export interface OnboardingActionsProps {
  onBack?: () => void;
  showBack?: boolean;
  backLabel?: string;
  onContinue?: (e?: React.MouseEvent) => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  continueType?: 'submit' | 'button';
  isSecondaryContinue?: boolean;
  onSkip?: () => void;
  showSkip?: boolean;
  skipLabel?: string;
  continueId?: string;
}

export const OnboardingActions: React.FC<OnboardingActionsProps> = ({
  onBack,
  showBack = true,
  backLabel = 'Back',
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  continueType = 'submit',
  isSecondaryContinue = false,
  onSkip,
  showSkip = false,
  skipLabel = 'Skip for now',
  continueId
}) => {
  return (
    <div className="onb-actions">
      {showBack && (
        <button
          type="button"
          className="btn btn-g btn-lg"
          onClick={onBack}
        >
          {backLabel}
        </button>
      )}
      <span className="sp" />
      {showSkip && (
        <button
          type="button"
          className="linkb mut"
          onClick={onSkip}
        >
          {skipLabel}
        </button>
      )}
      <button
        id={continueId}
        type={continueType}
        className={`btn ${isSecondaryContinue ? 'btn-g' : 'btn-w'} btn-lg`}
        disabled={continueDisabled}
        onClick={continueType === 'button' ? onContinue : undefined}
      >
        {continueLabel}
      </button>
    </div>
  );
};
