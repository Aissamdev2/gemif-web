export type User = {
  id: string;
  name: string;
  publicname: string;
  year: string;
  role: string;
  color: string;
  logincount: number;
  lastseen: string;
  email: string;
  password: string;
  assignedgithubtoken: string;
  isverified: boolean;
}


export type PrimitiveUser = {
  name: string,
  signedup: boolean,
  id: number;
}

export type Token = {
  githubtoken: string;
  assigned: boolean;
}

export type FetchedUser = {
  id: string;
  name: string;
  publicname: string;
  year: string;
  role: string;
};

export type UserCookie = {
  id: string;
  email: string;
  isverified: boolean;
  token: string;
  logincount: number;
  githubtoken: string;
}

export type Event = {
  id: string;
  name: string;
  description?: string;
  date: string;
  time?: string;
  scope: string;
  primitiveid: string;
  userid: string;
  subjectid: string;
}

export type PrimitiveSubject = {
  id: string;
  name: string;
  color: string;
  bordercolor: string;
  bgcolor: string;
  primitiveid?: string;
  info: any;
  qual: number[];
  diff: number[];
  userid: string;
}

export type Subject = {
  id?: string;
  name: string;
  color: string;
  bordercolor: string;
  bgcolor: string;
  year?: string | null;
  quadri?: string | null;
  primitiveid: string;
  archived: boolean;
  qual?: number;
  diff?: number;
  userid?: string;
}

export type RemainingTime = {
  days: number;
  hours: number;
  minutes: number;
}

export type VerifySession = {
  error: string | null;
  session: UserCookie | null;
}

export type GitHubContent = {
  name: string;
  path: string;
  type: "file" | "tree";
  children?: GitHubContent[];
};

export type SubjectInfo = {
  
}

export type Ranking = {
  primitiveid: string;
  score: number
}[]


export type MainPost = {
  id?: string;
  name: string;
  description?: string;
  subjectid?: string;
  type?: string;
  foldername?: string;
  filenames?: string[];
  links?: string[];
  userId?: string;
}


export type Message = {
  id?: string;
  name: string;
  description?: string;
  createdat: string;
  year?: string;
  scope: string;
  userid: string;
}


export type WeeklyChallenge = {
  id: string;
  title: string;
  description: string;
  ismultiplechoice: boolean;
  options: string[] | null;
  correctanswers: string[];
  difficulty: number;
  deadline: string;
  strictanswer: boolean;
  active: boolean;
  suggested: boolean;
  createdat: string;
  userid: string;
};

export type WeeklyChallengeAnswer = {
  id: string;
  challengeid: string;
  answer: string;
  score: number;
  createdat: string;
  userid: string;
};


export type UserPublic = {
  id: string;
  name: string;
  year: string;
  role: string;
  color: string;
  weeklychallengesscore: number;
}


export interface MultipartUploadInfo {
  uploadId: string;
  parts: Array<{ PartNumber: number; ETag: string }>;
}

export interface PresignResult {
  presigned: Record<string, string[]> | null;
  uploadIds: Record<string, string> | null;
  fileKeys: string[];
}











export type WithMandatory<T, K extends keyof T> = Required<Pick<T, K>> & Partial<Omit<T, K>>;


export type SimplePrim = { id: string; name: string, year: number, quadri: number | null };

export type ColumnId = 'toTake' | 'taking' | 'passed';

export type Columns = {
  toTake: SimplePrim[];
  taking: SimplePrim[];
  passed: SimplePrim[];
};


export type SessionPayload = {
  userId: string
  email: string
  role: 'user' | 'admin' | 'dev'
  flags?: Record<string, boolean>
}


export type ActionDetail = {
  name: string;       // name of the item (e.g., file name)
  success: boolean;
  error?: string;     // optional error for this item
};
export type ActionReturn<T> =
  | {
      ok: true;
      data: T;                  // required when ok is true
      details?: ActionDetail[];
    }
  | {
      ok: false;
      error: string;            // required when ok is false
      errorCode: ErrorCode;     // required when ok is false
      details?: ActionDetail[];
    };

export type ActionRedirect =
    {
      ok: false;
      error: string;
      errorCode: ErrorCode;
      details?: ActionDetail[];
    };


export type FormActionReturn<T> =
  | {
      ok: true;
      data: T | null;                  // required when ok is true
      details?: ActionDetail[];
    }
  | {
      ok: false;
      error: string;            // required when ok is false
      errorCode: ErrorCode;     // required when ok is false
      details?: ActionDetail[];
    };

    
export type ErrorMessage = {
  error: string;
  errorCode: ErrorCode;
  details?: ActionDetail[];
}

export type R2File = {
  name: string;
  type: string;
  size: number;
}

export type ApiResponse = {
  data: any;
  error: string | null;
  publicError: string | null;
  details?: any;
  errorCode: ErrorCode | null;
};

