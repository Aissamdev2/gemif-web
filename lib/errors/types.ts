// result.ts
import { SessionPayload } from "@/app/lib/definitions";
import { ErrorCode, ErrorTag } from "./codes";
import { VerificationToken } from "@/db/schema";

/**
 * Error and Result types
 */

export type ZodResource = { kind: "zod", path: string }

export type FileResource = {
  kind: 'file';
  fileName: string;
  key: string;
  size?: number;
  contentType?: string;
};

export type SessionResource = { kind: 'session' } & SessionPayload;

export type SessionTokenResource = { kind: 'session-token', token: string}

export type VerificationResource = { kind: 'verification' } & Partial<VerificationToken>

export type UserEmailResource = {
  kind: 'user-email',
  email: string
}

export type UserResource = {
  kind: 'user';
  userId: string;
  email: string;
};

export type PrimitiveSubjectResource = {
  kind: 'primitive-subject';
  primitiveId: string;
};

export type PrimitiveSubjectsResource = {
  kind: 'primitive-subjects';
  primitiveIds: string[];
};

export type SubjectResource = {
  kind: 'subject';
  primitiveId: string;
  id: string;
};

export type SubjectsResource = {
  kind: 'subjects';
  primitiveIds: string[];
  ids: string[];
};

export type PostResource = {
  kind: 'post';
  postId?: string;
  slug?: string;
};

export type DBResource = {
  kind: 'db';
  table?: string;
  id?: string;
  queryId?: string;
};

export type GenericResource = {
  kind: 'generic';
  type?: string; // e.g. 'session', 'cache', 'job'
  id?: string;
  name?: string;
  [key: string]: unknown;
};

// union of all resource types
export type Resource =
  | ZodResource
  | FileResource
  | SessionResource
  | SessionTokenResource
  | VerificationResource
  | UserEmailResource
  | UserResource
  | PrimitiveSubjectResource
  | PrimitiveSubjectsResource
  | SubjectResource
  | SubjectsResource
  | PostResource
  | DBResource
  | GenericResource;

// --- existing metadata (unchanged) ---
export type ErrorMetadata = {
  scope: string;
  operation: string;
  isExpected: boolean;
  sensitivity: "none" | "masked" | "log-only";
  tags: ErrorTag[];
  [key: string]: unknown;
};

export interface AppError<R extends Resource = Resource> {
  code: string;
  message: string;
  details: string;
  metadata: ErrorMetadata;
  raw?: string;
  resource?: R;
  parallelErrors?: AppError<Resource>[];
}

export interface SanitizedAppError<R extends Resource = Resource> {
  code: string;
  message: string;
  details: string;
  metadata?: ErrorMetadata;
  raw?: string;
  resource?: R;
  parallelErrors?: SanitizedAppError<Resource>[];
}

export interface PartialAppError<R extends Resource = Resource> extends AppError<R> {
  parallelErrors: AppError<Resource>[]; // required here
}

export interface SanitizedPartialAppError<R extends Resource = Resource> extends SanitizedAppError<R> {
  parallelErrors: SanitizedAppError<Resource>[]; // required here
}


export type CreateErrorParams<R extends Resource = Resource> = {
  code: ErrorCode;
  message: string;
  details: string;
  metadata: ErrorMetadata;
  raw?: string;
  resource?: R;
  parallelErrors?: AppError<R>[];
};

export type SanitizedCreateErrorParams<R extends Resource = Resource> = {
  code: ErrorCode;
  message: string;
  details: string;
  metadata?: ErrorMetadata;
  raw?: string;
  resource?: R;
  parallelErrors?: SanitizedAppError<R>[];
};

export type CreatePartialErrorParams<R extends Resource = Resource> = {
  code: ErrorCode;
  message: string;
  details: string;
  metadata: ErrorMetadata;
  raw?: string;
  resource?: R;
  parallelErrors: AppError<R>[];
};


export type ErrorFactoryParams<R extends Resource = Resource> = Omit<CreateErrorParams<R>, "code">;

export type PartialErrorFactoryParams<R extends Resource = Resource> = Omit<CreatePartialErrorParams<R>, "code">;
/**
 * Discriminated Result union with explicit `kind` for clarity
 */
export type Success<T> = {
  ok: true;
  kind: "success";
  data: T;
  meta?: Record<string, unknown>;
};

export type PartialSuccess<T, R extends Resource = Resource> = {
  ok: true;
  kind: "partial";
  data: T;
  meta?: Record<string, unknown>;
  error: PartialAppError<R>;
};

export type SanitizedPartialSuccess<T, R extends Resource = Resource> = {
  ok: true;
  kind: "partial";
  data: T;
  meta?: Record<string, unknown>;
  error: PartialAppError<R>;
};

export type Failure<R extends Resource = Resource> = {
  ok: false;
  kind: 'failure';
  error: AppError<R>;
};

export type SanitizedFailure<R extends Resource = Resource> = {
  ok: false;
  kind: 'failure';
  error: SanitizedAppError<R>;
};

export type Result<T, R extends Resource = Resource> = Success<T> | PartialSuccess<T, R> | Failure<R>;

export type SanitizedResult<T, R extends Resource = Resource> = Success<T> | SanitizedPartialSuccess<T, R> | SanitizedFailure<R>;

