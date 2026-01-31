'use client';

import { useState, useCallback, useEffect } from 'react';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

export function ErrorToast({ message, onClose }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <div className="bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <span>⚠️</span>
        <span className="text-sm">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white/80 hover:text-white"
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function useErrorToast() {
  const [error, setError] = useState<string | null>(null);

  const showError = useCallback((message: string) => {
    setError(message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const ErrorComponent = error ? (
    <ErrorToast message={error} onClose={clearError} />
  ) : null;

  return { showError, clearError, ErrorComponent };
}
