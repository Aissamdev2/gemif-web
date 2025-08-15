import EditEventClient from "@/app/ui/edit-event-client";
import Modal from "@/app/ui/modal";


export default async function Page({ params }: any) {

  const { id } = await params;
  return (
    <Modal>
      <EditEventClient id={id} />
    </Modal>
  )
}