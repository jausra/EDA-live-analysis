import { startSerial, serialWrite } from './serialReader.js';
import { clearSerialChart, updateSerialChartValue } from '../../frontend/recordFrontend/serialChart.js';
import { clearSigLineChart } from '../../frontend/recordFrontend/significanceLineChart.js';

//Class to control the calibration of the hardware. 
export class CalibrationManager {
    constructor(connectionManager, sessionManager, stimPresets, stimDisplay, roundManager) {
        this.connectionManager = connectionManager;
        this.sessionManager = sessionManager;
        this.stimPresets = stimPresets;
        this.stimDisplay = stimDisplay;
        this.roundManager = roundManager;
        this.initializeElements();
        this.setupCalibrationControls();
        this.setupEventListeners();
        this.previousRound = 1;
    }

    //Method to connect to HTML elements. 
    initializeElements() {
        this.stimStartStopButton = document.getElementById("stimStartStopButton");
        this.calibrateButton = document.getElementById("calibrateButton");
        this.calContainer = document.getElementById("calContainer");
        this.calOffsetInput = document.getElementById("calOffsetInput");
        this.calOffsetSlider = document.getElementById("calOffsetSlider");
        this.calGainInput = document.getElementById("calGainInput");
        this.calGainSlider = document.getElementById("calGainSlider");
        this.calSubmitButton = document.getElementById("calSubmitButton");
        this.setRMinButton = document.getElementById("setRMinButton");
        this.setRMaxButton = document.getElementById("setRMaxButton");
        this.autocalButton = document.getElementById("autocalButton");
    }

    //Method to set slider and text input parameters. 
    setupCalibrationControls() {
        // Calibration constants
        const offsetMin = 4; // kOhm
        const offsetMax = 2000; // kOhm
        const offsetDefault = 1000; // kOhm 
        const gainMin = 0.4; // kOhm
        const gainMax = 100; // kOhm
        const gainDefault = 10; // kOhm

        // Set slider ranges and default values
        this.rOff = offsetDefault;
        this.calOffsetSlider.min = offsetMin;
        this.calOffsetSlider.max = offsetMax;
        this.calOffsetInput.value = offsetDefault;
        this.calOffsetSlider.value = offsetDefault;

        this.rGain = gainDefault;
        this.calGainSlider.min = gainMin;
        this.calGainSlider.max = gainMax;
        this.calGainInput.value = gainDefault;
        this.calGainSlider.value = gainDefault;
    }

    //Method to set up click handlers for buttons/sliders/text inputs. 
    setupEventListeners() {
        //Calibrate button click handler.
        this.calibrateButton.addEventListener("click", async () => {
            await this.handleCalibrateClick();
        });

        //Offset input change handler.
        this.calOffsetInput.addEventListener("change", (e) => {
            this.handleOffsetInputChange(e);
        });

        //Offset slider change handler.
        this.calOffsetSlider.addEventListener("change", (e) => {
            this.handleOffsetSliderChange(e);
        });

        //Gain input change handler.
        this.calGainInput.addEventListener("change", (e) => {
            this.handleGainInputChange(e);
        });

        //Gain slider change handler.
        this.calGainSlider.addEventListener("change", (e) => {
            this.handleGainSliderChange(e);
        });

        //Submit button click handler.
        this.calSubmitButton.addEventListener("click", async () => {
            await this.handleSubmitClick();
        });

        //Set R Min button click handler.
        this.setRMinButton.addEventListener("click", () => {
            this.handleRMinClick();
        });

        //Set R Max button click handler.
        this.setRMaxButton.addEventListener("click", () => {
            this.handleRMaxClick();
        });

        //Autocal button click handler.
        this.autocalButton.addEventListener("click", async () => {
            await this.handleAutocalClick();
        });
    }

    async handleCalStimulus(round) {
        if (round !== this.previousRound) {
            for (const [id, state] of this.connectionManager.getPortStates().entries()) {

                let adcMin = Math.min(...state.stimEDAValues);
                console.log("ADC Min: ", adcMin);
                let adcMax = Math.max(...state.stimEDAValues);
                console.log("ADC Max: ", adcMax);

                //Check if ADC values are in range
                if (adcMin >= 75 && adcMin <= 95 && adcMax >= 160 && adcMax <= 180) { // If ADC values are in range, start the game

                    console.log("CALIBRATION COMPLETE");
                } else { // If ADC value are not in range, update the offset and gain resistance
                    this.calculateTargetRMax(adcMin); //Low ADC corresponds to high wheatstone voltage, which comes from high resistance
                    this.calculateTargetRMin(adcMax); //High ADC corresponds to low wheatstone voltage, which comes from low resistance
    
                    this.calculateOffR();
                    this.calculateGainR();
    
                    const command = `SET R_OFF ${this.rOff} R_GAIN ${this.rGain}\n`;

                    for (const [id, state] of this.connectionManager.getPortStates().entries()) {
                        await serialWrite(id, command);
                    }
                }
            }
            this.previousRound = round;
        }
    }

