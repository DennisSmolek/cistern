import { Mesh, Vector3 } from "three/webgpu";

export const ControlPoint = ({
    ref,
    position,
}: {
    ref?: React.RefObject<Mesh>;
    position: Vector3;
}) => {
    return (
        <mesh ref={ref} position={position}>
            <sphereGeometry args={[0.05, 32, 32]} />
            <meshStandardMaterial color='red' />
        </mesh>
    );
};
