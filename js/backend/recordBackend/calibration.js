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

    // Port 1 (sensor1) elements
    this.calOffsetInput1 = document.getElementById("offset-input1");
    this.calOffsetSlider1 = document.getElementById("offset-slider1");
    this.calGainInput1 = document.getElementById("gain-input1");
    this.calGainSlider1 = document.getElementById("gain-slider1");
    this.calResetOffset1 = document.getElementById("offset-recenter1");

    // Port 2 (sensor2) elements
    this.calOffsetInput2 = document.getElementById("offset-input2");
    this.calOffsetSlider2 = document.getElementById("offset-slider2");
    this.calGainInput2 = document.getElementById("gain-input2");
    this.calGainSlider2 = document.getElementById("gain-slider2");
    this.calResetOffset2 = document.getElementById("offset-recenter2");

    // Map port IDs to their UI elements
    this.portElements = new Map();
    this.portElements.set("sensor1", {
      offsetInput: this.calOffsetInput1,
      offsetSlider: this.calOffsetSlider1,
      gainInput: this.calGainInput1,
      gainSlider: this.calGainSlider1,
      resetButton: this.calResetOffset1,
    });
    this.portElements.set("sensor2", {
      offsetInput: this.calOffsetInput2,
      offsetSlider: this.calOffsetSlider2,
      gainInput: this.calGainInput2,
      gainSlider: this.calGainSlider2,
      resetButton: this.calResetOffset2,
    });
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

    // Store per-port calibration values
    this.portCalibration = new Map();

    // Initialize calibration values and UI for each port
    for (const [portId, elements] of this.portElements.entries()) {
      this.portCalibration.set(portId, {
        rOff: this.offsetDefault,
        rGain: this.gainDefault,
      });

      // Setup sliders
      elements.offsetSlider.min = this.offsetMin;
      elements.offsetSlider.max = this.offsetMax;
      elements.offsetSlider.value = this.offsetDefault;
      elements.gainSlider.min = this.gainMin;
      elements.gainSlider.max = this.gainMax;
      elements.gainSlider.value = this.gainDefault;

      // Setup inputs
      elements.offsetInput.value = this.offsetDefault;
      elements.gainInput.value = this.gainDefault;
    }
  }

  // Helper method to get calibration values for a port
  getPortCalibration(portId) {
    if (!this.portCalibration.has(portId)) {
      this.portCalibration.set(portId, {
        rOff: this.offsetDefault,
        rGain: this.gainDefault,
      });
    }
    return this.portCalibration.get(portId);
  }

  // Helper method to get UI elements for a port
  getPortElements(portId) {
    return this.portElements.get(portId);
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
    // Helper function to determine port ID from element ID
    const getPortIdFromElementId = (elementId) => {
      if (elementId.includes("1") || elementId === "offset-recenter1") {
        return "sensor1";
      } else if (elementId.includes("2") || elementId === "offset-recenter2") {
        return "sensor2";
      }
      return null;
    };

    // Setup event listeners for port 1
    this.calOffsetInput1.addEventListener("change", async (e) => {
      const now = Date.now();
      if (this.stimAnalyzer)
        this.stimAnalyzer.suppressForCalibration(now, "sensor1");
      if (this.dataProcessor) this.dataProcessor.setPhase("manual-offset");
      await this.handleOffsetInputChange(e, "sensor1");
    });

    this.calOffsetSlider1.addEventListener("change", async (e) => {
      const now = Date.now();
      if (this.stimAnalyzer)
        this.stimAnalyzer.suppressForCalibration(now, "sensor1");
      if (this.dataProcessor) this.dataProcessor.setPhase("manual-offset");
      await this.handleOffsetSliderChange(e, "sensor1");
    });

    this.calGainInput1.addEventListener("change", async (e) => {
      const now = Date.now();
      if (this.stimAnalyzer)
        this.stimAnalyzer.suppressForCalibration(now, "sensor1");
      if (this.dataProcessor) this.dataProcessor.setPhase("manual-gain");
      await this.handleGainInputChange(e, "sensor1");
    });

    this.calGainSlider1.addEventListener("change", async (e) => {
      const now = Date.now();
      if (this.stimAnalyzer)
        this.stimAnalyzer.suppressForCalibration(now, "sensor1");
      if (this.dataProcessor) this.dataProcessor.setPhase("manual-gain");
      await this.handleGainSliderChange(e, "sensor1");
    });

    this.calResetOffset1.addEventListener("click", async () => {
      if (this.stimAnalyzer) this.stimAnalyzer.beginCalibrationSuppression();
      if (this.dataProcessor) this.dataProcessor.setPhase("auto-offset");
      const state = this.connectionManager.getPortStates().get("sensor1");
      if (state) {
        await this.modifyOffset("sensor1", state);
      }
      if (this.dataProcessor) this.dataProcessor.setPhase("game");
    });

    // Setup event listeners for port 2
    this.calOffsetInput2.addEventListener("change", async (e) => {
      const now = Date.now();
      if (this.stimAnalyzer)
        this.stimAnalyzer.suppressForCalibration(now, "sensor2");
      if (this.dataProcessor) this.dataProcessor.setPhase("manual-offset");
      await this.handleOffsetInputChange(e, "sensor2");
    });

    this.calOffsetSlider2.addEventListener("change", async (e) => {
      const now = Date.now();
      if (this.stimAnalyzer)
        this.stimAnalyzer.suppressForCalibration(now, "sensor2");
      if (this.dataProcessor) this.dataProcessor.setPhase("manual-offset");
      await this.handleOffsetSliderChange(e, "sensor2");
    });

    this.calGainInput2.addEventListener("change", async (e) => {
      const now = Date.now();
      if (this.stimAnalyzer)
        this.stimAnalyzer.suppressForCalibration(now, "sensor2");
      if (this.dataProcessor) this.dataProcessor.setPhase("manual-gain");
      await this.handleGainInputChange(e, "sensor2");
    });

    this.calGainSlider2.addEventListener("change", async (e) => {
      const now = Date.now();
      if (this.stimAnalyzer)
        this.stimAnalyzer.suppressForCalibration(now, "sensor2");
      if (this.dataProcessor) this.dataProcessor.setPhase("manual-gain");
      await this.handleGainSliderChange(e, "sensor2");
    });

    this.calResetOffset2.addEventListener("click", async () => {
      if (this.stimAnalyzer) this.stimAnalyzer.beginCalibrationSuppression();
      if (this.dataProcessor) this.dataProcessor.setPhase("auto-offset");
      const state = this.connectionManager.getPortStates().get("sensor2");
      if (state) {
        await this.modifyOffset("sensor2", state);
      }
      if (this.dataProcessor) this.dataProcessor.setPhase("game");
    });
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

          // Update calibration for the specific port
          this.calculateTargetRMax(adcMin, id);
          this.calculateTargetRMin(adcMax, id);
          this.calculateOffR(id);
          this.calculateGainR(id);

          const cal = this.getPortCalibration(id);
          const command = `SET R_OFF ${cal.rOff} R_GAIN ${cal.rGain}\n`;
          await serialWrite(id, command);
        }
        state.stimEDAValues = [];
      }
      this.previousRound = round;
    }
  }

  //Method to update the R offset by a ratio
  async increaseRGainByRatio(ratio, portId) {
    const cal = this.getPortCalibration(portId);
    const elements = this.getPortElements(portId);

    console.log(`Old rGain for ${portId}:`, cal.rGain);
    cal.rGain = ratio * cal.rGain;
    if (cal.rGain > this.gainMax) {
      cal.rGain = this.gainMax;
    }
    if (cal.rGain < this.gainMin) {
      cal.rGain = this.gainMin;
    }
    elements.gainSlider.value = cal.rGain;
    elements.gainInput.value = cal.rGain;

    const command = `SET R_OFF ${cal.rOff} R_GAIN ${cal.rGain}\n`;
    console.log(`Updating rGain by ratio for ${portId}:`, ratio);
    console.log(`New rGain for ${portId}:`, cal.rGain);
    await serialWrite(portId, command);
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
    const cal = this.getPortCalibration(id);
    const elements = this.getPortElements(id);

    // Initialize per-port step counter if needed
    if (!this._offsetStepCounters) {
      this._offsetStepCounters = new Map();
    }
    if (!this._offsetStepCounters.has(id)) {
      this._offsetStepCounters.set(id, 0);
    }

    let offsetCalDone = false;
    while (!offsetCalDone) {
      await new Promise((resolve) => setTimeout(resolve, 10));

      if (state.stimEDAValues.length > 10) {
        let val = state.stimEDAValues[state.stimEDAValues.length - 1];
        // console.table({
        //   port: id,
        //   "state.stimEDAValues.length": state.stimEDAValues.length,
        //   val: val,
        //   baselineADCTarget: this.baselineADCTarget,
        //   baselineADCTargetError: this.baselineADCTargetError,
        //   "target - err":
        //     this.baselineADCTarget - 255 * this.baselineADCTargetError,
        //   "target + err":
        //     this.baselineADCTarget + 255 * this.baselineADCTargetError,
        // });

        // Add variable to control the step frequency
        if (!this.offsetStepEveryN) {
          this.offsetStepEveryN = 2; // Default to 2 if not set
        }

        let shouldStep = false;
        let stepCounter = this._offsetStepCounters.get(id);
        stepCounter++;
        if (stepCounter >= this.offsetStepEveryN) {
          shouldStep = true;
          stepCounter = 0;
        }
        this._offsetStepCounters.set(id, stepCounter);

        if (val < this.baselineADCTarget - 255 * this.baselineADCTargetError) {
          if (shouldStep) {
            cal.rOff++;
            if (this.dataProcessor) this.dataProcessor.updateOffset(cal.rOff);
            elements.offsetSlider.value = cal.rOff;
            elements.offsetInput.value = cal.rOff;
            // console.log(`Increasing rOff for ${id}: ${cal.rOff}`);
            const command = `SET R_OFF ${cal.rOff} R_GAIN ${cal.rGain}\n`;
            await serialWrite(id, command);
          }
        } else if (
          val >
          this.baselineADCTarget + 255 * this.baselineADCTargetError
        ) {
          if (shouldStep) {
            cal.rOff--;
            if (this.dataProcessor) this.dataProcessor.updateOffset(cal.rOff);
            elements.offsetSlider.value = cal.rOff;
            elements.offsetInput.value = cal.rOff;
            // console.log(`Decreasing rOff for ${id}: ${cal.rOff}`);
            const command = `SET R_OFF ${cal.rOff} R_GAIN ${cal.rGain}\n`;
            await serialWrite(id, command);
          }
        } else {
          console.log(`Value stable for ${id}`);
          state.stimEDAValues = [];
          state.stimEDATime = [];
          offsetCalDone = true;
          if (this.stimAnalyzer)
            this.stimAnalyzer.endCalibrationSuppression(Date.now(), id);
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

      // Run operations for all ports simultaneously
      const portPromises = Array.from(
        this.connectionManager.getPortStates().entries()
      ).map(async ([id, state]) => {
        const cal = this.getPortCalibration(id);
        const command = `SET R_OFF ${cal.rOff} R_GAIN ${cal.rGain}\n`;
        await startSerial(id, window.updateInterfaceCal);
        await serialWrite(id, command); //Set the initial cal values
        await this.modifyOffset(id, state);
      });
      await Promise.all(portPromises);
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
  async handleOffsetInputChange(e, portId) {
    const cal = this.getPortCalibration(portId);
    const elements = this.getPortElements(portId);

    cal.rOff = e.target.value;
    const offsetMin = parseFloat(elements.offsetSlider.min); //Convert from string to float.
    const offsetMax = parseFloat(elements.offsetSlider.max); //Convert from string to float.

    //Modify the text if it is outside the min/max.
    if (cal.rOff < offsetMin) {
      cal.rOff = offsetMin;
      e.target.value = cal.rOff;
    }
    if (cal.rOff > offsetMax) {
      cal.rOff = offsetMax;
      e.target.value = cal.rOff;
    }

    if (this.dataProcessor) this.dataProcessor.updateOffset(cal.rOff);

    const command = `SET R_OFF ${cal.rOff} R_GAIN ${cal.rGain}\n`;
    await serialWrite(portId, command); //Set the initial cal values

    elements.offsetSlider.value = cal.rOff; //Make the slider reflect the text input.
  }

  //Handle changes in offset slider.
  async handleOffsetSliderChange(e, portId) {
    const cal = this.getPortCalibration(portId);
    const elements = this.getPortElements(portId);

    cal.rOff = e.target.value;
    const offsetMin = parseFloat(elements.offsetSlider.min); //Convert from string to float.
    const offsetMax = parseFloat(elements.offsetSlider.max); //Convert from string to float.

    //Modify the slider if it is outside the min/max.
    if (cal.rOff < offsetMin) {
      cal.rOff = offsetMin;
    }
    if (cal.rOff > offsetMax) {
      cal.rOff = offsetMax;
    }

    if (this.dataProcessor) this.dataProcessor.updateOffset(cal.rOff);

    const command = `SET R_OFF ${cal.rOff} R_GAIN ${cal.rGain}\n`;
    await serialWrite(portId, command); //Set the initial cal values

    elements.offsetInput.value = cal.rOff; //Make the text input reflect the slider.
  }

  //Handle changes in gain text input.
  async handleGainInputChange(e, portId) {
    const cal = this.getPortCalibration(portId);
    const elements = this.getPortElements(portId);

    cal.rGain = Number(e.target.value);
    const gainMin = parseFloat(elements.gainSlider.min); //Convert from string to float.
    const gainMax = parseFloat(elements.gainSlider.max); //Convert from string to float.

    //Modify the text if it is outside the min/max.
    if (cal.rGain < gainMin) {
      cal.rGain = gainMin;
      e.target.value = cal.rGain;
    }
    if (cal.rGain > gainMax) {
      cal.rGain = gainMax;
      e.target.value = cal.rGain;
    }

    if (this.dataProcessor) this.dataProcessor.updateGain(cal.rGain);

    const command = `SET R_OFF ${cal.rOff} R_GAIN ${cal.rGain}\n`;
    await serialWrite(portId, command); //Set the initial cal values

    elements.gainSlider.value = cal.rGain; //Make the slider reflect the text input.
  }

  //Handle changes in offset slider.
  async handleGainSliderChange(e, portId) {
    const cal = this.getPortCalibration(portId);
    const elements = this.getPortElements(portId);

    cal.rGain = Number(e.target.value);
    const gainMin = parseFloat(elements.gainSlider.min); //Convert from string to float.
    const gainMax = parseFloat(elements.gainSlider.max); //Convert from string to float.

    //Modify the slider if it is outside the min/max.
    if (cal.rGain < gainMin) {
      cal.rGain = gainMin;
    }
    if (cal.rGain > gainMax) {
      cal.rGain = gainMax;
    }

    if (this.dataProcessor) this.dataProcessor.updateGain(cal.rGain);

    const command = `SET R_OFF ${cal.rOff} R_GAIN ${cal.rGain}\n`;
    await serialWrite(portId, command); //Set the initial cal values

    elements.gainInput.value = cal.rGain; //Make the text input reflect the slider.
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

  calculateTargetR(adcOut, portId) {
    const cal = this.getPortCalibration(portId);
    const vOut = 3.3 * (adcOut / 255.0);
    // const rTarget = (cal.rOff*(1.65*(cal.rGain+10) - 10*vTarget)/(10*vTarget + 1.65*(cal.rGain-10)));
    const rTarget =
      (cal.rOff * (this.rGainLittle * (1.65 - vOut) + 1.65 * cal.rGain)) /
      (this.rGainLittle * (vOut - 1.65) + 1.65 * cal.rGain);

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

  calculateTargetRMin(adcOut, portId) {
    if (!this.portRMin) {
      this.portRMin = new Map();
    }
    this.portRMin.set(portId, this.calculateTargetR(adcOut, portId));
    console.log(
      `Smallest resistance for ${portId}:`,
      this.portRMin.get(portId)
    );
  }

  handleRMaxClick() {
    // this.calculateTargetR();
    // this.rMax = this.rTarget;
    const debugCalTextInput = document.getElementById("debugCalTextInput");
    const rMe = Number(debugCalTextInput.value);
    this.rMax = rMe;
    console.log("this.rMax: ", this.rMax);
  }

  calculateTargetRMax(adcOut, portId) {
    if (!this.portRMax) {
      this.portRMax = new Map();
    }
    this.portRMax.set(portId, this.calculateTargetR(adcOut, portId));
    console.log(`Largest resistance for ${portId}:`, this.portRMax.get(portId));
  }

  calculateOffR(portId) {
    const cal = this.getPortCalibration(portId);
    const elements = this.getPortElements(portId);
    const rMin = this.portRMin ? this.portRMin.get(portId) : null;
    const rMax = this.portRMax ? this.portRMax.get(portId) : null;

    if (rMin && rMax) {
      cal.rOff = Math.sqrt(rMin * rMax);
      // cal.rOff = Math.min(cal.rOff, 2000.00);
      cal.rOff = Math.min(cal.rOff, 4000.0);
      cal.rOff = Math.max(cal.rOff, 4.0);
      console.log(`rOff for ${portId}:`, cal.rOff);
      elements.offsetSlider.value = cal.rOff;
      elements.offsetInput.value = cal.rOff;
    }
  }

  calculateGainR(portId) {
    const cal = this.getPortCalibration(portId);
    const elements = this.getPortElements(portId);
    const rMax = this.portRMax ? this.portRMax.get(portId) : null;

    if (rMax) {
      // cal.rGain = -5.5/(1.65-3.3*(rMin/(rMin+cal.rOff)));
      // cal.rGain = -5.5/(1.65-3.3*(rMax/(rMax+cal.rOff))); //rGainLittle = 10k
      // cal.rGain = (-0.55*this.rGainLittle)/(1.65-3.3*(rMax/(rMax+cal.rOff)));
      cal.rGain =
        ((this.desiredLowerVoltage - 1.65) * this.rGainLittle) /
        (1.65 - 3.3 * (rMax / (rMax + cal.rOff)));
      // cal.rGain = Math.min(cal.rGain, 100.00);
      cal.rGain = Math.min(cal.rGain, 200.0);
      cal.rGain = Math.max(cal.rGain, 0.4);
      console.log(`rGain for ${portId}:`, cal.rGain);
      elements.gainSlider.value = cal.rGain;
      elements.gainInput.value = cal.rGain;
    }
  }

  async handleAutocalClick(portId) {
    const rMin = this.portRMin ? this.portRMin.get(portId) : null;
    const rMax = this.portRMax ? this.portRMax.get(portId) : null;
    console.log(`rMin for ${portId}:`, rMin);
    console.log(`rMax for ${portId}:`, rMax);

    if (rMin && rMax) {
      this.calculateOffR(portId);
      this.calculateGainR(portId);

      const cal = this.getPortCalibration(portId);
      const command = `SET R_OFF ${cal.rOff} R_GAIN ${cal.rGain}\n`;
      await serialWrite(portId, command);
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

  resetROff(portId) {
    const cal = this.getPortCalibration(portId);
    const elements = this.getPortElements(portId);
    cal.rOff = this.offsetDefault;
    elements.offsetSlider.value = cal.rOff;
    elements.offsetInput.value = cal.rOff;
  }

  resetRGain(portId) {
    const cal = this.getPortCalibration(portId);
    const elements = this.getPortElements(portId);
    cal.rGain = this.gainDefault;
    elements.gainSlider.value = cal.rGain;
    elements.gainInput.value = cal.rGain;
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
