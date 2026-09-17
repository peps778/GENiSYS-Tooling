import ConceptCard from './ConceptCard';
import { workflows } from '../data/workflows';
export default function ReconWorkflow() {
  return (
    <div className="nr-workflow-grid">
      {workflows.map((w) => (
        <ConceptCard key={w.title} title={w.title}>
          <ol>
            {w.steps.map((s) => (
              <li key={s}>
                <code>{s}</code>
              </li>
            ))}
          </ol>
        </ConceptCard>
      ))}
    </div>
  );
}
