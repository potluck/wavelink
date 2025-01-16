import { Nunito } from 'next/font/google'

const nunito = Nunito({ subsets: ['latin'] })
export default function Help() {
  return (
    <div className={`${nunito.className} max-w-2xl mx-auto p-6 space-y-6`}>
      <div>
        Wavelink is a word association game. In each round, you and your partner receive 2 starting words.
      </div>
      <br />
      <div>
        You respond by submitting a word that connects those words. For example:
      </div>
      <br />
      <div>
        <b>Fire</b> and <b>Water</b> might yield <b>Element</b> or <b>Steam</b>.
      </div>
      <br />
      <div>
        If you and your partner submit matching words, you win the round!
      </div>
      <br />
      <div>
        Otherwise, you try again. Now, you&apos;ll both be trying to connect the two words you just submitted.
        For example, if you submitted <b>Element</b> and your partner submitted <b>Steam</b>, you might try <b>Gas</b>.
      </div>
      <br />
      <div>
        You get up to 5 tries to connect per round!
      </div>
    </div>
  )
}