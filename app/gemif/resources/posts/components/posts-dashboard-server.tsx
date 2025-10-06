import React from "react";
import PostsDashboardClient from "./posts-dashboard-client";
import { redirect, unauthorized } from "next/navigation";
import { AlertTriangle } from "lucide-react"
import { SessionPayload } from "@/app/lib/definitions";
import { verifySession } from "@/auth/dal";
import { redirectErrorUrl } from "@/lib/utils";
import { dbGetResourcesPosts } from "@/db/main-posts/main-posts";
import { dbGetSubjects } from "@/db/subjects";
import { isFailure, unwrap, unwrapError } from "@/lib/errors/result";



export default async function PostsDashboardServer() {
  // Validate session [START]
  const sessionResult = await verifySession();
  if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
  const session = unwrap(sessionResult)
  if (!session) unauthorized()
  // Validate session [END]
  
  const { userId } = session;

  const [postsResult, subjectsResult] = await Promise.all([dbGetResourcesPosts(), dbGetSubjects({ id: userId })]);
  if (isFailure(postsResult)) redirectErrorUrl(unwrapError(postsResult))
  if (isFailure(subjectsResult)) redirectErrorUrl(unwrapError(subjectsResult))
  
  const posts = unwrap(postsResult)
  const subjects = unwrap(subjectsResult)

  return (
    <PostsDashboardClient posts={posts} subjects={subjects} />
  )
}


function Error({
  error,
  errorCode,
}: {
  error: string
  errorCode: string
}) {
  return (
    <div className="panel-body flex flex-col gap-1 flex-1 min-h-0 overflow-hidden">
      {/* Disabled Controls */}
      <div className="flex w-full items-end gap-3 mb-3">
        <div className="flex-grow grid grid-cols-1 grid-rows-1">
          <div className="col-start-1 row-start-1 transition-all duration-300 ease-in-out">
            <div className="w-full">
              <label
                htmlFor="subject-select"
                className="block ml-1 text-xs font-medium text-gray-900"
              >
                Asignatura
              </label>
              <select
                id="subject-select"
                className="disabled select select-md w-full"
                disabled
              ></select>
            </div>
          </div>
        </div>
        <button
          className="btn btn-secondary btn-md flex items-center transition-all duration-300 ease-in-out disabled"
          disabled
        >
          <span className="overflow-hidden whitespace-nowrap">Buscar</span>
        </button>
      </div>

      {/* Error Message Panel */}
      <div className="h-full flex-1 min-h-0 flex flex-col">
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="h-full flex flex-col items-center justify-center gap-2 rounded-md border border-red-300 bg-red-50 text-red-600 shadow-sm px-3 py-2">
            <AlertTriangle className="h-6 w-6 flex-shrink-0" />
            <span className="font-semibold">{errorCode}:</span>
            <span className="text-muted truncate">{error}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
