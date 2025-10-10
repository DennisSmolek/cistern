import { useEffect, useId, useRef, useCallback, useMemo } from 'react';
import { usePostprocessing } from '../Postprocessing';
import GTAONode, { ao } from 'three/addons/tsl/display/GTAONode.js';
import type { TextureNode } from 'three/webgpu';
import { float, type ShaderNodeObject, type mul } from 'three/tsl';
import { updatePass } from './passUtils';
import { usePipeline } from '../Pipeline';
import { uniform } from 'three/src/nodes/core/UniformNode.js';

type AOProps = {
    radius?: number;
    scale?: number;
    thickness?: number;
    distanceExponent?: number;
    distanceFallOff?: number;
    priority?: number;
    strength?: number;
    resolutionScale?: number;
};

// AOBuildProps removed; we use PipelineContext directly via BuildFn

export function AOPass({
    radius = 0.5,
    scale = 1.0,
    thickness = 1.0,
    distanceExponent = 1.0,
    distanceFallOff = 1.0,
    priority = 10,
    strength = 1.0,
    resolutionScale = 0.5,
}: AOProps) {
    const { register, unregister, rebuild } = usePipeline();
    const id = useId();
    const passRef = useRef<ShaderNodeObject<GTAONode> | null>(null);

    const uniforms = useMemo(() => {
        return {
            strength: uniform(1),
        };
    }, []);

    // when strength changes, update the uniforms
    useEffect(() => {
        uniforms.strength.value = strength;
    }, [strength]);

    useEffect(() => {
        if (!passRef.current) return;
        passRef.current.resolutionScale = resolutionScale;
    }, [resolutionScale]);

    //* Update Pass
    const update = useCallback(() => {
        if (!passRef.current) return;
        updatePass(passRef, {
            radius,
            scale,
            thickness,
            distanceExponent,
            distanceFallOff,
        });
    }, [radius, scale, thickness, distanceExponent, distanceFallOff]);

    // Node Builder
    // todo: move this to a util?
    //@ts-expect-error kdjfnb
    const build: BuildFn<typeof mul> = useCallback(
        ({ textureNodes, camera }) => {
            const { depth, normal, output } = textureNodes;
            if (!passRef.current) passRef.current = ao(depth, normal, camera);
            update();
            // todo: make this a prop
            passRef.current.resolutionScale = 0.5;
            //return passRef.current;
            console.log('strength', uniforms.strength.value);
            //todo: Do we need to output mul here or is that on the next pass?
            const aoTex = passRef.current.getTextureNode();
            const maxGamma = float(4);
            const gamma = float(uniforms.strength).mul(maxGamma.sub(1)).add(1); // 0->1 maps to 1->4
            return output.mul(aoTex.pow(gamma));
        },
        [update],
    );

    // Register once
    const oldId = useRef(id);
    const oldPriority = useRef(priority);
    useEffect(() => {
        console.log('trying to register with id', id, 'and priority', priority);
        //  if (oldId.current === id && oldPriority.current === priority) return;
        oldId.current = id;
        oldPriority.current = priority;
        console.log('ao: registering pass', id);
        //@ts-expect-error kdjfnb
        register({ id, priority, build });
        return () => unregister(id);
    }, [id, priority, build, register, unregister]);

    // Mutate AO params on prop changes
    // We do this because we also need to update on build
    useEffect(() => {
        console.log('prop change triggering update call');
        update();
    }, [radius, scale, thickness, distanceExponent, distanceFallOff, id, priority, build, update]);

    return null;
}
