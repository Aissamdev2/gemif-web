


export type dbCreateResourcesPostOutput = {
  id: string;
  folderName: string;
}

export type ResourcePostWithSubjectAndUser = {
  post: {
    id: string;
    name: string;
    description: string | null;
    folderName: string;
    fileNames: string[];
    links: string[];
    anonymous: boolean;
    createdAt: Date;
  };
  subject: {
    name: string;
  };
  user: {
    id: string;
    publicName: string | null;
  }
}