export type ErrorCode =
  | 'NO_AUTH'
  | 'DB_EVENTS_GET_FAILED'
  | 'BAD_REQUEST'
  | 'MISSING_FIELDS'
  | 'DB_EVENT_POST_FAILED'
  | 'DB_EVENT_GET_FAILED'
  | 'DB_EVENT_PATCH_FAILED'
  | 'DB_EVENT_DELETE_FAILED'
  | 'EXTERNAL_FILE_POST_FAILED'
  | 'INVALID_TYPE'
  | 'EXTERNAL_CREDENTIALS_ERROR'
  | 'EXTERNAL_FOLDER_GET_FAILED'
  | 'EXTERNAL_PARTIAL_DELETE'
  | 'EXTERNAL_FOLDER_DELETE_FAILED'
  | 'RATE_LIMIT'
  | 'EXTERNAL_POST_FAILED'
  | 'EXTERNAL_GET_FAILED'
  | 'EXTERNAL_PATCH_FAILED'
  | 'EXTERNAL_DELETE_FAILED'
  | 'EXTERNAL_FILE_DELETE_FAILED'
  | 'EXTERNAL_FOLDER_GET_FAILED'
  | 'EXTERNAL_EXTERNAL_FILE_POST_FAILED'
  | 'DB_MAIN_POSTS_GET_FAILED'
  | 'DB_MAIN_POST_GET_FAILED'
  | 'DB_MAIN_POSTS_POST_FAILED'
  | 'DB_MAIN_POSTS_DELETE_FAILED'
  | 'MISSING_PARAMS'
  | 'PERMISSION_DENIED'
  | 'DB_MAIN_POSTS_PATCH_FAILED'
  | 'DB_MESSAGES_GET_FAILED'
  | 'DB_MESSAGES_POST_FAILED'
  | 'DB_MESSAGE_GET_FAILED'
  | 'DB_MESSAGES_PATCH_FAILED'
  | 'DB_MESSAGE_DELETE_FAILED'
  | 'DB_USER_GET_FAILED'
  | 'DB_UNSEEN_GET_FAILED'
  | 'DB_PRIMITIVE_SUBJECTS_GET_FAILED'
  | 'DB_PRIMITIVE_SUBJECTS_PATCH_FAILED'
  | 'DB_SUBJECTS_GET_FAILED'
  | 'DB_SUBJECTS_POST_FAILED'
  | 'DB_SUBJECTS_PATCH_FAILED'
  | 'DB_SUBJECT_DELETE_FAILED'
  | 'DB_USER_PATCH_FAILED'
  | 'DB_USERS_GET_FAILED'
  | 'DB_WEEKLY_CHALLENGE_ANSWERS_GET_FAILED'
  | 'DB_WEEKLY_CHALLENGE_ANSWERS_POST_FAILED'
  | 'DB_WEEKLY_CHALLENGE_ANSWER_GET_FAILED'
  | 'DB_WEEKLY_CHALLENGE_ANSWER_PATCH_FAILED'
  | 'DB_WEEKLY_CHALLENGE_ANSWER_DELETE_FAILED'
  | 'DB_WEEKLY_CHALLENGES_GET_FAILED'
  | 'DB_WEEKLY_CHALLENGES_POST_FAILED'
  | 'DB_WEEKLY_CHALLENGE_GET_FAILED'
  | 'DB_WEEKLY_CHALLENGE_PATCH_FAILED'
  | 'DB_WEEKLY_CHALLENGE_DELETE_FAILED'
  | 'RESOURCE_EXISTS'
  | 'UPLOAD_FAILED'
  | 'UPDATE_FAILED'
  | 'UNKNOWN_ERROR'
  | 'EXTERNAL_PARTIAL_POST'
  | 'EXTERNAL_PARTIAL_PATCH'
  | 'DB_RANKING_GET_FAILED'
  | 'DB_RANKING_PATCH_FAILED'
  | 'RESOURCE_DELETED'
  | 'USER_NOT_FOUND'
  | 'INCORRECT_PASSWORD'
  | 'DB_USERS_POST_FAILED'
  | 'DB_AUTH_ERROR'
  | 'EMAIL_SEND_FAILED'
  | 'DB_VERIFICATION_TOKENS_PATCH_FAILED'
  | 'USER_NOT_VERIFIED'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'DB_TOKENS_GET_FAILED'
  | 'DB_TOKENS_POST_FAILED'
  | 'DB_TOKENS_PATCH_FAILED'
  | 'DB_TOKENS_DELETE_FAILED'
  | 'MISSING_ENV'
  | 'AUTH_ERROR'
  | 'MAIL_SEND_ERROR'
  | 'DB_PRIMITIVE_USER_GET_FAILED'
  | 'DB_PRIMITIVE_USER_PATCH_FAILED'
  | 'WORKER_MPU_COMPLETE_FAILED'
  | 'MISSING_GROUPED_FILES'
  | 'WORKER_URL_ERROR'

