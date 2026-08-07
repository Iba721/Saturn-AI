export interface IdleState {

    orbTiltX: number;

    orbTiltZ: number;

    shellTilt: number;

    ringTilt: number;

    dustTilt: number;

}

export function getIdleState(
    time: number
): IdleState {

    return {

        orbTiltX:
            Math.sin(time * 0.08) * 0.015,

        orbTiltZ:
            Math.cos(time * 0.06) * 0.012,

        shellTilt:
            Math.sin(time * 0.12) * 0.01,

        ringTilt:
            Math.sin(time * 0.03) * 0.006,

        dustTilt:
            Math.sin(time * 0.02) * 0.02,

    };

}