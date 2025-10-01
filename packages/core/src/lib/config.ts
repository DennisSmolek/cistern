import { defaultTrimConfig } from './defaults';
import { deepMerge } from './utils';

export const defaultBaseConfig: BaseConfig = {
    radius: 20,
    height: 10,
    pedestalRadius: 5,
    pedestalHeight: 0.25,
    skylightRadius: 5,
};

// depreciated
export const getConfigFromBase = (baseConfig: BaseConfig): CisternConfig => {
    return getConfig(baseConfig);
}
/**
 * Generates a full CisternConfig object from a given BaseConfig.
 *
 * This function takes a minimal base configuration (dimensions, radii, heights, etc.)
 * and expands it into a complete CisternConfig, filling in all required sub-sections
 * (root, pedestal, corners, wall, soffit, skylight) with defaults and derived values.
 *
 * If no input is provided, the defaultBaseConfig is used.
 *
 * @param inputBaseConfig - The minimal base configuration to expand.
 * @returns The fully expanded cistern configuration object.
 */

export function getConfig(inputBaseConfig?: BaseConfig): CisternConfig {
    const baseConfig = inputBaseConfig || defaultBaseConfig;
    const config = {
        root: {
            radius: baseConfig.radius,
            topRadius: baseConfig.topRadius || baseConfig.radius,
            bottomRadius: baseConfig.bottomRadius || baseConfig.radius,
            height: baseConfig.height,
            topHeight: baseConfig.topHeight || baseConfig.height,
            bottomHeight: baseConfig.bottomHeight || 0,
        },
        pedestal: {
            height: baseConfig.pedestalHeight,
            outerHeight: baseConfig.pedestalHeight,
            radius: baseConfig.pedestalRadius,
            dropAngle: 0,
            points: [] as Points,
            inset: 0.125,
            insetHeight: 0.125,
        },
        bottomCorner: {
            startDistance: baseConfig.cornerDistance || 1,
            endDistance: baseConfig.cornerDistance || 1,
            firstControlDistance: 0,
            lastControlDistance: 0,
            points: [] as Points,
        },
        topCorner: {
            startDistance: baseConfig.cornerDistance || 1,
            endDistance: baseConfig.cornerDistance || 1,
            firstControlDistance: 0,
            lastControlDistance: 0,
            points: [] as Points,
        },
        wall: {
            points: [] as Points,
            ceilingTrim: defaultTrimConfig,
            floorTrim: defaultTrimConfig,
            railTrim: defaultTrimConfig,
        },
        soffit: {
            height: 0,
            radius: 0.185,
            dropAngle: 0,
            inset: 0.125,
            insetHeight: 0.125,
            points: [] as Points,
        },
        skylight: {
            radius: baseConfig.skylightRadius || 0,
            topRadius: baseConfig.skylightRadius || 0,
            depth: 0.25,
            points: [] as Points,
            topLip: 0.125,
        },
    };

    return config;
}

/**
 * Merges two CisternConfig objects.
 *
 * This function takes two CisternConfig objects and merges them, returning a new
 * CisternConfig object with the merged values.
 *
 * @param config1 - The first CisternConfig object to merge.
 * @param config2 - The second CisternConfig object to merge.
 * @returns The merged CisternConfig object.
 */
export function mergeConfigs(config1: Partial<CisternConfig>, config2: Partial<CisternConfig>): CisternConfig {
    return deepMerge<CisternConfig>(config1 || {}, config2 || {});
}