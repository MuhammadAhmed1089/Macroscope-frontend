import { useEffect, useState } from "react";

export default function Toast({ status, loading }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (status.type === "idle" && !loading) return;
    if (!status.message) return;

    const id = Date.now();
    setToasts(t => [...t, { id, type: status.type, message: status.message }]);

    const timer = setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
    }, 4000);

    return () => clearTimeout(timer);
  }, [status.message, status.type]);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "●"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
