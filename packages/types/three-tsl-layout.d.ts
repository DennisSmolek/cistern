// Augment "three/tsl" to match the current (JS) runtime signature for `Fn` that accepts an optional
// `layout` argument.  This silences the "Expected 1 arguments, but got 2" TS errors produced by TSL
// code-generators that emit `Fn( jsFunc, layout )` calls.
//
// NOTE: These overloads purposefully mirror the existing definitions from the upstream `@types/three`
// package and simply add the `layout: Layout` parameter.  They are placed in a separate declaration
// file so that we do not modify `node_modules` directly and can be easily removed once upstream types
// are updated.

import type NodeBuilder from 'three/src/nodes/core/NodeBuilder.js';
import type { Layout, ShaderNodeFn } from 'three/tsl';

// Extend the "three/tsl" module with *additional* overloads that accept an
// optional `layout` argument.  Keeping the original overloads intact ensures
// calls with a single parameter still type-check, while calls that provide a
// layout object gain proper typing.

declare module 'three/tsl' {
    // ────────────────────────────────────────────────────────────────────────────
    // No-arg *existing* overloads (shadowed here to control ordering)
    // ────────────────────────────────────────────────────────────────────────────
    export function Fn(jsFunc: (builder: NodeBuilder) => void): ShaderNodeFn<[]>;
    export function Fn<T extends readonly unknown[]>(
        jsFunc: (args: T, builder: NodeBuilder) => void,
    ): ShaderNodeFn<T>;
    export function Fn<T extends { readonly [key: string]: unknown }>(
        jsFunc: (args: T, builder: NodeBuilder) => void,
    ): ShaderNodeFn<[T]>;

    // ────────────────────────────────────────────────────────────────────────────
    // New overloads that also accept a `layout` object
    // ────────────────────────────────────────────────────────────────────────────
    export function Fn(
        jsFunc: (builder: NodeBuilder) => void,
        layout: Layout,
    ): ShaderNodeFn<[]>;

    export function Fn<T extends readonly unknown[]>(
        jsFunc: (args: T, builder: NodeBuilder) => void,
        layout: Layout,
    ): ShaderNodeFn<T>;

    export function Fn<T extends { readonly [key: string]: unknown }>(
        jsFunc: (args: T, builder: NodeBuilder) => void,
        layout: Layout,
    ): ShaderNodeFn<[T]>;
}
