import { createClient, RealtimePostgresInsertPayload } from '@supabase/supabase-js'

import { Nunito } from 'next/font/google'
import Explainer from './components/Explainer';
const nunito = Nunito({ subsets: ['latin'] })

// Create a function to handle inserts
const handleInserts = (payload: RealtimePostgresInsertPayload<{ [key: string]: string }>) => {
  console.log('Change received!', payload)
}

export default function Help() {
  // Listen to inserts
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")
  supabase
    .channel('todos')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'todos' }, handleInserts)
    .subscribe()
  return (
    <div className={`${nunito.className} max-w-2xl mx-auto p-6 space-y-6`}>
      <h1 className="text-4xl font-bold text-center w-full">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
      <Explainer />
      <button
        onClick={() => window.history.back()}
        className="block mx-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        ← Go Back
      </button>
    </div>
  )
}