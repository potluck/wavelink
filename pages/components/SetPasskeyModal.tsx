import { useState, useEffect, useCallback } from "react";
import PasskeySelector from "./PasskeySelector";

type SetPasskeyModalProps = {
  inputPassKey: (passkey: string | null) => void
}

export default function SetPasskeyModal({ inputPassKey }: SetPasskeyModalProps) {
  const [agreeToSetKey, setAgreeToSetKey] = useState(false);

  const handleClose = useCallback((passkey: string | null) => {
    inputPassKey(passkey);
    setAgreeToSetKey(false);
  }, [inputPassKey]);

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
      {!agreeToSetKey ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Enjoying Wavelink? Create an access key!</h2>
          <p className="mb-4 dark:text-gray-300">
            Creating an access key will allow seamless access to your games across devices.
          </p>
          <p className="mb-4 dark:text-gray-300">
            Faster than a password - only takes 5 seconds.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => handleClose(null)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Maybe Later
            </button>
            <button
              onClick={() => setAgreeToSetKey(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Access Key
            </button>
          </div>
        </div>
      ) : (
        <PasskeySelector
          title="Choose access key..."
          description="Set up your access key to access your games across devices."
          submitButtonText="Create Access Key"
          cancelButtonText="Maybe Later"
          onSubmit={(passkey) => handleClose(passkey)}
          onCancel={() => handleClose(null)}
          backendError={null}
          showExplainer={true}
        />
      )}
    </div>
  );
}
