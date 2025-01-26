import { useEffect, useCallback } from "react";

type ClaimUserModalProps = {
  onConfirm: (confirmed: boolean) => void;
  userName: string;
  otherPlayers: string[];
}

export default function ClaimUserModal({ onConfirm, userName, otherPlayers }: ClaimUserModalProps) {

  const handleClose = useCallback(async (confirmed: boolean) => {
    if (!confirmed) {
      onConfirm(false);
      return;
    }

  }, [onConfirm]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Claim User</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          There is already an account with the name {userName}.
        </p>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          They are playing games with: {(otherPlayers || []).join(', ')}.
        </p>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Is this you? If not, you can create a new account by choosing a different name.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => onConfirm(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

}