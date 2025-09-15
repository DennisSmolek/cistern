

const defaultPointCounts = {
    corner: 10,
    wall: 2,
    pedestal: 3,
    soffit: 6,
};

export type BaseConfig = {
    radius: number;
    cornerRadius: number;
    height: number;
    peak: number;
    pedestalRadius: number;
    pedestalHeight: number;
};



export type CornerConfig = {
    radius: number;
    angle: number;
    points: number[][];
};

export type PedestalConfig = {
    height?: number;
    radius?: number;
    angle?: number; // optional because soffit doesn't have an angle
    points?: number[][];
    inset?: number;
    insetHeight?: number;
};

export type AdvancedConfig = {
    root?: {
        wallAngle?: number;
        ceilingAngle?: number;
        floorAngle?: number;
        radius?: number;
        peak?: number;
        height?: number;
    };
    pedestal?: PedestalConfig;
    bottomCorner?: CornerConfig;
    topCorner?: CornerConfig;
    wall?: {
        height?: number;
        points?: number[][];
    };
    soffit?: PedestalConfig;
    skylight?: {
        radius?: number;
        depth?: number;
        points?: number[][];
        topLip?: number;
        topDiff?: number;
    };
};



/*
    A cistern is a shape that gets Lathed into a round shape so we define the edges
    we can start with a base config and in that generate a detailed config.
    detailed config can hold params or the raw points themselves.
    if we provide points and configs, the configs act as maximums.
    
    We start at 0,0;
    root:
    radius: Distance from the center of the cistern to the edge of the cistern.
    Usually just the floor length minus the corner radius.
    floorAngle: the exit angle from the origin outward.
    cornerRadius: radius of the curve to the walls
    height: height out the OUTSIDE of the cistern (both corners - wall height   )
    peak: any difference betwen the outer height and inner height

    After the root, we can add overrides
    pedestal:
    this is like a table that starts in the center.
    To start we add the height to the origin for the starting point.
    Then we go out radius at angle, then drop height. Then when starting from here we
    use root.floorAngle to continue

    bottomCorner:
    this is the transition from floor to wall. our angle is the pitch of the wall

    wall:
    The height of the wall goes from the end of the bottomCorner to the start of the topCorner

    topCorner:
    transition from wall to ceiling. The angle is the pitch of the ceiling.

    Now we have to work a bit backwards.
    skylight: 
    we start at x:0, y: height + peak
    radius is the cutback length that we pull off the ceiling
    height is the inner edge of the skylight. If we have a soffit we add that to the end point\

    So the idea is, if theres a skylight we cut a hole in the ceiling and the soffit acts as the edge

    soffit:
    kinda like the pedastle but on the ceiling. Has an addional inset that can make it feel 
    the ceiling is "floating" and is a good spot to put lights.

    */

/*
 * Takes a baseConfig and generates an advancedConfig (no points yet)
 */

export function getConfigFromBase(baseConfig: BaseConfig, skipPoints = false): AdvancedConfig {
    const config = {
        root: {
            wallAngle: 90,
            ceilingAngle: 90,
            floorAngle: 0,
            radius: baseConfig.radius,
            peak: baseConfig.peak,
            height: baseConfig.height,
        },
        pedestal: {
            height: baseConfig.pedestalHeight,
            radius: baseConfig.pedestalRadius,
            angle: 0,
            points: [] as number[][],
            inset: 0.125,
            insetHeight: 0.125,
        },
        bottomCorner: {
            radius: baseConfig.cornerRadius,
            angle: 90,
            points: [] as number[][],
        },
        topCorner: {
            radius: baseConfig.cornerRadius,
            angle: 90,
            points: [] as number[][],
        },
        wall: {
            height: baseConfig.height - baseConfig.cornerRadius * 2,
            points: [] as number[][],
        },
        soffit: {
            height: 0,
            radius: 0,
            inset: 0.125, // Default inset value
            insetHeight: 0.125, // Default inset height
            points: [] as number[][],
        },
        skylight: {
            radius: baseConfig.pedestalRadius, // Skylight is typically smaller than full radius
            depth: baseConfig.peak,
            points: [] as number[][],
            topLip: 0.125,
            topDiff: -0.125,
        },
    };

    // Generate points for each section
    if (!skipPoints) {
        generateConfigPoints(config);
    }

    return config;
}

