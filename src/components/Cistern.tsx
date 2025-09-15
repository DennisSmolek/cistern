import { useEffect, useMemo } from "react";
import { CisternGeometry } from "../CisternGeometry";
import { AdvancedConfig } from "../pointGeneration";
import { BackSide, Mesh, MeshStandardMaterial } from "three/webgpu";

interface CisternProps {
    meshRef?: React.RefObject<Mesh | null>;
    config: AdvancedConfig | Readonly<AdvancedConfig>;
}

export const Cistern = ({ meshRef, config, ...props }: CisternProps) => {
    const geometry = useMemo(() => {
        return new CisternGeometry();
    }, []);

    // try to assign after creation EXPERIMENTAL
    useEffect(() => {
        if (geometry) {
            geometry.generateFromConfig(config as AdvancedConfig);
            if (meshRef?.current)
                (meshRef.current.material as MeshStandardMaterial).needsUpdate =
                    true;
        }
    }, [config, geometry, meshRef]);

    return (
        <mesh geometry={geometry} ref={meshRef} {...props}>
            <meshStandardMaterial color='pink' side={BackSide} />
        </mesh>
    );
};
