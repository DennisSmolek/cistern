// we are just going to make super simple tsl lines. We can fix drei later
import { Vector3, Line2NodeMaterial, type ColorRepresentation } from 'three/webgpu';

import { Line2 } from 'three/addons/lines/webgpu/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { useMemo } from 'react';

export const Line = ({ points, color }: { points: Vector3[]; color: ColorRepresentation }) => {
  // setup the geometry when the input points change
  const lineGeo = useMemo(() => {
    const geo = new LineGeometry();
    // we have to flatten the points to a single array like a buffer
    const flattened: number[] = [];
    for (const point of points) {
      flattened.push(point.x, point.y, point.z);
    }
    geo.setPositions(flattened);
    return geo;
  }, [points]);

  const lineMat = useMemo(() => {
    const matLine = new Line2NodeMaterial({
      color: color,
      linewidth: 5, // in world units with size attenuation, pixels otherwise
      vertexColors: true,
      dashed: false,
      alphaToCoverage: true,
    });
    return matLine;
  }, [color]);

  const line = useMemo(() => {
    const line = new Line2(lineGeo, lineMat);
    line.computeLineDistances();
    line.scale.set(1, 1, 1);
    return line;
  }, [lineGeo, lineMat]);

  return <primitive object={line} />;
};