    initCalibrationCB(){
        this.stimDisplay.clearOnStimDisplay(); //Clear all callbacks
        //Function to be called every time we have a new stim. 
        this.stimDisplay.onStimDisplay(async ({ stim, round, color, startTime, stopTime }) => {
            await this.handleCalStimulus(
                // stim, 
                round, 
                // color, 
                // startTime, 
                // stopTime,
                // this.stimDisplay,
                // this.stimAnalyzer,
                // updateSigLineChartValue,
                // (id, state) => this.dataProcessor.updateSensorCSVData(id, state),
                // (round_, stim_, type_, startTime_, stopTime_) => this.dataProcessor.updateSessionCSVData(round_, stim_, type_, startTime_, stopTime_),
                // annotateChartWithDelta,
                // annotateChartWithStim
            );
        });
    }

    //Handle clicking the calibration button. 
    async handleCalibrateClick() {
        try {
            clearSigLineChart(); //Clear the significance chart. 
            this.stimStartStopButton.disabled = false; //Enable the start button
            this.calibrateButton.disabled = true; //Disable the clibration button. 
            this.calContainer.classList.toggle("hiddenFlex", false); //show the calibration sliders/text inputs. 

            //Reset EDA values and clear charts for all ports.
            for (const [id, state] of this.connectionManager.getPortStates().entries()) {
                this.connectionManager.resetEDAValues(id);
                // clearSerialChart(id);
            }
            clearSerialChart(this.connectionManager);

            this.stimPresets.applyPreset("Calibrate"); // Apply the calibration preset

            this.initCalibrationCB(); 
            this.stimDisplay.running = true;

            await this.sessionManager.showInitialCountdown();

            //Start serial reading for all ports.
            for (const [id, state] of this.connectionManager.getPortStates().entries()) {
                await startSerial(id, window.updateInterface);
            }
            this.stimDisplay.start();
        } catch (error) {
            console.error("Could not read from serial port:", error);
        }
    }

    //Handle changes in offset text input. 
    handleOffsetInputChange(e) {
        this.rOff = e.target.value;
        const offsetMin = parseFloat(this.calOffsetSlider.min); //Convert from string to float.
        const offsetMax = parseFloat(this.calOffsetSlider.max); //Convert from string to float.

        //Modify the text if it is outside the min/max. 
        if (this.rOff < offsetMin) {
            this.rOff = offsetMin;
            e.target.value = this.rOff;
        }
        if (this.rOff > offsetMax) {
            this.rOff = offsetMax;
            e.target.value = this.rOff;
        }
        
        this.calOffsetSlider.value = this.rOff; //Make the slider reflect the text input.
    }

    //Handle changes in offset slider. 
    handleOffsetSliderChange(e) {
        this.rOff = e.target.value;
        const offsetMin = parseFloat(this.calOffsetSlider.min); //Convert from string to float.
        const offsetMax = parseFloat(this.calOffsetSlider.max); //Convert from string to float.

        //Modify the slider if it is outside the min/max. 
        if (this.rOff < offsetMin) {
            this.rOff = offsetMin;
        }
        if (this.rOff > offsetMax) {
            this.rOff = offsetMax;
        }
        
        this.calOffsetInput.value = this.rOff; //Make the text input reflect the slider.
    }

    //Handle changes in gain text input. 
    handleGainInputChange(e) {
        this.rGain = Number(e.target.value);
        const gainMin = parseFloat(this.calGainSlider.min); //Convert from string to float.
        const gainMax = parseFloat(this.calGainSlider.max); //Convert from string to float.

        //Modify the text if it is outside the min/max. 
        if (this.rGain < gainMin) {
            this.rGain = gainMin;
            e.target.value = this.rGain;
        }
        if (this.rGain > gainMax) {
            this.rGain = gainMax;
            e.target.value = this.rGain;
        }
        
        this.calGainSlider.value = this.rGain; //Make the slider reflect the text input.
    }

