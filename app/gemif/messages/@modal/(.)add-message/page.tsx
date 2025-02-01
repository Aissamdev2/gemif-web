import Modal from "@/app/ui/modal"
import AddMessageForm from "@/app/ui/add-message-form"
import { Suspense } from "react"

export default async function Page() {

  return (
    <Modal>
      <AddMessageForm />
    </Modal>
  )
}