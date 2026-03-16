import React from "react";

/**
 * Renders a URL-aware link. If the value looks like a URL, it renders as a clickable hyperlink.
 * Otherwise renders plain text.
 */
export function LinkText({ value, children, style }: { value: string; children?: React.ReactNode; style?: React.CSSProperties }) {
  if (!value) return <>{children || null}</>;
  const isUrl = /^https?:\/\//i.test(value) || /^www\./i.test(value);
  const href = value.startsWith("www.") ? `https://${value}` : value;
  const content = children || value;

  if (isUrl) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#4F46E5", textDecoration: "underline", ...style }}
      >
        {content}
      </a>
    );
  }
  return <span style={style}>{content}</span>;
}

/**
 * Build contact elements with auto-hyperlinking for URLs
 */
export function ContactLine({ items, separator = " · ", style }: { items: string[]; separator?: string; style?: React.CSSProperties }) {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return null;

  return (
    <span style={style}>
      {filtered.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && separator}
          <LinkText value={item} />
        </React.Fragment>
      ))}
    </span>
  );
}
