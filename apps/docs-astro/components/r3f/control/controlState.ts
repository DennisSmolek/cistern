import { proxy, ref } from "valtio";
import { Vector3 } from "three/webgpu";
import {
    generateRawPoints,
    getConfigFromBase,
    mergeConfigs,
} from "@cistern/core";

import type { AdvancedConfig } from "@cistern/core";

const baseConfig = {
    radius: 20,
    height: 10,
    pedestalRadius: 5,
    pedestalHeight: 0.25,
    skylightRadius: 5,
};

const overrides: Partial<AdvancedConfig> = {

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
const advancedConfig = mergeConfigs(firstConfig, overrides) as AdvancedConfig;


interface ControlState {
    base: typeof baseConfig;
    displayPoints: Vector3[];
    activeConfig: AdvancedConfig;
    overrideConfig: Partial<AdvancedConfig>;
}

export const controlState = proxy<ControlState>({
    base: baseConfig,
    displayPoints: ref([]),
    activeConfig: advancedConfig,
    overrideConfig: overrides,
});




export function generateCistern(overrideConfig: Partial<AdvancedConfig>) {
    const newConfig = mergeConfigs(controlState.activeConfig, overrideConfig);
    const newPoints = generateRawPoints(newConfig);

    return {
        config: newConfig,
        points: newPoints,
    }
}
