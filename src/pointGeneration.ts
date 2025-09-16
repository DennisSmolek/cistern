import { CubicBezierCurve, Vector2 } from "three/webgpu";


const defaultPointCounts = {
    corner: 10,
    wall: 2,
    pedestal: 3,
    soffit: 6,
};

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

type SinglePoint = [
    number, // x
    number, // y
    number?, // id
];

type Points = SinglePoint[];


export type CornerConfig = {
    startDistance: number;
    endDistance: number;
    firstControlDistance: number;
    lastControlDistance: number;
    points: Points;
    // Calculated positions (added during generation)
    startPoint?: SinglePoint;
    endPoint?: SinglePoint;
    firstControlPoint?: SinglePoint;
    lastControlPoint?: SinglePoint;
};

export type PedestalConfig = {
    height?: number;
    outerHeight?: number;
    radius?: number;
    dropAngle?: number; // optional because soffit doesn't have an angle
    points?: Points;
    inset?: number;
    insetHeight?: number;
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
    wall?: {
        height?: number;
        points?: Points;
    };
    soffit?: PedestalConfig;
    skylight?: {
        radius?: number;
        depth?: number;
        points?: Points;
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

            radius: baseConfig.radius,
            topRadius: baseConfig.topRadius || baseConfig.radius,
            bottomRadius: baseConfig.bottomRadius || baseConfig.radius,
            height: baseConfig.height,
            topHeight: baseConfig.topHeight || baseConfig.height,
            bottomHeight: baseConfig.bottomHeight || baseConfig.height,
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
        },
        soffit: {
            height: 0,
            radius: 0,
            dropAngle: 0,
            inset: 0.125, // Default inset value
            insetHeight: 0.125, // Default inset height
            points: [] as Points,
        },
        skylight: {
            radius: baseConfig.skylightRadius || 0, // Skylight is typically smaller than full radius
            depth: 0.25,
            points: [] as Points,
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
function createPointTracker(pointsArray: Points) {
    return {
        last: () => pointsArray[pointsArray.length - 1],
        push: (point: SinglePoint) => pointsArray.push(point),
        pushArray: (x: number, y: number) => pointsArray.push([x, y]),
        pushWithId: (x: number, y: number, id: number) => pointsArray.push([x, y, id]),
    };
}

/*
 * Helper function that transforms points relative to a current position
 * and adds them to the main points array, returning the final position
 */
function attachTransformed(
    mainPoints: Points,
    currentPosition: SinglePoint,
    pointsToTransform: Points,
    sectionId?: number
): SinglePoint {
    let finalPosition = [...currentPosition] as SinglePoint;

    // Skip the first point since it's always [0,0] and should match currentPosition
    for (let i = 1; i < pointsToTransform.length; i++) {
        const point = pointsToTransform[i];
        // Transform point relative to current position
        const transformedPoint = sectionId === undefined
            ? [
                currentPosition[0] + point[0],
                currentPosition[1] + point[1],
            ]
            : [
                currentPosition[0] + point[0],
                currentPosition[1] + point[1],
                sectionId,
            ];

        // Add to main points array
        mainPoints.push(transformedPoint as SinglePoint);

        // Update final position to the last transformed point
        finalPosition = transformedPoint as SinglePoint;
    }

    return finalPosition;
}

/*
 * Generates points for each section of the advanced config
 * Each section starts at (0,0) locally
 * 
 */

function makePedestal(config: PedestalConfig): Points {
    // Pedestals are tables that start "on top" of the floor surface
    // They extend outward and then drop down to create a table-like structure
    const points: Points = [];

    const { last, pushArray } = createPointTracker(points);
    const height = config.height || 0;
    const outerHeight = config.outerHeight || height;
    const inset = config.inset || 0.125;
    const insetHeight = config.insetHeight || 0.125;
    const angle = config.dropAngle || 0;
    const radius = config.radius || 1;
    const angleRad = (angle * Math.PI) / 180;

    // initial point at origin (on top of floor surface)
    pushArray(0, 0);

    // extend X by radius, and possible a different outer height
    pushArray(radius, outerHeight);

    // Drop down from last point using the drop angle
    const dropDistance = height - insetHeight;
    pushArray(
        last()[0] + dropDistance * Math.cos(-angleRad),
        last()[1] + dropDistance * Math.sin(-angleRad)
    );

    // cut back in 90 degrees parallel to the top a distance of inset towards the origin
    pushArray(last()[0] - inset, last()[1]);

    // drop insetHeight
    pushArray(last()[0], last()[1] - insetHeight);

    // finally extend out insetDistance towards the radius direction
    pushArray(
        last()[0] + inset,
        last()[1] + inset
    );
    return points;
}

function makeSoffit(config: PedestalConfig): Points {
    // Soffits are ceiling insets that start "on the ceiling"
    // They create a floating ceiling effect by going inward, down, outward, down, then inward again

    const points: Points = [];
    const { last, pushArray } = createPointTracker(points);
    const height = config.height || 0;
    const inset = config.inset || 0.125;
    const insetHeight = config.insetHeight || 0.125;
    const radius = config.radius || 0;
    const dropAngle = config.dropAngle || 0;
    const dropAngleRad = (dropAngle * Math.PI) / 180;

    // initial point at origin (on the ceiling)
    pushArray(0, 0);

    // continue towards the center (x axis) the inset amount
    pushArray(last()[0] - inset, last()[1]);

    // go DOWN towards the floor insetHeight using drop angle
    pushArray(
        last()[0] + insetHeight * Math.cos(-dropAngleRad),
        last()[1] + insetHeight * Math.sin(-dropAngleRad)
    );

    // go OUTWARD inset (straight outward, no angle)
    pushArray(last()[0] + inset, last()[1]);

    // go DOWN height - insetHeight using drop angle
    const dropDistance = height - insetHeight;
    pushArray(
        last()[0] + dropDistance * Math.cos(-dropAngleRad),
        last()[1] + dropDistance * Math.sin(-dropAngleRad)
    );

    // finally towards the center radius 
    // i think we drop this to maintain ceiling angle
    //    pushArray(last()[0] - Math.max(radius, inset), last()[1]);
    return points;
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

export function generateRawPoints(config: AdvancedConfig): Points {
    const points: Points = [];
    // attach the helper
    const { last, pushWithId } = createPointTracker(points);


    let floorLength = config.root?.bottomRadius || 0;
    // if we have a pedestal, move up pedestal height
    if (config.pedestal?.height && config.pedestal.height > 0) {
        // section 0: pedestal
        pushWithId(0, config.pedestal.height, 0);
        // make pedestal points
        const pedestalPoints = makePedestal(config.pedestal);
        // attach the pedestal points
        attachTransformed(points, last(), pedestalPoints, 0);

        // subtract the pedestal radius from the floor length
        floorLength -= config.pedestal.radius || 0;
    } else {
        //start at origin
        pushWithId(0, 0, 1); // section 1: floor
    }
    const floorOrigin = last();

    //* CORNER MADNESS ==== */
    // we do the corners no matter what now
    // first we have to get the points and curve data we need
    // extend out from the last position floorLength to the bottom height, but dont add it yet
    const absoluteBottomCornerPoint = [floorLength, config.root?.bottomHeight || last()[1]];
    // the top corner is the bottom plus topHeight and topRadius
    // we cant just push that yet but we can store it
    const absoluteTopCornerPoint = [config.root?.topRadius || 0, config.root?.topHeight || 0];
    const finalPosition = [0, config.root?.height || 10];

    const bottom = config.bottomCorner;
    const top = config.topCorner;
    if (!bottom || !top) throw new Error('Bottom and top corners are required to generate points!');
    const bottomPoints: Vector2[] = [];
    const topPoints: Vector2[] = [];

    //* CORNER POSITION CALCULATIONS ==============================

    // Calculate bottom corner positions
    // Direction from bottom corner towards floor origin
    const floorDirection = [
        floorOrigin[0] - absoluteBottomCornerPoint[0],
        floorOrigin[1] - absoluteBottomCornerPoint[1]
    ];
    const floorDistance = Math.sqrt(floorDirection[0] ** 2 + floorDirection[1] ** 2);
    const floorUnit = floorDistance > 0 ? [floorDirection[0] / floorDistance, floorDirection[1] / floorDistance] : [1, 0];

    // Direction from bottom corner towards top corner
    const bottomWallDirection = [
        absoluteTopCornerPoint[0] - absoluteBottomCornerPoint[0],
        absoluteTopCornerPoint[1] - absoluteBottomCornerPoint[1]
    ];
    const bottomWallDistance = Math.sqrt(bottomWallDirection[0] ** 2 + bottomWallDirection[1] ** 2);
    const bottomWallUnit = bottomWallDistance > 0 ? [bottomWallDirection[0] / bottomWallDistance, bottomWallDirection[1] / bottomWallDistance] : [0, 1];

    // Calculate all bottom corner positions
    const bottomStartDistance = bottom.startDistance || 0;
    const bottomEndDistance = bottom.endDistance || 0;
    const bottomFirstControlDistance = bottom.firstControlDistance || 0;
    const bottomLastControlDistance = bottom.lastControlDistance || 0;

    // start point
    bottomPoints.push(new Vector2(
        absoluteBottomCornerPoint[0] + bottomStartDistance * floorUnit[0],
        absoluteBottomCornerPoint[1] + bottomStartDistance * floorUnit[1]
    ));

    // first control point
    bottomPoints.push(new Vector2(
        absoluteBottomCornerPoint[0] + bottomFirstControlDistance * floorUnit[0],
        absoluteBottomCornerPoint[1] + bottomFirstControlDistance * floorUnit[1]
    ));

    // last control point
    bottomPoints.push(new Vector2(
        absoluteBottomCornerPoint[0] + bottomLastControlDistance * bottomWallUnit[0],
        absoluteBottomCornerPoint[1] + bottomLastControlDistance * bottomWallUnit[1]
    ));

    // end point
    bottomPoints.push(new Vector2(
        absoluteBottomCornerPoint[0] + bottomEndDistance * bottomWallUnit[0],
        absoluteBottomCornerPoint[1] + bottomEndDistance * bottomWallUnit[1]
    ));


    // Calculate top corner positions

    // Direction from top corner towards bottom corner
    const topWallDirection = [
        absoluteBottomCornerPoint[0] - absoluteTopCornerPoint[0],
        absoluteBottomCornerPoint[1] - absoluteTopCornerPoint[1]
    ];
    const wallDistance = Math.sqrt(topWallDirection[0] ** 2 + topWallDirection[1] ** 2);
    const wallUnit = wallDistance > 0 ? [topWallDirection[0] / wallDistance, topWallDirection[1] / wallDistance] : [0, -1];

    // Direction from top corner towards final position
    const ceilingDirection = [
        finalPosition[0] - absoluteTopCornerPoint[0],
        finalPosition[1] - absoluteTopCornerPoint[1]
    ];
    const ceilingDistance = Math.sqrt(ceilingDirection[0] ** 2 + ceilingDirection[1] ** 2);
    const ceilingUnit = ceilingDistance > 0 ? [ceilingDirection[0] / ceilingDistance, ceilingDirection[1] / ceilingDistance] : [0, 1];

    // Calculate all top corner positions
    const topStartDistance = top.startDistance || 0;
    const topEndDistance = top.endDistance || 0;
    const topFirstControlDistance = top.firstControlDistance || 0;
    const topLastControlDistance = top.lastControlDistance || 0;

    // start point
    topPoints.push(new Vector2(
        absoluteTopCornerPoint[0] + topStartDistance * wallUnit[0],
        absoluteTopCornerPoint[1] + topStartDistance * wallUnit[1]
    ));

    // first control point
    topPoints.push(new Vector2(
        absoluteTopCornerPoint[0] + topFirstControlDistance * wallUnit[0],
        absoluteTopCornerPoint[1] + topFirstControlDistance * wallUnit[1]
    ));

    // last control point
    topPoints.push(new Vector2(
        absoluteTopCornerPoint[0] + topLastControlDistance * ceilingUnit[0],
        absoluteTopCornerPoint[1] + topLastControlDistance * ceilingUnit[1]
    ));

    // end point
    topPoints.push(new Vector2(
        absoluteTopCornerPoint[0] + topEndDistance * ceilingUnit[0],
        absoluteTopCornerPoint[1] + topEndDistance * ceilingUnit[1]
    ));

    //* Bezier Curve Generation:
    const bottomCurve = new CubicBezierCurve(bottomPoints[0], bottomPoints[1], bottomPoints[2], bottomPoints[3]);
    const topCurve = new CubicBezierCurve(topPoints[0], topPoints[1], topPoints[2], topPoints[3]);

    // now we get points from the curves
    const bottomCurvePoints = bottomCurve.getPoints(10);
    const topCurvePoints = topCurve.getPoints(10);
    // map over the points and push them to the points array, dont forget to add the id
    // for the wall we take the last point of the bottom and first of the top 
    bottomCurvePoints.forEach((point) => {
        const isLast = point === bottomCurvePoints[bottomCurvePoints.length - 1];
        pushWithId(point.x, point.y, isLast ? 2 : 3); // section 2: bottom corner
    });
    topCurvePoints.forEach((point) => {
        const isFirst = point === topCurvePoints[0];
        pushWithId(point.x, point.y, isFirst ? 3 : 4); // section 3: top corner
    });

    // we are now at the top of the corner and need to head towards the peak

    // now we are at the top of the corner and attach the wall points
    if (config.wall?.points && config.wall.height) {
        attachTransformed(points, last(), config.wall.points, 3); // section 3: wall
    }
    // now we are at the top of the wall and attach the top corner points
    if (
        config.topCorner?.radius &&
        config.topCorner.radius > 0 &&
        config.topCorner.points
    ) {
        attachTransformed(points, last(), config.topCorner.points, 4); // section 4: topCorner
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
    pushWithId(last()[0] + ceilingLength * Math.cos(ceilingAngle), last()[1] + ceilingLength * Math.sin(ceilingAngle), 5); // section 5: ceiling

    // add the soffit points
    if (config.soffit?.points && config.soffit.points.length > 0) {
        attachTransformed(points, last(), config.soffit.points, 6); // section 6: soffit
    }
    // add the skylight points
    if (config.skylight?.points && config.skylight.points.length > 0) {
        attachTransformed(points, last(), config.skylight.points, 7); // section 7: skylight
    }
    //because of the skylight we probably arent at the final position and thats ok

    return points;
}
