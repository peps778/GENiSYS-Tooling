import type { Pipeline } from "../types/linuxDocs";

export function buildPipelineCommand(pipeline: Pipeline): string {
  return pipeline.steps.map((step) => `# ${step.title}: ${step.purpose}\n${step.command}`).join("\n\n");
}
