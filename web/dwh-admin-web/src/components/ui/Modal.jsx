import { useEffect, useRef } from 'react'

import useT from '../../hooks/useT'
import Icon from './Icon'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible dialog: labelled by its title, closes on Escape and on a backdrop click (unless dismissible is
 * false), keeps keyboard focus inside while open and gives it back to the opener afterwards.
 */
export default function Modal({ title, onClose, children, footer, size = 'medium', dismissible = true }) {
  const { t } = useT()
  const dialogRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const dialog = dialogRef.current
    const first = dialog && dialog.querySelector(FOCUSABLE)
    if (first) {
      first.focus()
    }

    function onKeyDown(event) {
      if (event.key === 'Escape' && dismissible) {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) {
        return
      }
      const focusable = [...dialog.querySelectorAll(FOCUSABLE)]
      if (focusable.length === 0) {
        return
      }
      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus()
      }
    }
  }, [onClose, dismissible])

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget && dismissible) {
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropMouseDown}>
      <div ref={dialogRef} className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2>{title}</h2>
          {dismissible && (
            <button type="button" className="icon-button" onClick={onClose} aria-label={t('common.actions.close')}>
              <Icon name="close" />
            </button>
          )}
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>
  )
}
