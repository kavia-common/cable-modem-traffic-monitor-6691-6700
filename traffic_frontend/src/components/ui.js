import React from "react";

// PUBLIC_INTERFACE
export function Button({ variant = "primary", size = "md", ...props }) {
  /** Themed button component. */
  const className = [
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    props.className || ""
  ].join(" ");
  return <button {...props} className={className} />;
}

// PUBLIC_INTERFACE
export function Input({ label, ...props }) {
  /** Themed input with label. */
  const id = props.id || `input-${props.name || Math.random().toString(16).slice(2)}`;
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <input {...props} id={id} className={["input", props.className || ""].join(" ")} />
    </label>
  );
}

// PUBLIC_INTERFACE
export function Select({ label, children, ...props }) {
  /** Themed select with label. */
  const id = props.id || `select-${props.name || Math.random().toString(16).slice(2)}`;
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <select {...props} id={id} className={["select", props.className || ""].join(" ")}>
        {children}
      </select>
    </label>
  );
}

// PUBLIC_INTERFACE
export function Card({ title, subtitle, actions, children }) {
  /** Simple card container. */
  return (
    <div className="card">
      {(title || subtitle || actions) ? (
        <div className="card-header">
          <div className="card-titleblock">
            {title ? <h2 className="card-title">{title}</h2> : null}
            {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="card-actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className="card-body">{children}</div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function InlineError({ title = "Error", message }) {
  /** Inline error banner for failed requests. */
  if (!message) return null;
  return (
    <div className="error-banner" role="alert" aria-live="polite">
      <strong className="error-title">{title}:</strong> <span>{message}</span>
    </div>
  );
}

// PUBLIC_INTERFACE
export function LoadingBar({ label = "Loading..." }) {
  /** Minimal loading indicator. */
  return (
    <div className="loading" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span className="loading-text">{label}</span>
    </div>
  );
}
