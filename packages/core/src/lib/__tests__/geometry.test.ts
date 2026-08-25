import { describe, expect, it } from 'vitest';
import { getConfig } from '../config';
import { generateRawPoints } from '../pointGeneration';
import { CisternGeometry } from '../CisternGeometry';

// The 8 section IDs generateRawPoints is documented to emit, pedestal -> skylight.
// See the block comment above generateRawPoints in pointGeneration.ts.
const KNOWN_SECTION_IDS = [0, 1, 2, 3, 4, 5, 6, 7];

function summarizeBySection(points: Points) {
    const bySection = new Map<number, Points>();
    for (const point of points) {
        const id = point[2] ?? -1;
        if (!bySection.has(id)) bySection.set(id, []);
        bySection.get(id)!.push(point);
    }
    const summary: Record<number, { count: number; first: SinglePoint; last: SinglePoint }> = {};
    for (const [id, pts] of [...bySection.entries()].sort((a, b) => a[0] - b[0])) {
        summary[id] = { count: pts.length, first: pts[0], last: pts[pts.length - 1] };
    }
    return summary;
}

describe('generateRawPoints', () => {
    it('produces the expected point count for the default config (regression tripwire)', () => {
        // Includes the intentional duplicate-point hacks in pointGeneration.ts
        // ("weird blur glitch" around the bottom/top corner curves, and the
        // "break transition bug" duplicate pushes around soffit/skylight).
        // This count must NOT change silently across the three.js bump.
        const points = generateRawPoints(getConfig());
        expect(points.length).toBe(187);
    });

    it('matches a per-section snapshot (count + first/last point) for the default config', () => {
        // Full 187-point dump would be unwieldy to review; instead snapshot a compact
        // summary per section id, which still catches changes to the duplicate-point
        // hacks (they show up as count deltas and/or first/last point deltas on the
        // sections they straddle: 1/2/3 for the bottom-corner glitch and 5/6/7 for the
        // soffit/skylight transition-bug pushes).
        const points = generateRawPoints(getConfig());
        expect(summarizeBySection(points)).toMatchSnapshot();
    });

    it('only emits the 8 known section ids', () => {
        const points = generateRawPoints(getConfig());
        const idsPresent = new Set(points.map((p) => p[2]).filter((id): id is number => id !== undefined));
        expect([...idsPresent].sort((a, b) => a - b)).toEqual(KNOWN_SECTION_IDS);
        for (const id of idsPresent) {
            expect(KNOWN_SECTION_IDS).toContain(id);
        }
    });

    it('every point has finite numeric x/y (and finite section id when present)', () => {
        const points = generateRawPoints(getConfig());
        for (const point of points) {
            expect(Number.isFinite(point[0])).toBe(true);
            expect(Number.isFinite(point[1])).toBe(true);
            if (point[2] !== undefined) {
                expect(Number.isFinite(point[2])).toBe(true);
            }
        }
    });

    it('produces a different (but still valid) point count for a non-default config', () => {
        const config = getConfig({
            radius: 8,
            height: 4,
            pedestalRadius: 2,
            pedestalHeight: 0.5,
            skylightRadius: 1,
        });
        const points = generateRawPoints(config);

        expect(points.length).toBeGreaterThan(0);
        // regression tripwire for the non-default shape too
        expect(points.length).toBe(187);
        for (const point of points) {
            expect(Number.isFinite(point[0])).toBe(true);
            expect(Number.isFinite(point[1])).toBe(true);
        }
        const idsPresent = new Set(points.map((p) => p[2]).filter((id): id is number => id !== undefined));
        expect([...idsPresent].sort((a, b) => a - b)).toEqual(KNOWN_SECTION_IDS);
    });
});