/*
 * Helper function factory that creates a last() function for getting the most recent point
 */
function createPointTracker(pointsArray: number[][]) {
    return {
        last: () => pointsArray[pointsArray.length - 1],
        push: (point: number[]) => pointsArray.push(point),
        pushArray: (x: number, y: number) => pointsArray.push([x, y]),
    };
}

/*
 * Helper function that transforms points relative to a current position
 * and adds them to the main points array, returning the final position
 */
function attachTransformed(
    mainPoints: number[][],
    currentPosition: number[],
    pointsToTransform: number[][]
): number[] {
    let finalPosition = [...currentPosition];

    // Skip the first point since it's always [0,0] and should match currentPosition
    for (let i = 1; i < pointsToTransform.length; i++) {
        const point = pointsToTransform[i];
        // Transform point relative to current position
        const transformedPoint = [
            currentPosition[0] + point[0],
            currentPosition[1] + point[1],
        ];

        // Add to main points array
        mainPoints.push(transformedPoint);

        // Update final position to the last transformed point
        finalPosition = transformedPoint;
    }

    return finalPosition;
}

/*
 * Generates points for each section of the advanced config
 * Each section starts at (0,0) locally
 */
export function generateConfigPoints(config: AdvancedConfig): AdvancedConfig {
    //* Pedestal Points ==============================
    if (config.pedestal?.height && config.pedestal.height > 0)
        makePedestal(config.pedestal);
    //* Bottom Corner Points ==============================
    if (config.bottomCorner?.radius && config.bottomCorner.radius > 0)
        makeCorner(config.bottomCorner);

    //* Wall Points ==============================
    // wall just takes origin and adds height
    if (config.wall?.points && config.wall.height) {
        // make origin
        config.wall.points.push([0, 0]);
        // height
        config.wall.points.push([0, config.wall.height]);
    }
    //* Top Corner Points ==============================
    if (config.topCorner?.radius && config.topCorner.radius > 0)
        makeCorner(config.topCorner, "top");
    //* Soffit Points ==============================
    if (config.soffit?.height && config.soffit.height > 0)
        makeSoffit(config.soffit);
    //* Skylight Points ==============================
    // skylight has a depth but should also calculate if theres a soffit height
    if (config.skylight?.points && config.skylight.depth !== undefined) {
        const soffitHeight = config.soffit?.height || 0;
        const finalHeight = config.skylight.depth + soffitHeight;
        // make origin
        config.skylight.points.push([0, 0]);
        // height
        config.skylight.points.push([0, finalHeight]);
        // cut back in 90 degrees parallel to the top a distance of inset towards the origin
        const topLip = config.skylight.topLip || 0;
        config.skylight.points.push([topLip, finalHeight]);
    }
    return config;
}

function makePedestal(config: PedestalConfig): void {
    // Pedestals are tables that start "on top" of the floor surface
    // They extend outward and then drop down to create a table-like structure

    const { last, pushArray } = createPointTracker(config.points!);
    const height = config.height || 0;
    const inset = config.inset || 0.125;
    const insetHeight = config.insetHeight || 0.125;
    const angle = config.angle || 0;
    const radius = config.radius || 1;
    const angleRad = (angle * Math.PI) / 180;

    // initial point at origin (on top of floor surface)
    pushArray(0, 0);

    // extend X by radius, taking into account the angle property in the negative direction
    // so if angle is 2 degrees, we go out radius but down 2 degrees
    pushArray(radius * Math.cos(-angleRad), radius * Math.sin(-angleRad));

    // go "down" relative to our current position a straight 90 degrees
    // and go down height-insetHeight
    pushArray(last()[0], last()[1] - (height - insetHeight));

    // cut back in 90 degrees parallel to the top a distance of inset towards the origin
    pushArray(last()[0] - inset, last()[1]);

    // drop insetHeight
    pushArray(last()[0], last()[1] - insetHeight);

    // finally extend out insetDistance towards the radius direction
    pushArray(
        last()[0] + inset * Math.cos(-angleRad),
        last()[1] + inset * Math.sin(-angleRad)
    );
}

