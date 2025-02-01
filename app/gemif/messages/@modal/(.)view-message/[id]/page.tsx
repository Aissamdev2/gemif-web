import Modal from "@/app/ui/modal"
import AddMessageForm from "@/app/ui/add-message-form"
import { Suspense } from "react"
import ViewMessage from "@/app/ui/view-message"

export default async function Page({ params }: { params: { id: string } }) {

  return (
    <Modal>
      <ViewMessage id={params.id} />
    </Modal>
  )
}