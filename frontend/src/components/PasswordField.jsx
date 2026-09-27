import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Password input with a show/hide toggle — useful on a phone, where a mistyped
 * password is otherwise invisible and the only feedback is a failed login.
 */
export default function PasswordField({ className = 'input-field', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} className={className} />
      <button
        type="button"                                  // never submits the form
        className="password-toggle"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        title={visible ? 'Masquer' : 'Afficher'}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
