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
    float,
    mix,
    mrt,
    normalView,
    output,
    pass,
    uniform,
    vec4,
    velocity,
} from 'three/tsl';
import { ssgi } from 'three/addons/tsl/display/SSGINode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { recurrentDenoise } from 'three/addons/tsl/display/RecurrentDenoiseNode.js';
import { DebugView, upscale, type Upscaler } from '@pmndrs/upscaler';

//* SSGI → FSR3 pipeline, following @pmndrs/upscaler's `10-ssgi-denoise`
//* (the SSGI half of `09-kitchen-sink`; we don't run its SSR):
//* 1. G-buffer pass at 1/ratio resolution (output / velocity / normal / diffuse)
//* 2. SSGI with `useTemporalFiltering` ON. That flag does NOT add a temporal
//*    stage — it only *rotates* the sampling pattern per frame so a downstream
//*    temporal resolver can average the noise away. A static pattern gives
//*    FSR3 correlated noise it cannot converge, which is worse.
//* 3. GI denoise (see `giDenoiser`) — SPATIAL ONLY. A second temporal stage
//*    before FSR3 reprojects on velocity alone, can't see FSR3's sub-pixel
//*    jitter, and cancels the very variance FSR3 needs to reconstruct.
//*    Spatial clean → temporal resolve is the composition FSR3 wants.
//* 4. Composite: beauty·mix(1, AO, strength) + albedo·GI. Upstream applies AO
//*    to beauty at full strength; we scale it back because beauty contains
//*    direct light (see the composite below).
//* 5. FSR3 upscales to display resolution and is the sole temporal resolver —
//*    no TRAA, and no second accumulator, anywhere in the graph.

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

    const { ratio, slices, steps, aoStrength, giDenoiser, ssgiTemporal, jitter, rcasDenoise } =
        useControls(
            'Render (SSGI + FSR3)',
            {
                ratio: { label: 'Render scale ×', value: 2, min: 1, max: 3, step: 0.25 },
                slices: { label: 'SSGI slices', value: 2, min: 1, max: 4, step: 1 },
                steps: { label: 'SSGI steps', value: 8, min: 4, max: 16, step: 1 },
                aoStrength: { label: 'AO on beauty', value: 0.5, min: 0, max: 1, step: 0.05 },
                giDenoiser: {
                    label: 'GI denoiser',
                    value: 'spatial',
                    options: {
                        'Spatial à-trous (recurrent, accumulate off)': 'spatial',
                        'DenoiseNode (bilateral)': 'builtin',
                        'None — FSR3 resolves raw': 'none',
                    },
                },
                ssgiTemporal: { label: 'SSGI rotate pattern', value: true },
                jitter: { label: 'Jitter (reconstruct)', value: true },
                rcasDenoise: { label: 'RCAS denoise', value: true },
            },
            { collapsed: true },
        );

    //* FSR3 runtime knobs — all live-mutable on `upscaler.settings`, so they
    //* stay out of the graph-rebuilding effect below and are applied per frame.
    const { debugView, maxAccumulation, sharpness, lockThinFeatures, detectShadingChanges } =
        useControls(
            'FSR3 debug',
            {
                debugView: {
                    label: 'View',
                    value: DebugView.None,
                    options: {
                        'Final image': DebugView.None,
                        'Accumulation age': DebugView.AccumulationAge,
                        Disocclusion: DebugView.Disocclusion,
                        'Motion vectors': DebugView.MotionVectors,
                        'Dilated depth': DebugView.Depth,
                        'Thin-feature locks': DebugView.Locks,
                        'Shading change': DebugView.ShadingChange,
                        Reactivity: DebugView.Reactivity,
                        Exposure: DebugView.Exposure,
                    },
                },
                maxAccumulation: { label: 'Max accum frames', value: 32, min: 1, max: 64, step: 1 },
                sharpness: { label: 'RCAS sharpness', value: 1, min: 0, max: 1, step: 0.05 },
                lockThinFeatures: { label: 'Lock thin features', value: true },
                detectShadingChanges: { label: 'Detect shading change', value: true },
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
    // Uniform, not a literal: changing the slider must not rebuild the graph.
    const aoUniform = useMemo(() => uniform(0.5), []);

    useEffect(() => {
        aoUniform.value = aoStrength;
    }, [aoUniform, aoStrength]);

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
        //* Rotates the sampling pattern per frame — decorrelates the noise so
        //* FSR3's accumulation can average it out. Not a temporal stage.
        giPass.useTemporalFiltering = ssgiTemporal;
        giPass.sliceCount.value = slices;
        giPass.stepCount.value = steps;
        const aoTex = sw(giPass.getAONode());
        const giRaw = giPass.getGINode();

        //* All three options are SPATIAL. Nothing here may accumulate or
        //* reproject — FSR3 owns every temporal stage in this graph.
        let gi;
        if (giDenoiser === 'spatial') {
            // à-trous with `accumulate: false` — no history, no reprojection.
            gi = sw(
                recurrentDenoise(giRaw as never, cam, {
                    depth: depth as never,
                    normal: normal as never,
                    raw: giRaw as never,
                    mode: 'diffuse',
                    accumulate: false,
                } as never),
            );
        } else if (giDenoiser === 'builtin') {
            gi = sw(denoise(giRaw as never, depth, normal, cam));
        } else {
            gi = sw(giRaw);
        }
        //* AO belongs on indirect light only. `beauty` is the fully lit result
        //* (direct + ambient + env), so multiplying all of it by AO both
        //* darkens direct light — physically wrong — and multiplies SSGI's
        //* sample noise into the brightest part of the signal, which is what
        //* boils under jitter. Without a direct/indirect split in the G-buffer
        //* (no room: four RGBA16F targets is the WebGPU cap) the honest
        //* approximation is to scale AO's authority over beauty back.
        const aoOnBeauty = mix(float(1), aoTex.r, aoUniform);
        const composite = vec4(beauty.rgb.mul(aoOnBeauty).add(diffuse.rgb.mul(gi.rgb)), beauty.a);

        // Pin the composite to a reduced-res texture so the whole effect graph
        // runs at render resolution; FSR3 upscales that to display size.
        const colorTex = convertToTexture(composite, rw, rh);
        const fsr = upscale(colorTex, depth, vel, cam, {
            path: 'temporal',
            ratio,
            jitter,
        }) as FSRNode;
        fsrRef.current = fsr;
        post.outputNode = fsr as never;
        post.needsUpdate = true;

        return () => {
            fsrRef.current = null;
            fsr.dispose?.();
        };
    }, [
        renderer,
        scene,
        camera,
        size,
        post,
        ratio,
        slices,
        steps,
        giDenoiser,
        ssgiTemporal,
        jitter,
        aoUniform,
    ]);

    // v10: the render phase replaces the default render loop.
    useFrame(
        () => {
            const upscaler = fsrRef.current?.upscaler;
            if (upscaler) {
                const s = upscaler.settings;
                s.rcasDenoise = rcasDenoise;
                s.debugView = debugView;
                s.maxAccumulation = maxAccumulation;
                s.sharpness = sharpness;
                s.lockThinFeatures = lockThinFeatures;
                s.detectShadingChanges = detectShadingChanges;
            }
            post.render();
        },
        { phase: 'render' },
    );

    return null;
};
