'use client'

import Modal from "@/app/ui/modal"
import AddFolderForm from "@/app/ui/add-folder-form"
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AddFolder() {
  const searchParams = useSearchParams();
  const fullPath = decodeURIComponent(searchParams.get("path") || "");

  return (
    <Modal>
      <AddFolderForm fullPath={fullPath}  />
    </Modal>
  )
}


export default function AddFolderPage() {

  return (
    <Modal>
      <Suspense>
        <AddFolder />
      </Suspense>
    </Modal>
  )
}