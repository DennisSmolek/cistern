// holds nodes as a part of a stack

import React, {
    createContext,
    useCallback,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useId,
    useContext,
} from 'react';
import {
    TextureNode,
    PerspectiveCamera,
    Scene,
    WebGPURenderer,
    RenderPipeline as ThreePostProcessing,
} from 'three/webgpu';
import { usePostprocessing } from './Postprocessing';
import type { StandardScenePassTextureNodes } from './passes/ScenePass';

// Context
interface PipelineContext {
    register: (pass: Registration) => void;
    unregister: (id: string) => void;
    registeredPasses: Map<string, Registration>;
    rebuild: () => void;
    notify: () => void;
}

const PipelineContext = createContext<PipelineContext | null>(null);

interface PipelineProps {
    children?: React.ReactNode;
    ref?: React.RefObject<PipelineRef>;
    onNewOutput?: () => void;
}

export interface PipelineRef {
    outputNode: Node;
    passes: Map<string, Registration>;
    id: string;
}

export interface BuildPayload {
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGPURenderer;
    postprocessing: ThreePostProcessing;
    scenePass: Pass;
    textureNodes: StandardScenePassTextureNodes;
    lastPass: Pass;
    colorIn: ColorNode;
}
export const Pipeline = ({ ref, children }: PipelineProps) => {
    const id = useId();
    const {
        scenePass,
        sceneTextureNodes,
        scene,
        camera,
        size,
        renderer,
        postprocessing,
        registerPipeline,
        unregisterPipeline,
    } = usePostprocessing();

    // todo: find right types for outputNode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [outputNode, setOutputNode] = useState<any | null>(null);
    //* Node Management ===---
    const registeredPassesRef = useRef<Map<string, Registration>>(new Map());

    //* Ref Value
    const pipelineRef = useMemo(
        () =>
            ({
                outputNode: outputNode,
                passes: registeredPassesRef.current,
                id: id,
            }) as PipelineRef,
        [outputNode, registeredPassesRef.current, id],
    );
    useImperativeHandle(ref, () => pipelineRef as PipelineRef);

    // register the pipeline to the postprocessing context
    useEffect(() => {
        if (!ref) throw new Error('Pipeline ref is not set');
        registerPipeline(pipelineRef);
        return unregisterPipeline(id);
    }, [id]);

    // todo: I don't think this is needed
    const [buildStage, bump] = useState(0);
    const notify = () => bump((x) => x + 1);

    const register = useCallback((r: Registration) => {
        registeredPassesRef.current.set(r.id, r);
        console.log('pipeline: registering pass', r.id);
        notify();
    }, []);
    const unregister = useCallback((id: string) => {
        registeredPassesRef.current.delete(id);
        console.log('unregistering pass', id);
        notify();
    }, []);

    //* Build the Pipeline ===---
    // Compose the chain whenever registrations change or size changes
    const oldBuildStage = useRef(buildStage);
    useLayoutEffect(() => {
        //if (oldBuildStage.current === buildStage) return;
        oldBuildStage.current = buildStage;
        console.log('buildStage changed', buildStage);
        // propagate size to all passes we own
        scenePass.setSize(size.width, size.height);

        // start from the scene pass
        let lastPass: ColorNode = scenePass;

        // apply registered effects in sorted order
        const ordered = Array.from(registeredPassesRef.current.values()).sort(
            (a, b) => a.priority - b.priority,
        );
        for (const reg of ordered) {
            const colorIn = getColorTextureNode(lastPass);
            const currentPass = reg.build({
                scene,
                camera: camera as unknown as PerspectiveCamera,
                renderer,
                postprocessing,
                scenePass,
                colorIn: colorIn,
                textureNodes: sceneTextureNodes,
                lastPass: lastPass,
            } as BuildPayload);
            lastPass = currentPass;
        }
        setOutputNode(lastPass);
        console.log('Set pp output node', lastPass);
        //TODO: because I'm busy at the moment and cant wire this up, we do it direct
        postprocessing.outputNode = lastPass;
    }, [size, scenePass, sceneTextureNodes, buildStage]);

    const contextValue = useMemo(
        () => ({
            registeredPasses: registeredPassesRef.current,

            register,
            unregister,
            rebuild: notify,
            notify,
        }),
        [register, unregister, registeredPassesRef.current, notify],
    );
    return <PipelineContext.Provider value={contextValue}>{children}</PipelineContext.Provider>;
};

const getColorTextureNode = (node: ColorNode): TextureNode => {
    const n = node as unknown as {
        getTextureNode?: () => TextureNode;
    };
    return typeof n?.getTextureNode === 'function'
        ? n.getTextureNode()
        : (node as TextureNode);
};

export const usePipeline = () => {
    const ctx = useContext(PipelineContext);
    if (!ctx) throw new Error('usePipeline must be used within a Pipeline');
    const { registeredPasses, register, unregister, rebuild, notify } = ctx;
    return { registeredPasses, register, unregister, rebuild, notify };
};
