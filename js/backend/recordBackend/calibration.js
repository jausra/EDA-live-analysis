import { startSerial, serialWrite } from "./serialReader.js";
import {
  clearSerialChart,
  updateSerialChartValue,
} from "../../frontend/recordFrontend/serialChart.js";
import { clearSigLineChart } from "../../frontend/recordFrontend/significanceLineChart.js";
import { resetColorOptions } from "../../utils.js";

//Class to control the calibration of the hardware.
export class CalibrationManager {
  constructor(
    connectionManager,
    sessionManager,
    stimPresets,
    stimDisplay,
    roundManager,
    stimAnalyzer,
    dataProcessor
  ) {
    this.connectionManager = connectionManager;
    this.sessionManager = sessionManager;
    this.stimPresets = stimPresets;
    this.stimDisplay = stimDisplay;
    this.roundManager = roundManager;
    this.stimAnalyzer = stimAnalyzer;
    this.dataProcessor = dataProcessor;
    this.initializeElements();
    this.setupEventListeners();
    this.setupCalibrationControls();
    this.calculateVoltageLimits();
    this.previousRound = 1;
  }

  //Method to connect to HTML elements.
  initializeElements() {
    this.stimStartStopButton = document.getElementById("stimStartStopButton");
    // this.calibrateButton = document.getElementById("calibrateButton");
    // this.calContainer = document.getElementById("calContainer");
    // this.calOffsetInput = document.getElementById("calOffsetInput");
    this.calOffsetInput = document.getElementById("offset-input");
    // this.calOffsetSlider = document.getElementById("calOffsetSlider");
    this.calOffsetSlider = document.getElementById("offset-slider");
    // this.calGainInput = document.getElementById("calGainInput");
    this.calGainInput = document.getElementById("gain-input");
    // this.calGainSlider = document.getElementById("calGainSlider");
    this.calGainSlider = document.getElementById("gain-slider");
    // this.calSubmitButton = document.getElementById("calSubmitButton");
    // this.setRMinButton = document.getElementById("setRMinButton");
    // this.setRMaxButton = document.getElementById("setRMaxButton");
    // this.autocalButton = document.getElementById("autocalButton");
    this.calResetOffset = document.getElementById("offset-recenter");
  }

  //Method to set slider and text input parameters.
  setupCalibrationControls() {
    // Calibration constants
    this.offsetMin = 4; // kOhm
    // this.offsetMax = 2000; // kOhm
    this.offsetMax = 4000; // kOhm
    this.offsetDefault = 700; // kOhm
    // const offsetDefault = 265 //Joku
    this.gainMin = 0.4; // kOhm
    // this.gainMax = 100; // kOhm
    this.gainMax = 200; // kOhm
    this.gainDefault = 20; // kOhm
    // const gainDefault = 35; // Joku

    this.rGainLittle = 4.7; // kOhm
    this.desiredRange = 0.33; // 0 to 1
    this.desiredError = 0.05; // 0 to 1
    // this.baselineADCTarget = 127;
    this.baselineADCTarget = 255 * ((1.0 - this.desiredRange) / 2);
    this.baselineADCTargetError = 0.05; // 0 to 1

    this.targetDeltaTolerance = 0.05;
    this.targetDelta = 60;
    this.uppoerTargetDeltaBound =
      this.targetDelta * (1 + this.targetDeltaTolerance);
    this.lowerTargetDeltaBound =
      this.targetDelta * (1 - this.targetDeltaTolerance);

    this.rOff = this.offsetDefault;
    this.calOffsetSlider.min = this.offsetMin;
    this.calOffsetSlider.max = this.offsetMax;
    this.calOffsetInput.value = this.offsetDefault;
    this.calOffsetSlider.value = this.offsetDefault;

    this.rGain = this.gainDefault;
    this.calGainSlider.min = this.gainMin;
    this.calGainSlider.max = this.gainMax;
    this.calGainInput.value = this.gainDefault;
    this.calGainSlider.value = this.gainDefault;
  }