function makeSoffit(config: PedestalConfig): void {
    // Soffits are ceiling insets that start "on the ceiling"
    // They create a floating ceiling effect by going inward, down, outward, down, then inward again

    const { last, pushArray } = createPointTracker(config.points!);
    const height = config.height || 0;
    const inset = config.inset || 0.125;
    const insetHeight = config.insetHeight || 0.125;
    const radius = config.radius || 0;

    // initial point at origin (on the ceiling)
    pushArray(0, 0);

    // continue towards the center (x axis) the inset amount
    pushArray(last()[0] - inset, last()[1]);

    // go DOWN towards the floor insetHeight
    pushArray(last()[0], last()[1] - insetHeight);

    // go OUTWARD inset (straight outward, no angle)
    pushArray(last()[0] + inset, last()[1]);

    // go DOWN height - insetHeight
    pushArray(last()[0], last()[1] - (height - insetHeight));

    // finally towards the center radius 
    pushArray(last()[0] - Math.max(radius, inset), last()[1]);
}

function makeCorner(config: CornerConfig, type = "bottom"): void {
    // The corner starts at 0,0 and creates an arc to a rotated position
    // First point is always (0,0) for proper offset tracking when connecting sections

    const radius = config.radius;
    const angle = config.angle || 90;
    const { pushArray } = createPointTracker(config.points);

    // Convert angle to radians
    const angleRad = (angle * Math.PI) / 180;

    // Determine arc center based on corner type
    // Bottom corner: arc center is above (0, radius) so arc goes from (0,0) to rotated position
    // Top corner: arc center is to the left (-radius, 0) - same as bottom but rotated 90° left
    const arcCenterY = type === "bottom" ? radius : 0;
    const arcCenterX = type === "bottom" ? 0 : -radius;

    // Determine start and end angles based on corner type
    // Bottom corner: start at -90° (pointing down), end at angle° - 90°
    // Top corner: start at 0° (pointing right/3 o'clock), end at 90° (pointing up/12 o'clock)
    const startAngle = type === "bottom" ? -Math.PI / 2 : 0;
    const endAngle =
        type === "bottom" ? angleRad - Math.PI / 2 : Math.PI / 2;

    // Always start at (0,0)
    pushArray(0, 0);

    // Generate remaining arc points using default point count
    const pointCount = defaultPointCounts.corner;
    for (let i = 1; i <= pointCount; i++) {
        const t = i / pointCount; // interpolation factor (0 to 1)
        const currentAngle = startAngle + (endAngle - startAngle) * t;

        // Calculate point on arc
        const x = arcCenterX + radius * Math.cos(currentAngle);
        const y = arcCenterY + radius * Math.sin(currentAngle);

        pushArray(x, y);
    }
}

// Generic shallow merge helper that preserves type safety
function isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function deepMerge<T extends Record<string, unknown>>(obj1: Partial<T>, obj2: Partial<T>): T {
    const result: Record<string, unknown> = { ...(obj1 as Record<string, unknown>) };

    if (!obj2) return result as T;

    for (const key in obj2 as Record<string, unknown>) {
        const value2 = (obj2 as Record<string, unknown>)[key];
        if (value2 === undefined) continue; // do not overwrite with undefined

        const value1 = (obj1 as Record<string, unknown> | undefined)?.[key];

        // Arrays: prefer object2 (replace, not concatenate)
        if (Array.isArray(value2)) {
            result[key] = value2.slice();
            continue;
        }

        // Objects: recursively merge when both sides are plain objects
        if (isPlainObject(value2) && isPlainObject(value1)) {
            result[key] = deepMerge(value1 as Record<string, unknown>, value2 as Record<string, unknown>);
            continue;
        }

        // If value2 is object but value1 is not, clone value2 via recursive merge into empty
        if (isPlainObject(value2)) {
            result[key] = deepMerge({}, value2 as Record<string, unknown>);
            continue;
        }

        // Primitives: prefer object2
        result[key] = value2;
    }

    return result as T;
}

