import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';

const MOBILE_QUERY = '(max-width: 640px)';

// Phones get a bottom sheet instead of the OS dropdown: the native picker truncates
// long labels and hides how many types there are, and this list is now long.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = e => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

export default function TypePicker({ value, onChange, options, title = 'Type de bien', className = 'input-field', style }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Keep the page behind the sheet from scrolling under the finger
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!isMobile) {
    return (
      <select className={className} style={style} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  const current = options.find(o => o.value === value);

  return (
    <>
      <button
        type="button"
        className={`${className} picker-trigger`}
        style={style}
        onClick={() => setOpen(true)}
      >
        <span className="picker-trigger-label">{current ? current.label : options[0]?.label}</span>
        <ChevronDown size={16} className="picker-trigger-icon" />
      </button>

      {/* Portalled to <body>: inside a modal, the overlay's backdrop-filter would
          otherwise become the containing block for this fixed-position sheet. */}
      {open && createPortal(
        <div className="sheet-overlay" onClick={() => setOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label={title}>
            <div className="sheet-grabber" />
            <div className="sheet-header">
              <span className="sheet-title">{title}</span>
              <button type="button" className="sheet-close" onClick={() => setOpen(false)} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            <div className="sheet-list">
              {options.map(o => (
                <button
                  key={o.value}
                  type="button"
                  className={`sheet-option ${o.value === value ? 'selected' : ''}`}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                >
                  <span>{o.label}</span>
                  {o.value === value && <Check size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
