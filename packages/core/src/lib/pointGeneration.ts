import { makePedestal, makeSoffit, makeTrim } from "./utils/sectionUtils";
import { makeCornerCurveFromPoints } from "./utils/curveUtils";
import { createPointTracker, notZero } from "./utils";
import type { CisternConfig, Points, SinglePoint } from "../types";

/**
 * Applies a local sequence of points relative to a current position and appends
 * the transformed points into the main profile list.
 *
 * Notes:
 * - The first entry in `pointsToTransform` is treated as the local origin and is
 *   intentionally skipped. All subsequent points are translated by `currentPosition`.
 * - When `sectionId` is provided, the transformed point is stored as a tuple with
 *   the third value set to that section identifier.
 * - Returns the last appended position to enable chaining successive attachments.
 *
 * @param mainPoints - Mutable list of profile points; appended in-place.
 * @param currentPosition - The origin used to translate `pointsToTransform`.
 * @param pointsToTransform - The local points (polyline) to attach.
 * @param sectionId - Optional section classification to tag each appended point.
 * @returns The final position appended to `mainPoints`.
 * @internal
 */
function attachTransformed(
    mainPoints: Points,
    currentPosition: SinglePoint,
    pointsToTransform: Points,
    sectionId?: number
): SinglePoint {
    let finalPosition = [...currentPosition] as SinglePoint;

    for (let i = 1; i < pointsToTransform.length; i++) {
        const point = pointsToTransform[i];
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

        mainPoints.push(transformedPoint as SinglePoint);
        finalPosition = transformedPoint as SinglePoint;
    }

    return finalPosition;
}



/**
 * Generates the complete 2D profile polyline for a cistern, segmented into logical
 * sections for downstream geometry and material assignment.
 *
 * The profile proceeds in this general order (when enabled by `config`):
 * 1. Pedestal → Floor origin
 * 2. Bottom corner curve
 * 3. Wall trims (floor/rail/ceiling)
 * 4. Top corner curve
 * 5. Ceiling run
 * 6. Soffit
 * 7. Skylight
 *
 * Section identifiers used by the points:
 * - 0: Pedestal
 * - 1: Floor
 * - 2: Bottom corner curve
 * - 3: Lower wall / trims
 * - 4: Top corner curve
 * - 5: Ceiling run
 * - 6: Soffit
 * - 7: Skylight
 *
 * @param config - Parameterization for corners, trims, soffit, skylight, and dimensions.
 * @returns Ordered list of points as tuples `[x, y, sectionId?]`.
 * @throws Error if `bottomCorner` or `topCorner` is missing in `config`.
 * @public
 */
export function generateRawPoints(config: CisternConfig): Points {
    const points: Points = [];
    const { last, pushWithId } = createPointTracker(points);

    if (config.pedestal?.height && config.pedestal.height > 0) {
        attachTransformed(points, [0, 0], makePedestal(config.pedestal), 0);
    } else pushWithId(0, 0, 1);

    // for floor sections this actually needs to be tagged in 1
    const floorOrigin = last();
    pushWithId(floorOrigin[0], floorOrigin[1], 1);

    //* Corner Generation ====--
    // We actually dont use it all yet to account for trim

    const absoluteBottomCornerPoint = [config.root?.bottomRadius || 0, config.root?.bottomHeight || last()[1]];
    const absoluteTopCornerPoint = [config.root?.topRadius || 0, config.root?.topHeight || 0];
    const finalPosition = [0, config.root?.height || 10];

    const bottom = config.bottomCorner;
    const top = config.topCorner;
    if (!bottom || !top) throw new Error('Bottom and top corners are required to generate points!');

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

    const bottomCurvePoints = bottomCurve.getPoints(10);
    const topCurvePoints = topCurve.getPoints(10);
    // lets try backtracking a small amount to clear this weird blur glitch
    bottomCurvePoints.forEach((point) => {
        const isFirst = point === bottomCurvePoints[0];
        const isLast = point === bottomCurvePoints[bottomCurvePoints.length - 1];
        // double push first with previous section (weird blur glitch)
        if (isFirst) pushWithId(point.x, point.y, 1);
        pushWithId(point.x, point.y, 2);
        if (isLast) pushWithId(point.x, point.y, 3);
    });

    //* Trim Points ====--
    // we need to get the pitch between the bottom radius and top and pass it to trim
    // because of the offsets
    const angleDeltaX = absoluteTopCornerPoint[0] - absoluteBottomCornerPoint[0];
    const angleDeltaY = absoluteTopCornerPoint[1] - absoluteBottomCornerPoint[1];
    const wallAngle = Math.atan2(angleDeltaY, angleDeltaX);

    if (config.wall?.floorTrim?.size && config.wall.floorTrim.size > 0) {
        const floorTrimPoints = makeTrim(config.wall.floorTrim);
        attachTransformed(points, last(), floorTrimPoints, 3);
    }
    if (config.wall?.railTrim?.size && config.wall.railTrim.size > 0) {
        const railTrimPoints = makeTrim(config.wall.railTrim, wallAngle);
        attachTransformed(points, last(), railTrimPoints, 3);
    }
    if (config.wall?.ceilingTrim?.size && config.wall.ceilingTrim.size > 0) {
        const ceilingTrimPoints = makeTrim(config.wall.ceilingTrim);
        attachTransformed(points, last(), ceilingTrimPoints, 3);
    }

    topCurvePoints.forEach((point) => {
        const isFirst = point === topCurvePoints[0];
        const isLast = point === topCurvePoints[topCurvePoints.length - 1];
        if (isFirst) pushWithId(point.x, point.y, 3);
        pushWithId(point.x, point.y, 4);
        if (isLast) pushWithId(point.x, point.y, 5);
    });

    const ceilingEdge = last();

    const deltaX = finalPosition[0] - ceilingEdge[0];
    const deltaY = finalPosition[1] - ceilingEdge[1];
    let ceilingLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const ceilingAngle = Math.atan2(deltaY, deltaX);

    ceilingLength -= notZero(config.skylight?.radius) ?? 0;
    ceilingLength -= notZero(config.soffit?.radius) ?? 0;

    pushWithId(last()[0] + ceilingLength * Math.cos(ceilingAngle), last()[1] + ceilingLength * Math.sin(ceilingAngle), 5);

    if (config.soffit) {
        // push another but at id 6 to try and fix transition bug
        pushWithId(last()[0], last()[1], 6);
        const soffitPts = notZero(config.soffit.points) ?? makeSoffit(config.soffit, ceilingAngle);
        if (soffitPts && soffitPts.length > 0) attachTransformed(points, last(), soffitPts, 6);
    }
    if (notZero(config.skylight?.radius)) {
        const skylightHeight = (config.skylight?.depth || 0) + (config.soffit?.height || 0);
        // push another to break transition bug
        pushWithId(config.skylight?.topRadius || last()[0], last()[1] + skylightHeight, 6);
        pushWithId(config.skylight?.topRadius || last()[0], last()[1] + skylightHeight, 7);
        if (notZero(config.skylight?.topLip)) {
            pushWithId(last()[0] + (config.skylight?.topLip ?? 0), last()[1], 7);
        }
    }

    return points;
}
