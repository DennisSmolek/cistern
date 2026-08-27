import { useEffect, useMemo } from 'react';
import { Line2NodeMaterial, type ColorRepresentation } from 'three/webgpu';
import { LineSegments2 } from 'three/addons/lines/webgpu/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { generateRawPoints, type CisternConfig } from '@cistern/core';

//* A sparse structural frame instead of a full wireframe: two rings (the
//* profile's ends) plus a few meridians, drawn as Line2 fat lines.
//*
//* Why not `wireframe: true`: that draws every triangle edge, so at a 1/2
//* render scale the lattice is denser than the pixel grid — many sub-pixel
//* features per pixel, which is the worst case for a temporal upscaler and
//* boils under FSR3's jitter. Sparse geometry removes the lattice; fat lines
//* remove the sub-pixel part (a 1px line is still sub-pixel at render res no
//* matter how few of them there are). Both together are the actual fix.

interface CisternFrameProps {
    config: CisternConfig;
    /** Vertical profile curves, evenly spaced around the axis. */
    meridians?: number;
    /**
     * Horizontal rings, taken in feature order: widest point, top, bottom,
     * then section boundaries outermost-first.
     */
    rings?: number;
    /** Screen-space line width in pixels — keep at 1.5 or above so it survives 1/2 res. */
    linewidth?: number;
    /**
     * Line color. Note there is no `opacity` here on purpose — the MRT scene
     * pass leaves every attachment at `NoBlending`, so a transparent material
     * would write alpha into the G-buffer instead of blending. Lighten the
     * color instead.
     */
    color?: ColorRepresentation;
}

/** Segments used to draw one ring — enough that it reads as a circle. */
const RING_SEGMENTS = 96;

export const CisternFrame = ({
    config,
    meridians = 8,
    rings = 2,
    linewidth = 2,
    color = 'black',
}: CisternFrameProps) => {
    const geometry = useMemo(() => {
        // Lathe profile: [radius, height] pairs, bottom to top.
        const profile = generateRawPoints(config);
        const positions: number[] = [];

        if (profile.length > 1) {
            // Meridians: the profile polyline, swept to a few fixed angles.
            for (let m = 0; m < meridians; m++) {
                const a = (m / Math.max(1, meridians)) * Math.PI * 2;
                const cos = Math.cos(a);
                const sin = Math.sin(a);
                for (let i = 0; i < profile.length - 1; i++) {
                    const [r0, y0] = profile[i];
                    const [r1, y1] = profile[i + 1];
                    // Skip degenerate steps so we don't emit zero-length segments.
                    if (r0 === r1 && y0 === y1) continue;
                    positions.push(r0 * cos, y0, r0 * sin, r1 * cos, y1, r1 * sin);
                }
            }

            //* Ring placement is ranked by what the profile actually *is*,
            //* not by evenly-spaced index — spacing by index lands them on
            //* whatever the pedestal happens to be doing. Widest point first
            //* (the outer edge you read as the silhouette), then the ends,
            //* then segment boundaries (top of the bevel, soffit, skylight —
            //* `generateRawPoints` tags each point with its section id) in
            //* order of how far out they sit.
            let widest = 0;
            for (let i = 1; i < profile.length; i++) {
                if (profile[i][0] > profile[widest][0]) widest = i;
            }
            const boundaries: number[] = [];
            for (let i = 1; i < profile.length; i++) {
                if (profile[i][2] !== profile[i - 1][2]) boundaries.push(i);
            }
            boundaries.sort((a, b) => profile[b][0] - profile[a][0]);

            const ranked: number[] = [];
            for (const i of [widest, profile.length - 1, 0, ...boundaries]) {
                if (!ranked.includes(i)) ranked.push(i);
            }

            for (const idx of ranked.slice(0, Math.max(0, rings))) {
                const [r, y] = profile[idx];
                if (r <= 0) continue;
                for (let j = 0; j < RING_SEGMENTS; j++) {
                    const a0 = (j / RING_SEGMENTS) * Math.PI * 2;
                    const a1 = ((j + 1) / RING_SEGMENTS) * Math.PI * 2;
                    positions.push(
                        r * Math.cos(a0), y, r * Math.sin(a0),
                        r * Math.cos(a1), y, r * Math.sin(a1),
                    );
                }
            }
        }

        const geo = new LineSegmentsGeometry();
        // setPositions rejects an empty buffer — keep one degenerate segment.
        geo.setPositions(positions.length ? positions : [0, 0, 0, 0, 0, 0]);
        return geo;
    }, [config, meridians, rings]);

    const material = useMemo(
        () =>
            new Line2NodeMaterial({
                color,
                // worldUnits stays false, so linewidth is screen-space pixels.
                linewidth,
                dashed: false,
            }),
        [color, linewidth],
    );

    const line = useMemo(() => new LineSegments2(geometry, material), [geometry, material]);

    useEffect(() => () => geometry.dispose(), [geometry]);
    useEffect(() => () => material.dispose(), [material]);

    return <primitive object={line} />;
};
