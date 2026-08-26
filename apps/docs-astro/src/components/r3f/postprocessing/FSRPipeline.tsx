import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import {
    ACESFilmicToneMapping,
    AgXToneMapping,
    NeutralToneMapping,
    NoToneMapping,
    Vector2,
    RenderPipeline as ThreePostProcessing,
    type PerspectiveCamera,
    type WebGPURenderer,
} from 'three/webgpu';
import {
    convertToTexture,
    diffuseColor,
    mrt,
    normalView,
    output,
    pass,
    vec4,
    velocity,
} from 'three/tsl';
import { ssgi } from 'three/addons/tsl/display/SSGINode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { upscale, type Upscaler } from '@pmndrs/upscaler';

//* SSGI → FSR3 pipeline, following @pmndrs/upscaler's `06-screenspace-gi`
//* recipe on the composable-node surface (`upscale()`):
//* 1. G-buffer pass at 1/ratio resolution (output / velocity / normal / diffuse)
//* 2. SSGI with `useTemporalFiltering` OFF — its rotating sampling pattern
//*    expects a TRAA to resolve it, and that swing defeats FSR3's variance
//*    clip at silhouettes. Static pattern + spatial DenoiseNode instead;
//*    FSR3's accumulation converges the residual noise.
//* 3. Composite: beauty·AO + albedo·GI (indirect diffuse recombination)
//* 4. FSR3 upscales to display resolution and is the sole temporal resolver —
//*    no TRAA anywhere in the graph.

// three's addon effect nodes are typed as their concrete class, which doesn't
// expose the swizzle/getTextureNode proxy members TSL adds at runtime.
const sw = (n: unknown) => n as ReturnType<typeof vec4>;

type FSRNode = ReturnType<typeof upscale> & {
    upscaler?: Upscaler | null;
    dispose?: () => void;
};

export const FSRPipeline = () => {
    const { renderer: r3fRenderer, scene, camera, size } = useThree();
    const renderer = useMemo(() => r3fRenderer as unknown as WebGPURenderer, [r3fRenderer]);

    const { ratio, slices, steps, jitter, rcasDenoise } = useControls(
        'Render (SSGI + FSR3)',
        {
            ratio: { label: 'Render scale ×', value: 2, min: 1, max: 3, step: 0.25 },
            slices: { label: 'SSGI slices', value: 2, min: 1, max: 4, step: 1 },
            steps: { label: 'SSGI steps', value: 8, min: 4, max: 16, step: 1 },
            jitter: { label: 'Jitter (reconstruct)', value: true },
            rcasDenoise: { label: 'RCAS denoise', value: true },
        },
        { collapsed: true },
    );

    // Renderer-level controls — tone mapping is applied by the pipeline's
    // final output transform, so it composes with FSR3's linear/HDR output.
    const { toneMapping, exposure } = useControls(
        'Renderer',
        {
            toneMapping: {
                label: 'Tone mapping',
                value: ACESFilmicToneMapping,
                options: {
                    'ACES Filmic': ACESFilmicToneMapping,
                    AgX: AgXToneMapping,
                    Neutral: NeutralToneMapping,
                    None: NoToneMapping,
                },
            },
            exposure: { label: 'Exposure', value: 1, min: 0.1, max: 3, step: 0.05 },
        },
        { collapsed: true },
    );

    const post = useMemo(() => new ThreePostProcessing(renderer), [renderer]);
    const fsrRef = useRef<FSRNode | null>(null);

    useEffect(() => {
        renderer.toneMapping = toneMapping;
        renderer.toneMappingExposure = exposure;
        post.needsUpdate = true;
    }, [renderer, post, toneMapping, exposure]);

    useEffect(() => {
        const cam = camera as unknown as PerspectiveCamera;
        const drawingSize = renderer.getDrawingBufferSize(new Vector2());
        const rw = Math.max(1, Math.floor(drawingSize.x / ratio));
        const rh = Math.max(1, Math.floor(drawingSize.y / ratio));

        // samples: 0 — since r185 PassNode inherits renderer.samples; FSR3 wants
        // the raw (non-MSAA) buffers and provides the anti-aliasing itself.
        const scenePass = pass(scene, cam, { samples: 0 });
        // WebGPU caps color attachments at 32 bytes/sample = four RGBA16F targets.
        scenePass.setMRT(
            mrt({ output, velocity, normal: normalView, diffuse: diffuseColor } as never),
        );
        scenePass.setResolutionScale(1 / ratio);

        const beauty = scenePass.getTextureNode('output');
        const depth = scenePass.getTextureNode('depth');
        const vel = scenePass.getTextureNode('velocity');
        const normal = scenePass.getTextureNode('normal');
        const diffuse = scenePass.getTextureNode('diffuse');

        const giPass = ssgi(beauty, depth, normal, cam);
        giPass.useTemporalFiltering = false;
        giPass.sliceCount.value = slices;
        giPass.stepCount.value = steps;
        const aoTex = sw(giPass.getAONode());
        const gi = sw(denoise(giPass.getGINode() as never, depth, normal, cam));
        const composite = vec4(beauty.rgb.mul(aoTex.r).add(diffuse.rgb.mul(gi.rgb)), beauty.a);

        // Pin the composite to a reduced-res texture so the whole effect graph
        // runs at render resolution; FSR3 upscales that to display size.
        const colorTex = convertToTexture(composite, rw, rh);
        const fsr = upscale(colorTex, depth, vel, cam, { path: 'temporal', ratio, jitter }) as FSRNode;
        fsrRef.current = fsr;
        post.outputNode = fsr as never;
        post.needsUpdate = true;

        return () => {
            fsrRef.current = null;
            fsr.dispose?.();
        };
    }, [renderer, scene, camera, size, post, ratio, slices, steps, jitter]);

    // v10: the render phase replaces the default render loop.
    useFrame(() => {
        const upscaler = fsrRef.current?.upscaler;
        if (upscaler) upscaler.settings.rcasDenoise = rcasDenoise;
        post.render();
    }, { phase: 'render' });

    return null;
};
