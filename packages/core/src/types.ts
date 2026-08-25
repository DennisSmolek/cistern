export type SinglePoint = [number, number, number?]

export type Points = SinglePoint[]

export interface TrimConfig {
    size?: number
    depth?: number
    bevelOuter?: boolean
    bevelTopInner?: boolean
    bevelBottomInner?: boolean
    bevelSize?: number
    offset?: number
    startFrom?: 'top' | 'bottom'
}

export interface BaseConfig {
    radius: number
    height: number
    topHeight?: number
    bottomHeight?: number
    topRadius?: number
    bottomRadius?: number
    pedestalRadius?: number
    pedestalHeight?: number
    cornerDistance?: number
    skylightRadius?: number
}

export interface WallConfig {
    ceilingTrim?: TrimConfig
    floorTrim?: TrimConfig
    railTrim?: TrimConfig
}

export interface CornerConfig {
    startDistance: number
    endDistance: number
    firstControlDistance: number
    lastControlDistance: number
    points?: Points
}

export interface PedestalConfig {
    height?: number
    outerHeight?: number
    radius?: number
    bumpRailWidth?: number
    bevelBumpRail?: boolean
    bumpRailHeight?: number
    dropAngle?: number
    points?: Points
    inset?: number
    insetHeight?: number
    insetOffset?: number
}

export interface CisternConfig {
    root?: {
        radius?: number
        topRadius?: number
        bottomRadius?: number
        height?: number
        topHeight?: number
        bottomHeight?: number
    }
    pedestal?: PedestalConfig
    bottomCorner?: CornerConfig
    topCorner?: CornerConfig
    wall?: WallConfig
    soffit?: PedestalConfig
    skylight?: {
        radius?: number
        topRadius?: number
        depth?: number
        points?: Points
        topLip?: number
    }
}
