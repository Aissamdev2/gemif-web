import Modal from "@/app/ui/modal"
import EditMessage from "@/app/ui/edit-message"

export default async function Page({ params }: { params: { id: string } }) {

  return (
    <Modal>
      <EditMessage id={params.id} />
    </Modal>
  )
}