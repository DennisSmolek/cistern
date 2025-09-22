import { makePedestal, makeSoffit } from "./sectionUtils";
import { makeTrim } from "./sectionUtils";
import { makeCornerCurveFromPoints } from "./curveUtils";
import { deepMerge, createPointTracker } from "./utils";
import type { BaseConfig, AdvancedConfig, TrimConfig, Points, SinglePoint } from "./types";



const defaultTrimConfig: TrimConfig = {
    size: 0.25,
    depth: -0.125,
    bevelOuter: true,
    bevelTopInner: true,
    bevelBottomInner: true,
    bevelSize: 0.0125,
    offset: 0,
    startFrom: 'bottom',
}






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

export function getConfigFromBase(baseConfig: BaseConfig): AdvancedConfig {
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
            ceilingTrim: defaultTrimConfig,//
            floorTrim: defaultTrimConfig,
            railTrim: defaultTrimConfig,//
        },
        soffit: {
            height: 0,
            radius: 0.185,
            dropAngle: 0,
            inset: 0.125, // Default inset value
            insetHeight: 0.125, // Default inset height
            points: [] as Points,
        },
        skylight: {
            radius: baseConfig.skylightRadius || 0, // Skylight is typically smaller than full radius
            topRadius: baseConfig.skylightRadius || 0,
            depth: 0.25,
            points: [] as Points,
            topLip: 0.125,
        },
    };

    // Generate points for each section

    return config;
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

    // if we have a pedestal, move up pedestal height
    if (config.pedestal?.height && config.pedestal.height > 0) {
        // make pedestal points
        const pedestalPoints = makePedestal(config.pedestal);
        // attach the pedestal points
        attachTransformed(points, [0, 0], pedestalPoints, 0);

    } else {
        //start at origin
        pushWithId(0, 0, 1); // section 1: floor
    }
    const floorOrigin = last();

    //* CORNER MADNESS ==== */
    // we do the corners no matter what now
    // first we have to get the points and curve data we need
    // extend out from the last position floorLength to the bottom height, but dont add it yet
    const absoluteBottomCornerPoint = [config.root?.bottomRadius || 0, config.root?.bottomHeight || last()[1]];
    // the top corner is the bottom plus topHeight and topRadius
    // we cant just push that yet but we can store it
    const absoluteTopCornerPoint = [config.root?.topRadius || 0, config.root?.topHeight || 0];
    const finalPosition = [0, config.root?.height || 10];


    const bottom = config.bottomCorner;
    const top = config.topCorner;
    if (!bottom || !top) throw new Error('Bottom and top corners are required to generate points!');


    //* CORNER POSITION CALCULATIONS ==============================

    // Calculate bottom corner positions
    // Build bottom bezier curve
    const bottomCurve = makeCornerCurveFromPoints(
        absoluteBottomCornerPoint,
        [floorOrigin[0], floorOrigin[1]],
        absoluteTopCornerPoint,
        {
            start: bottom.startDistance || 0,
            firstControl: bottom.firstControlDistance || 0,
            lastControl: bottom.lastControlDistance || 0,
            end: bottom.endDistance || 0,
        }
    );


    // Calculate top corner positions

    // Build top bezier curve
    const topCurve = makeCornerCurveFromPoints(
        absoluteTopCornerPoint,
        absoluteBottomCornerPoint,
        finalPosition,
        {
            start: top.startDistance || 0,
            firstControl: top.firstControlDistance || 0,
            lastControl: top.lastControlDistance || 0,
            end: top.endDistance || 0,
        }
    );

    //* Bezier Curve Sampling:

    // now we get points from the curves
    const bottomCurvePoints = bottomCurve.getPoints(10);
    const topCurvePoints = topCurve.getPoints(10);
    // map over the points and push them to the points array, dont forget to add the id
    // for the wall we take the last point of the bottom and first of the top 
    bottomCurvePoints.forEach((point) => {
        const isLast = point === bottomCurvePoints[bottomCurvePoints.length - 1];
        pushWithId(point.x, point.y, isLast ? 3 : 2); // section 2: bottom corner
    });
    //* Wall Handling ==============================
    // We have trim and rails to add
    // base trim
    if (config.wall?.floorTrim?.size && config.wall.floorTrim.size > 0) {
        const floorTrimPoints = makeTrim(config.wall.floorTrim);
        // console.log('Generating floor trim', config.wall.floorTrim, floorTrimPoints);

        attachTransformed(points, last(), floorTrimPoints, 2); // section 2: bottom corner
    }
    // rail trim
    if (config.wall?.railTrim?.size && config.wall.railTrim.size > 0) {
        const railTrimPoints = makeTrim(config.wall.railTrim);

        attachTransformed(points, last(), railTrimPoints, 2); // section 2: bottom corner
    }
    // ceiling trim
    if (config.wall?.ceilingTrim?.size && config.wall.ceilingTrim.size > 0) {
        // slight change here. we want to calculate the offset as if from the top.
        // so we need the size and how far from the top we are to calculate a new offsetusus
        const ceilingTrimPoints = makeTrim(config.wall.ceilingTrim);
        // console.log('Generating ceiling trim', config.wall.ceilingTrim, ceilingTrimPoints);

        attachTransformed(points, last(), ceilingTrimPoints, 2); // section 2: bottom corner
    }


    // * Top Corner Handling ==============================
    topCurvePoints.forEach((point) => {
        const isFirst = point === topCurvePoints[0];
        pushWithId(point.x, point.y, isFirst ? 3 : 4); // section 3: top corner
    });

    // we are now at the top of the corner and need to head towards the peak
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

    // add the soffit points (generate if not provided but soffit is configured)
    if (config.soffit) {
        const soffitPts = (config.soffit.points && config.soffit.points.length > 0)
            ? config.soffit.points
            : makeSoffit(config.soffit, ceilingAngle);
        if (soffitPts && soffitPts.length > 0) attachTransformed(points, last(), soffitPts, 6); // section 6: soffit
    }
    // add the skylight points
    if (config.skylight?.radius && config.skylight.radius > 0) {
        // section 7: skylight
        // we should be at the edge of the wall or the soffit and need to go up and make a lip
        const skylightHeight = (config.skylight?.depth || 0) + (config.soffit?.height || 0);
        //   console.log('skylightHeight', skylightHeight, config.soffit?.height);
        pushWithId(config.skylight?.topRadius || last()[0], last()[1] + skylightHeight, 7);
        // if we have a topLip move out x from last
        if (config.skylight?.topLip && config.skylight.topLip > 0) {
            pushWithId(last()[0] + config.skylight.topLip, last()[1], 7);
        }
    }
    //because of the skylight we probably arent at the final position and thats ok

    return points;
}
