/**
 * Renders CMS section body as either safe HTML (legacy) or plaintext
 * paragraphs (preferred for steward editors).
 */
export function CmsText({
  content,
  className,
  as: Tag = "div",
}: {
  content: string;
  className?: string;
  as?: "div" | "p" | "blockquote" | "span";
}) {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(trimmed);

  if (looksLikeHtml) {
    return (
      <Tag
        className={className}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  const paragraphs = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  if (Tag === "blockquote" || Tag === "span" || Tag === "p") {
    return <Tag className={className}>{trimmed}</Tag>;
  }

  if (paragraphs.length <= 1) {
    return (
      <Tag className={className}>
        <p className="whitespace-pre-wrap">{trimmed}</p>
      </Tag>
    );
  }

  return (
    <Tag className={className}>
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-wrap">
                  {p}
                </p>
              ))}
    </Tag>
  );
}
