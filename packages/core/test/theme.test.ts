import { describe, it, expect } from "vitest";
import {
  getThemePreset,
  applySemanticOverrides,
  themePresets,
  defaultTheme,
  type ThemePreset,
  type TuiTheme,
} from "../src/theme.js";

describe("Theme Presets", () => {
  describe("themePresets", () => {
    it("should include all preset themes", () => {
      const presetNames: ThemePreset[] = [
        "default",
        "monokai",
        "solarized-dark",
        "solarized-light",
        "nord",
      ];

      for (const name of presetNames) {
        expect(themePresets[name]).toBeDefined();
        expect(themePresets[name]).toHaveProperty("chromaterm");
        expect(themePresets[name]).toHaveProperty("semantic");
      }
    });

    it("should have default preset equal to defaultTheme", () => {
      expect(themePresets.default).toBe(defaultTheme);
    });

    it("should have valid semantic colors for all presets", () => {
      const presetNames = Object.keys(themePresets) as ThemePreset[];

      for (const name of presetNames) {
        const theme = themePresets[name];
        const semantic = theme.semantic;

        // Check all required semantic colors are present
        expect(semantic).toHaveProperty("primary");
        expect(semantic).toHaveProperty("secondary");
        expect(semantic).toHaveProperty("border");
        expect(semantic).toHaveProperty("header");
        expect(semantic).toHaveProperty("success");
        expect(semantic).toHaveProperty("warning");
        expect(semantic).toHaveProperty("error");
        expect(semantic).toHaveProperty("info");
        expect(semantic).toHaveProperty("added");
        expect(semantic).toHaveProperty("removed");
        expect(semantic).toHaveProperty("modified");
        expect(semantic).toHaveProperty("addedBackground");
        expect(semantic).toHaveProperty("removedBackground");

        // Check that colors are callable functions (ChromatermColor)
        expect(typeof semantic.success).toBe("function");
        expect(typeof semantic.error).toBe("function");
        expect(typeof semantic.warning).toBe("function");
        expect(typeof semantic.info).toBe("function");
      }
    });

    it("should have different theme objects for different presets", () => {
      // Each preset should be a different theme object
      expect(themePresets.default).not.toBe(themePresets.monokai);
      expect(themePresets.monokai).not.toBe(themePresets.nord);

      // In blind mode (test environment), the actual output may be the same
      // because no ANSI codes are added, but the themes are still distinct objects
      expect(themePresets.default.chromaterm).toBeDefined();
      expect(themePresets.monokai.chromaterm).toBeDefined();
    });
  });

  describe("getThemePreset", () => {
    it("should return default theme", () => {
      const theme = getThemePreset("default");
      expect(theme).toBe(defaultTheme);
    });

    it("should return monokai theme", () => {
      const theme = getThemePreset("monokai");
      expect(theme).toBe(themePresets.monokai);
      expect(theme).toHaveProperty("chromaterm");
      expect(theme).toHaveProperty("semantic");
    });

    it("should return solarized-dark theme", () => {
      const theme = getThemePreset("solarized-dark");
      expect(theme).toBe(themePresets["solarized-dark"]);
    });

    it("should return solarized-light theme", () => {
      const theme = getThemePreset("solarized-light");
      expect(theme).toBe(themePresets["solarized-light"]);
    });

    it("should return nord theme", () => {
      const theme = getThemePreset("nord");
      expect(theme).toBe(themePresets.nord);
    });

    it("should return different theme instances", () => {
      const themes = [
        "default",
        "monokai",
        "solarized-dark",
        "solarized-light",
        "nord",
      ] as const;

      // Get all themes
      const themeInstances = themes.map((name) => getThemePreset(name));

      // Each should be a different instance
      const uniqueInstances = new Set(themeInstances);
      expect(uniqueInstances.size).toBe(themes.length);

      // All should have semantic colors defined
      for (const theme of themeInstances) {
        expect(theme.semantic.success).toBeDefined();
        expect(typeof theme.semantic.success).toBe("function");
      }
    });
  });

  describe("applySemanticOverrides", () => {
    it("should return theme unchanged (currently not implemented)", () => {
      const baseTheme = getThemePreset("default");
      const customTheme = applySemanticOverrides(baseTheme, {
        success: "#00FF00",
      });

      // Currently returns the same theme unchanged
      // This is a known limitation until chromaterm provides runtime hex-to-Color conversion
      expect(customTheme).toBe(baseTheme);
    });

    it("should handle empty overrides", () => {
      const baseTheme = getThemePreset("nord");
      const customTheme = applySemanticOverrides(baseTheme, {});

      // Should return the same theme
      expect(customTheme).toBe(baseTheme);
    });

    it("should not mutate the original theme", () => {
      const baseTheme = getThemePreset("default");
      const originalSuccess = baseTheme.semantic.success("test");

      applySemanticOverrides(baseTheme, {
        success: "#00FF00",
      });

      // Original theme should be unchanged
      expect(baseTheme.semantic.success("test")).toBe(originalSuccess);
    });
  });

  describe("Theme Color Functionality", () => {
    it("should work in blind mode (non-TTY)", () => {
      const theme = getThemePreset("monokai");

      const successText = theme.semantic.success("Success!");
      const errorText = theme.semantic.error("Error!");

      // In blind mode (non-TTY/no colors), colors don't add ANSI codes
      // but they still work as pass-through functions
      expect(successText).toBeDefined();
      expect(errorText).toBeDefined();

      // Should contain the original text
      expect(successText).toContain("Success!");
      expect(errorText).toContain("Error!");
    });

    it("should support color chaining", () => {
      const theme = getThemePreset("nord");

      // ChromatermColor supports color transformations
      const darkenedSuccess = theme.semantic.success.darken(0.2);
      expect(typeof darkenedSuccess).toBe("function");

      const output = darkenedSuccess("Darkened");
      expect(output).toBeDefined();
      expect(typeof output).toBe("string");
    });

    it("should support all semantic color types", () => {
      const theme = getThemePreset("solarized-light");
      const testText = "test";

      // Test all semantic colors work
      const outputs = {
        primary: theme.semantic.primary(testText),
        secondary: theme.semantic.secondary(testText),
        border: theme.semantic.border(testText),
        header: theme.semantic.header(testText),
        success: theme.semantic.success(testText),
        warning: theme.semantic.warning(testText),
        error: theme.semantic.error(testText),
        info: theme.semantic.info(testText),
        added: theme.semantic.added(testText),
        removed: theme.semantic.removed(testText),
        modified: theme.semantic.modified(testText),
        addedBackground: theme.semantic.addedBackground(testText),
        removedBackground: theme.semantic.removedBackground(testText),
      };

      // All should produce non-empty strings
      for (const [key, output] of Object.entries(outputs)) {
        expect(output, `${key} should produce output`).toBeDefined();
        expect(typeof output, `${key} should be string`).toBe("string");
        expect(output.length, `${key} should be non-empty`).toBeGreaterThan(0);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid theme switching", () => {
      const presets: ThemePreset[] = [
        "default",
        "monokai",
        "nord",
        "solarized-dark",
      ];

      // Rapidly switch between themes
      for (let i = 0; i < 10; i++) {
        const preset = presets[i % presets.length]!;
        const theme = getThemePreset(preset);
        const output = theme.semantic.success("test");

        expect(output).toBeDefined();
        expect(typeof output).toBe("string");
      }
    });

    it("should handle empty string styling", () => {
      const theme = getThemePreset("monokai");

      const output = theme.semantic.success("");
      expect(output).toBeDefined();
      expect(typeof output).toBe("string");
    });

    it("should handle very long strings", () => {
      const theme = getThemePreset("nord");
      const longString = "x".repeat(10000);

      const output = theme.semantic.success(longString);
      expect(output).toBeDefined();
      expect(output).toContain(longString);
    });

    it("should handle special characters", () => {
      const theme = getThemePreset("solarized-dark");
      const specialChars = "!@#$%^&*()[]{}|\\;:'\",.<>?/`~\n\t";

      const output = theme.semantic.success(specialChars);
      expect(output).toBeDefined();
      expect(output).toContain(specialChars);
    });

    it("should handle Unicode characters", () => {
      const theme = getThemePreset("default");
      const unicode = "Hello 世界 🌍 ∑∫∂";

      const output = theme.semantic.success(unicode);
      expect(output).toBeDefined();
      expect(output).toContain(unicode);
    });
  });

  describe("Type Safety", () => {
    it("should have correct TypeScript types", () => {
      const theme: TuiTheme = getThemePreset("monokai");

      // Type checks (compile-time verification)
      expect(theme.chromaterm).toBeDefined();
      expect(theme.semantic).toBeDefined();

      // Semantic colors should be callable
      const success: string = theme.semantic.success("test");
      const error: string = theme.semantic.error("test");

      expect(typeof success).toBe("string");
      expect(typeof error).toBe("string");
    });

    it("should accept valid preset names", () => {
      const presets: ThemePreset[] = [
        "default",
        "monokai",
        "solarized-dark",
        "solarized-light",
        "nord",
      ];

      for (const preset of presets) {
        const theme = getThemePreset(preset);
        expect(theme).toBeDefined();
      }
    });
  });
});
