import { useSnapshot } from 'valtio';
import { controlState } from './controlState';
import { useEffect, useMemo } from 'react';
import { useControls } from 'leva';

export const ControlScene = () => {
  const { activeConfig } = useSnapshot(controlState);

  const rootOptions = useControls('Root', {
    radius: {
      value: activeConfig.root?.radius || 0.25,
      min: 1,
      max: 100,
      step: 0.5,
    },
    topRadius: {
      value: activeConfig.root?.topRadius || 0.25,
      min: 1,
      max: 100,
      step: 0.5,
    },
    bottomRadius: {
      value: activeConfig.root?.bottomRadius || 0.25,
      min: 1,
      max: 100,
      step: 0.5,
    },
    height: {
      value: activeConfig.root?.height || 0.25,
      min: 0,
      max: 30,
      step: 0.5,
    },
    topHeight: {
      value: activeConfig.root?.topHeight || 0.25,
      min: 0,
      max: 30,
      step: 0.5,
    },
    bottomHeight: {
      value: activeConfig.root?.bottomHeight || 0.25,
      min: -10,
      max: 30,
      step: 0.5,
    },
  });

  // make changes to the config
  const pedestal = useControls('Pedestal', {
    height: {
      value: activeConfig.pedestal?.height || 0.25,
      min: 0,
      max: 30,
      step: 0.1,
    },
    radius: {
      value: activeConfig.pedestal?.radius || 0.25,
      min: 0,
      max: 100,
      step: 0.1,
    },
    dropAngle: {
      value: activeConfig.pedestal?.dropAngle || 90,
      min: 0,
      max: 180,
      step: 1,
    },
    inset: {
      value: activeConfig.pedestal?.inset || 0.125,
      min: 0,
      max: 1,
      step: 0.01,
    },
    insetHeight: {
      value: activeConfig.pedestal?.insetHeight || 0.125,
      min: 0,
      max: 30,
      step: 0.1,
    },
  });
  const bottomCorner = useControls('Bottom Corner', {
    startDistance: {
      value: activeConfig.bottomCorner?.startDistance || 0.25,
      min: 0,
      max: 10,
      step: 0.1,
    },
    endDistance: {
      value: activeConfig.bottomCorner?.endDistance || 0.25,
      min: 0,
      max: 10,
      step: 0.1,
    },
    firstControlDistance: {
      value: activeConfig.bottomCorner?.firstControlDistance || 0.25,
      min: 0,
      max: 10,
      step: 0.1,
    },
    lastControlDistance: {
      value: activeConfig.bottomCorner?.lastControlDistance || 0.25,
      min: 0,
      max: 10,
      step: 0.1,
    },
  });
  const topCorner = useControls('Top Corner', {
    startDistance: {
      value: activeConfig.topCorner?.startDistance || 0.25,
      min: 0,
      max: 10,
      step: 0.1,
    },
    endDistance: {
      value: activeConfig.topCorner?.endDistance || 0.25,
      min: 0,
      max: 10,
      step: 0.1,
    },
    firstControlDistance: {
      value: activeConfig.topCorner?.firstControlDistance || 0.25,
      min: 0,
      max: 1,
      step: 0.01,
    },
    lastControlDistance: {
      value: activeConfig.topCorner?.lastControlDistance || 0.25,
      min: 0,
      max: 1,
      step: 0.01,
    },
  });
  const soffit = useControls('Soffit', {
    height: {
      value: activeConfig.soffit?.height || 0.25,
      min: 0,
      max: 10,
      step: 0.1,
    },
    radius: {
      value: activeConfig.soffit?.radius || 0.25,
      min: 0,
      max: 10,
      step: 0.1,
    },
    dropAngle: {
      value: activeConfig.soffit?.dropAngle || 90,
      min: 0,
      max: 180,
      step: 1,
    },
    inset: {
      value: activeConfig.soffit?.inset || 0.125,
      min: 0,
      max: 10,
      step: 0.1,
    },
    insetHeight: {
      value: activeConfig.soffit?.insetHeight || 0.125,
      min: 0,
      max: 10,
      step: 0.1,
    },
  });
  const skylight = useControls('Skylight', {
    radius: {
      value: activeConfig.skylight?.radius || 0,
      min: 0,
      max: 10,
      step: 0.1,
    },
    topRadius: {
      value: activeConfig.skylight?.topRadius || 0.25,
      min: 0,
      max: 10,
      step: 0.1,
    },
    depth: {
      value: activeConfig.skylight?.depth || 0.25,
      min: 0,
      max: 10,
      step: 0.1,
    },
    topLip: {
      value: activeConfig.skylight?.topLip || 0.125,
      min: 0,
      max: 10,
      step: 0.1,
    },
  });

  const overrideConfig = useMemo(() => {
    return {
      root: rootOptions,
      pedestal: pedestal,
      bottomCorner: bottomCorner,
      topCorner: topCorner,
      soffit: soffit,
      skylight: skylight,
    };
  }, [rootOptions, pedestal, bottomCorner, topCorner, soffit, skylight]);

  useEffect(() => {
    controlState.overrideConfig = overrideConfig;
  }, [overrideConfig]);

  return null;
};
