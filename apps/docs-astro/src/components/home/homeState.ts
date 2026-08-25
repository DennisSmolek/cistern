import { proxy } from 'valtio';
import type { Mesh } from 'three/webgpu';

/** Page-level UI state shared between the DOM shell and the R3F scene. */
export const homeState = proxy({
    /** "Edit live" mode: hero hidden, camera pulled out, leva expanded. */
    editMode: false,
    /** prefers-reduced-motion — camera snaps instead of easing. */
    reducedMotion: false,
});

/**
 * Non-reactive handles out of the R3F tree (three objects must not be
 * proxied). The Export panel reads these.
 */
export const sceneRefs: { cistern: Mesh | null } = {
    cistern: null,
};
