

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  AUTH_ERROR = 'AUTH_ERROR',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Business Logic
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  OPERATION_FAILED = 'OPERATION_FAILED',
  
  // External Services
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  EXTERNAL_PARSING_ERROR = 'EXTERNAL_PARSING_ERROR',
  MAIL_ERROR = 'MAIL_ERROR',
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CLIENT_API_ERROR = 'CLIENT_API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Storage
  R2_SERVER_STORAGE_ERROR = 'R2_SERVER_STORAGE_ERROR',
  R2_PARTIAL_SERVER_STORAGE_ERROR = 'R2_PARTIAL_SERVER_STORAGE_ERROR',
  R2_CLIENT_STORAGE_ERROR = 'R2_CLIENT_STORAGE_ERROR',
  R2_PARTIAL_CLIENT_STORAGE_ERROR = 'R2_PARTIAL_CLIENT_STORAGE_ERROR',

  // Retries
  TOO_MANY_RETRIES = 'TOO_MANY_RETRIES'
}

export enum ErrorTag {

  "mail" = "mail",

  "userFailure" = "user-failure",

  "zod" = "zod",

  "crypto" = "crypto",

  "env" = "env",

  "pool" = "pool",
  "progressTracker" = "progress-tracker",
  "xhr" = "xhr",

  "retry" = "retry",
  "db" = "db",
  "external" = "external",
  "parse" = "parse",
  

  "users" = "users",

  "auth" = "auth",

  "login" = "login",
  "signup" = "signup",

  "account" = "account",

  "workerAuth" = "worker-auth",
  "session" = "session",
  "verification" = "verification",

  "cookies" = "cookies",

  "jwt" = "jwt",

  "jose" = "jose",

  "r2" = "r2",

  "worker" = "worker",

  "s3" = "s3",
  "partSigning" = "part-signing",

  "fileUpload" = "file-upload",
  "chunkUpload" = "chunk-upload",
  "fileDeletion" = "file-deletion",

  "multipart" = "multipart",
  "multipartCreation" = "multipart-creation",
  "multipartCompletion" = "multipart-completion",
  "multipartAbortion" = "multipart-abortion",

  "failedFetchResponse" = "failed-fetch-response",
  "failedFetch" = "failed-fetch"
}

// Error severity mapping for monitoring
export const ERROR_SEVERITY = {
  [ErrorCode.UNAUTHORIZED]: 'medium',
  [ErrorCode.FORBIDDEN]: 'medium',
  [ErrorCode.SESSION_EXPIRED]: 'low',
  [ErrorCode.VALIDATION_ERROR]: 'low',
  [ErrorCode.INVALID_INPUT]: 'low',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'low',
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 'medium',
  [ErrorCode.OPERATION_FAILED]: 'high',
  [ErrorCode.DATABASE_ERROR]: 'critical',
  [ErrorCode.EXTERNAL_API_ERROR]: 'high',
  [ErrorCode.INTERNAL_ERROR]: 'critical',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'medium',
} as const;