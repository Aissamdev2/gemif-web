import Modal from "@/app/ui/modal"
import AddEventForm from "@/app/ui/add-event-form2"
import { getSubjects } from "@/app/lib/actions"

export default async function Page() {

  return (
    <Modal>
      <AddEventForm/>
    </Modal>
  )
}