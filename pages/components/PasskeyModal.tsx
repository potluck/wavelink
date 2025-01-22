import { useState } from "react";

type PasskeyModalProps = {
  inputPassKey: (passkey: string | null) => void
}

export default function PasskeyModal({ inputPassKey }: PasskeyModalProps) {

  const [agreeToSetKey, setAgreeToSetKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = (passkey: string | null) => {
    inputPassKey(passkey);
    setAgreeToSetKey(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        {!agreeToSetKey ? (
          <>
            <h2 className="text-xl font-bold mb-4 dark:text-white">Enjoying Wavelink? Create a passkey!</h2>
            <p className="mb-4 dark:text-gray-300">
              Creating a passkey will allow seamless access to your games across devices.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleClose(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setAgreeToSetKey(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Passkey
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4 dark:text-white">Choose passkey...</h2>
            <p className="mb-4 dark:text-gray-300">
              A Wavelink passkey is just a star sign and your home state.
            </p>

            <div className="space-y-4 mb-6">
              {error && (
                <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
              )}
              <div>
                <label htmlFor="starSign" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Star Sign
                </label>
                <select
                  id="starSign"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select your star sign</option>
                  {['Aquarius', 'Aries', 'Cancer', 'Capricorn', 'Gemini', 'Leo',
                    'Libra', 'Pisces', 'Sagittarius', 'Scorpio', 'Taurus', 'Virgo']
                    .map((sign) => (
                      <option key={sign} value={sign.toLowerCase()}>{sign}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label htmlFor="homeState" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Home State
                </label>
                <select
                  id="homeState"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select your home state</option>
                  {['Not from the US', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
                    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
                    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
                    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
                    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
                    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
                    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
                    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
                    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
                    'West Virginia', 'Wisconsin', 'Wyoming']
                    .map((state) => (
                      <option key={state} value={state.toLowerCase().replace(/\s+/g, '')}>{state}</option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleClose(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  const starSign = (document.getElementById('starSign') as HTMLSelectElement).value;
                  const homeState = (document.getElementById('homeState') as HTMLSelectElement).value;

                  if (!starSign || !homeState) {
                    setError('Must select an option for both questions');
                    return;
                  }
                  const passkey = `${starSign}-${homeState}`;
                  handleClose(passkey);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Passkey
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
