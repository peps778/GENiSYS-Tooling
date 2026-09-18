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
      <div className="nr-card-heading">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="nr-card-body">{children}</div>}
    </section>
  );
}
