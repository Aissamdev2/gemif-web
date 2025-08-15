import Modal from "@/app/ui/modal"
import ViewMessage from "@/app/ui/view-message"

export default async function Page({ params }: any) {

  const { id } = await params;

  return (
    <Modal>
      <ViewMessage id={id} />
    </Modal>
  )
}