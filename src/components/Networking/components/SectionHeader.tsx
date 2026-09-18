export default function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="nr-content-heading">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <div>{description}</div>
    </header>
  );
}
