import EditEvent from "@/app/ui/edit-event";
import Modal from "@/app/ui/modal";


export default async function Page({ params }: { params: { id: string } }) {

  return (
    <Modal>
      <EditEvent id={params.id} />
    </Modal>
  )
}