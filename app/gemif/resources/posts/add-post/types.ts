import { ProcessFilesResult } from "@/types/storage";


export type AddResourcesPostReturn = ProcessFilesResult & {
  id: string,
  folderName: string,
}

export type UpdateResourcesPostReturn = ProcessFilesResult & {
  id: string,
  folderName: string,
}