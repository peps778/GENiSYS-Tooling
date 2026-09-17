import ConceptCard from './ConceptCard';
import ReferenceList from './ReferenceList';
import { curlCommands } from '../data/curl';
export default function CurlReference() {
  return (
    <ConceptCard
      title="curl Inspection Reference"
      description="Use curl to inspect headers, status, redirects, cookies, request bodies, and verbose transport details."
    >
      <ReferenceList items={curlCommands} />
    </ConceptCard>
  );
}
