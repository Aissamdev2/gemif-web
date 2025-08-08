'use client'

import Modal from "@/app/ui/modal"
import AddFileForm from "@/app/ui/add-file-form"
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AddFile() {
  const searchParams = useSearchParams();
  const fullPath = decodeURIComponent(searchParams.get("path") || "");

  return (
    <Modal>
      <AddFileForm fullPath={fullPath}  />
    </Modal>
  )
}


export default function AddFilePage() {

  return (
    <Modal>
      <Suspense>
        <AddFile />
      </Suspense>
    </Modal>
  )
}