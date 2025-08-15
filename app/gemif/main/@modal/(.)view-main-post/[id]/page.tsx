import ViewMainPostServer from "@/app/ui/main/view-main-post/view-main-post-server"


export default async function Page({ params }: any) {

  const { id } = await params;

  return (
    <ViewMainPostServer id={id} />
  )
}