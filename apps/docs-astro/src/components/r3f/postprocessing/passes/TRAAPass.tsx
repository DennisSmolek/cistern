import { useCallback, useEffect, useId, useRef } from 'react';
import type TRAANode from 'three/addons/tsl/display/TRAANode.js';
import { usePipeline } from '../Pipeline';
import { traa } from 'three/addons/tsl/display/TRAANode.js';

export const TRAAPass = () => {
    const { register, unregister } = usePipeline();
    const id = useId();
    const passRef = useRef<TRAANode | null>(null);

    // Node Builder
    // todo: move this to a util?
    //@ts-expect-error kdjfnb
    const build: BuildFn<typeof mul> = useCallback(({ textureNodes, camera, colorIn }) => {
        const { depth, velocity } = textureNodes;
        console.log('Nodes going into traa', colorIn, depth, velocity);
        // get the texture from the last pass
        if (!passRef.current) passRef.current = traa(colorIn, depth, velocity, camera);
        return passRef.current;
    }, []);

    // Register once
    useEffect(() => {
        register({ id, priority: 1000, build });
        return () => unregister(id);
    }, [id, build, register, unregister]);

    return null;
};
