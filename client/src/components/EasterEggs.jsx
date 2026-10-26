export function EasterEggToast({ revelation, onClose }) {
  if (!revelation) {
    return null;
  }

  return (
    <aside
      className="easter-egg-toast"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="easter-egg-toast-mark" aria-hidden="true">
        ✦
      </div>
      <div>
        <p className="easter-egg-toast-kicker">MAISON TRAAC · ATELIER</p>
        <p className="easter-egg-toast-title">{revelation.title}</p>
        <p className="easter-egg-toast-detail">{revelation.detail}</p>
      </div>
      <button
        type="button"
        className="easter-egg-toast-close"
        onClick={onClose}
        aria-label="Fermer le message secret"
      >
        ×
      </button>
    </aside>
  );
}