  voltageToADC(voltage) {
    return 255 * (voltage / 3.3);
  }

  calculateVoltageLimits() {
    this.desiredUpperVoltage = 1.65 + (3.3 * this.desiredRange) / 2;
    this.desiredUpperADC = this.voltageToADC(this.desiredUpperVoltage);
    console.log("desiredUpperADC: ", this.desiredUpperADC);

    this.desiredUpperVoltageMax =
      this.desiredUpperVoltage + 3.3 * this.desiredError;
    this.desiredUpperADCMax = this.voltageToADC(this.desiredUpperVoltageMax);
    console.log("desiredUpperADCMax: ", this.desiredUpperADCMax);

    this.desiredUpperVoltageMin =
      this.desiredUpperVoltage - 3.3 * this.desiredError;
    this.desiredUpperADCMin = this.voltageToADC(this.desiredUpperVoltageMin);
    console.log("desiredUpperADCMin: ", this.desiredUpperADCMin);

    this.desiredLowerVoltage = 1.65 - (3.3 * this.desiredRange) / 2;
    this.desiredLowerADC = this.voltageToADC(this.desiredLowerVoltage);
    console.log("desiredLowerADC: ", this.desiredLowerADC);

    this.desiredLowerVoltageMax =
      this.desiredLowerVoltage + 3.3 * this.desiredError;
    this.desiredLowerADCMax = this.voltageToADC(this.desiredLowerVoltageMax);
    console.log("desiredLowerADCMax: ", this.desiredLowerADCMax);

    this.desiredLowerVoltageMin =
      this.desiredLowerVoltage - 3.3 * this.desiredError;
    this.desiredLowerADCMin = this.voltageToADC(this.desiredLowerVoltageMin);
    console.log("desiredLowerADCMin: ", this.desiredLowerADCMin);
  }

  //Method to set up click handlers for buttons/sliders/text inputs.
  setupEventListeners() {
    //Calibrate button click handler.
    // this.calibrateButton.addEventListener("click", async () => {
    //     await this.handleCalibrateClick();
    // });

    //Offset input change handler.
    this.calOffsetInput.addEventListener("change", async (e) => {
      const now = Date.now();
      if (this.stimAnalyzer) this.stimAnalyzer.suppressForCalibration(now);
      if (this.dataProcessor) this.dataProcessor.setPhase("manual-offset");
      await this.handleOffsetInputChange(e);
    });

    //Offset slider change handler.
    this.calOffsetSlider.addEventListener("change", async (e) => {
      const now = Date.now();
      if (this.stimAnalyzer) this.stimAnalyzer.suppressForCalibration(now);
      if (this.dataProcessor) this.dataProcessor.setPhase("manual-offset");
      await this.handleOffsetSliderChange(e);
    });

    //Gain input change handler.
    this.calGainInput.addEventListener("change", async (e) => {
      const now = Date.now();
      if (this.stimAnalyzer) this.stimAnalyzer.suppressForCalibration(now);
      if (this.dataProcessor) this.dataProcessor.setPhase("manual-gain");
      await this.handleGainInputChange(e);
    });

    //Gain slider change handler.
    this.calGainSlider.addEventListener("change", async (e) => {
      const now = Date.now();
      if (this.stimAnalyzer) this.stimAnalyzer.suppressForCalibration(now);
      if (this.dataProcessor) this.dataProcessor.setPhase("manual-gain");
      await this.handleGainSliderChange(e);
    });

    this.calResetOffset.addEventListener("click", async () => {
      if (this.stimAnalyzer) this.stimAnalyzer.beginCalibrationSuppression();
      if (this.dataProcessor) this.dataProcessor.setPhase("auto-offset");
      for (const [id, state] of this.connectionManager
        .getPortStates()
        .entries()) {
        await this.modifyOffset(id, state);
      }
      if (this.dataProcessor) this.dataProcessor.setPhase("game");
    });

    //Submit button click handler.
    // this.calSubmitButton.addEventListener("click", async () => {
    //     await this.handleSubmitClick();
    // });

    // //Set R Min button click handler.
    // this.setRMinButton.addEventListener("click", () => {
    //     this.handleRMinClick();
    // });

    // //Set R Max button click handler.
    // this.setRMaxButton.addEventListener("click", () => {
    //     this.handleRMaxClick();
    // });

    // //Autocal button click handler.
    // this.autocalButton.addEventListener("click", async () => {
    //     await this.handleAutocalClick();
    // });
  }

