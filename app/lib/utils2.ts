import { forbidden, unauthorized } from "next/navigation";
import { ActionReturn } from "./definitions";



export function throwError({ response }: { response: ActionReturn<any> }) {
  if (response.ok) return
  if (response.errorCode === "UNAUTHORIZED") unauthorized();
  if (response.errorCode === "FORBIDDEN") forbidden();
  throw new Error(response.error || "An error occurred");
}