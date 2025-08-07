'use client'


import Modal from "@/app/ui/modal"
import AddFileForm from "@/app/ui/add-file-form"
import { useSearchParams } from "next/navigation";

export default function AddFilePage() {
  const searchParams = useSearchParams();
  const fullPath = decodeURIComponent(searchParams.get("path") || "");

  return (
    <Modal>
      <AddFileForm fullPath={fullPath}  />
    </Modal>
  )
}