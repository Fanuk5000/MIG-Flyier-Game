/**
 * Keyboard input capture closure with continuous state and edge-triggered justPressed.
 */
export function createInput() {
    const keys = {
        moveForward: false,
        turnLeft: false,
        turnRight: false,
        moveBackward: false,
    };

    const justPressed = {
        moveForward: false,
        turnLeft: false,
        turnRight: false,
        moveBackward: false,
    };

    function setKey(action, isDown, repeat = false) {
        if (isDown) {
            // Trigger justPressed only on initial keydown, not OS key-repeat
            if (!keys[action] && !repeat) {
                justPressed[action] = true;
            }
            keys[action] = true;
        } else {
            keys[action] = false;
        }
    }

    function onKeyDown(e) {
        if (e.code === "ArrowUp" || e.code === "KeyW") {
            setKey("moveForward", true, e.repeat);
            e.preventDefault();
        }
        if (e.code === "ArrowDown" || e.code === "KeyS") {
            setKey("moveBackward", true, e.repeat);
            e.preventDefault();
        }
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
            setKey("turnLeft", true, e.repeat);
            e.preventDefault();
        }
        if (e.code === "ArrowRight" || e.code === "KeyD") {
            setKey("turnRight", true, e.repeat);
            e.preventDefault();
        }
    }

    function onKeyUp(e) {
        if (e.code === "ArrowUp" || e.code === "KeyW")
            setKey("moveForward", false);
        if (e.code === "ArrowDown" || e.code === "KeyS")
            setKey("moveBackward", false);
        if (e.code === "ArrowLeft" || e.code === "KeyA")
            setKey("turnLeft", false);
        if (e.code === "ArrowRight" || e.code === "KeyD")
            setKey("turnRight", false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return {
        getState: () => ({
            ...keys,
            justPressed: { ...justPressed },
        }),
        clearJustPressed: () => {
            for (const action in justPressed) {
                justPressed[action] = false;
            }
        },
        destroy: () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        },
    };
}
