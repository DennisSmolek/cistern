import { proxy, ref } from "valtio";
import { MeshStandardNodeMaterial, MeshStandardMaterial, Vector3 } from "three/webgpu";
import {
    generateRawPoints,
    getConfigFromBase,
    mergeConfigs,
} from "@cistern/core";

import type { CisternConfig } from "@cistern/core";

// NOTE this is handled internally now but we need to init the controls with these values
const baseConfig = {
    radius: 20,
    height: 10,
    pedestalRadius: 5,
    pedestalHeight: 0.25,
    skylightRadius: 5,
};

const overrides: Partial<CisternConfig> = {

    soffit: {
        height: 1,
    },
    wall: {
        railTrim: {
            offset: 5,
        },
    },
};

// generate a config from base
const firstConfig = getConfigFromBase(baseConfig);
// merge overrides and make the initial section points
const CisternConfig = mergeConfigs(firstConfig, overrides) as CisternConfig;


interface ControlState {
    base: typeof baseConfig;
    materials?: Record<string, MeshStandardNodeMaterial | MeshStandardMaterial>;
    displayPoints: Vector3[];
    activeConfig: CisternConfig;
    overrideConfig: Partial<CisternConfig>;
}

export const controlState = proxy<ControlState>({
    base: baseConfig,
    displayPoints: ref([]),
    activeConfig: CisternConfig,
    overrideConfig: overrides,
    materials: ref({} as Record<string, MeshStandardNodeMaterial>)
});






export function generateCistern(overrideConfig: Partial<CisternConfig>) {
    const newConfig = mergeConfigs(controlState.activeConfig, overrideConfig);
    const newPoints = generateRawPoints(newConfig);

    return {
        config: newConfig,
        points: newPoints,
    }
}
