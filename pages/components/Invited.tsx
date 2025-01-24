import { Nunito } from 'next/font/google'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Explainer from './Explainer';
import ConfirmPasskeyModal from './ConfirmPasskeyModal';

const nunito = Nunito({ subsets: ['latin'] })
const getUserFromLocalStorage = () => {
  const userId = localStorage.getItem('wavelink-userId');
  const userSlug = localStorage.getItem('wavelink-userSlug');
  return {
    userId: userId ? parseInt(userId) : null,
    userSlug: userSlug
  };
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
  const router = useRouter();
  const [showExplainer, setShowExplainer] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [retrievedUserId, setRetrievedUserId] = useState<number | null>(null);

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
    const localUser = getUserFromLocalStorage();
    try {
      const { user, retrievedUser, userHasPasskey, otherPlayers } = await callAPICreateOrRetrieveUser(name);
      console.log("got user: ", user, retrievedUser, userHasPasskey);
      console.log("localUserId: ", localUser);

      // existing user who is already in a game, who is not in local storage
      if (retrievedUser && retrievedUser.id !== localUser.userId && user.game_id) {
        if (userHasPasskey) {
          setRetrievedUserId(user.id);
          setShowPasskeyModal(true);
        } else { // no passkey, so just give it to them
          // TODO: Confirm this is you
          console.log("other players: ", otherPlayers);
          router.push(`/${user.slug}/${player1}`);
        }
      } else { // created new user, or matched local storage, or existing user had no games
        router.push(`/${user.slug}/${player1}`);
      }

    } catch (err) {
      console.error("error creating user: ", err);
    }
  };

  return (
    <div className={`${nunito.className} grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-2 pb-20 gap-6 sm:p-8`}>
      {showPasskeyModal && (
        <ConfirmPasskeyModal
          userId={retrievedUserId || 0}
          onConfirm={(confirmed) => {
            if (confirmed) {
              router.push(`/${name.replace(/ /g, '-')}/${player1}`);
            }
            setShowPasskeyModal(false);
          }}
        />
      )}
      <h1 className="text-4xl font-bold text-center max-w-md">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
      <div className="space-y-4">
        <p className="text-gray-700">Hi there, welcome to Wavelink!</p>
        <p className="text-gray-700">You&apos;ve been invited to play with <b>{player1}</b>!</p>
        <p className="text-gray-700">Enter your name below to play.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="w-full px-6 py-2 text-lg font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Play
          </button>
        </form>
        <div className="mt-4">
          <button
            className="text-blue-500 hover:text-blue-700 underline cursor-pointer flex items-center gap-1"
            onClick={() => setShowExplainer(!showExplainer)}>How to play</button>
          <div className="max-w-md">
            {showExplainer && <Explainer />}
          </div>
        </div>
      </div>
    </div>
  );
}