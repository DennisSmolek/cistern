type SinglePoint = [number, number, number?]

type Points = SinglePoint[]

interface TrimConfig {
    size?: number
    depth?: number
    bevelOuter?: boolean
    bevelTopInner?: boolean
    bevelBottomInner?: boolean
    bevelSize?: number
    offset?: number
    startFrom?: 'top' | 'bottom'
}

interface WallConfig {
    ceilingTrim?: TrimConfig
    floorTrim?: TrimConfig
    railTrim?: TrimConfig
}

interface CornerConfig {
    startDistance: number
    endDistance: number
    firstControlDistance: number
    lastControlDistance: number
    points?: Points
}

interface PedestalConfig {
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

interface AdvancedConfig {
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
