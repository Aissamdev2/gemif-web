import VerifyEmailClient from "../ui/verify-email/verify-email-client"

export default async function VerifyEmailPage({ searchParams }: any) {
  const token = await searchParams?.token ?? null

  return <VerifyEmailClient token={token} />

}
