import { Nunito } from 'next/font/google'
import Link from "next/link";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ClaimUserModal from './components/ClaimUserModal';
import ConfirmPasskeyModal from './components/ConfirmPasskeyModal';

const nunito = Nunito({ subsets: ['latin'] })

const getUserFromLocalStorage = () => {
  const userId = localStorage.getItem('wavelink-userId');
  const userSlug = localStorage.getItem('wavelink-userSlug');
  return {
    userId: userId ? parseInt(userId) : null,
    userSlug: userSlug
  };
}

const saveUserToLocalStorage = (userId: number, userSlug: string) => {
  localStorage.setItem('wavelink-userId', userId.toString());
  localStorage.setItem('wavelink-userSlug', userSlug);
}

async function callAPICreateOrRetrieveUser(userName: string) {
  const response = await fetch(`/api/create-or-retrieve-user?userName=${encodeURIComponent(userName)}`);
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  return response.json();
}

export default function Home() {
  const router = useRouter();
  const [showNameInput, setShowNameInput] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<string[]>([]);
  const [retrievedUserId, setRetrievedUserId] = useState<number | null>(null);
  const [retrievedUserName, setRetrievedUserName] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [showClaimUserModal, setShowClaimUserModal] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const localUser = getUserFromLocalStorage();
    if (localUser.userId) {
      router.push(`/${localUser.userSlug}`);
      return;
    }
  }, [router.isReady, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedSlug = name.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]/g, '');

    if (sanitizedSlug.length < 2 || sanitizedSlug === "help" || sanitizedSlug === "invite" || sanitizedSlug === "ai") {
      setError("Please enter a valid name (2+ characters).");
      return;
    }

    try {
      const { user, retrievedUser, userHasPasskey, otherPlayers } = await callAPICreateOrRetrieveUser(name.trim());
      if (retrievedUser && user.game_id) {
        setOtherPlayers(otherPlayers);
        setRetrievedUserId(user.id);
        setRetrievedUserName(user.name);
        setSlug(user.slug);

        if (userHasPasskey) {
          setShowPasskeyModal(true);
        } else {
          setShowClaimUserModal(true);
        }
        return;
      }
      saveUserToLocalStorage(user.id, user.slug);
      router.push(`/${user.slug}`);
    } catch (err) {
      console.error("error creating user: ", err);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div
      className={`${nunito.className} grid grid-rows-[auto_1fr_auto] items-start justify-items-center min-h-screen p-2 pb-8 gap-4 sm:gap-8 sm:p-12 dark:bg-gray-900 dark:text-white`}
    >
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-center w-full dark:text-white">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
        <ul className="list-inside text-base sm:text-base text-center sm:text-left dark:text-gray-300">
          <li>Hey! You&apos;ve reached the homepage for Wavelink. This game is in the Beta phase of development.</li>
          <br />
          <li>You can start a game with Potluck or the AI partner by clicking the button below!</li>
          <br />
          <li>Or, create an account and send your invite link to a friend!</li>
        </ul>
        <div className="flex flex-col gap-4 items-center">
          <div className="flex gap-4">
            <Link href="/potluck/invite" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-800 text-sm">
              Play with Potluck
            </Link>
            <Link href="/ai/invite" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-800 text-sm">
              Play with the AI
            </Link>
          </div>

          {showPasskeyModal && (
            <ConfirmPasskeyModal
              userId={retrievedUserId || 0}
              userName={retrievedUserName || ""}
              onConfirm={(confirmed) => {
                if (confirmed) {
                  saveUserToLocalStorage(retrievedUserId || 0, slug || "");
                  router.push(`/${slug}`);
                }
                setShowPasskeyModal(false);
              }}
            />
          )}
          {showClaimUserModal && (
            <ClaimUserModal
              userName={retrievedUserName || ""}
              otherPlayers={otherPlayers}
              onConfirm={(confirmed) => {
                if (confirmed) {
                  saveUserToLocalStorage(retrievedUserId || 0, slug || "");
                  router.push(`/${slug}`);
                } else {
                  setShowClaimUserModal(false);
                }
              }}
            />
          )}

          {!showNameInput ? (
            <button
              onClick={() => setShowNameInput(true)}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded dark:bg-purple-600 dark:hover:bg-purple-800 mt-4"
            >
              Create account
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4 w-full max-w-md">
              {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <button
                type="submit"
                className="w-full px-6 py-2 text-lg font-semibold text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:bg-purple-600 dark:hover:bg-purple-700"
              >
                Create Account
              </button>
            </form>
          )}
          <Link href="/help" className="text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300">How to play</Link>
        </div>
      </main>
    </div>
  );
}
