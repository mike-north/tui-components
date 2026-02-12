import { describe, it, expect } from "vitest";
import { createChart } from "../src/chart.js";

describe("scatter chart", () => {
  const chart = createChart();

  it("renders scatter chart in markdown mode", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [
          {
            name: "Data",
            data: [
              { x: 10, y: 20 },
              { x: 50, y: 50 },
            ],
          },
        ],
        height: 6,
        width: 25,
      },
      { renderMode: "markdown" }
    );
    expect(result.output).toContain("│");
    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("renders scatter chart in ansi mode", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [
          {
            name: "Data",
            data: [
              { x: 10, y: 20 },
              { x: 50, y: 50 },
            ],
          },
        ],
        height: 6,
        width: 25,
      },
      { renderMode: "ansi" }
    );
    expect(result.output).toContain("│");
  });
});

describe("pie chart", () => {
  const chart = createChart();

  it("renders pie chart in markdown mode", () => {
    const result = chart.render(
      {
        type: "pie",
        series: [
          {
            name: "Revenue",
            data: [
              { label: "Sales", x: "Sales", y: 45 },
              { label: "Support", x: "Support", y: 30 },
            ],
          },
        ],
        height: 8,
        width: 25,
      },
      { renderMode: "markdown" }
    );
    expect(result.output).toContain("Sales");
    expect(result.output).toContain("%");
  });

  it("renders donut chart with center label", () => {
    const result = chart.render(
      {
        type: "donut",
        series: [
          {
            name: "Share",
            data: [
              { label: "A", x: "A", y: 60 },
              { label: "B", x: "B", y: 40 },
            ],
          },
        ],
        height: 8,
        width: 25,
        centerLabel: "100%",
        innerRadius: 0.5,
      },
      { renderMode: "markdown" }
    );
    expect(result.output).toContain("A");
    expect(result.output).toContain("B");
  });
});

describe("heatmap chart", () => {
  const chart = createChart();

  it("renders heatmap chart with blocks style", () => {
    const result = chart.render(
      {
        type: "heatmap",
        series: [
          {
            name: "Activity",
            data: [
              { x: "Mon", y: 10, label: "9am" },
              { x: "Tue", y: 90, label: "9am" },
              { x: "Mon", y: 50, label: "10am" },
              { x: "Tue", y: 70, label: "10am" },
            ],
          },
        ],
        height: 6,
        width: 20,
        heatmapStyle: "blocks",
      },
      { renderMode: "markdown" }
    );
    expect(result.output).toContain("Mon");
    expect(result.output).toContain("Tue");
    expect(result.output).toContain("9am");
    expect(result.output).toContain("10am");
  });

  it("renders heatmap chart with ascii style", () => {
    const result = chart.render(
      {
        type: "heatmap",
        series: [
          {
            name: "Activity",
            data: [
              { x: "A", y: 10, label: "X" },
              { x: "B", y: 90, label: "X" },
            ],
          },
        ],
        height: 4,
        width: 15,
        heatmapStyle: "ascii",
      },
      { renderMode: "markdown" }
    );
    expect(result.output).toContain("A");
    expect(result.output).toContain("B");
  });
});
