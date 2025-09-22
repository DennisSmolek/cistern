import { createPointTracker } from "./utils";
import { PedestalConfig, Points } from "./pointGeneration";
import { makeBevelCurve } from "./curveUtils";
import type { SinglePoint, TrimConfig } from "./pointGeneration";


/*
 * Generates points for each section of the advanced config
 * Each section starts at (0,0) locally
 * 
 */

export function makePedestal(config: PedestalConfig): Points {
    // Pedestals are tables that start "on top" of the floor surface
    // They extend outward and then drop down to create a table-like structure
    const points: Points = [];

    const { last, pushArray } = createPointTracker(points);
    const height = config.height || 0;
    const outerHeight = config.outerHeight || height;
    const inset = config.inset || 0.125;
    const insetHeight = config.insetHeight || 0.125;
    const angle = config.dropAngle || 90;
    const radius = config.radius || 1;
    const angleRad = (angle * Math.PI) / 180;

    pushArray(0, 0);

    // initial point at origin (on top of floor surface)
    pushArray(0, height);

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
        last()[1]
    );
    return points;
}

export function makeSoffit(config: PedestalConfig, ceilingAngle?: number): Points {
    // Soffits are ceiling insets that start "on the ceiling"
    // They create a floating ceiling effect by going inward, down, outward, down, then inward again

    const points: Points = [];
    const { last, pushArray } = createPointTracker(points);
    const height = config.height || 0;
    const inset = config.inset || 0.125;
    const insetHeight = config.insetHeight || 0.125;
    const dropAngle = config.dropAngle || 90;
    const dropAngleRad = (dropAngle * Math.PI) / 180;
    const radius = config.radius || 0;

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
    // If ceilingAngle is provided, extend out at that angle, otherwise go flat (along x axis)
    if (typeof ceilingAngle === "number") {
        // Move outward by max(radius, inset) at the given ceiling angle
        pushArray(
            last()[0] + Math.max(radius, inset) * Math.cos(ceilingAngle),
            last()[1] + Math.max(radius, inset) * Math.sin(ceilingAngle)
        );
    } else {
        // Default: move flat along x axis
        pushArray(last()[0] - Math.max(radius, inset), last()[1]);
    }
    return points;
}

//* Make trim for a wall shape (assume vertical for now)
export function makeTrim(config: TrimConfig): Points {
    const points: Points = [];

    const trimBevelSize = config.bevelSize || 0.0125;
    const depth = config.depth || 0;
    const startFrom = config.startFrom || 'bottom';
    const offset = config.offset || 0;
    const size = config.size || 0;
    const bevelTopInner = config.bevelTopInner || false;
    const bevelBottomInner = config.bevelBottomInner || false;
    const bevelOuter = config.bevelOuter || false;
    const { last, pushArray } = createPointTracker(points);
    const trimDirection = depth > 0 ? 1 : -1;
    // because we will use assign later, these points are relative
    // origin
    pushArray(0, 0);
    // if we start from the top the direction is negative
    const direction = startFrom === 'top' ? -1 : 1;
    // if there is an offset go that direction that far
    pushArray(0, direction * offset);
    const outerCorner = [depth, direction * offset] as SinglePoint;
    const opositeOuterCorner = [outerCorner[0], outerCorner[1] + direction * size] as SinglePoint;
    // first bevel depends on where we start from
    const firstBevel = startFrom === 'top' ? bevelTopInner : bevelBottomInner;
    // if arent beveling inner (against the surface) add the insidepoint, 
    if (firstBevel) {
        // we are beveling, we are at point1, control is up bevelSize, then we go out
        // direction * bevelSize
        const startPoint = last();
        // go Y Direction by bevelSize
        const controlPoint = [last()[0], last()[1] + direction * trimBevelSize] as SinglePoint;
        const endPoint = [last()[0] + trimBevelSize * trimDirection, controlPoint[1]] as SinglePoint;
        // console.log('startPoint', startPoint);
        // console.log('controlPoint', controlPoint);
        // console.log('endPoint', endPoint);
        //  console.log('trimDirection', trimDirection);
        //  console.log('trimBevelSize', trimBevelSize);
        //  console.log('direction', direction);
        const curve = makeBevelCurve(startPoint, endPoint, controlPoint);
        const curvePoints = curve.getPoints(10);
        curvePoints.forEach((point) => {
            pushArray(point.x, point.y);
        });
    }
    // we are now at the outer edge of the bottom of the trim w/wo bevel
    // extend out depth
    pushArray(last()[0] + depth, last()[1]);
    // we bevel both corners regardless of top/bottom
    if (bevelOuter) {
        // Initial Corner
        // if we are at the bottom of the trim we round out
        const firstStartPoint = last();
        // go in/out on the x
        const firstControlPoint = [firstStartPoint[0] + (trimDirection * trimBevelSize), firstStartPoint[1]] as SinglePoint;
        // go up/down on the y towards the oposite corner
        const firstEndPoint = [firstControlPoint[0], firstControlPoint[1] + (direction * trimBevelSize)] as SinglePoint;
        const firstCurve = makeBevelCurve(firstStartPoint, firstEndPoint, firstControlPoint);
        const firstCurvePoints = firstCurve.getPoints(10);
        firstCurvePoints.forEach((point) => pushArray(point.x, point.y));
        // extend out size on the y
        pushArray(last()[0], last()[1] + size * direction);
        // Oposite Corner
        // we are on the outer edge of the trim and need to go back to the wall
        const secondStartPoint = last();
        // go up/down the y to get to the corner
        const secondControlPoint = [secondStartPoint[0], secondStartPoint[1] + (direction * trimBevelSize)] as SinglePoint;
        // goin/out on the x towards the wall
        const secondEndPoint = [secondControlPoint[0] - (trimDirection * trimBevelSize), secondControlPoint[1]] as SinglePoint;
        const secondCurve = makeBevelCurve(secondStartPoint, secondEndPoint, secondControlPoint);
        const secondCurvePoints = secondCurve.getPoints(10);
        secondCurvePoints.forEach((point) => {
            pushArray(point.x, point.y);
        });
    }
    // just add the outer points
    else {
        pushArray(outerCorner[0], outerCorner[1]);
        pushArray(opositeOuterCorner[0], opositeOuterCorner[1]);
    }
    // we should now be on the outer edge corner or just inside it after a bevel
    // extend back to the wall
    pushArray(last()[0] - depth, last()[1]);
    // now we potentially innerBevel
    const lastBevel = startFrom === 'top' ? bevelBottomInner : bevelTopInner;
    if (lastBevel) {
        // direction * bevelSize
        const controlPoint = [0, last()[1]] as SinglePoint;
        const endPoint = [controlPoint[0], controlPoint[1] + (direction * trimBevelSize)] as SinglePoint;
        const curve = makeBevelCurve(last(), endPoint, controlPoint);
        const curvePoints = curve.getPoints(10);
        curvePoints.forEach((point) => {
            pushArray(point.x, point.y);
        });
    }
    return points;
}