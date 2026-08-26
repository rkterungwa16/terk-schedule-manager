import type { ReactNode } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ onClose, children }: ModalProps) {
  // `true` unconditionally — Modal is only ever mounted while open (the
  // caller renders it via `{isAddingEvent && <Modal>...}`), so there's no
  // separate "open" state to track here; the trap is active for exactly
  // as long as this component exists.
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      {/* stopPropagation so clicking inside the dialog doesn't bubble up
          to the overlay's onClose handler */}
      <div
        ref={dialogRef}
        className="modal-content"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
