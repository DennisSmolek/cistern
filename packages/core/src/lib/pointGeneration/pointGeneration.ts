import { makePedestal, makeSoffit, makeTrim } from "./sectionUtils";
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
            ceilingTrim: defaultTrimConfig,
            floorTrim: defaultTrimConfig,
            railTrim: defaultTrimConfig,
        },
        soffit: {
            height: 0,
            radius: 0.185,
            dropAngle: 0,
            inset: 0.125,
            insetHeight: 0.125,
            points: [] as Points,
        },
        skylight: {
            radius: baseConfig.skylightRadius || 0,
            topRadius: baseConfig.skylightRadius || 0,
            depth: 0.25,
            points: [] as Points,
            topLip: 0.125,
        },
    };

    return config;
}

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

export function mergeConfigs(config1: Partial<AdvancedConfig>, config2: Partial<AdvancedConfig>): AdvancedConfig {
    return deepMerge<AdvancedConfig>(config1 || {}, config2 || {});
}

export function generateRawPoints(config: AdvancedConfig): Points {
    const points: Points = [];
    const { last, pushWithId } = createPointTracker(points);

    if (config.pedestal?.height && config.pedestal.height > 0) {
        const pedestalPoints = makePedestal(config.pedestal);
        attachTransformed(points, [0, 0], pedestalPoints, 0);

    } else {
        pushWithId(0, 0, 1);
    }
    const floorOrigin = last();

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

    bottomCurvePoints.forEach((point) => {
        const isLast = point === bottomCurvePoints[bottomCurvePoints.length - 1];
        pushWithId(point.x, point.y, isLast ? 3 : 2);
    });

    if (config.wall?.floorTrim?.size && config.wall.floorTrim.size > 0) {
        const floorTrimPoints = makeTrim(config.wall.floorTrim);
        attachTransformed(points, last(), floorTrimPoints, 2);
    }
    if (config.wall?.railTrim?.size && config.wall.railTrim.size > 0) {
        const railTrimPoints = makeTrim(config.wall.railTrim);
        attachTransformed(points, last(), railTrimPoints, 2);
    }
    if (config.wall?.ceilingTrim?.size && config.wall.ceilingTrim.size > 0) {
        const ceilingTrimPoints = makeTrim(config.wall.ceilingTrim);
        attachTransformed(points, last(), ceilingTrimPoints, 2);
    }

    topCurvePoints.forEach((point) => {
        const isFirst = point === topCurvePoints[0];
        pushWithId(point.x, point.y, isFirst ? 3 : 4);
    });

    const ceilingEdge = last();

    const deltaX = finalPosition[0] - ceilingEdge[0];
    const deltaY = finalPosition[1] - ceilingEdge[1];
    let ceilingLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const ceilingAngle = Math.atan2(deltaY, deltaX);

    if (config.skylight?.radius && config.skylight.radius > 0) ceilingLength -= config.skylight.radius;
    if (config.soffit?.radius && config.soffit.radius > 0) ceilingLength -= config.soffit.radius;

    pushWithId(last()[0] + ceilingLength * Math.cos(ceilingAngle), last()[1] + ceilingLength * Math.sin(ceilingAngle), 5);

    if (config.soffit) {
        const soffitPts = (config.soffit.points && config.soffit.points.length > 0)
            ? config.soffit.points
            : makeSoffit(config.soffit, ceilingAngle);
        if (soffitPts && soffitPts.length > 0) attachTransformed(points, last(), soffitPts, 6);
    }
    if (config.skylight?.radius && config.skylight.radius > 0) {
        const skylightHeight = (config.skylight?.depth || 0) + (config.soffit?.height || 0);
        pushWithId(config.skylight?.topRadius || last()[0], last()[1] + skylightHeight, 7);
        if (config.skylight?.topLip && config.skylight.topLip > 0) {
            pushWithId(last()[0] + config.skylight.topLip, last()[1], 7);
        }
    }

    return points;
}
