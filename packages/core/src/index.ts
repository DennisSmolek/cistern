// Re-export global types so consumers can import from '@cistern/core'
export type BaseConfig = globalThis.BaseConfig
export type CisternConfig = globalThis.CisternConfig
export type Points = globalThis.Points
export type SinglePoint = globalThis.SinglePoint
export type TrimConfig = globalThis.TrimConfig
export type WallConfig = globalThis.WallConfig
export type CornerConfig = globalThis.CornerConfig
export type PedestalConfig = globalThis.PedestalConfig

export { CisternGeometry } from './lib/CisternGeometry'
export { CisternMesh } from './lib/CisternMesh'
export { CisternMaterial } from './lib/CisternMaterial'

export { generateRawPoints } from './lib/pointGeneration'
export { getConfigFromBase, mergeConfigs } from './lib/config'
