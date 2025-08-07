import Modal from "@/app/ui/modal"
import AddEventForm from "@/app/ui/add-event-form2"
import { getEvents } from "@/app/lib/actions/events/actions";


export default async function Page({ params }: { params: { eventId: string } }) {

  return (
    <Modal>
      <AddEventForm/>
    </Modal>
  )
}