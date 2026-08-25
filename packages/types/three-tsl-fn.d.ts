import type { Node, VarNode } from "three/webgpu";

declare global {
    // Fn Arg types (three >=0.185 node types carry TSL operators directly;
    // the old ShaderNodeObject wrapper no longer exists)
    type FnArg = Node;
    type FnVar = VarNode;
}

export { };
