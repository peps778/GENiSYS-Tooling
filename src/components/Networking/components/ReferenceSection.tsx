import ConceptCard from './ConceptCard';
import SectionHeader from './SectionHeader';

export default function ReferenceSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      {children}
    </div>
  );
}

export { ConceptCard };
