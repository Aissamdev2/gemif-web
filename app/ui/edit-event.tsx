
import { getEvent, getUser } from "../lib/actions"
import { useUser } from "../lib/use-user"
import EditEventClient from "./edit-event-client"

export default async function EditEvent({ id }: { id: string }) {
  const event = await getEvent(id)
  const user = await getUser()
  if (!event) {
    return null
  }
  if (!user) {
    return null
  }

  if (event.userid !== user.id) {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <h1>No tienes permiso para editar este evento</h1>
      </div>
    )
  }

  return (
    <EditEventClient event={event} />
  )
}