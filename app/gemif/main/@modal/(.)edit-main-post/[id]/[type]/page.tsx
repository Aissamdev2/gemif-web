import Modal from "@/app/ui/modal"
import { Suspense } from "react"
import EditMainPost from "@/app/ui/edit-main-post"

export default async function Page({ params }: { params: { id: string, type: string } }) {

  return (
    <Modal>
      <EditMainPost id={params.id} type={params.type} />
    </Modal>
  )
}