import { jwtVerify } from "jose";

export interface Env {
  GEMIF_WEB_MAIN: R2Bucket;
  GEMIF_WEB_RESOURCES_POSTS?: R2Bucket; // Example of other buckets
  JWT_SECRET: string;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.slice(1));
    const action = url.searchParams.get("action") || "";
    const bucketName = url.searchParams.get("bucket") || request.headers.get("x-bucket");

    const headers = new Headers({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Bucket",
    });

    // --- Handle preflight CORS ---
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    // --- Select bucket dynamically ---
    if (!bucketName) {
      return new Response("Missing bucket name (use ?bucket=... or x-bucket header)", { status: 400, headers });
    }

    const bucket =
      bucketName === "GEMIF_WEB_MAIN"
        ? env.GEMIF_WEB_MAIN
        : bucketName === "GEMIF_WEB_RESOURCES_POSTS"
        ? env.GEMIF_WEB_RESOURCES_POSTS
        : undefined;
    if (!bucket) {
      return new Response(`Bucket "${bucketName}" not found in environment`, { status: 400, headers });
    }

    // --- JWT Auth ---
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response("Missing token", { status: 401, headers });
    }

    try {
      await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET));
    } catch {
      return new Response("Invalid or expired token", { status: 401, headers });
    }

    try {
      switch (request.method.toUpperCase()) {
        // ---------------- PUT ----------------
        case "PUT": {
          if (action === "mpu-uploadpart") {
            const uploadId = url.searchParams.get("uploadId");
            const partNumberString = url.searchParams.get("partNumber");
            if (!uploadId || !partNumberString)
              return new Response("Missing partNumber or uploadId", { status: 400, headers });
            if (!request.body) return new Response("Missing body", { status: 400, headers });

            const partNumber = parseInt(partNumberString);
            const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);
            const uploadedPart = await multipartUpload.uploadPart(partNumber, request.body);
            return new Response(JSON.stringify(uploadedPart), { headers });
          }

          if (!request.body) return new Response("No body provided", { status: 400, headers });

          await bucket.put(key, request.body, {
            httpMetadata: { contentType: request.headers.get("content-type") ?? "application/octet-stream" },
          });

          return new Response(`Uploaded ${key} successfully!`, { status: 201, headers });
        }

        // ---------------- POST ----------------
        case "POST": {
          switch (action) {
            case "mpu-create": {
              const multipartUpload = await bucket.createMultipartUpload(key, {
                httpMetadata: { contentType: request.headers.get("content-type") ?? "application/octet-stream" },
              });
              return new Response(
                JSON.stringify({ key: multipartUpload.key, uploadId: multipartUpload.uploadId }),
                { status: 201, headers }
              );
            }

            case "mpu-complete": {
              const uploadId = url.searchParams.get("uploadId");
              if (!uploadId) return new Response("Missing uploadId", { status: 400, headers });
              const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);
              const body: { parts: R2UploadedPart[] } = await request.json();
              if (!body?.parts) return new Response("Missing parts", { status: 400, headers });

              const object = await multipartUpload.complete(body.parts);
              headers.set("etag", object.httpEtag);
              return new Response(null, { status: 200, headers });
            }

            default:
              return new Response(`Unknown action ${action} for POST`, { status: 400, headers });
          }
        }

        // ---------------- GET ----------------
        case "GET": {
          const object = await bucket.get(key);
          if (!object) return new Response("Object Not Found", { status: 404, headers });

          object.writeHttpMetadata(headers);
          headers.set("etag", object.httpEtag);
          return new Response(object.body ?? undefined, {
            status: object.body ? 200 : 412,
            headers,
          });
        }

        // ---------------- DELETE ----------------
        case "DELETE": {
          switch (action) {
            case "mpu-abort": {
              const uploadId = url.searchParams.get("uploadId");
              if (!uploadId) return new Response("Missing uploadId", { status: 400, headers });
              const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);
              await multipartUpload.abort();
              return new Response(null, { status: 204, headers });
            }

            case "delete": {
              await bucket.delete(key);
              return new Response(null, { status: 204, headers });
            }

            default:
              return new Response(`Unknown action ${action} for DELETE`, { status: 400, headers });
          }
        }

        default:
          return new Response("Method Not Allowed", { status: 405, headers });
      }
    } catch (err: any) {
      console.error("Something went wrong:", err);
      return new Response(`Error: ${err.message}`, { status: 500, headers });
    }
  },
};


export default worker;