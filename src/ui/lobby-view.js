/**
 * Decoupled DOM Overlay for the HTTP Room Lobby (src/ui/lobby-view.js).
 * Subscribes to Lobby EventTarget events ("roomsChanged", "error", "joined")
 * and renders room list, ping indicator, pilot callsign input, and "Launch Fighter" button.
 */

export class LobbyView {
    #lobby;
    #container;
    #rootEl = null;
    #roomListEl = null;
    #statusEl = null;
    #nameInputEl = null;
    #launchBtnEl = null;
    #selectedRoomId = null;
    #onRoomsChanged;
    #onError;
    #onJoined;

    /**
     * @param {import('./lobby.js').Lobby} lobby
     * @param {Object} [options={}]
     * @param {HTMLElement} [options.container]
     * @param {(detail: Object) => void} [options.onLaunch]
     */
    constructor(lobby, { container = null, onLaunch = null } = {}) {
        this.#lobby = lobby;
        this.#container =
            container ||
            (typeof document !== "undefined" ? document.body : null);
        this.onLaunch = onLaunch;

        this.#onRoomsChanged = (e) =>
            this.#renderRooms(e.detail?.rooms || []);
        this.#onError = (e) =>
            this.#renderError(e.detail?.message || "Connection error");
        this.#onJoined = (e) => {
            this.hide();
            if (typeof this.onLaunch === "function") {
                this.onLaunch(e.detail);
            }
        };

