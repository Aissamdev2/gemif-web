
// export default async function ErrorPage({ searchParams }: { searchParams: any }) {
//   const { error, errorCode, details } = await searchParams;

//   return (
//     <div className="h-screen w-screen flex items-center justify-center bg-bg p-4">
//       <div className="panel max-w-md w-full mx-auto text-center">
//         <div className="panel-body space-y-6">
//           {/* Error Icon */}
//           <div className="flex justify-center">
//             <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
//               <svg 
//                 className="w-8 h-8 text-danger" 
//                 fill="none" 
//                 stroke="currentColor" 
//                 viewBox="0 0 24 24"
//               >
//                 <path 
//                   strokeLinecap="round" 
//                   strokeLinejoin="round" 
//                   strokeWidth={2} 
//                   d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" 
//                 />
//               </svg>
//             </div>
//           </div>

//           {/* Error Code */}
//           <div>
//             <h1 className="heading-xl text-text-primary mb-2">
//               Error {errorCode ?? "Unknown"}
//             </h1>
//             <div className="w-12 h-1 bg-danger mx-auto rounded-full"></div>
//           </div>

//           {/* Error Message */}
//           <div className="space-y-3">
//             <p className="text-body text-text-primary">
//               {error ?? "Something went wrong"}
//             </p>
//             {details && (
//               <p className="text-muted text-text-secondary leading-relaxed">
//                 {details}
//               </p>
//             )}
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-3 justify-center pt-4">
//             <button 
              
//               className="btn btn-md btn-secondary btn-icon"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//               </svg>
//               Go Back
//             </button>
//             <button 
              
//               className="btn btn-md btn-primary btn-icon"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//               </svg>
//               Try Again
//             </button>
//           </div>

//           {/* Support Info */}
//           <div className="pt-6 border-t border-border">
//             <p className="text-muted text-text-secondary text-xs">
//               If the problem persists, please contact support
//             </p>
//             <button className="btn btn-sm btn-ghost text-xs text-link mt-2">
//               Contact Support →
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }










import React from "react";
import ClientActions from "./components/error-client";
import Link from "next/link";

// Server component (Next.js) that renders a polished error page using the provided theme/tailwind classes.
// Includes a small client-only subcomponent for interactive buttons (retry, copy, report).

type Props = {
  searchParams: Record<string, any> | Promise<Record<string, any>>;
};

export default async function ErrorPage({ searchParams }: Props) {
  // Accept either a plain object or a promise (defensive). Matches the user's original usage
  const params = await Promise.resolve(searchParams as Record<string, any>);
  const {
    message,
    details,
    code,
    origin
  } = params ?? {};

  const shortMsg = typeof message === "string" ? message : JSON.stringify(message);
  const longDetails = typeof details === "string" ? details : JSON.stringify(details, null, 2);

  return (
    <div className="h-screen w-screen flex items-center justify-center p-6 bg-bg">
      <div className="max-w-3xl w-full panel animate-fadeIn shadow-lg overflow-hidden">
        <div className="flex gap-6 items-center p-6 panel-header">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(242,101,109,0.12), rgba(210,82,94,0.08))' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M11 7h2v6h-2z" fill="var(--color-danger)" />
                <path d="M11 15h2v2h-2z" fill="var(--color-danger)" />
                <circle cx="12" cy="12" r="10" stroke="var(--color-border)" strokeWidth="0.8" />
              </svg>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="heading-xl">Ocurrió un error</h2>
                <p className="text-muted mt-1">Hemos capturado los detalles del error a continuación. Puedes reportarlo si quieres.</p>
              </div>

              <div className="text-right">
                <div className="text-body">Código</div>
                <div className="heading-lg mt-1">{String(code)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border panel-body grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="md:col-span-2">
            <div className="mb-3">
              <div className="text-md font-semibold">Mensaje</div>
              <div className="mt-2 panel p-3 bg-surface text-text-primary rounded">
                <div className="text-sm">{shortMsg}</div>
              </div>
            </div>

            <div>
              <div className="text-md font-semibold">Detalles</div>
              <pre className="mt-2 p-3 rounded text-xs font-mono bg-[color:var(--color-bg)] border border-border overflow-x-auto" style={{ whiteSpace: 'pre-wrap' }}>
{longDetails}
              </pre>
            </div>
          </div>

          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="panel p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-md font-semibold">Meta</div>
                <dl className="mt-3 text-sm text-text-secondary space-y-2">
                  <div>
                    <dt className="text-body">Path</dt>
                    <dd className="text-muted truncate">{typeof window === 'undefined' ? 'Server' : window.location?.pathname ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-body">Time</dt>
                    <dd className="text-muted">{new Date().toLocaleString()}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-4 flex gap-2">
                {/* Client actions will handle retry/copy/report */}
                {/* Buttons keep the same visual language as the theme */}
                <ClientActions
                  errorCode={String(code)}
                  shortMsg={shortMsg}
                  longDetails={longDetails}
                  origin={String(origin)}
                />
              </div>
            </div>

            <div className="text-xs text-text-secondary text-center p-3">
              Si el error persiste, repórtelo para que podamos investigarlo.
            </div>
          </div>
        </div>

        <div className="panel-footer border-t border-border p-4 flex items-center justify-between">
          <div className="text-sm text-text-secondary">Error ID: <span className="font-mono">{(Math.random() + 1).toString(36).slice(2, 10)}</span></div>
          <div className="flex items-center gap-3">
            <Link href="/" className="btn btn-ghost btn-sm">Ir a inicio</Link>
            <Link href="/support" className="btn btn-link btn-sm">Soporte</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
