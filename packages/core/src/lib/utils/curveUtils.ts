import { CubicBezierCurve, Vector2, Vector3 } from "three/webgpu";
import type { SinglePoint, Points } from "../pointGeneration/types";

function length(v: number[]): number {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

function toUnit(v: number[], fallback: number[]): number[] {
    const len = length(v);
    return len > 0 ? [v[0] / len, v[1] / len] : fallback;
}

export function makeVec2(point: SinglePoint): Vector2 {
    return new Vector2(point[0], point[1]);
}
export function makeVec2Id(point: SinglePoint, id: number): Vector3 {
    return new Vector3(point[0], point[1], id);
}
export function makePointsArray(points: Vector2[] | Vector3[], newId?: number): Points {
    return points.map((point) => {
        const newArray = [point.x, point.y];
        if (newId) newArray.push(newId);
        return newArray as SinglePoint;
    });
}
export function makeBevelCurve(
    startPoint: SinglePoint,
    endPoint: SinglePoint,
    controlPoint: SinglePoint
): CubicBezierCurve {
    return new CubicBezierCurve(makeVec2(startPoint), makeVec2(controlPoint), makeVec2(controlPoint), makeVec2(endPoint));
}

export function makeBezierCurve(
    startPoint: SinglePoint,
    endPoint: SinglePoint,
    firstControlPoint: SinglePoint,
    lastControlPoint: SinglePoint
): CubicBezierCurve {
    return new CubicBezierCurve(makeVec2(startPoint), makeVec2(firstControlPoint), makeVec2(lastControlPoint), makeVec2(endPoint));
}

export function makeCornerBezier(
    cornerPoint: number[],
    startDirectionUnit: number[],
    endDirectionUnit: number[],
    distances: { start: number; firstControl: number; lastControl: number; end: number }
): CubicBezierCurve {
    const p0 = new Vector2(
        cornerPoint[0] + distances.start * startDirectionUnit[0],
        cornerPoint[1] + distances.start * startDirectionUnit[1]
    );
    const p1 = new Vector2(
        cornerPoint[0] + distances.firstControl * startDirectionUnit[0],
        cornerPoint[1] + distances.firstControl * startDirectionUnit[1]
    );
    const p2 = new Vector2(
        cornerPoint[0] + distances.lastControl * endDirectionUnit[0],
        cornerPoint[1] + distances.lastControl * endDirectionUnit[1]
    );
    const p3 = new Vector2(
        cornerPoint[0] + distances.end * endDirectionUnit[0],
        cornerPoint[1] + distances.end * endDirectionUnit[1]
    );

    return new CubicBezierCurve(p0, p1, p2, p3);
}

export function makeCornerCurveFromPoints(
    cornerPoint: number[],
    startTowardPoint: number[],
    endTowardPoint: number[],
    distances: { start: number; firstControl: number; lastControl: number; end: number },
    fallbacks?: { startUnit?: number[]; endUnit?: number[] }
): CubicBezierCurve {
    const startVec = [startTowardPoint[0] - cornerPoint[0], startTowardPoint[1] - cornerPoint[1]];
    const endVec = [endTowardPoint[0] - cornerPoint[0], endTowardPoint[1] - cornerPoint[1]];
    const startUnit = toUnit(startVec, fallbacks?.startUnit || [1, 0]);
    const endUnit = toUnit(endVec, fallbacks?.endUnit || [0, 1]);
    return makeCornerBezier(cornerPoint, startUnit, endUnit, distances);
}
