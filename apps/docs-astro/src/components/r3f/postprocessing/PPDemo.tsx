import { AOPass } from './passes/AOPass';
import { TRAAPass } from './passes/TRAAPass';
import { PostProcessing } from './Postprocessing';
import { useControls } from 'leva';

export const PPDemo = () => {
    const aoProps = useControls('GTAO', {
        radius: {
            label: 'Radius',
            value: 0.5,
            min: 0,
            max: 10,
            step: 0.01,
        },
        scale: {
            label: 'Scale',
            value: 1.0,
            min: 0,
            max: 10,
            step: 0.01,
        },
        thickness: {
            label: 'Thickness',
            value: 1.0,
            min: 0,
            max: 10,
            step: 0.01,
        },
        distanceExponent: {
            label: 'Exponent',
            value: 1.0,
            min: 0,
            max: 10,
            step: 0.01,
        },
        distanceFalloff: {
            label: 'Falloff',
            value: 1.0,
            min: 0,
            max: 10,
            step: 0.01,
        },
        strength: {
            label: 'Strength',
            value: 1.0,
            min: 0,
            max: 10,
            step: 0.01,
        },
        resolutionScale: {
            label: 'Resolution Scale',
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.01,
        },
    });
    return (
        <PostProcessing>
            <AOPass {...aoProps} />
            <TRAAPass />
        </PostProcessing>
    );
};