  async handleCalStimulus(round) {
    if (round !== this.previousRound) {
      console.log("Calibrating...");
      for (const [id, state] of this.connectionManager
        .getPortStates()
        .entries()) {
        console.log("state.stimEDAValues.length", state.stimEDAValues.length);
        let adcMin = Math.min(...state.stimEDAValues.slice(10));
        console.log("ADC Min: ", adcMin);
        let adcMax = Math.max(...state.stimEDAValues.slice(10));
        console.log("ADC Max: ", adcMax);

        //Check if ADC values are in range
        if (adcMin >= 75 && adcMin <= 95 && adcMax >= 160 && adcMax <= 180) {
          // If ADC values are in range, start the game
          // if (true) {
          console.log("CALIBRATION COMPLETE");
          this.stimPresets.msiApplyPreset(presetName); //Apply the stim items based on the game.
          resetColorOptions();
          await this.sessionManager.msiStartSession();
        } else {
          // If ADC value are not in range, update the offset and gain resistance
          console.log("Updating with new values...");
          this.calculateTargetRMax(adcMin); //Low ADC corresponds to high wheatstone voltage, which comes from high resistance
          this.calculateTargetRMin(adcMax); //High ADC corresponds to low wheatstone voltage, which comes from low resistance

          this.calculateOffR();
          this.calculateGainR();

          const command = `SET R_OFF ${this.rOff} R_GAIN ${this.rGain}\n`;

          for (const [id, state] of this.connectionManager
            .getPortStates()
            .entries()) {
            await serialWrite(id, command);
          }
        }
        state.stimEDAValues = [];
      }
      this.previousRound = round;
    }
  }

  //Method to update the R offset by a ratio
  async increaseRGainByRatio(ratio) {
    console.log("Old rGain:", this.rGain);
    this.rGain = ratio * this.rGain;
    if (this.rGain > this.gainMax) {
      this.rGain = this.gainMax;
    }
    if (this.rGain < this.gainMin) {
      this.rGain = this.gainMin;
    }
    this.calGainSlider.value = this.rGain;
    this.calGainInput.value = this.rGain;

    const command = `SET R_OFF ${this.rOff} R_GAIN ${this.rGain}\n`;
    console.log("Updating rOff by ratio:", ratio);
    console.log("nNewew rGain:", this.rGain);
    for (const [id, state] of this.connectionManager
      .getPortStates()
      .entries()) {
      await serialWrite(id, command);
    }
  }

  async msiHandleCalStimulus(round, presetName) {
    // This function is no longer needed for round 2 processing
    // All calibration completion logic has been moved to msiBeginCal
  }

