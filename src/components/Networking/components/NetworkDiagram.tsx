export default function NetworkDiagram({ lines }: { lines: string[] }) {
  return <pre className="nr-diagram">{lines.join('\n')}</pre>;
}
