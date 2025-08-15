import EditMainPostServer from "@/app/ui/main/edit-main-post/edit-main-post-server"


export default async function Page({ params }: any) {

  const { id } = await params;

  return (
    <EditMainPostServer id={id} />
  )
}