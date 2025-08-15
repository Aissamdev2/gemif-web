import Modal from "@/app/ui/modal"
import EditMessage from "@/app/ui/edit-message"

export default async function Page({ params }: any) {

  const { id } = await params;

  return (
    <Modal>
      <EditMessage id={id} />
    </Modal>
  )
}