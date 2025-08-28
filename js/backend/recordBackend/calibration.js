import { startSerial, serialWrite } from './serialReader.js';
import { clearSerialChart, updateSerialChartValue } from '../../frontend/recordFrontend/serialChart.js';
import { clearSigLineChart } from '../../frontend/recordFrontend/significanceLineChart.js';

//Class to control the calibration of the hardware. 
export class CalibrationManager {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.initializeElements();
        this.setupCalibrationControls();
        this.setupEventListeners();
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
        this.calOffsetSlider.min = offsetMin;
        this.calOffsetSlider.max = offsetMax;
        this.calOffsetInput.value = offsetDefault;
        this.calOffsetSlider.value = offsetDefault;

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

            //Start serial reading for all ports.
            for (const [id, state] of this.connectionManager.getPortStates().entries()) {
                await startSerial(id, updateSerialChartValue);
            }
        } catch (error) {
            console.error("Could not read from serial port:", error);
        }
    }

    //Handle changes in offset text input. 
    handleOffsetInputChange(e) {
        let inputOffset = e.target.value;
        const offsetMin = parseFloat(this.calOffsetSlider.min); //Convert from string to float.
        const offsetMax = parseFloat(this.calOffsetSlider.max); //Convert from string to float.

        //Modify the text if it is outside the min/max. 
        if (inputOffset < offsetMin) {
            inputOffset = offsetMin;
            e.target.value = inputOffset;
        }
        if (inputOffset > offsetMax) {
            inputOffset = offsetMax;
            e.target.value = inputOffset;
        }
        
        this.calOffsetSlider.value = inputOffset; //Make the slider reflect the text input.
    }

    //Handle changes in offset slider. 
    handleOffsetSliderChange(e) {
        let sliderOffset = e.target.value;
        const offsetMin = parseFloat(this.calOffsetSlider.min); //Convert from string to float.
        const offsetMax = parseFloat(this.calOffsetSlider.max); //Convert from string to float.

        //Modify the slider if it is outside the min/max. 
        if (sliderOffset < offsetMin) {
            sliderOffset = offsetMin;
        }
        if (sliderOffset > offsetMax) {
            sliderOffset = offsetMax;
        }
        
        this.calOffsetInput.value = sliderOffset; //Make the text input reflect the slider.
    }

    //Handle changes in gain text input. 
    handleGainInputChange(e) {
        let inputGain = e.target.value;
        const gainMin = parseFloat(this.calGainSlider.min); //Convert from string to float.
        const gainMax = parseFloat(this.calGainSlider.max); //Convert from string to float.

        //Modify the text if it is outside the min/max. 
        if (inputGain < gainMin) {
            inputGain = gainMin;
            e.target.value = inputGain;
        }
        if (inputGain > gainMax) {
            inputGain = gainMax;
            e.target.value = inputGain;
        }
        
        this.calGainSlider.value = inputGain; //Make the slider reflect the text input.
    }

    //Handle changes in offset slider. 
    handleGainSliderChange(e) {
        let sliderGain = e.target.value;
        const gainMin = parseFloat(this.calGainSlider.min); //Convert from string to float.
        const gainMax = parseFloat(this.calGainSlider.max); //Convert from string to float.

        //Modify the slider if it is outside the min/max. 
        if (sliderGain < gainMin) {
            sliderGain = gainMin;
        }
        if (sliderGain > gainMax) {
            sliderGain = gainMax;
        }
        
        this.calGainInput.value = sliderGain; //Make the text input reflect the slider.
    }

    //Method to send the offset and gain values to the arduino. 
    async handleSubmitClick() {
        const debugCalTextInput = document.getElementById("debugCalTextInput");
        const R_me = Number(debugCalTextInput.value);
        const R_gain = Number(this.calGainInput.value);
        const R_off = Number(this.calOffsetInput.value);
        const expectedV_out = R_gain*((1.65 -(3.3*(R_me/(R_me+R_off))))/10.0) + 1.65;
        // console.log("expectedV_out", expectedV_out);
        const expectedADC_out = Math.round(255 * (expectedV_out / 3.3));
        console.log("expectedADC_out", expectedADC_out);


        const command = `SET R_OFF ${this.calOffsetInput.value} R_GAIN ${this.calGainInput.value}\n`;
        
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
