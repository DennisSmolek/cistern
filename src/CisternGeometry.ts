// This file started as a direct copy of the LatheGeometry class in three.js
// https://github.com/mrdoob/three.js/blob/master/src/geometries/LatheGeometry.js


import { Float32BufferAttribute, BufferGeometry, Vector2, Vector3, MathUtils } from "three/webgpu";
import { AdvancedConfig, generateRawPoints } from "./pointGeneration";

/**
 * Creates meshes with axial symmetry like vases. The lathe rotates around the Y axis.
 *
 * ```js
 * const points = [];
 * for ( let i = 0; i < 10; i ++ ) {
 * 	points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * 10 + 5, ( i - 5 ) * 2 ) );
 * }
 * const geometry = new THREE.LatheGeometry( points );
 * const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
 * const lathe = new THREE.Mesh( geometry, material );
 * scene.add( lathe );
 * ```
 *
 * @augments BufferGeometry
 */
export class CisternGeometry extends BufferGeometry {
    declare parameters: {
        points: Array<Vector2 | Vector3>;
        segments: number;
        phiStart: number;
        phiLength: number;
    };

    declare type: string;
    activeConfig: AdvancedConfig;
    activeGenerationPoints: Vector2[];
    activeSegmentMap: number[];
    /**
     * Constructs a new lathe geometry.
     *
     * @param {Array<Vector2|Vector3>} [points] - An array of points in 2D space. The x-coordinate of each point
     * must be greater than zero.
     * @param {number} [segments=24] - The number of circumference segments to generate.
     * @param {number} [phiStart=0] - The starting angle in radians.
     * @param {number} [phiLength=Math.PI*2] - The radian (0 to 2PI) range of the lathed section 2PI is a
     * closed lathe, less than 2PI is a portion.
     */
    constructor(points = [new Vector2(0, - 0.5), new Vector2(0.5, 0), new Vector2(0, 0.5)], segments = 36, phiStart = 0, phiLength = Math.PI * 2) {

        super();

        this.type = 'CisternGeometry';
        this.activeConfig = {};
        this.activeGenerationPoints = [];
        this.activeSegmentMap = [];
        /**
         * Holds the constructor parameters that have been
         * used to generate the geometry. Any modification
         * after instantiation does not change the geometry.
         *
         * @type {Object}
         */
        this.parameters = {
            points: points,
            segments: segments,
            phiStart: phiStart,
            phiLength: phiLength
        };

        // initial build
        this.generateFromPoints(points);

    }

    /**
     * Generate from an advanced config
     */
    generateFromConfig(config: AdvancedConfig) {
        const pointsAsArrays = generateRawPoints(config);
        // convert the arrays to vectors
        const points = pointsAsArrays.map(point => new Vector2(point[0], point[1]));
        const segmentMap = pointsAsArrays.map(point => point[2]);
        this.activeConfig = config;
        this.activeGenerationPoints = points;
        this.activeSegmentMap = segmentMap;
        this.generateFromPoints(points);
    }

    /**
     * Re-generate the geometry with new points using existing parameters
     */
    generateFromPoints(points: Vector2[]) {
        // update stored points
        this.parameters.points = points;

        const { segments, phiStart, phiLength } = this.parameters;
        this.buildGeometry(points, segments, phiStart, phiLength);
    }

    /**
     * Internal builder used by constructor and generate()
     */
    private buildGeometry(points: Vector2[], segmentsIn: number, phiStartIn: number, phiLengthIn: number) {
        // normalize inputs
        const segments = Math.floor(segmentsIn);
        const phiLength = MathUtils.clamp(phiLengthIn, 0, Math.PI * 2);
        const phiStart = phiStartIn;

        console.log('segments', segments);

        // buffers
        const indices: number[] = [];
        const vertices: number[] = [];
        const uvs: number[] = [];
        const initNormals: number[] = [];
        const normals: number[] = [];
        const sectionIds: number[] = [];

        // helper variables
        const inverseSegments = 1.0 / segments;
        const vertex = new Vector3();
        const uv = new Vector2();
        const normal = new Vector3();
        const curNormal = new Vector3();
        const prevNormal = new Vector3();
        let dx = 0;
        let dy = 0;

        // pre-compute normals for initial "meridian"
        for (let j = 0; j <= (points.length - 1); j++) {
            switch (j) {
                case 0:
                    dx = points[j + 1].x - points[j].x;
                    dy = points[j + 1].y - points[j].y;
                    normal.x = dy * 1.0;
                    normal.y = - dx;
                    normal.z = dy * 0.0;
                    prevNormal.copy(normal);
                    normal.normalize();
                    initNormals.push(normal.x, normal.y, normal.z);
                    break;
                case (points.length - 1):
                    initNormals.push(prevNormal.x, prevNormal.y, prevNormal.z);
                    break;
                default:
                    dx = points[j + 1].x - points[j].x;
                    dy = points[j + 1].y - points[j].y;
                    normal.x = dy * 1.0;
                    normal.y = - dx;
                    normal.z = dy * 0.0;
                    curNormal.copy(normal);
                    normal.x += prevNormal.x;
                    normal.y += prevNormal.y;
                    normal.z += prevNormal.z;
                    normal.normalize();
                    initNormals.push(normal.x, normal.y, normal.z);
                    prevNormal.copy(curNormal);
            }
        }

        // generate vertices, uvs and normals
        for (let i = 0; i <= segments; i++) {
            const phi = phiStart + i * inverseSegments * phiLength;
            const sin = Math.sin(phi);
            const cos = Math.cos(phi);
            for (let j = 0; j <= (points.length - 1); j++) {
                // vertex
                vertex.x = points[j].x * sin;
                vertex.y = points[j].y;
                vertex.z = points[j].x * cos;
                vertices.push(vertex.x, vertex.y, vertex.z);
                // uv
                uv.x = i / segments;
                uv.y = j / (points.length - 1);
                uvs.push(uv.x, uv.y);
                // normal
                const x = initNormals[3 * j + 0] * sin;
                const y = initNormals[3 * j + 1];
                const z = initNormals[3 * j + 0] * cos;
                normals.push(x, y, z);

                // section id
                const sectionIndex = this.activeSegmentMap[j];
                if (sectionIndex !== undefined) {
                    sectionIds.push(sectionIndex);
                }
            }
        }

        // indices
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < (points.length - 1); j++) {
                const base = j + i * points.length;
                const a = base;
                const b = base + points.length;
                const c = base + points.length + 1;
                const d = base + 1;
                // faces
                indices.push(a, b, d);
                indices.push(c, d, b);
            }
        }

        // build geometry (overwrite attributes)
        this.setIndex(indices);
        this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        this.setAttribute('sectionId', new Float32BufferAttribute(sectionIds, 1));
    }

    copy(source: CisternGeometry) {

        super.copy(source);

        this.parameters = Object.assign({}, source.parameters);

        return this;

    }

    /**
     * Factory method for creating an instance of this class from the given
     * JSON object.
     *
     * @param {Object} data - A JSON object representing the serialized geometry.
     * @return {LatheGeometry} A new instance.
     */
    static fromJSON(data: unknown) {
        const { points, segments, phiStart, phiLength } = data as {
            points: Array<Vector2>;
            segments: number;
            phiStart: number;
            phiLength: number;
        };

        return new CisternGeometry(points, segments, phiStart, phiLength);

    }

}
