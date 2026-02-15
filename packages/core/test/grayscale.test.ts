import { describe, it, expect } from "vitest";
import {
  GRAYSCALE_CHARS,
  createGrayscaleStyleFunctions,
  getShadeForValue,
} from "../src/grayscale.js";

describe("GRAYSCALE_CHARS", () => {
  it("should have correct Unicode shade characters", () => {
    expect(GRAYSCALE_CHARS.light).toBe("░");
    expect(GRAYSCALE_CHARS.medium).toBe("▒");
    expect(GRAYSCALE_CHARS.dark).toBe("▓");
    expect(GRAYSCALE_CHARS.solid).toBe("█");
  });
});

describe("createGrayscaleStyleFunctions", () => {
  const style = createGrayscaleStyleFunctions();

  it("should return text unchanged for primary", () => {
    expect(style.primary("hello")).toBe("hello");
  });

  it("should wrap text with light shades for secondary", () => {
    expect(style.secondary("text")).toBe("░text░");
  });

  it("should return empty string for empty secondary input", () => {
    expect(style.secondary("")).toBe("");
  });

  it("should prefix with solid block for header", () => {
    expect(style.header("Title")).toBe("█ Title");
  });

  it("should return empty string for empty header input", () => {
    expect(style.header("")).toBe("");
  });

  it("should return text unchanged for border", () => {
    expect(style.border("│")).toBe("│");
  });

  it("should wrap with dark shades for success", () => {
    expect(style.success("done")).toBe("▓done▓");
  });

  it("should wrap with medium shades for warning", () => {
    expect(style.warning("warn")).toBe("▒warn▒");
  });

  it("should wrap with solid blocks for error", () => {
    expect(style.error("fail")).toBe("█fail█");
  });

  it("should wrap with light shades for info", () => {
    expect(style.info("note")).toBe("░note░");
  });
});

describe("getShadeForValue", () => {
  it("should return light shade for values < 0.25", () => {
    expect(getShadeForValue(0)).toBe("░");
    expect(getShadeForValue(0.1)).toBe("░");
    expect(getShadeForValue(0.24)).toBe("░");
  });

  it("should return medium shade for values 0.25-0.5", () => {
    expect(getShadeForValue(0.25)).toBe("▒");
    expect(getShadeForValue(0.35)).toBe("▒");
    expect(getShadeForValue(0.49)).toBe("▒");
  });

  it("should return dark shade for values 0.5-0.75", () => {
    expect(getShadeForValue(0.5)).toBe("▓");
    expect(getShadeForValue(0.6)).toBe("▓");
    expect(getShadeForValue(0.74)).toBe("▓");
  });

  it("should return solid shade for values >= 0.75", () => {
    expect(getShadeForValue(0.75)).toBe("█");
    expect(getShadeForValue(0.9)).toBe("█");
    expect(getShadeForValue(1)).toBe("█");
  });
});
