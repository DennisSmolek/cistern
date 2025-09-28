import { Float32BufferAttribute, BufferGeometry, Vector2, Vector3, MathUtils } from "three/webgpu";
import { generateRawPoints, } from "./pointGeneration";
import { mergeConfigs, getConfigFromBase } from "./config";
import { defaultBaseConfig } from "./defaults";
import { CisternConfig } from "..";
import { circleToUV } from "./utils/threeUtils";

export class CisternGeometry extends BufferGeometry {
    declare parameters: {
        points: Array<Vector2 | Vector3>;
        segments: number;
        phiStart: number;
        phiLength: number;
    };

    declare type: string;
    activeConfig: CisternConfig;
    activeGenerationPoints: Vector2[];
    activeSegmentMap: number[];
    segmentCounts: number[] = [];

    get maxRadius() {
        if (!this.activeConfig.root) return 0;
        // the top and bottom radius of the activeConfig
        return Math.max(this.activeConfig.root.topRadius || 0, this.activeConfig.root.bottomRadius || 0);
    }


    constructor(points: Vector2[] = [], segments = 36, phiStart = 0, phiLength = Math.PI * 2, inputConfig?: CisternConfig) {
        super();
        this.type = 'CisternGeometry';
        this.activeConfig = getConfigFromBase(defaultBaseConfig);
        this.activeGenerationPoints = [];
        this.activeSegmentMap = [];
        this.parameters = { points, segments, phiStart, phiLength };
        if (points && points.length > 0) this.generateFromPoints(points as Vector2[]);
        else this.updateConfig(inputConfig || this.activeConfig);
    }

    updateConfig(config: Partial<CisternConfig>) {
        const newConfig = mergeConfigs(this.activeConfig, config);
        const points = this.generateFromConfig(newConfig);
        return { config: newConfig, points: points };
    }

    generateFromConfig(config: CisternConfig): Vector2[] {
        const pointsAsArrays = generateRawPoints(config);
        const points = pointsAsArrays.map(point => new Vector2(point[0], point[1]));
        const segmentMap = pointsAsArrays.map(point => point[2] ?? -1);
        // build segment counts
        this.segmentCounts = segmentMap.reduce((counts, segmentId) => {
            counts[segmentId] = (counts[segmentId] || 0) + 1;
            return counts;
        }, [] as number[]);
        this.activeConfig = config;
        this.activeSegmentMap = segmentMap;
        this.generateFromPoints(points);
        return points;
    }

    generateFromPoints(points: Vector2[]) {
        this.parameters.points = points;
        this.activeGenerationPoints = points;
        const { segments, phiStart, phiLength } = this.parameters;
        this.buildGeometry(points, segments, phiStart, phiLength);
    }

    private buildGeometry(points: Vector2[], segmentsIn: number, phiStartIn: number, phiLengthIn: number) {
        const segments = Math.floor(segmentsIn);
        const phiLength = MathUtils.clamp(phiLengthIn, 0, Math.PI * 2);
        const phiStart = phiStartIn;

        const indices: number[] = [];
        const vertices: number[] = [];
        const uvs: number[] = [];
        const circularUVs: number[] = [];
        const sectionPercentages: number[] = [];
        const initNormals: number[] = [];
        const normals: number[] = [];
        const sectionIds: number[] = [];

        const inverseSegments = 1.0 / segments;
        const vertex = new Vector3();
        const uv = new Vector2();
        const normal = new Vector3();
        const curNormal = new Vector3();
        const prevNormal = new Vector3();
        let dx = 0;
        let dy = 0;

        //* Initial Normal Generation ====--

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
        let currentSection = 0;
        let currentSectionIndex = 0;

        //* Final Vertex & UV Generation ====--
        for (let i = 0; i <= segments; i++) {
            const phi = phiStart + i * inverseSegments * phiLength;
            const sin = Math.sin(phi);
            const cos = Math.cos(phi);
            for (let j = 0; j <= (points.length - 1); j++) {
                // Position
                vertex.x = points[j].x * sin;
                vertex.y = points[j].y;
                vertex.z = points[j].x * cos;
                vertices.push(vertex.x, vertex.y, vertex.z);

                // Regular UVs
                uv.x = i / segments;
                uv.y = j / (points.length - 1);
                uvs.push(uv.x, uv.y);

                // Circular UVs
                const circularUV = circleToUV(vertex.x, vertex.z, this.maxRadius);
                circularUVs.push(circularUV.x, circularUV.y);

                // Normals
                const x = initNormals[3 * j + 0] * sin;
                const y = initNormals[3 * j + 1];
                const z = initNormals[3 * j + 0] * cos;
                normals.push(- x, - y, - z);

                // Section IDs
                const sectionIndex = this.activeSegmentMap[j];
                sectionIds.push(sectionIndex);
                // Position within the section
                // reset as we progress through the sections
                if (sectionIndex !== currentSection) {
                    currentSection = sectionIndex;
                    currentSectionIndex = 0;
                }
                sectionPercentages.push(currentSectionIndex / this.segmentCounts[currentSection]);
                currentSectionIndex++;
            }
        }

        //* Index Generation ====--
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < (points.length - 1); j++) {
                const base = j + i * points.length;
                const a = base;
                const b = base + points.length;
                const c = base + points.length + 1;
                const d = base + 1;
                indices.push(a, d, b);
                indices.push(c, b, d);
            }
        }

        this.setIndex(indices);
        this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        this.setAttribute('circularUV', new Float32BufferAttribute(circularUVs, 2));
        this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        this.setAttribute('sectionId', new Float32BufferAttribute(sectionIds, 1));
        this.setAttribute('sectionPercentage', new Float32BufferAttribute(sectionPercentages, 1));
    }

    copy(source: CisternGeometry) {
        super.copy(source);
        this.parameters = Object.assign({}, source.parameters);
        return this;
    }

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


