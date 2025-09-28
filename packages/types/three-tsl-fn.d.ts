import type { ShaderNodeObject } from "three/tsl";
import type { Node, VarNode } from "three/webgpu";

declare global {
    // Fn Arg types
    type FnArg = ShaderNodeObject<Node>;
    type FnVar = ShaderNodeObject<VarNode>;
}

export { };
