export type BaseConfig = {
    radius: number;
    height: number;
    topHeight?: number;
    bottomHeight?: number;
    topRadius?: number;
    bottomRadius?: number;
    pedestalRadius?: number;
    pedestalHeight?: number;
    cornerDistance?: number;
    skylightRadius?: number;
};

export type SinglePoint = [
    number, // x
    number, // y
    number?, // id
];

export type Points = SinglePoint[];

export type TrimConfig = {
    size?: number,
    depth?: number,
    bevelOuter?: boolean,
    bevelTopInner?: boolean,
    bevelBottomInner?: boolean,
    bevelSize?: number,
    offset?: number,
    startFrom?: 'top' | 'bottom',
}

export type WallConfig = {
    ceilingTrim?: TrimConfig,
    floorTrim?: TrimConfig,
    railTrim?: TrimConfig,
}

export type CornerConfig = {
    startDistance: number;
    endDistance: number;
    firstControlDistance: number;
    lastControlDistance: number;
    points?: Points;
};

export type PedestalConfig = {
    height?: number;
    outerHeight?: number;
    radius?: number;
    bumpRailWidth?: number;
    bevelBumpRail?: boolean;
    bumpRailHeight?: number;
    dropAngle?: number;
    points?: Points;
    inset?: number;
    insetHeight?: number;
    insetOffset?: number;
};

export type AdvancedConfig = {
    root?: {
        radius?: number;
        topRadius?: number;
        bottomRadius?: number;
        height?: number;
        topHeight?: number;
        bottomHeight?: number;
    };
    pedestal?: PedestalConfig;
    bottomCorner?: CornerConfig;
    topCorner?: CornerConfig;
    wall?: WallConfig;
    soffit?: PedestalConfig;
    skylight?: {
        radius?: number;
        topRadius?: number;
        depth?: number;
        points?: Points;
        topLip?: number;
    };
};
