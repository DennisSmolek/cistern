import { createPointTracker } from ".";
import { makeBevelCurve } from "./curveUtils";

export function makePedestal(config: PedestalConfig): Points {
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
    pushArray(0, height);
    pushArray(radius, outerHeight);

    const dropDistance = height - insetHeight;
    pushArray(
        last()[0] + dropDistance * Math.cos(-angleRad),
        last()[1] + dropDistance * Math.sin(-angleRad)
    );

    pushArray(last()[0] - inset, last()[1]);
    pushArray(last()[0], last()[1] - insetHeight);
    pushArray(last()[0] + inset, last()[1]);
    return points;
}

export function makeSoffit(config: PedestalConfig, ceilingAngle?: number): Points {
    const points: Points = [];
    const { last, pushArray } = createPointTracker(points);
    const height = config.height || 0;
    const inset = config.inset || 0.125;
    const insetHeight = config.insetHeight || 0.125;
    const dropAngle = config.dropAngle || 90;
    const dropAngleRad = (dropAngle * Math.PI) / 180;
    const radius = config.radius || 0;

    pushArray(0, 0);
    pushArray(last()[0] - inset, last()[1]);
    pushArray(
        last()[0] + insetHeight * Math.cos(-dropAngleRad),
        last()[1] + insetHeight * Math.sin(-dropAngleRad)
    );
    pushArray(last()[0] + inset, last()[1]);

    const dropDistance = height - insetHeight;
    pushArray(
        last()[0] + dropDistance * Math.cos(-dropAngleRad),
        last()[1] + dropDistance * Math.sin(-dropAngleRad)
    );

    if (typeof ceilingAngle === "number") {
        pushArray(
            last()[0] + Math.max(radius, inset) * Math.cos(ceilingAngle),
            last()[1] + Math.max(radius, inset) * Math.sin(ceilingAngle)
        );
    } else {
        pushArray(last()[0] - Math.max(radius, inset), last()[1]);
    }
    return points;
}

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

    pushArray(0, 0);
    const direction = startFrom === 'top' ? -1 : 1;
    pushArray(0, direction * offset);
    const outerCorner = [depth, direction * offset] as SinglePoint;
    const opositeOuterCorner = [outerCorner[0], outerCorner[1] + direction * size] as SinglePoint;
    const firstBevel = startFrom === 'top' ? bevelTopInner : bevelBottomInner;

    if (firstBevel) {
        const controlPoint = [last()[0], last()[1] + direction * trimBevelSize] as SinglePoint;
        const endPoint = [controlPoint[0], controlPoint[1]] as SinglePoint;
        const curve = makeBevelCurve(last(), endPoint, controlPoint);
        const curvePoints = curve.getPoints(10);
        curvePoints.forEach((point) => {
            pushArray(point.x, point.y);
        });
    }

    pushArray(last()[0] + depth, last()[1]);
    if (bevelOuter) {
        const firstStartPoint = last();
        const firstControlPoint = [firstStartPoint[0] + (trimDirection * trimBevelSize), firstStartPoint[1]] as SinglePoint;
        const firstEndPoint = [firstControlPoint[0], firstControlPoint[1] + (direction * trimBevelSize)] as SinglePoint;
        const firstCurve = makeBevelCurve(firstStartPoint, firstEndPoint, firstControlPoint);
        const firstCurvePoints = firstCurve.getPoints(10);
        firstCurvePoints.forEach((point) => pushArray(point.x, point.y));
        pushArray(last()[0], last()[1] + size * direction);
        const secondStartPoint = last();
        const secondControlPoint = [secondStartPoint[0], secondStartPoint[1] + (direction * trimBevelSize)] as SinglePoint;
        const secondEndPoint = [secondControlPoint[0] - (trimDirection * trimBevelSize), secondControlPoint[1]] as SinglePoint;
        const secondCurve = makeBevelCurve(secondStartPoint, secondEndPoint, secondControlPoint);
        const secondCurvePoints = secondCurve.getPoints(10);
        secondCurvePoints.forEach((point) => {
            pushArray(point.x, point.y);
        });
    } else {
        pushArray(outerCorner[0], outerCorner[1]);
        pushArray(opositeOuterCorner[0], opositeOuterCorner[1]);
    }
    pushArray(last()[0] - depth, last()[1]);
    const lastBevel = startFrom === 'top' ? bevelBottomInner : bevelTopInner;
    if (lastBevel) {
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
