
import type { AppError, CreateErrorParams, CreatePartialErrorParams, ErrorFactoryParams, PartialAppError, PartialErrorFactoryParams, PrimitiveSubjectResource, PrimitiveSubjectsResource, Resource, SessionResource, SessionTokenResource, SubjectResource, SubjectsResource, UserEmailResource, VerificationResource, ZodResource } from './types';
import { ErrorCode } from './codes';

// Base error factory
export const createError = <R extends Resource = Resource>({
  code,
  message,
  details,
  metadata,
  raw,
  resource,
  parallelErrors,
}: CreateErrorParams<R>): AppError<R> => ({
  code,
  message,
  details,
  metadata,
  raw,
  resource,
  parallelErrors,
});

export const createPartialError = <R extends Resource = Resource>({
  code,
  message,
  details,
  metadata,
  raw,
  resource,
  parallelErrors,
}: CreatePartialErrorParams<R>): PartialAppError<R> => ({
  code,
  message,
  details,
  metadata,
  raw,
  resource,
  parallelErrors,
});


export const ValidationError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.VALIDATION_ERROR, ...params });

export const NotFoundError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.RESOURCE_NOT_FOUND, ...params });

export const UnauthorizedError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.UNAUTHORIZED, ...params });

export const ForbiddenError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.FORBIDDEN, ...params });

export const BusinessRuleError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.BUSINESS_RULE_VIOLATION, ...params });

export const DatabaseError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.DATABASE_ERROR, ...params });

export const InvalidInputError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.INVALID_INPUT, ...params });

export const MailError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.DATABASE_ERROR, ...params });

export const ExternalApiError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.EXTERNAL_API_ERROR, ...params });

export const ExternalParsingError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.EXTERNAL_PARSING_ERROR, ...params });

export const InternalError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.INTERNAL_ERROR, ...params });

export const ClientApiError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.CLIENT_API_ERROR, ...params });

export const RateLimitError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.RATE_LIMIT_EXCEEDED, ...params });

export const R2ServerStorageError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.R2_SERVER_STORAGE_ERROR, ...params });

export const R2PartialServerStorageError = <R extends Resource = Resource>(params: PartialErrorFactoryParams<R>): PartialAppError<R> =>
  createPartialError({ code: ErrorCode.R2_SERVER_STORAGE_ERROR, ...params });

export const R2PartialClientStorageError = <R extends Resource = Resource>(params: PartialErrorFactoryParams<R>): PartialAppError<R> =>
  createPartialError({ code: ErrorCode.R2_PARTIAL_CLIENT_STORAGE_ERROR, ...params });

export const R2ClientStorageError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.R2_CLIENT_STORAGE_ERROR, ...params });

export const TooManyRetriesError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.TOO_MANY_RETRIES, ...params });

export const AuthError = <R extends Resource = Resource>(params: ErrorFactoryParams<R>): AppError<R> =>
  createError({ code: ErrorCode.AUTH_ERROR, ...params });



// Error cause factories
export async function responseRawError(response: Response) {
  return `Status [${response.status}] Status text [${response.statusText}] Text [${await response.text()}]`
}
export function errorRaw(error: Error) {
  return `Error message [${error.message}]`
}


// Error resource factories
// helpers/resource-attach.ts
import { FileResource, UserResource, PostResource } from './types';
import { SessionPayload } from '@/app/lib/definitions';
import { VerificationToken } from '@/db/schema';


export function makeZodResource({ path }: {
  path: string,
}): ZodResource {
  return {
    kind: 'zod',
    path
  };
}

export function makeFileResource({ fileName, key, size, contentType }: {
  fileName: string;
  key: string;
  size?: number;
  contentType?: string;
}): FileResource {
  return {
    kind: 'file',
    fileName,
    key,
    size,
    contentType,
  };
}

export function makeSessionResource(payload: SessionPayload): SessionResource  {
  return {
    kind: "session",
    ...payload
  }
}

export function makeSessionTokenResource(token: string): SessionTokenResource {
  return {
    kind: "session-token",
    token
  }
}

export function makeVerificationResource(payload: Partial<VerificationToken>): VerificationResource {
  return {
    kind: "verification",
    ...payload
  }
}

export function makeUserEmailResource({ email }: { email: string }) : UserEmailResource {
  return {
    kind: 'user-email',
    email
  };
}

export function makeUserResource({ userId, email }: { userId: string; email: string }) : UserResource {
  return {
    kind: 'user',
    userId,
    email,
  };
}

export function makePrimitiveSubjectResource({ primitiveId }: { primitiveId: string }) : PrimitiveSubjectResource {
  return {
    kind: 'primitive-subject',
    primitiveId,
  };
}

export function makePrimitiveSubjectsResource({ primitiveIds }: { primitiveIds: string[] }) : PrimitiveSubjectsResource {
  return {
    kind: 'primitive-subjects',
    primitiveIds
  };
}

export function makeSubjectResource({ primitiveId, id }: { primitiveId: string, id: string }) : SubjectResource {
  return {
    kind: 'subject',
    primitiveId,
    id
  };
}

export function makeSubjectsResource({ primitiveIds, ids }: { primitiveIds: string[], ids: string[] }) : SubjectsResource {
  return {
    kind: 'subjects',
    primitiveIds,
    ids
  };
}


export function makePostResource(ctx: { postId?: string; slug?: string }) : PostResource {
  return {
    kind: 'post',
    postId: ctx.postId,
    slug: ctx.slug
  };
}


