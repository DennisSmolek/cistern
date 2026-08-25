// Domain types live in ./types and are re-exported so consumers can
// `import type { CisternConfig } from '@cistern/core'`
export * from './types'

export { CisternGeometry } from './lib/CisternGeometry'
//export { CisternMesh } from './lib/CisternMesh'
export { CisternMaterial } from './lib/CisternMaterial'

export { generateRawPoints } from './lib/pointGeneration'
export { getConfigFromBase, mergeConfigs, getConfig } from './lib/config'
export { mat, withMat } from './lib/utils'
