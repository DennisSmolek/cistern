import { proxy } from "valtio";
import * as THREE from "three";

const defaultPointCounts = {
    corner: 10,
    wall: 2,
    pedestal: 3,
    soffit: 6,
};

type BaseConfig = {
    radius: number;
    cornerRadius: number;
    height: number;
    peak: number;
    pedestalRadius: number;
    pedestalHeight: number;
};

const baseConfig = {
    radius: 3,
    cornerRadius: 0.5,
    height: 0.5,
    peak: 0.0125,
    pedestalRadius: 0.5,
    pedestalHeight: 0.0125,
};
const rootOverrides = {
    wallAngle: 90,
    ceilingAngle: 90,
    floorAngle: 0,
};

type CornerConfig = {
    radius: number;
    angle: number;
    points: THREE.Vector2[];
};

type AdvancedConfig = {
    root: {
        wallAngle: number;
        ceilingAngle: number;
        floorAngle: number;
    };
    pedestal: {
        height: number;
        radius: number;
        angle: number;
        points: THREE.Vector2[];
        inset: number;
        insetHeight: number;
    };
    bottomCorner: CornerConfig;
    topCorner: CornerConfig;

    wall: {
        height: number;
        points: THREE.Vector2[];
    };
    soffit: {
        height: number;
        radius: number;
        inset: number;
        insetHeight: number;
        points: THREE.Vector2[];
    };
    skylight: {
        radius: number;
        depth: number;
        points: THREE.Vector2[];
    };
};

const advancedConfig = {
    root: rootOverrides,
    pedestal: {
        height: 0.5,
        radius: 0.5,
        angle: 0,
        points: [],
        inset: 0.125,
        insetHeight: 0.125,
    },
    bottomCorner: {
        radius: 0.5,
        angle: 90,
        points: [],
    },
    topCorner: {
        radius: 0.5,
        angle: 90,
        points: [],
    },
    wall: {
        height: 0.5,
        points: [],
    },
    soffit: {
        height: 0.5,
        radius: 0.5,
        inset: 0.125,
        insetHeight: 0.125,
        points: [],
    },
    skylight: {
        radius: 0.5,
        depth: 0.125,
        points: [],
    },
};

export const controlState = proxy({
    base: baseConfig,
    points: [],
    activeConfig: advancedConfig,
});

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
            wallAngle: 90,
            ceilingAngle: 90,
            floorAngle: 0,
        },
        pedestal: {
            height: baseConfig.pedestalHeight,
            radius: baseConfig.pedestalRadius,
            angle: 0,
            points: [] as THREE.Vector2[],
            inset: 0.125,
            insetHeight: 0.125,
        },
        bottomCorner: {
            radius: baseConfig.cornerRadius,
            angle: 90,
            points: [] as THREE.Vector2[],
        },
        topCorner: {
            radius: baseConfig.cornerRadius,
            angle: 90,
            points: [] as THREE.Vector2[],
        },
        wall: {
            height: baseConfig.height - baseConfig.radius * 2,
            points: [] as THREE.Vector2[],
        },
        soffit: {
            height: 0,
            radius: 0,
            inset: 0.125, // Default inset value
            insetHeight: 0.125, // Default inset height
            points: [] as THREE.Vector2[],
        },
        skylight: {
            radius: baseConfig.pedestalRadius, // Skylight is typically smaller than full radius
            depth: baseConfig.peak,
            points: [] as THREE.Vector2[],
        },
    };

    // Generate points for each section
    generatePoints(config);

    return config;
}

/*
 * Helper function factory that creates a last() function for getting the most recent point
 */
function createPointTracker(pointsArray: THREE.Vector2[]) {
    return {
        last: () => pointsArray[pointsArray.length - 1],
        push: (point: THREE.Vector2) => pointsArray.push(point),
    };
}

/*
 * Generates points for each section of the advanced config
 * Each section starts at (0,0) locally
 */
function generatePoints(config: AdvancedConfig): void {
    //* Pedestal Points ==============================
    // Pedestals are tables we only make points if the height is above 0
    /*
    ________
           _|
          |_
    */
    if (config.pedestal.height > 0) {
        const { last, push } = createPointTracker(config.pedestal.points);
        const angle = config.pedestal.angle;
        const radius = config.pedestal.radius;
        const height = config.pedestal.height;
        const inset = config.pedestal.inset;
        const insetHeight = config.pedestal.insetHeight;

        // Convert angle to radians (assuming angle is in degrees)
        const angleRad = (angle * Math.PI) / 180;

        // initial point at origin
        push(new THREE.Vector2(0, 0));

        // extend X by radius, taking into account the angle property in the negative direction
        // so if angle is 2 degrees, we go out radius but down 2 degrees
        push(
            new THREE.Vector2(
                radius * Math.cos(-angleRad),
                radius * Math.sin(-angleRad)
            )
        );

        // go "down" relative to our current position a straight 90 degrees
        // and go down height-insetHeight
        push(new THREE.Vector2(last().x, last().y - (height - insetHeight)));

        // cut back in 90 degrees parallel to the top a distance of inset towards the origin
        push(new THREE.Vector2(last().x - inset, last().y));

        // drop insetHeight
        push(new THREE.Vector2(last().x, last().y - insetHeight));

        // finally extend out insetDistance  towards the radius direction
        push(
            new THREE.Vector2(
                last().x + inset * Math.cos(-angleRad),
                last().y + inset * Math.sin(-angleRad)
            )
        );
    }
    //* Bottom Corner Points ==============================
    if (config.bottomCorner.radius > 0) makeCorner(config.bottomCorner);

    //* Wall Points ==============================
    // Starting at (0,0) - wall logic goes here
    //* Top Corner Points ==============================
    if (config.topCorner.radius > 0) makeCorner(config.topCorner, "top");
    //* Soffit Points ==============================
    // Starting at (0,0) - soffit logic goes here
    //* Skylight Points ==============================
    // Starting at (0,0) - skylight logic goes here
}

function makeCorner(config: CornerConfig, type = "bottom"): void {
    // The corner starts at 0,0 and creates an arc to a rotated position
    // First point is always (0,0) for proper offset tracking when connecting sections

    const radius = config.radius;
    const angle = config.angle;
    const { push } = createPointTracker(config.points);

    // Convert angle to radians
    const angleRad = (angle * Math.PI) / 180;

    // Determine arc center based on corner type
    // Bottom corner: arc center is above (0, radius) so arc goes from (0,0) to rotated position
    // Top corner: arc center is below (0, -radius) so arc goes from (0,0) to rotated position
    const arcCenterY = type === "bottom" ? radius : -radius;
    const arcCenter = new THREE.Vector2(0, arcCenterY);

    // Determine start and end angles based on corner type
    // Bottom corner: start at -90° (pointing down), end at angle° - 90°
    // Top corner: start at 90° (pointing up), end at 90° - angle°
    const startAngle = type === "bottom" ? -Math.PI / 2 : Math.PI / 2;
    const endAngle =
        type === "bottom" ? angleRad - Math.PI / 2 : Math.PI / 2 - angleRad;

    // Always start at (0,0)
    push(new THREE.Vector2(0, 0));

    // Generate remaining arc points using default point count
    const pointCount = defaultPointCounts.corner;
    for (let i = 1; i <= pointCount; i++) {
        const t = i / pointCount; // interpolation factor (0 to 1)
        const currentAngle = startAngle + (endAngle - startAngle) * t;

        // Calculate point on arc
        const x = arcCenter.x + radius * Math.cos(currentAngle);
        const y = arcCenter.y + radius * Math.sin(currentAngle);

        push(new THREE.Vector2(x, y));
    }
}
