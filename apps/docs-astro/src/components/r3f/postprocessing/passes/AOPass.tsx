import { useEffect, useId, useRef, useCallback } from 'react';
import { usePostprocessing } from '../Postprocessing';
import GTAONode, { ao } from 'three/addons/tsl/display/GTAONode.js';
import type { TextureNode } from 'three/webgpu';
import type { ShaderNodeObject, mul } from 'three/tsl';
import { updatePass } from './passUtils';
import { usePipeline } from '../Pipeline';

type AOProps = {
    radius?: number;
    scale?: number;
    thickness?: number;
    distanceExponent?: number;
    distanceFalloff?: number;
    priority?: number;
};

// AOBuildProps removed; we use PipelineContext directly via BuildFn

export function AOPass({
    radius = 0.5,
    scale = 1.0,
    thickness = 1.0,
    distanceExponent = 1.0,
    distanceFalloff = 1.0,
    priority = 10,
}: AOProps) {
    const { register, unregister } = usePipeline();
    const id = useId();
    const passRef = useRef<ShaderNodeObject<GTAONode> | null>(null);

    //* Update Pass
    const update = useCallback(() => {
        if (!passRef.current) return;
        updatePass(passRef, {
            radius,
            scale,
            thickness,
            distanceExponent,
            distanceFalloff,
        });
    }, [radius, scale, thickness, distanceExponent, distanceFalloff]);

    // Node Builder
    // todo: move this to a util?
    //@ts-expect-error kdjfnb
    const build: BuildFn<typeof mul> = useCallback(
        ({ textureNodes, camera }) => {
            const { depth, normal, output } = textureNodes;
            if (!passRef.current) passRef.current = ao(depth, normal, camera);
            update();
            passRef.current.resolutionScale = 0.5;
            //return passRef.current;
            //todo: Do we need to output mul here or is that on the next pass?
            return passRef.current.getTextureNode().mul(output);
        },
        [update],
    );

    // Register once
    useEffect(() => {
        //@ts-expect-error kdjfnb
        register({ id, priority, build });
        return () => unregister(id);
    }, [id, priority, build, register, unregister]);

    // Mutate AO params on prop changes
    // We do this because we also need to update on build
    useEffect(() => {
        update();
    }, [radius, scale, thickness, distanceExponent, distanceFalloff, id, priority, build, update]);

    return null;
}
