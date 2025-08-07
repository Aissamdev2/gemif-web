'use client'

import { X } from 'lucide-react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

type Position = 'right' | 'bottom' | 'left' | 'top'

export default function MiniModal({
  trigger = '?',
  children,
  position = 'top',
}: {
  trigger?: string
  children: React.ReactNode
  position?: Position
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; maxWidth: number; maxHeight: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const latestCoordsRef = useRef<{ top: number; left: number; maxWidth: number; maxHeight: number } | null>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)

  const SPACING = 6
  const FALLBACK_MODAL_WIDTH = 288
  const FALLBACK_MODAL_HEIGHT = 200
  const MAX_ALLOWED_WIDTH = 400
  const MAX_ALLOWED_HEIGHT = 500

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let actualModalWidth = modalContentRef.current?.offsetWidth || FALLBACK_MODAL_WIDTH
    let actualModalHeight = modalContentRef.current?.offsetHeight || FALLBACK_MODAL_HEIGHT

    actualModalWidth = Math.min(actualModalWidth, MAX_ALLOWED_WIDTH)
    actualModalHeight = Math.min(actualModalHeight, MAX_ALLOWED_HEIGHT)

    let newTop = 0
    let newLeft = 0
    let newMaxWidth = actualModalWidth
    let newMaxHeight = actualModalHeight

    switch (position) {
      case 'bottom':
        newTop = rect.bottom + SPACING
        newLeft = rect.left
        break
      case 'top':
        newTop = rect.top - actualModalHeight - SPACING
        newLeft = rect.left
        break
      case 'right':
        newTop = rect.top
        newLeft = rect.right + SPACING
        break
      case 'left':
        newTop = rect.top
        newLeft = rect.left - actualModalWidth - SPACING
        break
    }

    if (newLeft < 0) newLeft = 10
    if (newLeft + actualModalWidth > viewportWidth) {
      newLeft = viewportWidth - actualModalWidth - 10
      if (newLeft < 10) newLeft = 10
    }

    if (newTop < 0) newTop = 10
    if (newTop + actualModalHeight > viewportHeight) {
      newTop = viewportHeight - actualModalHeight - 10
      if (newTop < 10) newTop = 10
    }

    const current = latestCoordsRef.current
    if (
      !current ||
      current.top !== newTop ||
      current.left !== newLeft ||
      current.maxWidth !== newMaxWidth ||
      current.maxHeight !== newMaxHeight
    ) {
      const newCoords = { top: newTop, left: newLeft, maxWidth: newMaxWidth, maxHeight: newMaxHeight }
      setCoords(newCoords)
      latestCoordsRef.current = newCoords
    }
  }, [position])

  useLayoutEffect(() => {
    if (open) {
      calculatePosition()
      window.addEventListener('resize', calculatePosition)
    } else {
      setCoords(null)
      latestCoordsRef.current = null
      window.removeEventListener('resize', calculatePosition)
    }

    return () => {
      window.removeEventListener('resize', calculatePosition)
    }
  }, [open, calculatePosition])

  const close = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen(true)}
        className={clsx(
          "ml-2 text-xs w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 transition",
          open ? "pointer-events-none" : "hover:bg-blue-200"
        )}
        title="Ayuda"
      >
        {trigger}
      </button>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100] cursor-default"
              onClick={close}
            />
            <div
              ref={modalContentRef}
              className="fixed z-[101] w-[calc(100vw-2rem)] sm:w-fit max-w-[400px] max-h-[500px] overflow-auto p-4 bg-white border border-gray-300 rounded-lg shadow-lg text-sm text-gray-800"
              style={coords ? {
                top: coords.top,
                left: coords.left,
                maxWidth: coords.maxWidth,
                maxHeight: coords.maxHeight,
              } : {}}
            >
              <div className="flex justify-between items-start mb-2">
                <strong className="text-sm font-medium text-gray-700">Info</strong>
                <button onClick={close} className="text-gray-500 hover:text-gray-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm overflow-auto">{children}</div>
            </div>
          </>,
          document.body
        )}
    </>
  )
}
