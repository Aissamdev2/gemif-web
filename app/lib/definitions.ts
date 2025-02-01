export type User = {
  id: string;
  name: string;
  year: string;
  role: string;
  color: string;
  logincount: number;
  lastseen: string;
  email: string;
  password: string;
  assignedgithubtoken: string;
};

export type Token = {
  githubtoken: string;
  assigned: boolean;
}

export type FetchedUser = {
  id: string;
  name: string;
  year: string;
  role: string;
};

export type UserCookie = {
  id: string;
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
  year?: string | null;
  quadri?: string | null;
  primitiveid?: string;
  professors: string[] | [];
  emails: string[] | [];
  credits: string;
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
  score?: number;
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
  filename?: string;
  link?: string;
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


