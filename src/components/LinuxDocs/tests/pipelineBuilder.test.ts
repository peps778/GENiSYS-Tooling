import { describe, expect, it } from "vitest";
import { pipelines } from "../data/pipelines";
import { buildPipelineCommand } from "../lib/pipelineBuilder";

describe("pipeline builder", () => {
  it("preserves every pipeline step in order", () => {
    const pipeline = pipelines.find((item) => item.id === "binary-triage")!;
    const output = buildPipelineCommand(pipeline);
    expect(output.indexOf("# Type:")).toBeGreaterThanOrEqual(0);
    expect(output.indexOf("# Magic bytes:")).toBeGreaterThan(output.indexOf("# Type:"));
    expect(output).toContain("sha256sum artifact.bin");
  });
});
