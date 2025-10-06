'use client';


export default function ErrorPage({ error }: { error: string }) {
  return (
    <main className="flex items-center justify-center h-screen w-screen bg-white px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-semibold text-gray-900">Ha ocurrido un error</h1>
        <p className="mt-4 text-base text-gray-600">{error}</p>
      </div>
    </main>
  );
}
