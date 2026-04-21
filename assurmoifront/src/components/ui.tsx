import type { PropsWithChildren } from 'react';

export function Button(
  props: PropsWithChildren<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }
  >
) {
  const { variant = 'primary', style, ...rest } = props;
  const base: React.CSSProperties = {
    borderRadius: 10,
    padding: '10px 12px',
    border: '1px solid rgba(255,255,255,0.14)',
    background: variant === 'primary' ? '#4f46e5' : 'transparent',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
  };
  return <button {...rest} style={{ ...base, ...style }} />;
}

export function Card(props: PropsWithChildren<{ title?: string; right?: React.ReactNode }>) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.04)',
        padding: 14,
      }}
    >
      {(props.title || props.right) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700 }}>{props.title}</div>
          <div>{props.right}</div>
        </div>
      )}
      <div style={{ marginTop: props.title || props.right ? 10 : 0 }}>{props.children}</div>
    </div>
  );
}

export function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{props.label}</div>
      <input
        type={props.type || 'text'}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        style={{
          borderRadius: 10,
          padding: '10px 12px',
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(0,0,0,0.25)',
          color: 'white',
          outline: 'none',
        }}
      />
    </label>
  );
}

export function SelectField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{props.label}</div>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        style={{
          borderRadius: 10,
          padding: '10px 12px',
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(0,0,0,0.25)',
          color: 'white',
          outline: 'none',
        }}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CodeBox(props: { value: unknown }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: 12,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.35)',
        overflow: 'auto',
        fontSize: 12,
        lineHeight: 1.35,
        maxHeight: 340,
      }}
    >
      {typeof props.value === 'string' ? props.value : JSON.stringify(props.value, null, 2)}
    </pre>
  );
}

