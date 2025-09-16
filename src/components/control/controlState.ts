import { proxy } from "valtio";
// import * as THREE from "three/webgpu";
import {
    generateRawPoints,
    getConfigFromBase,
    mergeConfigs,
    type AdvancedConfig,
} from "../../pointGeneration";

const baseConfig = {
    radius: 20,
    cornerRadius: 0.5,
    height: 10,
    peak: 1,
    pedestalRadius: 5,
    pedestalHeight: 0.25,
    skylightRadius: 5,
};

const overrides: Partial<AdvancedConfig> = {

    soffit: {
        height: 1,
    },
};

// generate a config from base
const firstConfig = getConfigFromBase(baseConfig, true);
// merge overrides and make the initial section points
const advancedConfig = mergeConfigs(firstConfig, overrides);

// make the raw worldspace points
const initialPoints = generateRawPoints(advancedConfig);
// log the raw points
console.log('Initial Points', initialPoints);

console.log('Advanced Config', advancedConfig);
export const controlState = proxy({
    base: baseConfig,
    points: initialPoints,
    activeConfig: advancedConfig,
});
