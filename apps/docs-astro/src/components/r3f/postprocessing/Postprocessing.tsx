import { useFrame } from '@react-three/fiber';
import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useCallback,
    useRef,
    useEffect,
    useLayoutEffect,
} from 'react';
import { useThree } from '@react-three/fiber';
import {
    WebGPURenderer,
    Scene,
    PerspectiveCamera,
    PostProcessing as ThreePostProcessing,
    PassNode,
} from 'three/webgpu';
import {
    ScenePass,
    type StandardScenePassTextureNodes,
    generateScenePass,
} from './passes/ScenePass';
import { Pipeline, type PipelineRef } from './Pipeline';

type Pass = PassNode;

//* Postprocessing Context ==============================

// Define the shape of the context value
// If you have a global type for postprocessing, use it here. Otherwise, define locally.
interface PostprocessingContextValue {
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGPURenderer;
    postprocessing: ThreePostProcessing;
    pipelines: PipelineRef[];
    size: { width: number; height: number };

    scenePass: Pass;
    sceneTextureNodes: StandardScenePassTextureNodes;
    //methods
    registerPipeline: (r: PipelineRef) => void;
    unregisterPipeline: (id: string) => void;
    notify: () => void;
    rebuild: () => void;
}

// Create the context with an undefined default value
const PostprocessingContext = createContext<PostprocessingContextValue | undefined>(undefined);
export const PostprocessingProvider = PostprocessingContext.Provider;

interface PostprocessingProps {
    children: React.ReactNode;
}
export const PostProcessing = ({ children }: PostprocessingProps) => {
    const { gl, scene, camera, size } = useThree();
    const renderer = useMemo(() => gl as unknown as WebGPURenderer, [gl]);
    const postprocessing = useMemo(() => new ThreePostProcessing(renderer), [renderer]);

    /* Setup a Root Pass, most will use this one by default */
    /*
    I fully plan on this having registration and conditional setting of what mrt etc
    */
    const { scenePass, sceneTextureNodes } = useMemo(
        () => generateScenePass(scene, camera as unknown as PerspectiveCamera),
        [scene, camera],
    );

    //* Pipeline Management ===---
    const pipelinesRef = useRef<PipelineRef[]>([]);
    const defaultPipelineRef = useRef<PipelineRef | null>(null);

    const [, bump] = useState(0);
    const notify = () => bump((x) => x + 1);

    const registerPipeline = useCallback((r: PipelineRef) => {
        pipelinesRef.current.push(r);
        notify();
    }, []);
    const unregisterPipeline = useCallback((id: string) => {
        pipelinesRef.current = pipelinesRef.current.filter((p) => p.id !== id);
        notify();
    }, []);

    const rebuild = useCallback(() => {
        console.log('rebuild when the piplelines are figured out');
    }, []);

    // We take over the render loop
    useFrame(() => {
        postprocessing.render();
    }, 1);

    const contextValue: PostprocessingContextValue = {
        scene,
        camera: camera as unknown as PerspectiveCamera,
        renderer,
        size,
        postprocessing,
        scenePass,
        sceneTextureNodes,
        pipelines: pipelinesRef.current,
        registerPipeline,
        unregisterPipeline,
        notify,
        rebuild,
    };

    // we return dynamic based on if the children have a pipeline or scenePass
    const { hasPipeline, hasScenePass } = hasPipelineOrScenePass(children);
    if (hasScenePass) {
        // todo: setup to use their scenePass with this and not the root?
        console.log('hasScenePass');
    }

    return (
        <PostprocessingProvider value={contextValue}>
            {!hasPipeline ? (
                <Pipeline ref={defaultPipelineRef as React.RefObject<PipelineRef>}>
                    {children}
                </Pipeline>
            ) : (
                children
            )}
        </PostprocessingProvider>
    );
};

/**
 * usePostprocessing
 * Returns the current Postprocessing context value.
 * Throws an error if used outside of a PostprocessingProvider.
 */
export function usePostprocessing(): PostprocessingContextValue {
    const context = useContext(PostprocessingContext);
    if (!context) {
        throw new Error('usePostprocessing must be used within a PostprocessingProvider');
    }
    return context;
}

// function to check if there are pipelines or scenePasses in the children

function hasPipelineOrScenePass(children: React.ReactNode): {
    hasPipeline: boolean;
    hasScenePass: boolean;
} {
    let hasPipeline = false;
    let hasScenePass = false;
    React.Children.toArray(children).forEach((child) => {
        if (!React.isValidElement(child)) return;
        if (child.type === Pipeline) hasPipeline = true;
        if (child.type === ScenePass) hasScenePass = true;
    });
    return { hasPipeline, hasScenePass };
}