// make a function to take in two configs (even partials) and merge them
export function mergeConfigs(config1: Partial<AdvancedConfig>, config2: Partial<AdvancedConfig>): AdvancedConfig {
    return deepMerge<AdvancedConfig>(config1 || {}, config2 || {});
}

// Ok now we have a nice config that can be edits but we need to take that config
// and make a raw set of xy points. Theres some parts where positions are derrived
// and we have to track running positions

export function generateRawPoints(config: AdvancedConfig): number[][] {
    const points: number[][] = [];
    // attach the helper
    const { last, pushArray } = createPointTracker(points);

    // the final point will be the origin + height + peak
    const finalPosition = [
        0,
        config.root?.height || 0 + (config.root?.peak || 0),
    ];
    let floorLength = config.root?.radius || 0;
    // if we have a pedestal, move up pedestal height
    if (config.pedestal?.height && config.pedestal.height > 0) {
        pushArray(0, config.pedestal.height);
        // attach the pedestal points
        if (config.pedestal.points) {
            attachTransformed(points, last(), config.pedestal.points);
        }
        // subtract the pedestal radius from the floor length
        floorLength -= config.pedestal.radius || 0;
    } else {
        //start at origin
        pushArray(0, 0);
    }
    // extend out from the last position floorLength at the floor angle
    const floorAngle = config.root?.floorAngle || 0;
    pushArray(
        floorLength * Math.cos(floorAngle),
        floorLength * Math.sin(floorAngle)
    );
    // if we have a bottom corner, apply
    if (
        config.bottomCorner?.radius &&
        config.bottomCorner.radius > 0 &&
        config.bottomCorner.points
    ) {
        attachTransformed(points, last(), config.bottomCorner.points);
    }
    // now we are at the top of the corner and attach the wall points
    if (config.wall?.points && config.wall.height) {
        attachTransformed(points, last(), config.wall.points);
    }
    // now we are at the top of the wall and attach the top corner points
    if (
        config.topCorner?.radius &&
        config.topCorner.radius > 0 &&
        config.topCorner.points
    ) {
        attachTransformed(points, last(), config.topCorner.points);
    }
    // this is edge of the ceiling
    const ceilingEdge = last();

    // calculate ceiling length (distance between ceiling edge and final position)
    const deltaX = finalPosition[0] - ceilingEdge[0];
    const deltaY = finalPosition[1] - ceilingEdge[1];
    let ceilingLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // calculate ceiling angle (pitch to go from ceiling edge to final position)
    const ceilingAngle = Math.atan2(deltaY, deltaX);

    // If there is a skylight and/or soffit we retract that from the ceiling length
    if (config.skylight?.radius && config.skylight.radius > 0) {
        ceilingLength -= config.skylight.radius;
    }
    if (config.soffit?.radius && config.soffit.radius > 0) {
        ceilingLength -= config.soffit.radius;
    }
    // extend out from last point at the ceilingAngle through the ceilingLength
    pushArray(last()[0] + ceilingLength * Math.cos(ceilingAngle), last()[1] + ceilingLength * Math.sin(ceilingAngle));

    // add the soffit points
    if (config.soffit?.points && config.soffit.points.length > 0) {
        attachTransformed(points, last(), config.soffit.points);
    }
    // add the skylight points
    if (config.skylight?.points && config.skylight.points.length > 0) {
        attachTransformed(points, last(), config.skylight.points);
    }
    //because of the skylight we probably arent at the final position and thats ok

    return points;
}
