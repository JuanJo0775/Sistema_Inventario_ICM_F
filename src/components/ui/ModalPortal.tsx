import { createPortal } from 'react-dom'
import type { ReactNode, MouseEvent } from 'react'

interface ModalPortalProps {
  children: ReactNode
  onClose?: () => void
}

export function ModalPortal({ children, onClose }: ModalPortalProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e: MouseEvent) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      {children}
    </div>,
    document.body,
  )
}
