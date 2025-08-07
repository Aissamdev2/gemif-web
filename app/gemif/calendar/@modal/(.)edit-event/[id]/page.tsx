import EditEventClient from "@/app/ui/edit-event-client";
import Modal from "@/app/ui/modal";


export default async function Page({ params }: { params: { id: string } }) {

  return (
    <Modal>
      <EditEventClient id={params.id} />
    </Modal>
  )
}