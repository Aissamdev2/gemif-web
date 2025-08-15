import type { FC, ReactNode } from 'react'
import ModalButton from '@/app/ui/modal-button'

interface ModalWindowProps {
  children: ReactNode
  route?: string
  headerHeight?: string
}

const ModalWrapper: FC<ModalWindowProps> = ({ children, route, headerHeight }) => {
  const style = headerHeight
    ? { top: headerHeight, height: `calc(100vh - ${headerHeight})` }
    : { top: 'var(--header-height, 0px)', height: 'calc(100vh - var(--header-height, 0px))' }

  return (
    <div
      className="fixed left-0 right-0 w-screen z-[9999]"
      style={style}
    >
      <ModalButton route={route}>
        {children}
      </ModalButton>
    </div>
  )
}

export default ModalWrapper
