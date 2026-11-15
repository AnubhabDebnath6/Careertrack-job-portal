export function Notice({ type = 'success', children }) {
  if (!children) return null;
  return (
    <div className={`notice ${type}`} role="status">
      {children}
    </div>
  );
}

export function ErrorNotice({ messages }) {
  if (!messages || messages.length === 0) return null;
  return (
    <div className="notice error" role="alert">
      <ul>
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="spinner" role="status">
      <span className="spin" />
      {label}
    </div>
  );
}
