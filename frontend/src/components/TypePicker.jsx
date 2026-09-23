import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';

const MOBILE_QUERY = '(max-width: 640px)';

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

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

export default function TypePicker({
  value,
  onChange,
  options,
  title = 'Type de bien',
  creatable = false,          // lets the user name a type that isn't in the list yet
  placeholder = 'Sélectionner…',
  className = 'input-field',
  style,
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  const close = () => { setOpen(false); setQuery(''); };

  // Click outside closes the desktop panel (the sheet has its own backdrop)
  useEffect(() => {
    if (!open || isMobile) return;
    const onDown = e => { if (!rootRef.current?.contains(e.target)) close(); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, isMobile]);

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Keep the page behind the sheet from scrolling under the finger
  useEffect(() => {
    if (!open || !isMobile) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open, isMobile]);

  const current  = options.find(o => o.value === value);
  const typed    = query.trim();
  const filtered = typed ? options.filter(o => norm(o.label).includes(norm(typed))) : options;
  const canCreate = creatable && typed && !options.some(o => norm(o.label) === norm(typed));

  const pick = v => { onChange(v); close(); };

  const onSearchKeyDown = e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();                       // never submit the form from the search box
    if (filtered.length) pick(filtered[0].value);
    else if (canCreate) pick(typed);
  };

  const list = (
    <>
      <div className="picker-search">
        <Search size={15} className="picker-search-icon" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder={creatable ? 'Rechercher ou saisir un nouveau type…' : 'Rechercher…'}
          aria-label={creatable ? 'Rechercher ou ajouter un type' : 'Rechercher un type'}
        />
      </div>
      <div className="picker-list">
        {filtered.map(o => (
          <button
            key={o.value}
            type="button"
            className={`picker-option ${o.value === value ? 'selected' : ''}`}
            onClick={() => pick(o.value)}
          >
            <span>{o.label}</span>
            {o.value === value && <Check size={18} />}
          </button>
        ))}
        {canCreate && (
          <button type="button" className="picker-option picker-option-create" onClick={() => pick(typed)}>
            <Plus size={16} />
            <span>Ajouter « {typed} »</span>
          </button>
        )}
        {!filtered.length && !canCreate && (
          <div className="picker-empty">Aucun type ne correspond.</div>
        )}
      </div>
    </>
  );

  const trigger = (
    <button type="button" className={`${className} picker-trigger`} onClick={() => setOpen(o => !o)}>
      <span className={`picker-trigger-label${current || value ? '' : ' is-placeholder'}`}>
        {current ? current.label : (value || placeholder)}
      </span>
      <ChevronDown size={16} className="picker-trigger-icon" />
    </button>
  );

  if (isMobile) {
    return (
      <>
        <div style={style}>{trigger}</div>
        {/* Portalled to <body>: inside a modal, the overlay's backdrop-filter would
            otherwise become the containing block for this fixed-position sheet. */}
        {open && createPortal(
          <div className="sheet-overlay" onClick={close}>
            <div className="sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label={title}>
              <div className="sheet-grabber" />
              <div className="sheet-header">
                <span className="sheet-title">{title}</span>
                <button type="button" className="sheet-close" onClick={close} aria-label="Fermer">
                  <X size={18} />
                </button>
              </div>
              {list}
            </div>
          </div>,
          document.body,
        )}
      </>
    );
  }

  return (
    <div className="picker" ref={rootRef} style={style}>
      {trigger}
      {open && <div className="picker-panel">{list}</div>}
    </div>
  );
}
