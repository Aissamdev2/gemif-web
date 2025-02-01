import Modal from "@/app/ui/modal"
import ViewMessage from "@/app/ui/view-message"

export default async function Page({ params }: { params: { id: string } }) {

  return (
    <Modal>
      <ViewMessage id={params.id} />
    </Modal>
  )
}