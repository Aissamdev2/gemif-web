import Modal from "@/app/ui/modal"
import ViewMainPost from "@/app/ui/view-main-post"

export default async function Page({ params }: { params: { id: string, type: string } }) {

  return (
    <Modal>
      <ViewMainPost id={params.id} type={params.type} />
    </Modal>
  )
}