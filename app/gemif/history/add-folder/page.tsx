'use client'

import Modal from "@/app/ui/modal"
import AddFolderForm from "@/app/ui/add-folder-form"
import { useSearchParams } from "next/navigation";

export default function AddFolderPage() {
  const searchParams = useSearchParams();
  const fullPath = decodeURIComponent(searchParams.get("path") || "");

  return (
    <Modal>
      <AddFolderForm fullPath={fullPath}  />
    </Modal>
  )
}