  initCalibrationCB() {
    this.stimDisplay.clearOnStimDisplay(); //Clear all callbacks
    //Function to be called every time we have a new stim.
    this.stimDisplay.onStimDisplay(
      async ({ stim, round, color, startTime, stopTime }) => {
        await this.handleCalStimulus(
          // stim,
          round
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
      }
    );
  }

  msiInitCalibrationCB(presetName) {
    this.stimDisplay.clearOnStimDisplay(); //Clear all callbacks
    //Function to be called every time we have a new stim.
    this.stimDisplay.onStimDisplay(
      async ({ stim, round, color, startTime, stopTime }) => {
        await this.msiHandleCalStimulus(round, presetName);
      }
    );
  }

  //Handle clicking the calibration button.
  async handleCalibrateClick() {
    try {
      clearSigLineChart(); //Clear the significance chart.
      this.stimStartStopButton.disabled = false; //Enable the start button
      // this.calibrateButton.disabled = true; //Disable the clibration button.
      // this.calContainer.classList.toggle("hiddenFlex", false); //show the calibration sliders/text inputs.

      //Reset EDA values and clear charts for all ports.
      for (const [id, state] of this.connectionManager
        .getPortStates()
        .entries()) {
        this.connectionManager.resetEDAValues(id);
        // clearSerialChart(id);
      }
      clearSerialChart(this.connectionManager);

      this.stimPresets.applyPreset("Calibrate"); // Apply the calibration preset

      this.initCalibrationCB();
      this.stimDisplay.running = true;

      await this.sessionManager.showInitialCountdown();

      //Start serial reading for all ports.
      for (const [id, state] of this.connectionManager
        .getPortStates()
        .entries()) {
        await startSerial(id, window.updateInterface);
      }
      this.stimDisplay.start();
    } catch (error) {
      console.error("Could not read from serial port:", error);
    }
  }

  async modifyOffset(id, state) {
    let offsetCalDone = false;
    while (!offsetCalDone) {
      await new Promise((resolve) => setTimeout(resolve, 10));

      if (state.stimEDAValues.length > 10) {
        let val = state.stimEDAValues[state.stimEDAValues.length - 1];
        console.table({
          "state.stimEDAValues.length": state.stimEDAValues.length,
          val: val,
          baselineADCTarget: this.baselineADCTarget,
          baselineADCTargetError: this.baselineADCTargetError,
          "target - err":
            this.baselineADCTarget - 255 * this.baselineADCTargetError,
          "target + err":
            this.baselineADCTarget + 255 * this.baselineADCTargetError,
        });

        // Add variable to control the step frequency
        if (!this.offsetStepEveryN) {
          this.offsetStepEveryN = 2; // Default to 1 if not set
        }
        if (!this._offsetStepCounter) {
          this._offsetStepCounter = 0;
        }

        let shouldStep = false;
        this._offsetStepCounter++;
        if (this._offsetStepCounter >= this.offsetStepEveryN) {
          shouldStep = true;
          this._offsetStepCounter = 0;
        }

        if (val < this.baselineADCTarget - 255 * this.baselineADCTargetError) {
          if (shouldStep) {
            this.rOff++;
            if (this.dataProcessor) this.dataProcessor.updateOffset(this.rOff);
            this.calOffsetSlider.value = this.rOff;
            this.calOffsetInput.value = this.rOff;
            console.log("Increasing rOff");
            const command = `SET R_OFF ${this.rOff} R_GAIN ${this.rGain}\n`;
            await serialWrite(id, command);
          }
        } else if (
          val >
          this.baselineADCTarget + 255 * this.baselineADCTargetError
        ) {
          if (shouldStep) {
            this.rOff--;
            if (this.dataProcessor) this.dataProcessor.updateOffset(this.rOff);
            this.calOffsetSlider.value = this.rOff;
            this.calOffsetInput.value = this.rOff;
            console.log("Decreasing rOff");
            const command = `SET R_OFF ${this.rOff} R_GAIN ${this.rGain}\n`;
            await serialWrite(id, command);
          }
        } else {
          console.log("Value stable");
          state.stimEDAValues = [];
          state.stimEDATime = [];
          offsetCalDone = true;
          if (this.stimAnalyzer)
            this.stimAnalyzer.endCalibrationSuppression(Date.now());
          // this.hideCalibrationProgress();
        }
      }
    }
  }

  async msiStartStream() {
    try {
      //Reset EDA values and clear charts for all ports.
      for (const [id, state] of this.connectionManager
        .getPortStates()
        .entries()) {
        this.connectionManager.resetEDAValues(id);
        // clearSerialChart(id);
      }
      clearSerialChart(this.connectionManager);

      const command = `SET R_OFF ${this.rOff} R_GAIN ${this.rGain}\n`;
      for (const [id, state] of this.connectionManager
        .getPortStates()
        .entries()) {
        await startSerial(id, window.updateInterfaceCal);
        await serialWrite(id, command); //Set the initial cal values
        // Show calibration progress indicator
        // this.showCalibrationProgress();
        await this.modifyOffset(id, state);
        // Show breathing cue for calibration
        // this.showBreathingCue("calibration");
        // if (this.dataProcessor) this.dataProcessor.setPhase("auto-gain");
      }
    } catch (error) {
      console.error("Could not read from serial port:", error);
    }
  }

  //Handle clicking the calibration button.
  async msiBeginCal(presetName) {
    try {
      // clearSigLineChart(); //Clear the significance chart.
      // // this.stimStartStopButton.disabled = false; //Enable the start button
      // // this.calibrateButton.disabled = true; //Disable the clibration button.
      // // this.calContainer.classList.toggle("hiddenFlex", false); //show the calibration sliders/text inputs.

      // //Reset EDA values and clear charts for all ports.
      // for (const [id, state] of this.connectionManager
      //   .getPortStates()
      //   .entries()) {
      //   this.connectionManager.resetEDAValues(id);
      //   // clearSerialChart(id);
      // }
      // clearSerialChart(this.connectionManager);

      // this.stimPresets.applyPreset("Calibrate"); // Not used

      // this.msiInitCalibrationCB(presetName); // Not used
      // this.stimDisplay.running = true;

      // // await this.sessionManager.showInitialCountdown();

      // //Start serial reading for all ports.
      // const command = `SET R_OFF ${this.rOff} R_GAIN ${this.rGain}\n`;
      // for (const [id, state] of this.connectionManager
      //   .getPortStates()
      //   .entries()) {
      //   await startSerial(id, window.updateInterfaceCal);
      //   await serialWrite(id, command); //Set the initial cal values
      //   // Show calibration progress indicator
      //   this.showCalibrationProgress();
      //   await this.modifyOffset(id, state);
      //   // Show breathing cue for calibration
      //   this.showBreathingCue("calibration");
      //   if (this.dataProcessor) this.dataProcessor.setPhase("auto-gain");
      // }

      // // After calibration is complete, transition to game
      // this.stimDisplay.running = false;
      // this.stimDisplay.clearOnStimDisplay();
      // this.hideCalibrationProgress();

      // // Hide calibration breathing cue and show game breathing cue
      // this.hideBreathingCue();

      await this.sessionManager.showInitialCountdown();
      this.showBreathingCue("game");

      this.stimPresets.msiApplyPreset(presetName); //Apply the stim items based on the game.
      resetColorOptions();
      if (this.dataProcessor) this.dataProcessor.setPhase("game");
      await this.sessionManager.msiStartSession();

      // Clear EDA values for all ports
      for (const [id, state] of this.connectionManager
        .getPortStates()
        .entries()) {
        state.stimEDAValues = [];
      }

      this.stimDisplay.start();
    } catch (error) {
      console.error("Could not read from serial port:", error);
    }
  }

  //Handle changes in offset text input.
  async handleOffsetInputChange(e) {
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

    if (this.dataProcessor) this.dataProcessor.updateOffset(this.rOff);

    const command = `SET R_OFF ${this.rOff} R_GAIN ${this.rGain}\n`;
    for (const [id, state] of this.connectionManager
      .getPortStates()
      .entries()) {
      await serialWrite(id, command); //Set the initial cal values
    }

    this.calOffsetSlider.value = this.rOff; //Make the slider reflect the text input.
  }

  //Handle changes in offset slider.
  async handleOffsetSliderChange(e) {
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

    if (this.dataProcessor) this.dataProcessor.updateOffset(this.rOff);

    const command = `SET R_OFF ${this.rOff} R_GAIN ${this.rGain}\n`;
    for (const [id, state] of this.connectionManager
      .getPortStates()
      .entries()) {
      await serialWrite(id, command); //Set the initial cal values
    }

    this.calOffsetInput.value = this.rOff; //Make the text input reflect the slider.
  }

  //Handle changes in gain text input.
  async handleGainInputChange(e) {
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

    if (this.dataProcessor) this.dataProcessor.updateGain(this.rGain);

    const command = `SET R_OFF ${this.rOff} R_GAIN ${this.rGain}\n`;
    for (const [id, state] of this.connectionManager
      .getPortStates()
      .entries()) {
      await serialWrite(id, command); //Set the initial cal values
    }

    this.calGainSlider.value = this.rGain; //Make the slider reflect the text input.
  }

  //Handle changes in offset slider.
  async handleGainSliderChange(e) {
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

    if (this.dataProcessor) this.dataProcessor.updateGain(this.rGain);

    const command = `SET R_OFF ${this.rOff} R_GAIN ${this.rGain}\n`;
    for (const [id, state] of this.connectionManager
      .getPortStates()
      .entries()) {
      await serialWrite(id, command); //Set the initial cal values
    }

    this.calGainInput.value = this.rGain; //Make the text input reflect the slider.
  }

  //Method to send the offset and gain values to the arduino.
  async handleSubmitClick() {
    const rGain = Number(this.calGainInput.value);
    const rOff = Number(this.calOffsetInput.value);

    const debugCalTextInput = document.getElementById("debugCalTextInput");
    const rMe = Number(debugCalTextInput.value);
    const expectedV_out =
      rGain * ((1.65 - 3.3 * (rMe / (rMe + rOff))) / 10.0) + 1.65;
    console.log("expectedV_out", expectedV_out);
    const expectedADC_out = Math.round(255 * (expectedV_out / 3.3));
    console.log("expectedADC_out", expectedADC_out);

    const command = `SET R_OFF ${rOff} R_GAIN ${rGain}\n`;

    //Send the command to each port.
    //To-Do: modify to send sepcific commends to individual ports.
    for (const [id, state] of this.connectionManager
      .getPortStates()
      .entries()) {
      await serialWrite(id, command);
    }
  }

  calculateTargetR(adcOut) {
    const vOut = 3.3 * (adcOut / 255.0);
    // const rTarget = (this.rOff*(1.65*(this.rGain+10) - 10*vTarget)/(10*vTarget + 1.65*(this.rGain-10)));
    const rTarget =
      (this.rOff * (this.rGainLittle * (1.65 - vOut) + 1.65 * this.rGain)) /
      (this.rGainLittle * (vOut - 1.65) + 1.65 * this.rGain);

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

  calculateTargetRMin(adcOut) {
    this.rMin = this.calculateTargetR(adcOut);
    console.log("Smallest resistance:", this.rMin);
  }

  handleRMaxClick() {
    // this.calculateTargetR();
    // this.rMax = this.rTarget;
    const debugCalTextInput = document.getElementById("debugCalTextInput");
    const rMe = Number(debugCalTextInput.value);
    this.rMax = rMe;
    console.log("this.rMax: ", this.rMax);
  }

  calculateTargetRMax(adcOut) {
    this.rMax = this.calculateTargetR(adcOut);
    console.log("Largest resistance:", this.rMax);
  }

  calculateOffR() {
    this.rOff = Math.sqrt(this.rMin * this.rMax);
    // this.rOff = Math.min(this.rOff, 2000.00);
    this.rOff = Math.min(this.rOff, 4000.0);
    this.rOff = Math.max(this.rOff, 4.0);
    console.log("rOff:", this.rOff);
    this.calOffsetSlider.value = this.rOff;
    this.calOffsetInput.value = this.rOff;
  }

  calculateGainR() {
    // this.rGain = -5.5/(1.65-3.3*(this.rMin/(this.rMin+this.rOff)));
    // this.rGain = -5.5/(1.65-3.3*(this.rMax/(this.rMax+this.rOff))); //rGainLittle = 10k
    // this.rGain = (-0.55*this.rGainLittle)/(1.65-3.3*(this.rMax/(this.rMax+this.rOff)));
    this.rGain =
      ((this.desiredLowerVoltage - 1.65) * this.rGainLittle) /
      (1.65 - 3.3 * (this.rMax / (this.rMax + this.rOff)));
    // this.rGain = Math.min(this.rGain, 100.00);
    this.rGain = Math.min(this.rGain, 200.0);
    this.rGain = Math.max(this.rGain, 0.4);
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
    for (const [id, state] of this.connectionManager
      .getPortStates()
      .entries()) {
      await serialWrite(id, command);
    }
  }

  //Public methods for external UI control.
  // enableCalibrateButton() {
  //     this.calibrateButton.disabled = false;
  // }

  // disableCalibrateButton() {
  //     this.calibrateButton.disabled = true;
  // }

  // toggleCalibrateButtonVisibility() {
  //     this.calibrateButton.classList.toggle("hiddenFlex");
  // }

  // showCalibrationContainer() {
  //     this.calContainer.classList.toggle("hiddenFlex", false);
  // }

  // hideCalibrationContainer() {
  //     this.calContainer.classList.toggle("hiddenFlex", true);
  // }

  resetROff() {
    this.rOff = this.offsetDefault;
    this.calOffsetSlider.value = this.rOff;
    this.calOffsetInput.value = this.rOff;
  }

  resetRGain() {
    this.rGain = this.gainDefault;
    this.calGainSlider.value = this.rGain;
    this.calGainInput.value = this.rGain;
  }

  showBreathingCue(phase) {
    const stimWrapper = document.getElementById("stimWrapper");
    if (!stimWrapper) return;

    // Remove any existing breathing cue
    this.hideBreathingCue();

    // Create breathing cue container
    const breathingCue = document.createElement("div");
    breathingCue.id = "breathingCue";
    breathingCue.style.position = "absolute";
    breathingCue.style.top = "95%"; // Position below the center where calibration bar is
    breathingCue.style.left = "50%";
    breathingCue.style.transform = "translate(-50%, -50%)";
    breathingCue.style.zIndex = "500"; // Lower than fireworks (1000) but above other content
    breathingCue.style.pointerEvents = "none";
    breathingCue.style.display = "flex";
    breathingCue.style.flexDirection = "column";
    breathingCue.style.alignItems = "center";
    breathingCue.style.gap = "20px";

    // Create breathing circle
    const breathingCircle = document.createElement("div");
    breathingCircle.id = "breathingCircle";
    breathingCircle.style.width = "120px";
    breathingCircle.style.height = "120px";
    breathingCircle.style.borderRadius = "50%";
    breathingCircle.style.border = "4px solid #4ecdc4";
    breathingCircle.style.backgroundColor = "rgba(78, 205, 196, 0.2)";
    breathingCircle.style.transition = "all 2s ease-in-out";
    breathingCircle.style.display = "flex";
    breathingCircle.style.alignItems = "center";
    breathingCircle.style.justifyContent = "center";
    breathingCircle.style.fontSize = "24px";
    breathingCircle.style.fontWeight = "bold";
    breathingCircle.style.color = "#4ecdc4";

    // Add breathing text
    const breathingText = document.createElement("div");
    breathingText.style.color = "#4ecdc4";
    breathingText.style.fontSize = "18px";
    breathingText.style.fontWeight = "bold";
    breathingText.style.textAlign = "center";

    if (phase === "calibration") {
      breathingText.innerHTML =
        "Calibrating...<br>Take a slow deep breath<br>Exhale fast";
      breathingCircle.textContent = "🌬️";
      breathingCircle.style.fontSize = "64px"; // Maximize emoji size
    } else if (phase === "game") {
      breathingText.innerHTML = "Take a slow deep breath<br>Exhale fast";
      breathingCircle.textContent = "🌬️";
      breathingCue.style.opacity = "0.7"; // Make it more subtle for game phase
      breathingCircle.style.fontSize = "64px"; // Maximize emoji size
    }

    breathingCue.appendChild(breathingCircle);
    breathingCue.appendChild(breathingText);
    stimWrapper.appendChild(breathingCue);

    // Start breathing animation
    this.startBreathingAnimation();
  }

  hideBreathingCue() {
    const breathingCue = document.getElementById("breathingCue");
    if (breathingCue) {
      breathingCue.remove();
    }
    this.stopBreathingAnimation();
  }

  startBreathingAnimation() {
    const breathingCircle = document.getElementById("breathingCircle");
    if (!breathingCircle) return;

    const breatheIn = () => {
      breathingCircle.style.transform = "scale(1.3)";
      breathingCircle.style.backgroundColor = "rgba(78, 205, 196, 0.4)";
    };

    const breatheOut = () => {
      breathingCircle.style.transform = "scale(1)";
      breathingCircle.style.backgroundColor = "rgba(78, 205, 196, 0.2)";
    };

    // Breathing cycle: 4 seconds in, 4 seconds out
    const breathingCycle = () => {
      breatheIn();
      setTimeout(() => {
        breatheOut();
        setTimeout(() => {
          if (document.getElementById("breathingCircle")) {
            breathingCycle();
          }
        }, 4000);
      }, 4000);
    };

    breathingCycle();
  }

  stopBreathingAnimation() {
    // Animation will stop automatically when element is removed
  }

  showCalibrationProgress() {
    const stimWrapper = document.getElementById("stimWrapper");
    if (!stimWrapper) return;

    // Remove any existing calibration progress
    this.hideCalibrationProgress();

    // Create calibration progress container
    const calProgress = document.createElement("div");
    calProgress.id = "calibrationProgress";
    calProgress.style.position = "absolute";
    calProgress.style.top = "50%";
    calProgress.style.left = "50%";
    calProgress.style.transform = "translate(-50%, -50%)";
    calProgress.style.zIndex = "600"; // Above breathing cue but below fireworks
    calProgress.style.pointerEvents = "none";
    calProgress.style.display = "flex";
    calProgress.style.flexDirection = "column";
    calProgress.style.alignItems = "center";
    calProgress.style.gap = "10px";
    calProgress.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    calProgress.style.padding = "15px";
    calProgress.style.borderRadius = "10px";
    calProgress.style.color = "white";

    // Create progress text
    const progressText = document.createElement("div");
    progressText.textContent = "Calibrating...";
    progressText.style.fontSize = "16px";
    progressText.style.fontWeight = "bold";

    // Create progress bar container
    const progressBarContainer = document.createElement("div");
    progressBarContainer.style.width = "200px";
    progressBarContainer.style.height = "8px";
    progressBarContainer.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
    progressBarContainer.style.borderRadius = "4px";
    progressBarContainer.style.overflow = "hidden";

    // Create progress bar
    const progressBar = document.createElement("div");
    progressBar.id = "calibrationProgressBar";
    progressBar.style.width = "0%";
    progressBar.style.height = "100%";
    progressBar.style.backgroundColor = "#4ecdc4";
    progressBar.style.transition = "width 0.3s ease";
    progressBar.style.borderRadius = "4px";

    progressBarContainer.appendChild(progressBar);
    calProgress.appendChild(progressText);
    calProgress.appendChild(progressBarContainer);
    stimWrapper.appendChild(calProgress);

    // Start progress animation
    this.startCalibrationProgressAnimation();
  }

  hideCalibrationProgress() {
    const calProgress = document.getElementById("calibrationProgress");
    if (calProgress) {
      calProgress.remove();
    }
  }

  startCalibrationProgressAnimation() {
    const progressBar = document.getElementById("calibrationProgressBar");
    if (!progressBar) return;

    // Progress from 0 to 100% over exactly 18 seconds
    const startTime = Date.now();
    const duration = 18000; // 18 seconds in milliseconds

    const updateProgress = () => {
      if (!document.getElementById("calibrationProgressBar")) {
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);

      progressBar.style.width = progress + "%";

      if (progress < 100) {
        requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
  }
}
