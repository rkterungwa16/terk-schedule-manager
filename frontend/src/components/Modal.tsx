import type { ReactNode } from "react";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ onClose, children }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      {/* stopPropagation so clicking inside the dialog doesn't bubble up
          to the overlay's onClose handler */}
      <div
        className="modal-content"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
}
