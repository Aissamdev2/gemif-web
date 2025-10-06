import { jwtVerify } from "jose";

export interface Env {
  GEMIF_WEB_MAIN: R2Bucket;
  JWT_SECRET: string; // Add this to your Worker environment
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {

    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.slice(1));
    const action = url.searchParams.get("action") || "";

    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    // --- Handle preflight CORS ---
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // --- Auth (skip only for OPTIONS) ---
    const token = url.searchParams.get("token");
    
    if (!token) {
      return new Response("Missing token", { status: 401, headers });
    }

    try {
      await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET));
    } catch (err: any) {
      return new Response("Invalid or expired token", { status: 401, headers });
    }

    try {
      switch (request.method.toUpperCase()) {
        case "PUT": {
          if (action === "mpu-uploadpart") {
            const uploadId = url.searchParams.get("uploadId");
            const partNumberString = url.searchParams.get("partNumber");
            if (!uploadId || !partNumberString)
              return new Response("Missing partNumber or uploadId", { status: 400, headers });
            if (!request.body) return new Response("Missing body", { status: 400, headers });

            const partNumber = parseInt(partNumberString);
            const multipartUpload =  env.GEMIF_WEB_MAIN.resumeMultipartUpload(key, uploadId);
            const uploadedPart = await multipartUpload.uploadPart(partNumber, request.body);

            return new Response(JSON.stringify(uploadedPart), { headers });
          }

          if (!request.body) return new Response("No body provided", { status: 400, headers });
          
          await env.GEMIF_WEB_MAIN.put(key, request.body, {
            httpMetadata: {
              contentType: request.headers.get("content-type") ?? "application/octet-stream"
            }
          });


          return new Response(`Uploaded ${key} successfully!`, { status: 201, headers });
        }

        case "POST": {
          switch (action) {
            case "mpu-create": {
              const multipartUpload = await env.GEMIF_WEB_MAIN.createMultipartUpload(key, {
              httpMetadata: { contentType: request.headers.get("content-type") ?? "application/octet-stream" }
            });
              return new Response(
                JSON.stringify({
                  key: multipartUpload.key,
                  uploadId: multipartUpload.uploadId,
                }),
                { status: 201, headers }
              );
            }

            case "mpu-complete": {
              const uploadId = url.searchParams.get("uploadId");
              if (!uploadId) return new Response("Missing uploadId", { status: 400, headers });

              const multipartUpload = env.GEMIF_WEB_MAIN.resumeMultipartUpload(key, uploadId);
              const body: { parts: R2UploadedPart[] } = await request.json();
              if (!body?.parts) return new Response("Missing parts", { status: 400, headers });

              try {
                const object = await multipartUpload.complete(body.parts);
                headers.set("etag", object.httpEtag);
                return new Response(null, { status: 200, headers });
              } catch (err: any) {
                return new Response(err.message, { status: 400, headers });
              }
            }

            default:
              return new Response(`Unknown action ${action} for POST`, { status: 400, headers });
          }
        }

        case "GET": {
          const object = await env.GEMIF_WEB_MAIN.get(key);
          if (!object) return new Response("Object Not Found", { status: 404, headers });

          object.writeHttpMetadata(headers);
          headers.set("etag", object.httpEtag);
          return new Response(object.body ?? undefined, {
            status: object.body ? 200 : 412,
            headers,
          });
        }

        case "DELETE": {
          switch (action) {
            case "mpu-abort": {
              const uploadId = url.searchParams.get("uploadId");
              if (!uploadId) return new Response("Missing uploadId", { status: 400, headers });
              const multipartUpload = env.GEMIF_WEB_MAIN.resumeMultipartUpload(key, uploadId);
              try {
                await multipartUpload.abort();
              } catch (err: any) {
                return new Response(err.message, { status: 400, headers });
              }
              return new Response(null, { status: 204, headers });
            }

            case "delete": {
              await env.GEMIF_WEB_MAIN.delete(key);
              return new Response(null, { status: 204, headers });
            }

            default:
              return new Response(`Unknown action ${action} for DELETE`, { status: 400, headers });
          }
        }

        default:
          return new Response("Method Not Allowed", {
            status: 405,
            headers,
          });
      }
    } catch (err: any) {
      console.error("Something went wrong:", err);
      return new Response(`Error: ${err.message}`, { status: 500, headers });
    }
  },
};

export default worker;