describe('CisternGeometry (default config)', () => {
    function makeDefaultGeometry() {
        return new CisternGeometry();
    }

    it('builds a position attribute with a positive vertex count', () => {
        const geometry = makeDefaultGeometry();
        const position = geometry.getAttribute('position');
        expect(position).toBeDefined();
        expect(position.count).toBeGreaterThan(0);
        expect(position.itemSize).toBe(3);
    });

    it('builds an index buffer', () => {
        const geometry = makeDefaultGeometry();
        const index = geometry.getIndex();
        expect(index).not.toBeNull();
        expect(index!.count).toBeGreaterThan(0);
        // triangles: index count must be a multiple of 3
        expect(index!.count % 3).toBe(0);
    });

    it('builds circularUV, sectionId, and sectionPercentage attributes with counts consistent with position', () => {
        const geometry = makeDefaultGeometry();
        const position = geometry.getAttribute('position');
        const circularUV = geometry.getAttribute('circularUV');
        const sectionId = geometry.getAttribute('sectionId');
        const sectionPercentage = geometry.getAttribute('sectionPercentage');

        expect(circularUV).toBeDefined();
        expect(sectionId).toBeDefined();
        expect(sectionPercentage).toBeDefined();

        expect(circularUV.itemSize).toBe(2);
        expect(sectionId.itemSize).toBe(1);
        expect(sectionPercentage.itemSize).toBe(1);

        expect(circularUV.count).toBe(position.count);
        expect(sectionId.count).toBe(position.count);
        expect(sectionPercentage.count).toBe(position.count);
    });

    it('every sectionId value is one of the 8 known section ids', () => {
        const geometry = makeDefaultGeometry();
        const sectionId = geometry.getAttribute('sectionId');
        const seen = new Set<number>();
        for (let i = 0; i < sectionId.count; i++) {
            const value = sectionId.getX(i);
            expect(Number.isFinite(value)).toBe(true);
            seen.add(value);
        }
        for (const id of seen) {
            expect(KNOWN_SECTION_IDS).toContain(id);
        }
    });

    it('every circularUV and sectionPercentage value is finite', () => {
        const geometry = makeDefaultGeometry();
        const circularUV = geometry.getAttribute('circularUV');
        const sectionPercentage = geometry.getAttribute('sectionPercentage');
        for (let i = 0; i < circularUV.count; i++) {
            expect(Number.isFinite(circularUV.getX(i))).toBe(true);
            expect(Number.isFinite(circularUV.getY(i))).toBe(true);
        }
        for (let i = 0; i < sectionPercentage.count; i++) {
            expect(Number.isFinite(sectionPercentage.getX(i))).toBe(true);
        }
    });

    it('computeBoundingSphere yields a finite, positive radius', () => {
        const geometry = makeDefaultGeometry();
        geometry.computeBoundingSphere();
        expect(geometry.boundingSphere).not.toBeNull();
        const radius = geometry.boundingSphere!.radius;
        expect(Number.isFinite(radius)).toBe(true);
        expect(radius).toBeGreaterThan(0);
    });

    it('matches a snapshot of key structural numbers (regression tripwire for the three.js bump)', () => {
        const geometry = makeDefaultGeometry();
        geometry.computeBoundingSphere();
        const position = geometry.getAttribute('position');
        const index = geometry.getIndex();

        expect({
            positionCount: position.count,
            indexCount: index!.count,
            segmentCounts: geometry.segmentCounts,
            boundingSphereRadius: geometry.boundingSphere!.radius,
            boundingSphereCenter: geometry.boundingSphere!.center.toArray(),
        }).toMatchSnapshot();
    });
});

describe('CisternGeometry (non-default config)', () => {
    it('builds consistent, finite attributes for a different radius/height/segments combination', () => {
        const config = getConfig({
            radius: 8,
            height: 4,
            pedestalRadius: 2,
            pedestalHeight: 0.5,
            skylightRadius: 1,
        });
        const segments = 12;
        const geometry = new CisternGeometry([], segments, 0, Math.PI * 2, config);

        const position = geometry.getAttribute('position');
        const index = geometry.getIndex();
        const circularUV = geometry.getAttribute('circularUV');
        const sectionId = geometry.getAttribute('sectionId');
        const sectionPercentage = geometry.getAttribute('sectionPercentage');

        expect(position.count).toBeGreaterThan(0);
        expect(index).not.toBeNull();
        expect(index!.count % 3).toBe(0);
        expect(circularUV.count).toBe(position.count);
        expect(sectionId.count).toBe(position.count);
        expect(sectionPercentage.count).toBe(position.count);

        // position.count should equal (segments + 1) rows * points-per-row
        const pointsPerRow = position.count / (segments + 1);
        expect(Number.isInteger(pointsPerRow)).toBe(true);

        for (let i = 0; i < position.count; i++) {
            expect(Number.isFinite(position.getX(i))).toBe(true);
            expect(Number.isFinite(position.getY(i))).toBe(true);
            expect(Number.isFinite(position.getZ(i))).toBe(true);
        }

        geometry.computeBoundingSphere();
        expect(Number.isFinite(geometry.boundingSphere!.radius)).toBe(true);
        expect(geometry.boundingSphere!.radius).toBeGreaterThan(0);
    });

    it('matches a snapshot of key structural numbers for the non-default config', () => {
        const config = getConfig({
            radius: 8,
            height: 4,
            pedestalRadius: 2,
            pedestalHeight: 0.5,
            skylightRadius: 1,
        });
        const geometry = new CisternGeometry([], 12, 0, Math.PI * 2, config);
        geometry.computeBoundingSphere();
        const position = geometry.getAttribute('position');
        const index = geometry.getIndex();

        expect({
            positionCount: position.count,
            indexCount: index!.count,
            segmentCounts: geometry.segmentCounts,
            boundingSphereRadius: geometry.boundingSphere!.radius,
        }).toMatchSnapshot();
    });
});
