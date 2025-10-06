import { redirectErrorUrl } from "@/lib/utils";
import FileLinkInputClient from "./file-link-input-client";
import { dbGetResourcesPost } from "@/db/main-posts/main-posts";
import { redirect } from "next/navigation";
import { isFailure, unwrap, unwrapError } from "@/lib/errors/result";


export default async function FileLinkInputServer({ id }: { id: string }) {

  const postResult = await dbGetResourcesPost({ id })
  if (isFailure(postResult)) return redirectErrorUrl(unwrapError(postResult))

  const mainPost = unwrap(postResult)
  return (
    <FileLinkInputClient folderName={mainPost.folderName} filenames={mainPost.fileNames} />
  )
}