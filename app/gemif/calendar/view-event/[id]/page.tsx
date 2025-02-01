import Modal from "@/app/ui/modal"
import ViewEventClient from "@/app/ui/view-event-client2"

export default async function Page({ params }: { params: { id: string } }) {

  return (
    <Modal>
      <ViewEventClient id={params.id} />
    </Modal>
  )
}