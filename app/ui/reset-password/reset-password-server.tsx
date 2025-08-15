
// app/reset-password/page.tsx
import ResetPasswordClient from "./reset-password-client";

export default async function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  // Extract token at the server level
  const token = searchParams?.token ?? null;

  return <ResetPasswordClient token={token} />;
}
