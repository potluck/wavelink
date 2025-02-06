import { useState, useEffect, useCallback } from "react";
import PasskeySelector from "./PasskeySelector";

type ConfirmPasskeyModalProps = {
  onConfirm: (passkey: string | null) => void;
  userId: number;
  userName: string;
  otherUserName?: string | null;
  onSwitchToOtherUser?: () => void;
}

export default function ConfirmPasskeyModal({ onConfirm, userId, userName, otherUserName, onSwitchToOtherUser }: ConfirmPasskeyModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(async (passkey: string | null) => {
    if (!passkey) {
      onConfirm(null);
      return;
    }

    try {
      const response = await fetch(`/api/check-passkey?userId=${userId}&passkey=${passkey}`);

      if (!response.ok) {
        setError('Invalid passkey. Please try again.');
        return;
      }

      onConfirm(passkey);
    } catch (err) {
      console.error("error checking passkey: ", err);
      setError('An error occurred. Please try again.');
    }
  }, [onConfirm, userId]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <PasskeySelector
        title={`${userName} - Please confirm your access key`}
        description={`There is already an account with the name ${userName}. To access this game, please enter your access key.`}
        submitButtonText="Confirm Access Key"
        cancelButtonText="Cancel"
        showExplainer={false}
        otherUserName={otherUserName}
        onSwitchToOtherUser={onSwitchToOtherUser}
        onSubmit={(passkey) => handleClose(passkey)}
        onCancel={() => handleClose(null)}
        backendError={error}
        additionalDescription={`Alternatively, you can create a new account by choosing a different name.`}
      />
    </div>
  );
} 