import { expectType, expectAssignable } from "tsd";
import { z } from "zod";
import type {
  TuiComponent,
  ComponentMetadata,
  RenderContext,
  RenderResult,
} from "../src/index.js";

// Test that TuiComponent interface is correctly typed
declare const component: TuiComponent<{ name: string }, z.ZodObject<{ name: z.ZodString }>>;

expectType<ComponentMetadata<{ name: string }>>(component.metadata);
expectAssignable<z.ZodType<{ name: string }>>(component.schema);

// Test render method types
declare const context: RenderContext;
expectType<RenderResult>(component.render({ name: "test" }, context));

// Test that getJsonSchema returns an object
expectType<object>(component.getJsonSchema());

// Test RenderContext type
expectType<number>(context.width);
expectType<boolean>(context.isTTY);
expectType<0 | 1 | 2 | 3>(context.colorLevel);

// Test RenderResult type
declare const result: RenderResult;
expectType<string>(result.output);
expectType<number>(result.actualWidth);
expectType<number>(result.lineCount);
