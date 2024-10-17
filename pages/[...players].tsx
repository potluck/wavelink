import { useRouter } from 'next/router'

export default function Page() {
  const router = useRouter()
  console.log(router.query.players);
  return <p>Players: {router.query.players?.toString()}</p>
}