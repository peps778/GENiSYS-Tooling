export default function WorkflowDiagram({
  steps,
}: {
  steps: string[];
}) {
  return (
    <div className="nr-workflow-sequence">
      {steps.map((step, index) => (
        <div className="nr-workflow-step" key={step}>
          <span className="nr-workflow-index">{String(index + 1).padStart(2, '0')}</span>
          <span>{step}</span>
          {index < steps.length - 1 && <span className="nr-workflow-chevron" aria-hidden="true">↓</span>}
        </div>
      ))}
    </div>
  );
}
