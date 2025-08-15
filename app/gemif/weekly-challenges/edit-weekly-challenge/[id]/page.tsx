import Modal from "@/app/ui/modal"
import EditWeeklyChallenge from "@/app/ui/edit-weekly-challenge"

export default async function Page({ params }: any) {

  const { id } = await params;

  return (
    <Modal>
      <EditWeeklyChallenge id={id} />
    </Modal>
  )
}