import { stopSerial, startSerial } from './recordBackend/serialReader.js';
import { clearSerialChart, annotateChartWithStim, annotateChartWithDelta } from '../frontend/recordFrontend/serialChart.js';
import { updateSigLineChartValue } from '../frontend/recordFrontend/significanceLineChart.js';

//Class for managing stim and record states. 
export class SessionManager {
    constructor(stimDisplay, connectionManager, roundManager, stimAnalyzer, dataProcessor) {
        this.stimDisplay = stimDisplay;
        this.connectionManager = connectionManager;
        this.roundManager = roundManager;
        this.stimAnalyzer = stimAnalyzer;
        this.dataProcessor = dataProcessor;
        this.stopSerial = stopSerial;
        this.clearSerialChart = clearSerialChart;
        this.startSerial = startSerial;
        this.sessionStartTime = null;
    }

    initStimDisplayCB(){
        this.stimDisplay.clearOnStimDisplay(); // Clear all callbacks
        this.roundManager.resetFirstStim();// Reset the first stim flag
        // Function to be called every time we have a new stim. 
        this.stimDisplay.onStimDisplay(({ stim, round, color, startTime, stopTime }) => {
            this.roundManager.handleGameStimulus(
                stim, 
                round, 
                color, 
                startTime, 
                stopTime,
                this.stimDisplay, 
                this.stimAnalyzer, 
                updateSigLineChartValue, 
                (id, state) => this.dataProcessor.updateSensorCSVData(id, state),
                (round_, stim_, type_, startTime_, stopTime_) => this.dataProcessor.updateSessionCSVData(round_, stim_, type_, startTime_, stopTime_),
                annotateChartWithDelta, 
                annotateChartWithStim
            );
        });
    }

    //Method to format the start time of the session. Format is 'YYYY-MM-DD_HH-mm-SS-sss'.
    formatTimeFilename(date) {
        return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + '_' +
        String(date.getHours()).padStart(2, '0') + '-' +
        String(date.getMinutes()).padStart(2, '0') + '-' +
        String(date.getSeconds()).padStart(2, '0') + '-' +
        String(date.getMilliseconds()).padStart(3, '0');
    }

    //Method to start the session. 
    async startSession(resetColorOptions, toggleStimControlDisable, updateInterface) {
        try {
            // this.initGameCB();
            // this.initStimDisplayCB();

            this.stimDisplay.running = true; //Set the 'running' flag to true. 
            const stimStartStopButton = document.getElementById("stimStartStopButton");
            if (stimStartStopButton) {
                stimStartStopButton.disabled = true; //Disable the start button. 
            }
            
            //Stop the serial connection and clear the serial plot for each port. 
            for (const [id, state] of this.connectionManager.getPortStates().entries()) {
                await this.stopSerial(id);
                // this.clearSerialChart(id);
            }
            this.clearSerialChart(this.connectionManager);

            resetColorOptions(); //Reset the color that will be associated with each stim. 
            this.sessionStartTime = this.formatTimeFilename(new Date(Date.now())); //Set the new session start time. 
            
            // this.calibrationManager.hideCalibrationContainer(); //Hide the calibration controls. 
            let calContainer = document.getElementById("calContainer");
            calContainer.classList.toggle("hiddenFlex", false);

            await this.showInitialCountdown(); //Show the initial countdown. 
            toggleStimControlDisable(true); //Disable session control buttons. 
            //Disable the start button and make it read "Stop".
            if (stimStartStopButton) {
                stimStartStopButton.disabled = false;
                stimStartStopButton.textContent = "Stop";
            }

            //Start the serial reading for each port. 
            for (const [id, state] of this.connectionManager.getPortStates().entries()) {
                await this.startSerial(id, updateInterface);
            }
            this.stimDisplay.start(); //Start the stim display. 
        } catch (error) {
            console.error("Could not read from serial port", error);
        }
    }

    //Method to start the session. 
    async msiStartSession() {
        try {
            // this.initGameCB();
            // this.initStimDisplayCB();

            // this.stimDisplay.running = true; //Set the 'running' flag to true. 
            // const stimStartStopButton = document.getElementById("stimStartStopButton");
            // if (stimStartStopButton) {
            //     stimStartStopButton.disabled = true; //Disable the start button. 
            // }
            
            //Stop the serial connection and clear the serial plot for each port. 
            // for (const [id, state] of this.connectionManager.getPortStates().entries()) {
            //     this.stopSerial(id);
            //     // this.clearSerialChart(id);
            // }
            this.clearSerialChart(this.connectionManager);

            this.sessionStartTime = this.formatTimeFilename(new Date(Date.now())); //Set the new session start time. 
            
            // this.calibrationManager.hideCalibrationContainer(); //Hide the calibration controls. 
            // let calContainer = document.getElementById("calContainer");
            // calContainer.classList.toggle("hiddenFlex", false);

            // await this.showInitialCountdown(); //Show the initial countdown. 
            // if (stimStartStopButton) {
            //     stimStartStopButton.disabled = false;
            //     stimStartStopButton.textContent = "Stop";
            // }

            // Start the serial reading for each port. 
            for (const [id, state] of this.connectionManager.getPortStates().entries()) {
                await this.stopSerial(id);
                await this.startSerial(id, window.updateInterfaceGame);
            }
            // this.stimDisplay.start(); //Start the stim display. 
        } catch (error) {
            console.error("Could not read from serial port", error);
        }
    }

    //Method to show the initial countdown. 
    async showInitialCountdown() {
        await new Promise((resolve) => {
            const displayText = document.getElementById("stimDisplay"); //Get the location of the countdown display. 
            let currentNumber = 3; //Start at "3".

            // Create a container for the countdown if not already present
            // (Assume displayText is a div or similar)
            displayText.innerHTML = `
                <div id="countdownContainer" style="display: flex; flex-direction: column; align-items: center;">
                    <div id="countdownLabel" style="font-size: 1em; margin-bottom: 0.3em;">Game start in</div>
                    <div id="countdownNumber" style="font-size: 2em;">${currentNumber}</div>
                </div>
            `;
            const countdownNumber = document.getElementById("countdownNumber");

            //Once every second for 3 seconds reduce the currentNumber and display it. 
            const interval = setInterval(() => {
                currentNumber--;
                if (currentNumber > 0) {
                    countdownNumber.textContent = currentNumber;
                } else {
                    clearInterval(interval);
                    displayText.textContent = '';
                    resolve();
                }
            }, 1700);
        });
    }

    //Getter and setter for session start time. 
    getSessionStartTime() {
        return this.sessionStartTime;
    }

    setSessionStartTime(time) {
        this.sessionStartTime = time;
    }
}
