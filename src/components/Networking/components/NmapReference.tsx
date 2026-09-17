import ConceptCard from './ConceptCard';
import ReferenceList from './ReferenceList';
import { nmapCommands } from '../data/nmap';
export default function NmapReference() {
  return (
    <ConceptCard
      title="Nmap Reference"
      description="Only scan systems you own or are explicitly authorized to test."
    >
      <ReferenceList items={nmapCommands} />
      <p className="nr-muted">
        Workflow: host discovery → port scan → service detection → version
        identification → focused enumeration.
      </p>
    </ConceptCard>
  );
}
