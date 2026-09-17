export default function ConceptCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="nr-card">
      <h2>{title}</h2>
      {description && <p className="nr-muted">{description}</p>}
      {children}
    </section>
  );
}
