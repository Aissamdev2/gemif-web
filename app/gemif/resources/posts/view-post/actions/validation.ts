import { string, uuidv4, z } from "zod";

export const RESOURCES_POSTS_DELETE_ERROR_PATHS: Record<string, string> = {
  id: "ID",
  folderName: "Nombre de carpeta",
  fileNames: "Nombres de archivos"
}

export const RESOURCES_POSTS_DOWNLOAD_ERROR_PATHS: Record<string, string> = {
  key: "Clave"
}

export const resourcesPostsDeleteSchema = z.object({
  id: z.uuidv4("ID de publicación inválido"),
  folderName: z.string("Nombre de carpeta inválido").min(1, "Nombre de carpeta inválido"),
  fileNames: z.array(z.string("Nombre de archivo inválido").min(1, "Nombre de archivo inválido"))
});

export const resourcesPostsDownloadSchema = z.object({
  key: z.string("La clave del archivo es inválida").min(1, "La clave del archivo es inválida")
});
