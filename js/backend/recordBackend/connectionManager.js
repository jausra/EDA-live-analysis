import { connectPort, disconnectPort } from './serialReader.js';

//Class for handling port connections. 
export class ConnectionManager {
    constructor() {
        this.connBox1 = document.getElementById("connBox1");
        this.connBox2 = document.getElementById("connBox2");
        this.portStates = new Map();
        this.gameButtons = document.querySelectorAll(".gameButton");
        
        this.initConnectionBoxes();
    }

    //Method for initializing how port connection buttons work. 
    initConnectionBoxes() {
        // Initialize connBox1
        this.connBox1.addEventListener("click", async (e) => {
            await this.handleConnectionClick(e, 'sensor1');
        });
        
        this.connBox1.addEventListener("mouseenter", (e) => {
            this.handleConnectionMouseEnter(e);
        });
        
        this.connBox1.addEventListener("mouseleave", (e) => {
            this.handleConnectionMouseLeave(e);
        });

        // Initialize connBox2
        this.connBox2.addEventListener("click", async (e) => {
            await this.handleConnectionClick(e, 'sensor2');
        });
        
        this.connBox2.addEventListener("mouseenter", (e) => {
            this.handleConnectionMouseEnter(e);
        });
        
        this.connBox2.addEventListener("mouseleave", (e) => {
            this.handleConnectionMouseLeave(e);
        });
    }

    //Method for handling connection/disconnection click. 
    async handleConnectionClick(e, portID) {
        if (e.target.classList.contains('connected')) {
            disconnectPort(portID);
            this.cancelPortState(portID);
            e.target.innerHTML = "+";
            e.target.classList.remove('connected');
        } else {
            try {
                const port = await connectPort(portID); //Connect to the serial port. 
                const portState = this.ensurePortState(portID); //Add arrays associated with that port. 
                if (port) {
                    e.target.innerHTML = "&#8644;";
                    e.target.classList.add('connected');
                }
            } catch {
                console.log("Serial port did not connect");
            }
        }
        this.updateGameButtonClickability();
    }

    //Method to control connection button during hover. 
    handleConnectionMouseEnter(e) {
        if (e.target.classList.contains("connected")) {
            e.target.innerHTML = '&#10005';
        }
    }

    //Method to control connection button after hover. 
    handleConnectionMouseLeave(e) {
        if (e.target.classList.contains("connected")) {
            e.target.innerHTML = "&#8644;";
        }
    }

    //Method to initialize data arrays associated with a port. 
    ensurePortState(id) {
        if (!this.portStates.has(id)) {
            this.portStates.set(id, {
                stimEDAValues: [],
                stimEDATime: [],
                data: [],
            });
        }
        return this.portStates.get(id);
    }

    //Method to disconnect from a port. 
    cancelPortState(id) {
        if (this.portStates.has(id)) {
            this.portStates.delete(id);
        }
    }

    //Method to enable/disable game buttons based on whether or not a port is connected. 
    updateGameButtonClickability() {
        const gameButtonDisable = this.portStates.size === 0;

        this.gameButtons.forEach(button => {
            if (gameButtonDisable) {
                button.classList.toggle("disabled", true);
            } else {
                button.classList.toggle("disabled", false);
            }
        });
    }

    //Method to clear data arrays associated with a port. 
    resetEDAValues(id) {
        if (this.portStates.has(id)) {
            const state = this.portStates.get(id);
            state.stimEDAValues = [];
            state.stimEDATime = [];
            state.data = [];
        }
    }

    getPortStates() {
        return this.portStates;
    }

    hasPortStates() {
        return this.portStates.size > 0;
    }
}
