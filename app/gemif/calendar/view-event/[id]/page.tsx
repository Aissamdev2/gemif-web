import Modal from "@/app/ui/modal"
import ViewEventClient from "@/app/ui/view-event-client2"

export default async function Page({ params }: any) {

  const { id } = await params;

  return (
    <Modal>
      <ViewEventClient id={id} />
    </Modal>
  )
}