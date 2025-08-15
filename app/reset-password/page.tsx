
// app/reset-password/page.tsx
import ResetPasswordClient from "@/app/ui/reset-password/reset-password-client";

export default async function ResetPasswordPage({ searchParams }: any) {
  // Extract token at the server level
  const token = searchParams?.token ?? null;

  return <ResetPasswordClient token={token} />;
}
