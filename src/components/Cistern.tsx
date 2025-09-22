import { useCallback, useEffect, useMemo } from "react";
import { CisternGeometry } from "../CisternGeometry";
import type { AdvancedConfig } from "../pointGeneration/types";
import { FrontSide, Mesh, MeshStandardMaterial, Vector2 } from "three/webgpu";

export interface CisternProps {
    ref?: React.RefObject<Mesh | null>;
    config?: AdvancedConfig | Readonly<AdvancedConfig>;
    onUpdate?: (params: { config: AdvancedConfig; points: Vector2[] }) => void;
    onConfigChange?: (config: AdvancedConfig) => void;
    onPointsChange?: (points: Vector2[]) => void;
}

export const Cistern = ({
    ref,
    config,
    onConfigChange,
    onPointsChange,
    onUpdate,
    ...props
}: CisternProps) => {
    const geometry = useMemo(() => {
        return new CisternGeometry();
    }, []);

    // handle updates
    const handleUpdate = useCallback(
        ({ config, points }: { config: AdvancedConfig; points: Vector2[] }) => {
            // if onConfig send that
            if (onConfigChange) onConfigChange(config);

            //if onPoints send poinst
            if (onPointsChange) onPointsChange(points);

            //if onUpdate send both
            if (onUpdate) onUpdate({ config, points });
        },
        [onConfigChange, onPointsChange, onUpdate]
    );

    // try to assign after creation EXPERIMENTAL
    useEffect(() => {
        if (geometry) {
            const { config: newConfig, points } = geometry.updateConfig(
                config as AdvancedConfig
            );
            handleUpdate({ config: newConfig, points });
            if (ref?.current)
                (ref.current.material as MeshStandardMaterial).needsUpdate =
                    true;
        }
    }, [config, geometry, ref, handleUpdate]);

    return (
        <mesh geometry={geometry} ref={ref} {...props}>
            <meshStandardMaterial color='pink' side={FrontSide} />
        </mesh>
    );
};
