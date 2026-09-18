export type DiagramNode = { title: string; subtitle: string };

export default function NetworkDiagram({ nodes }: { nodes: DiagramNode[] }) {
  return (
    <div
      className="nr-flow"
      role="img"
      aria-label={nodes.map((node) => node.title).join(' to ')}
    >
      {nodes.map((node, index) => (
        <div className="nr-flow-part" key={`${node.title}-${index}`}>
          <div className="nr-flow-node">
            <strong>{node.title}</strong>
            <span>{node.subtitle}</span>
          </div>
          {index < nodes.length - 1 && (
            <span className="nr-flow-arrow" aria-hidden="true">
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
