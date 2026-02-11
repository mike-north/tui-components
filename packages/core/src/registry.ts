import type { TuiComponent } from "./component.js";
import type { ZodType, ZodTypeDef } from "zod";

/**
 * Summary information about a registered component.
 */
export interface ComponentInfo {
  name: string;
  description: string;
  version: string;
}

/**
 * A registered component with unknown input type.
 * Used internally by the registry.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = TuiComponent<any, ZodType<any, ZodTypeDef, any>>;

/**
 * Global registry for TUI components.
 * Enables CLI discovery and dynamic component lookup.
 */
export class ComponentRegistry {
  private components = new Map<string, AnyComponent>();

  /**
   * Register a component by invoking its factory function.
   * @param factory - Factory function that creates the component
   * @returns The created component instance
   */
  register<TInput, TSchema extends ZodType<TInput, ZodTypeDef, unknown>>(
    factory: () => TuiComponent<TInput, TSchema>
  ): TuiComponent<TInput, TSchema> {
    const component = factory();
    const name = component.metadata.name;

    if (this.components.has(name)) {
      throw new Error(`Component "${name}" is already registered`);
    }

    this.components.set(name, component as AnyComponent);
    return component;
  }

  /**
   * Get a component by name.
   * @param name - Component name
   * @returns The component or undefined if not found
   */
  get(name: string): AnyComponent | undefined {
    return this.components.get(name);
  }

  /**
   * Check if a component is registered.
   * @param name - Component name
   */
  has(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * List all registered components.
   * @returns Array of component info objects
   */
  list(): ComponentInfo[] {
    return Array.from(this.components.values()).map((c) => ({
      name: c.metadata.name,
      description: c.metadata.description,
      version: c.metadata.version,
    }));
  }

  /**
   * Get all registered component names.
   */
  names(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Clear all registered components.
   * Primarily useful for testing.
   */
  clear(): void {
    this.components.clear();
  }
}

/**
 * Global component registry instance.
 * Components register themselves here on import.
 */
export const registry = new ComponentRegistry();
