import { unstable_cache } from "next/cache";
import { db } from "../db.server";
import { eq, resourcesPostsTable, ResourcesPost, subjectsTable, usersTable } from "../schema";
import { ActionReturn, WithMandatory } from "@/app/lib/definitions";
import { cache } from "react";
import { generateFolderName } from "../logic";
import { DatabaseError, errorRaw } from "@/lib/errors/factories";
import { failure, success } from "@/lib/errors/result";
import { Result } from "@/lib/errors/types";
import { dbCreateResourcesPostOutput, ResourcePostWithSubjectAndUser } from "./types";
import { ErrorTag } from "@/lib/errors/codes";


export const dbGetResourcesPosts = cache(unstable_cache(async (): Promise<Result<ResourcesPost[]>> => {
  try {
    const resourcesPosts = await db.select().from(resourcesPostsTable);
    
    if (!resourcesPosts) {
      return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo obtener la información de las publicaciones",
      metadata: {
        scope: "Db get resources posts",
        operation: "Db get resources posts",
        sensitivity: "none",
        tags: [ErrorTag.external, ErrorTag.db],
        isExpected: true,
      },
    }))
    }
    return success(resourcesPosts)
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo obtener la información de las publicaciones",
      metadata: {
        scope: "Db get resources posts",
        operation: "Db get resources posts",
        sensitivity: "none",
        tags: [ErrorTag.external, ErrorTag.db],
        isExpected: false,
      },
      raw: errorRaw(error)
    }))
  }
},
['resources-posts'],
{
  tags: ['resources-posts'],
}))

export const dbGetResourcesPost = cache(
  async ({ id }: { id: string }): Promise<Result<ResourcesPost>> => {
    // unstable_cache handles long-term caching & invalidation tags
    return await unstable_cache(
      async (): Promise<Result<ResourcesPost>> => {
        try {
          const post = (await db
            .select()
            .from(resourcesPostsTable)
            .where(eq(resourcesPostsTable.id, id))
            .limit(1)
          )[0];

          if (!post) {
            return failure(DatabaseError({
              message: "Error de base de datos",
              details: "No se pudo obtener la información de la publicación",
              metadata: {
                scope: "Db get resources post",
                operation: "Db get resources post by id",
                sensitivity: "none",
                tags: [ErrorTag.external, ErrorTag.db],
                isExpected: true,
              },
            }))
          }

          return success(post)
        } catch (error: any) {
          return failure(DatabaseError({
            message: "Error de base de datos",
            details: "No se pudo obtener la información de la publicación",
            metadata: {
              scope: "Db get resources post",
              operation: "Db get resources post by id",
              sensitivity: "none",
              tags: [ErrorTag.external, ErrorTag.db],
              isExpected: false,
            },
            raw: errorRaw(error)
          }))
        }
      },
      [`resources-post-${id}`],
      { tags: ["resources-posts"] }
    )();
  }
);

export const dbGetResourcesPostWithSubjectAndUser = cache(
  async ({ id }: { id: string }): Promise<Result<ResourcePostWithSubjectAndUser | null>> => {
    // unstable_cache handles long-term caching & invalidation tags
    return await unstable_cache(
      async (): Promise<Result<ResourcePostWithSubjectAndUser | null>> => {
        try {
          const result = (await db
          .select({
            post: {
              id: resourcesPostsTable.id,
              name: resourcesPostsTable.name,
              description: resourcesPostsTable.description,
              folderName: resourcesPostsTable.folderName,
              fileNames: resourcesPostsTable.fileNames,
              links: resourcesPostsTable.links,
              anonymous: resourcesPostsTable.anonymous,
              createdAt: resourcesPostsTable.createdAt,
            },
            subject: {
              name: subjectsTable.name,
            },
            user: {
              id: usersTable.id,
              publicName: usersTable.publicName,
            }
          })
          .from(resourcesPostsTable)
          .innerJoin(subjectsTable, eq(resourcesPostsTable.subjectId, subjectsTable.primitiveId))
          .innerJoin(usersTable, eq(resourcesPostsTable.userId, usersTable.id))
          .where(eq(resourcesPostsTable.id, id)))[0];

          return success(result)
        } catch (error: any) {
          return failure(DatabaseError({
            message: "Error de base de datos",
            details: "No se pudo obtener la información de la publicación",
            metadata: {
              scope: "Db get resources post",
              operation: "Db get resources post with subject and user",
              sensitivity: "none",
              tags: [ErrorTag.external, ErrorTag.db],
              isExpected: false,
            },
            raw: errorRaw(error)
          }))
        }
      },
      [`resources-post-${id}`],
      { tags: ["resources-posts"] }
    )();
  }
);


export async function dbCreateResourcesPost({ payload }: { payload: WithMandatory<ResourcesPost, "name" | "fileNames" | "links" | "subjectId" | "userId" > }): Promise<Result<dbCreateResourcesPostOutput>> {
  const folderName = generateFolderName();
  try {
    const id = (await db.insert(resourcesPostsTable).values({ ...payload, folderName: folderName }).returning({ id: resourcesPostsTable.id }))[0]?.id;
    return success({ id, folderName })
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo crear la publicación",
      metadata: {
        scope: "Db create resources post",
        operation: "Db create resources post",
        sensitivity: "none",
        tags: [ErrorTag.external, ErrorTag.db],
        isExpected: true,
      },
      raw: errorRaw(error)
    }))
  }
}

export async function dbUpdateResourcesPost({ id, payload }: { id: string, payload: Partial<ResourcesPost> }): Promise<Result<boolean>> {
  try {
    await db.update(resourcesPostsTable).set(payload).where(eq(resourcesPostsTable.id, id))
    return success(true)
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo modificar la publicación",
      metadata: {
        scope: "Db update resources post",
        operation: "Db update resources post",
        sensitivity: "none",
        tags: [ErrorTag.external, ErrorTag.db],
        isExpected: true,
      },
      raw: errorRaw(error)
    }))
  }
}

export async function dbDeleteResourcesPost({ id }: { id: string }) {
  try {
    await db.delete(resourcesPostsTable).where(eq(resourcesPostsTable.id, id))
    return success(true)
  } catch (error: any) {
    return failure(DatabaseError({
      message: "Error de base de datos",
      details: "No se pudo eliminar la publicación",
      metadata: {
        scope: "Db delete resources post",
        operation: "Db delete resources post",
        sensitivity: "none",
        tags: [ErrorTag.external, ErrorTag.db],
        isExpected: true,
      },
      raw: errorRaw(error)
    }))
  }
}

