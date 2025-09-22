export { CisternGeometry } from './lib/CisternGeometry'
export { CisternMesh } from './lib/CisternMesh'
export * as pointGeneration from './lib/pointGeneration'
export type {
    BaseConfig,
    AdvancedConfig,
    Points,
    SinglePoint,
    TrimConfig,
    WallConfig,
    CornerConfig,
    PedestalConfig,
} from './lib/pointGeneration/types'
export { generateRawPoints, getConfigFromBase, mergeConfigs } from './lib/pointGeneration/pointGeneration'
