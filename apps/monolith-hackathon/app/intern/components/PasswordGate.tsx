// app/intern/components/PasswordGate.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function PasswordGate() {
  const { login } = useAuth();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    const success = await login(input);

    if (!success) {
      setError(true);
      setInput('');
    }

    setIsLoading(false);
  };

  return (
    <div className="intern-gate">
      <div className="intern-gate-container">
        <h1 className="intern-gate-title">ACCESS REQUIRED</h1>
        <p className="intern-gate-desc">
          Enter your access code to continue.
        </p>
        <form onSubmit={handleSubmit} className="intern-gate-form">
          <input
            type="password"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Enter access code"
            className={`intern-gate-input ${error ? 'intern-gate-input--error' : ''}`}
            autoFocus
            disabled={isLoading}
          />
          <button
            type="submit"
            className="intern-gate-btn"
            disabled={isLoading}
          >
            {isLoading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>
        {error && <p className="intern-gate-error">ACCESS DENIED</p>}
      </div>
    </div>
  );
}
