type PasskeyModalProps = {
  inputPassKey: (passkey: string | null) => void
}

export default function PasskeyModal({ inputPassKey }: PasskeyModalProps) {

  const handleClose = (passkey: string | null) => {
    inputPassKey(passkey);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Enjoying Wavelink? Create a passkey!</h2>
        <p className="mb-4">
          Want to keep your game history and access your account across devices? 
          Create a passkey!
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => handleClose(null)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              // TODO: Implement passkey creation
              handleClose("passkey");
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Passkey
          </button>
        </div>
      </div>
    </div>
  );
}
