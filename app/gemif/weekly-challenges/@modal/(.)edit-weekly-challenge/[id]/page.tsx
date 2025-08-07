import Modal from "@/app/ui/modal"
import EditWeeklyChallenge from "@/app/ui/edit-weekly-challenge"

export default async function Page({ params }: { params: { id: string } }) {

  return (
    <Modal>
      <EditWeeklyChallenge id={params.id} />
    </Modal>
  )
}