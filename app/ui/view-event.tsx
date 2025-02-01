import { getEvent } from "../lib/actions";
import ViewEventClient from "./view-event-client2";

export default async function ViewEvent({ id }: { id: string }) {

  return (
    <ViewEventClient id={id} />
  )
}