    //Handle changes in offset slider. 
    handleGainSliderChange(e) {
        this.rGain = Number(e.target.value);
        const gainMin = parseFloat(this.calGainSlider.min); //Convert from string to float.
        const gainMax = parseFloat(this.calGainSlider.max); //Convert from string to float.

        //Modify the slider if it is outside the min/max. 
        if (this.rGain < gainMin) {
            this.rGain = gainMin;
        }
        if (this.rGain > gainMax) {
            this.rGain = gainMax;
        }
        
        this.calGainInput.value = this.rGain; //Make the text input reflect the slider.
    }

    //Method to send the offset and gain values to the arduino. 
    async handleSubmitClick() {
        const rGain = Number(this.calGainInput.value);
        const rOff = Number(this.calOffsetInput.value);

        const debugCalTextInput = document.getElementById("debugCalTextInput");
        const rMe = Number(debugCalTextInput.value);
        const expectedV_out = rGain*((1.65 -(3.3*(rMe/(rMe+rOff))))/10.0) + 1.65;
        console.log("expectedV_out", expectedV_out);
        const expectedADC_out = Math.round(255 * (expectedV_out / 3.3));
        console.log("expectedADC_out", expectedADC_out);

        const command = `SET R_OFF ${rOff} R_GAIN ${rGain}\n`;
        
        //Send the command to each port. 
        //To-Do: modify to send sepcific commends to individual ports. 
        for (const [id, state] of this.connectionManager.getPortStates().entries()) {
            await serialWrite(id, command);
        }
    }

    calculateTargetR(adcTarget) {
        const vTarget = 3.3* (adcTarget/255.00)
        const rTarget = (this.rOff*(1.65*(this.rGain+10) - 10*vTarget)/(10*vTarget + 1.65*(this.rGain-10)));

        return rTarget;
    }

    handleRMinClick() {
        // this.calculateTargetR();
        // this.rMin = this.rTarget;
        const debugCalTextInput = document.getElementById("debugCalTextInput");
        const rMe = Number(debugCalTextInput.value);
        this.rMin = rMe;
        console.log("this.rMin: ", this.rMin);
    }

    calculateTargetRMin(adcTarget) {
        this.rMin = this.calculateTargetR(adcTarget);
        console.log("Smallest resistance:", this.rMin);
    }

    handleRMaxClick() {
        // this.calculateTargetR();
        // this.rMax = this.rTarget;
        const debugCalTextInput = document.getElementById("debugCalTextInput");
        const rMe = Number(debugCalTextInput.value);
        this.rMax = rMe;
        console.log("this.rMax: ", this.rMax)
    }

    calculateTargetRMax(adcTarget) {
        this.rMax = this.calculateTargetR(adcTarget);
        console.log("Largest resistance:", this.rMax);
    }

    calculateOffR() {
        this.rOff = Math.sqrt(this.rMin*this.rMax);
        console.log("rOff:", this.rOff);
        this.calOffsetSlider.value = this.rOff;
        this.calOffsetInput.value = this.rOff;
    }

    calculateGainR() {
        // this.rGain = -5.5/(1.65-3.3*(this.rMin/(this.rMin+this.rOff)));
        this.rGain = -5.5/(1.65-3.3*(this.rMax/(this.rMax+this.rOff)));
        console.log("rGain:", this.rGain);
        this.calGainSlider.value = this.rGain;
        this.calGainInput.value = this.rGain;
    }

    async handleAutocalClick() {
        console.log("rMin:", this.rMin);
        console.log("rMax:", this.rMax);

        this.calculateOffR();
        this.calculateGainR();

        const command = `SET R_OFF ${this.rOff} R_GAIN ${this.rGain}\n`;
        
        //Send the command to each port. 
        //To-Do: modify to send sepcific commends to individual ports. 
        for (const [id, state] of this.connectionManager.getPortStates().entries()) {
            await serialWrite(id, command);
        }
    }

    //Public methods for external UI control.
    enableCalibrateButton() {
        this.calibrateButton.disabled = false;
    }

    disableCalibrateButton() {
        this.calibrateButton.disabled = true;
    }

    toggleCalibrateButtonVisibility() {
        this.calibrateButton.classList.toggle("hiddenFlex");
    }

    showCalibrationContainer() {
        this.calContainer.classList.toggle("hiddenFlex", false);
    }

    hideCalibrationContainer() {
        this.calContainer.classList.toggle("hiddenFlex", true);
    }
}
