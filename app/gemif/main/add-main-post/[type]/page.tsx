import Modal from "@/app/ui/modal"
import AddMainPostForm from "@/app/ui/add-main-post-form"

export default async function Page({ params }: { params: { type: string } }) {

  return (
    <Modal>
      <AddMainPostForm type={params.type}/>
    </Modal>
  )
}