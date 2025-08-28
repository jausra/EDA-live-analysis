import { stopSerial, startSerial } from './recordBackend/serialReader.js';
import { clearSerialChart } from '../frontend/recordFrontend/serialChart.js';

//Class for managing stim and record states. 
export class SessionManager {
    constructor(stimDisplay, connectionManager, calibrationManager) {
        this.stimDisplay = stimDisplay;
        this.connectionManager = connectionManager;
        this.calibrationManager = calibrationManager;
        this.stopSerial = stopSerial;
        this.clearSerialChart = clearSerialChart;
        this.startSerial = startSerial;
        this.sessionStartTime = null;
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
            this.stimDisplay.running = true; //Set the 'running' flag to true. 
            const stimStartStopButton = document.getElementById("stimStartStopButton");
            if (stimStartStopButton) {
                stimStartStopButton.disabled = true; //Disable the start button. 
            }
            
            //Stop the serial connection and clear the serial plot for each port. 
            for (const [id, state] of this.connectionManager.getPortStates().entries()) {
                this.stopSerial(id);
                // this.clearSerialChart(id);
            }
            this.clearSerialChart(this.connectionManager);

            resetColorOptions(); //Reset the color that will be associated with each stim. 
            this.sessionStartTime = this.formatTimeFilename(new Date(Date.now())); //Set the new session start time. 
            this.calibrationManager.hideCalibrationContainer(); //Hide the calibration controls. 

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

    //Method to show the initial countdown. 
    async showInitialCountdown() {
        await new Promise((resolve) => {
            const displayText = document.getElementById("stimDisplay"); //Get the location of the countdown display. 
            let currentNumber = 3; //Start at "3".
            displayText.textContent = currentNumber; //Set the text to "3". 

            //Once every second for 3 seconds reduce the currentNumber and display it. 
            const interval = setInterval(() => {
                currentNumber--;
                if (currentNumber > 0) {
                    displayText.textContent = currentNumber;
                } else {
                    clearInterval(interval);
                    displayText.textContent = '';
                    resolve();
                }
            }, 1000);
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
