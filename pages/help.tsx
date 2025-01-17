import { Nunito } from 'next/font/google'
import Explainer from './components/Explainer';

const nunito = Nunito({ subsets: ['latin'] })
export default function Help() {
  return (
    <div className={`${nunito.className} max-w-2xl mx-auto p-6 space-y-6`}>
      <h1 className="text-4xl font-bold text-center w-full">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
      <Explainer />
    </div>
  )
}