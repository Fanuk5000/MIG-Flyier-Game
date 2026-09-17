/**
 * Minimal keyboard input capture closure.
 */
export function createInput() {
    const keys = {
        moveForward: false,
        turnLeft: false,
        turnRight: false,
        moveBackward: false,
    };

    function onKeyDown(e) {
        if (e.code === "ArrowUp" || e.code === "KeyW") {
            keys.moveForward = true;
            e.preventDefault();
        }
        if (e.code === "ArrowDown" || e.code === "KeyS") {
            keys.moveBackward = true;
            e.preventDefault();
        }
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
            keys.turnLeft = true;
            e.preventDefault();
        }
        if (e.code === "ArrowRight" || e.code === "KeyD") {
            keys.turnRight = true;
            e.preventDefault();
        }
    }

    function onKeyUp(e) {
        if (e.code === "ArrowUp" || e.code === "KeyW") keys.moveForward = false;
        if (e.code === "ArrowDown" || e.code === "KeyS")
            keys.moveBackward = false;
        if (e.code === "ArrowLeft" || e.code === "KeyA") keys.turnLeft = false;
        if (e.code === "ArrowRight" || e.code === "KeyD")
            keys.turnRight = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return {
        getState: () => ({ ...keys }),
        destroy: () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        },
    };
}
