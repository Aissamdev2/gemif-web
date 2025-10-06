import { ErrorCode } from "../lib/definitions";

export default async function ErrorPage({ searchParams }: { searchParams: any }) {

  const { error, errorCode, details } = await searchParams;

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <h1>Error {errorCode ?? "Unknown"}</h1>
      <p>{error ?? "Something went wrong"}</p>
      <p>{details}</p>
    </div>
  );
}
