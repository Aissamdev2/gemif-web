// components/header-server.tsx
import React from "react";
import { redirect, unauthorized } from "next/navigation";
import Image from "next/image";
import { ErrorCode, SessionPayload } from "@/app/lib/definitions";
import { redirectErrorUrl } from "@/lib/utils";
import { verifySession } from "@/auth/dal";
import { connection } from "next/server";
import { isFailure, unwrap, unwrapError } from "@/lib/errors/result";
import { dbGetUser } from "@/db/users";


export default async function ProfileServer() {
  // Validate session [START]
  const sessionResult = await verifySession();
  if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
  const session = unwrap(sessionResult)
  if (!session) unauthorized()
  // Validate session [END]

  const { userId } = session;

  const userResult = await dbGetUser({ id: userId });
  if (isFailure(userResult)) redirectErrorUrl(unwrapError(userResult))

  const user = unwrap(userResult)
  if (!user.publicName) unauthorized()

  return (
    <div className="flex items-center gap-3">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.publicName}
          width={32}
          height={32}
          className="rounded-full"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
          {user.publicName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-gray-900 truncate">
          {user.publicName}
        </span>
        <span className="text-xs text-gray-500 truncate">{user.email}</span>
      </div>
    </div>
  );
}

