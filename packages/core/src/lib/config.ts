import { defaultTrimConfig } from './defaults';
import { deepMerge } from './utils';

export function getConfigFromBase(baseConfig: BaseConfig): CisternConfig {
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

export function mergeConfigs(config1: Partial<CisternConfig>, config2: Partial<CisternConfig>): CisternConfig {
    return deepMerge<CisternConfig>(config1 || {}, config2 || {});
}