        if (this.#container) {
            this.#buildDOM();
        }
        this.#bindLobbyEvents();
    }

    /**
     * Shows the lobby DOM overlay.
     */
    show() {
        if (this.#rootEl) {
            this.#rootEl.style.display = "flex";
        }
    }

    /**
     * Hides the lobby DOM overlay.
     */
    hide() {
        if (this.#rootEl) {
            this.#rootEl.style.display = "none";
        }
    }

    /**
     * Removes event listeners and destroys the DOM overlay.
     */
    destroy() {
        if (this.#lobby) {
            this.#lobby.removeEventListener(
                "roomsChanged",
                this.#onRoomsChanged,
            );
            this.#lobby.removeEventListener("error", this.#onError);
            this.#lobby.removeEventListener("joined", this.#onJoined);
        }
        if (this.#rootEl && this.#rootEl.parentNode) {
            this.#rootEl.parentNode.removeChild(this.#rootEl);
        }
        this.#rootEl = null;
    }

    #bindLobbyEvents() {
        if (!this.#lobby) return;
        this.#lobby.addEventListener("roomsChanged", this.#onRoomsChanged);
        this.#lobby.addEventListener("error", this.#onError);
        this.#lobby.addEventListener("joined", this.#onJoined);
    }

    #buildDOM() {
        const root = document.createElement("div");
        root.id = "lobby-overlay";
        Object.assign(root.style, {
            position: "fixed",
            inset: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(11, 15, 25, 0.88)",
            fontFamily: "monospace",
            color: "#e2e8f0",
            zIndex: "100",
        });

        const panel = document.createElement("div");
        Object.assign(panel.style, {
            width: "min(620px, 92vw)",
            backgroundColor: "#1e293b",
            border: "1px solid #38bdf8",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6)",
        });

        // Header
        const header = document.createElement("div");
        Object.assign(header.style, {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            borderBottom: "1px solid #334155",
            paddingBottom: "12px",
        });

        const title = document.createElement("h2");
        title.textContent = "TACTICAL INTERCEPT LOBBY";
        Object.assign(title.style, {
            margin: "0",
            fontSize: "18px",
            color: "#38bdf8",
            letterSpacing: "1px",
        });

        const refreshBtn = document.createElement("button");
        refreshBtn.type = "button";
        refreshBtn.textContent = "Refresh";
        Object.assign(refreshBtn.style, {
            backgroundColor: "#0f172a",
            color: "#38bdf8",
            border: "1px solid #38bdf8",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            fontFamily: "monospace",
        });
        refreshBtn.addEventListener("click", () => {
            this.#setStatus("Refreshing sectors...", "#94a3b8");
            this.#lobby.refresh();
        });

        header.append(title, refreshBtn);

        // Pilot Callsign Input
        const inputRow = document.createElement("div");
        Object.assign(inputRow.style, {
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
        });

        const label = document.createElement("label");
        label.textContent = "PILOT CALLSIGN:";
        label.style.color = "#94a3b8";
        label.style.fontSize = "13px";

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = "Ghost-1";
        nameInput.placeholder = "Enter callsign...";
        Object.assign(nameInput.style, {
            flex: "1",
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            border: "1px solid #475569",
            borderRadius: "4px",
            padding: "8px 12px",
            fontFamily: "monospace",
            fontSize: "14px",
        });
        this.#nameInputEl = nameInput;
        inputRow.append(label, nameInput);

        // Status / Error Banner
        const statusEl = document.createElement("div");
        Object.assign(statusEl.style, {
            fontSize: "12px",
            color: "#94a3b8",
            marginBottom: "10px",
            minHeight: "18px",
        });
        statusEl.textContent = "Scanning active air-defense sectors...";
        this.#statusEl = statusEl;

        // Room List Container
        const roomList = document.createElement("div");
        Object.assign(roomList.style, {
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxHeight: "260px",
            overflowY: "auto",
            marginBottom: "20px",
        });
        this.#roomListEl = roomList;

        // Footer with Launch Fighter button
        const footer = document.createElement("div");
        Object.assign(footer.style, {
            display: "flex",
            justifyContent: "flex-end",
        });

        const launchBtn = document.createElement("button");
        launchBtn.type = "button";
        launchBtn.textContent = "LAUNCH FIGHTER";
        Object.assign(launchBtn.style, {
            backgroundColor: "#0284c7",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            padding: "10px 22px",
            fontSize: "14px",
            fontWeight: "bold",
            fontFamily: "monospace",
            cursor: "pointer",
            letterSpacing: "1px",
        });
        launchBtn.addEventListener("click", () => {
            const callsign = this.#nameInputEl?.value || "Ghost-1";
            this.#lobby.join(this.#selectedRoomId, callsign);
        });
        this.#launchBtnEl = launchBtn;
        footer.appendChild(launchBtn);

        panel.append(header, inputRow, statusEl, roomList, footer);
        root.appendChild(panel);
        this.#container.appendChild(root);
        this.#rootEl = root;
    }

    #setStatus(text, color = "#94a3b8") {
        if (!this.#statusEl) return;
        this.#statusEl.textContent = text;
        this.#statusEl.style.color = color;
    }

    #renderRooms(rooms) {
        if (!this.#roomListEl) return;
        this.#roomListEl.innerHTML = "";

        if (!rooms.length) {
            this.#setStatus("No active sectors found.", "#facc15");
            return;
        }

        if (
            !this.#selectedRoomId ||
            !rooms.some((r) => r.id === this.#selectedRoomId)
        ) {
            this.#selectedRoomId = rooms[0].id;
        }

        this.#setStatus(
            `Connected — ${rooms.length} sectors online (auto-refresh active)`,
            "#4ade80",
        );

        for (const room of rooms) {
            const isSelected = room.id === this.#selectedRoomId;
            const row = document.createElement("div");
            Object.assign(row.style, {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: "6px",
                backgroundColor: isSelected ? "#0f172a" : "#162032",
                border: isSelected
                    ? "1px solid #38bdf8"
                    : "1px solid #334155",
                cursor: "pointer",
            });

            const left = document.createElement("div");
            const nameEl = document.createElement("div");
            nameEl.textContent = room.name;
            Object.assign(nameEl.style, {
                fontWeight: "bold",
                color: isSelected ? "#38bdf8" : "#f8fafc",
                fontSize: "14px",
                marginBottom: "4px",
            });

            const metaEl = document.createElement("div");
            metaEl.textContent = `Threat: ${room.shahedCount ?? 4} Shaheds | Difficulty: ${room.difficulty || "Standard"}`;
            Object.assign(metaEl.style, {
                fontSize: "12px",
                color: "#94a3b8",
            });
            left.append(nameEl, metaEl);

            const right = document.createElement("div");
            Object.assign(right.style, {
                textAlign: "right",
                fontSize: "12px",
            });

            const playersEl = document.createElement("div");
            playersEl.textContent = `${room.players ?? 1}/${room.maxPlayers ?? 8} Pilots`;
            playersEl.style.color = "#e2e8f0";

            const ping = room.ping ?? 25;
            const pingEl = document.createElement("div");
            pingEl.textContent = `${ping} ms`;
            pingEl.style.color =
                ping < 40 ? "#4ade80" : ping < 80 ? "#facc15" : "#ef4444";

            right.append(playersEl, pingEl);
            row.append(left, right);

            row.addEventListener("click", () => {
                this.#selectedRoomId = room.id;
                this.#renderRooms(rooms);
            });

            this.#roomListEl.appendChild(row);
        }
    }

    #renderError(message) {
        this.#setStatus(`Error: ${message}`, "#ef4444");
        if (!this.#roomListEl) return;

        this.#roomListEl.innerHTML = "";
        const errBox = document.createElement("div");
        Object.assign(errBox.style, {
            padding: "16px",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            border: "1px solid #ef4444",
            borderRadius: "6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
        });

        const msgSpan = document.createElement("span");
        msgSpan.textContent = message;
        msgSpan.style.color = "#fca5a5";

        const retryBtn = document.createElement("button");
        retryBtn.type = "button";
        retryBtn.textContent = "Retry Now";
        Object.assign(retryBtn.style, {
            backgroundColor: "#ef4444",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            fontFamily: "monospace",
        });
        retryBtn.addEventListener("click", () => {
            this.#setStatus("Retrying connection...", "#facc15");
            this.#lobby.refresh();
        });

        errBox.append(msgSpan, retryBtn);
        this.#roomListEl.appendChild(errBox);
    }
}

/**
 * Factory helper to instantiate LobbyView.
 * @param {import('./lobby.js').Lobby} lobby
 * @param {Object} [options]
 * @returns {LobbyView}
 */
export function createLobbyView(lobby, options = {}) {
    return new LobbyView(lobby, options);
}
