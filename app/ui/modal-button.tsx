'use client'

import type { FC, MouseEvent, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface ModalButtonProps {
  route?: string
  children: ReactNode
}

/**
 * Full-screen clickable backdrop that closes the modal when clicked.
 * Also renders modal content and ignores clicks inside it.
 */
const ModalButton: FC<ModalButtonProps> = ({ route, children }) => {
  const router = useRouter()

  const handleClose = () => {
    console.log('Backdrop clicked')
    if (route) {
      router.push(route)
    } else {
      router.back()
    }
  }

  const handleContentClick = (e: MouseEvent) => {
    e.stopPropagation() // clicks inside modal content won't close it
  }

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center p-4"
    >
      {/* backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-[2px] bg-[#0000002f]"
        onClick={handleClose}
      />

      {/* modal content */}
      <div
        className="relative z-20 pointer-events-auto mx-auto w-[90%] md:w-[70%] lg:w-[60%] max-w-3xl"
        onClick={handleContentClick}
      >
        {children}
      </div>
    </div>
  )
}

export default ModalButton