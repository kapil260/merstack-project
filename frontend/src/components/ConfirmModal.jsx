// "Are you sure?" popup used before deleting anything
const ConfirmModal = ({ title, message, confirmText = "Delete", onConfirm, onCancel, busy }) => (
  <div className="modal-backdrop" onClick={onCancel}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="modal-actions">
        <button className="btn btn-light" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? "Please wait..." : confirmText}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
