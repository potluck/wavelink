import { Nunito } from 'next/font/google'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Explainer from './Explainer';
import ConfirmPasskeyModal from './ConfirmPasskeyModal';
import ClaimUserModal from './ClaimUserModal';

const nunito = Nunito({ subsets: ['latin'] })
const getUserFromLocalStorage = () => {
  const userId = localStorage.getItem('wavelink-userId');
  const userSlug = localStorage.getItem('wavelink-userSlug');
  return {
    userId: userId ? parseInt(userId) : null,
    userSlug: userSlug
  };
}

const saveUserToLocalStorage = (userId: number, userName: string) => {
  localStorage.setItem('wavelink-userId', userId.toString());
  localStorage.setItem('wavelink-userSlug', userName);
}

// create user via API
async function callAPICreateOrRetrieveUser(userName: string) {
  const response = await fetch(`/api/create-or-retrieve-user?userName=${encodeURIComponent(userName)}`);
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  return response.json();
}


export default function Invited({ player1 }: { player1: string }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const router = useRouter();
  const [showExplainer, setShowExplainer] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [showClaimUserModal, setShowClaimUserModal] = useState(false);
  const [retrievedUserId, setRetrievedUserId] = useState<number | null>(null);
  const [retrievedUserName, setRetrievedUserName] = useState<string | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const localUser = getUserFromLocalStorage();
    if (localUser.userId && localUser.userSlug) {
      if (localUser.userSlug === player1) {
        router.push(`/${localUser.userSlug}`);
      } else {
        router.push(`/${localUser.userSlug}/${player1}`);
      }
    }
  }, [router.isReady, router, player1]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedSlug = name.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]/g, '');
    const sanitizedName = name.trim().replace(/ [^\w'-]/g, '');
    const localUser = getUserFromLocalStorage();
    if (sanitizedSlug === player1.toLowerCase()) {
      setError("You can't play with yourself!");
      return;
    }
    else if (sanitizedName.length < 2 || sanitizedSlug === "help" || sanitizedSlug === "invite" || sanitizedSlug === "ai") {
      setError("Please enter a valid name (2+ characters).");
      return;
    } else {
      setError(null);
    }
    try {
      const { user, retrievedUser, userHasPasskey, otherPlayers } = await callAPICreateOrRetrieveUser(sanitizedName);

      // existing user who is already in a game, who is not in local storage
      if (retrievedUser && user.id !== localUser.userId && user.game_id) {
        setOtherPlayers(otherPlayers);
        setRetrievedUserId(user.id);
        setRetrievedUserName(user.name);
        setSlug(user.slug);

        if (userHasPasskey) {
          setShowPasskeyModal(true);
        } else {
          setShowClaimUserModal(true);
        }
      } else { // created new user, or matched local storage, or existing user had no games
        saveUserToLocalStorage(user.id, user.slug);
        router.push(`/${user.slug}/${player1}`);
      }

    } catch (err) {
      console.error("error creating user: ", err);
    }
  };

  return (
    <div className={`${nunito.className} grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-2 pb-20 gap-6 sm:p-8 dark:bg-gray-900`}>
      {showPasskeyModal && (
        <ConfirmPasskeyModal
          userId={retrievedUserId || 0}
          userName={retrievedUserName || ""}
          onConfirm={(confirmed) => {
            if (confirmed) {
              saveUserToLocalStorage(retrievedUserId || 0, slug);
              router.push(`/${slug}/${player1}`);
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
              saveUserToLocalStorage(retrievedUserId || 0, slug);
              router.push(`/${slug}/${player1}`);
            } else {
              setShowClaimUserModal(false);
            }
          }}
        />
      )}
      <h1 className="text-4xl font-bold text-center max-w-md dark:text-white">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">Hi there, welcome to Wavelink!</p>
        <p className="text-gray-700 dark:text-gray-300">You&apos;ve been invited to play with <b>{player1 === "ai" ? "the AI" : player1}</b>!</p>
        <p className="text-gray-700 dark:text-gray-300">Enter your name below to play.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
          />
          <button
            type="submit"
            className="w-full px-6 py-2 text-lg font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Play
          </button>
        </form>
        <div className="mt-4">
          <button
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer flex items-center gap-1"
            onClick={() => setShowExplainer(!showExplainer)}>How to play</button>
          <div className="max-w-md">
            {showExplainer && <Explainer />}
          </div>
        </div>
      </div>
    </div>
  );
}