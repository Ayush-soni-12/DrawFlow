import { FC, useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface ToastNotificationProps {
  message: string;
  isVisible: boolean;
}

export const ToastNotification: FC<ToastNotificationProps> = ({ message, isVisible }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setMounted(true);
    } else {
      /* Small delay so fade-out animation plays before unmounting */
      const t = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(t);
    }
  }, [isVisible]);

  if (!mounted) return null;

  return (
    <div
      className={`toast-notification ${isVisible ? 'toast-visible' : 'toast-hidden'}`}
      role="status"
      aria-live="polite"
    >
      <Check size={14} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
};
