import { analyzeRounds } from "./stats.js";
import { formatTimeCSV } from "../../utils.js";

//Class for analyzing the raw EDA data.
export class StimAnalyzer {
  constructor(connectionManager, dataProcessor) {
    this.connectionManager = connectionManager;
    this.dataProcessor = dataProcessor;
    this.mergedData = {};
    this.previousWindowStartRound = 0;
    this.windowRounds = 4;
    this.overlapPercent = 0.25;
    this.overlapRounds = this.calculateOverlapRounds(
      this.windowRounds,
      this.overlapPercent
    );

    // Per-port state for dip detection
    this.portState = new Map(); // Stores state for each port: { previousValue, previousTime, dipFlag, dipStartValue, dipStartTime, suppressUntil }
    this.calibrationActive = false; // Global flag for calibration suppression

    // Score tracking per port
    this.portScores = new Map();
    this.maxScore = 100; // Score required to win
    this.gameWon = false; // Track if game has been won

    this.setupThreshold();
    this.initializeScoreBars();
  }

  setupThreshold() {
    // Port 1 (sensor1) elements
    this.thresholdInput1 = document.getElementById("threshold-input1");
    this.thresholdSlider1 = document.getElementById("threshold-slider1");

    // Port 2 (sensor2) elements
    this.thresholdInput2 = document.getElementById("threshold-input2");
    this.thresholdSlider2 = document.getElementById("threshold-slider2");

    // Threshold constants
    this.thresholdMin = 1;
    this.thresholdMax = 80;
    this.thresholdDefault = 20;

    // Map port IDs to their UI elements
    this.portThresholdElements = new Map();
    this.portThresholdElements.set("sensor1", {
      input: this.thresholdInput1,
      slider: this.thresholdSlider1,
    });
    this.portThresholdElements.set("sensor2", {
      input: this.thresholdInput2,
      slider: this.thresholdSlider2,
    });

    // Store per-port threshold values
    this.portThresholds = new Map();

    // Initialize threshold values and UI for each port
    for (const [portId, elements] of this.portThresholdElements.entries()) {
      this.portThresholds.set(portId, this.thresholdDefault);

      // Setup sliders
      elements.slider.min = this.thresholdMin;
      elements.slider.max = this.thresholdMax;
      elements.slider.value = this.thresholdDefault;

      // Setup inputs
      elements.input.value = this.thresholdDefault;
    }

    //Threshold input change handler for port 1.
    this.thresholdInput1.addEventListener("change", (e) => {
      this.handleThresholdInputChange(e, "sensor1");
    });

    //Threshold slider change handler for port 1.
    this.thresholdSlider1.addEventListener("change", (e) => {
      this.handleThresholdSliderChange(e, "sensor1");
    });

    //Threshold input change handler for port 2.
    this.thresholdInput2.addEventListener("change", (e) => {
      this.handleThresholdInputChange(e, "sensor2");
    });

    //Threshold slider change handler for port 2.
    this.thresholdSlider2.addEventListener("change", (e) => {
      this.handleThresholdSliderChange(e, "sensor2");
    });
  }

  // Helper method to get threshold value for a port
  getPortThreshold(portId) {
    if (!this.portThresholds.has(portId)) {
      this.portThresholds.set(portId, this.thresholdDefault);
    }
    return this.portThresholds.get(portId);
  }

  // Helper method to get UI elements for a port
  getPortThresholdElements(portId) {
    return this.portThresholdElements.get(portId);
  }

  //Handle changes in threshold text input.
  handleThresholdInputChange(e, portId) {
    const elements = this.getPortThresholdElements(portId);
    let threshold = e.target.value;
    const thresholdMin = parseFloat(elements.slider.min); //Convert from string to float.
    const thresholdMax = parseFloat(elements.slider.max); //Convert from string to float.

    //Modify the text if it is outside the min/max.
    if (threshold < thresholdMin) {
      threshold = thresholdMin;
      e.target.value = threshold;
    }
    if (threshold > thresholdMax) {
      threshold = thresholdMax;
      e.target.value = threshold;
    }

    this.portThresholds.set(portId, threshold);

    if (this.dataProcessor) {
      this.dataProcessor.updateThreshold(threshold, portId);
      this.dataProcessor.setPhase("manual-threshold");
    }

    elements.slider.value = threshold; //Make the slider reflect the text input.
  }

  //Handle changes in threshold slider.
  handleThresholdSliderChange(e, portId) {
    const elements = this.getPortThresholdElements(portId);
    let threshold = e.target.value;
    const thresholdMin = parseFloat(elements.slider.min); //Convert from string to float.
    const thresholdMax = parseFloat(elements.slider.max); //Convert from string to float.

    //Modify the slider if it is outside the min/max.
    if (threshold < thresholdMin) {
      threshold = thresholdMin;
    }
    if (threshold > thresholdMax) {
      threshold = thresholdMax;
    }

    this.portThresholds.set(portId, threshold);

    if (this.dataProcessor) {
      this.dataProcessor.updateThreshold(threshold, portId);
      this.dataProcessor.setPhase("manual-threshold");
    }

    elements.input.value = threshold; //Make the text input reflect the slider.
  }

  //Method for calculating the number of rounds for the overlap.
  calculateOverlapRounds(window, overlap) {
    return Math.round(window * overlap);
  }

  //Method for setting the window length and can calculating overlap rounds. This is run when you update the window slider.
  setWindowRounds(rounds) {
    this.windowRounds = rounds;
    this.overlapRounds = this.calculateOverlapRounds(
      this.windowRounds,
      this.overlapPercent
    );
  }

  //Method for setting the overlap percent and can calculating overlap rounds. This is run when you update the overlap slider.
  setOverlapPercent(overlap) {
    this.overlapPercent = (overlap * 0.01).toFixed(2);
    this.overlapRounds = this.calculateOverlapRounds(
      this.windowRounds,
      this.overlapPercent
    );
  }

  //Method for calculating the largest negative change in EDA during a single stim.
  findMaxDelta(data) {
    if (data.length < 2) return 0; //Don't valculate if there are less than 3 data points.

    let currentMax = data[0]; //Set the current max to the value of the first data point.
    let maxDelta = 0; //Set the maximum change value to 0.

    for (let i = 1; i < data.length; i++) {
      //Starting with the second data point, increment by 1 over the entire array.
      const delta = currentMax - data[i]; //Set delta to the currentMax minus the current datapoint.
      //If the delta is greater than the max delta, set the max delta to the delta.
      if (delta > maxDelta) {
        maxDelta = delta;
      }
      //If the data point is higher than the current max, set the current max to the data point.
      if (data[i] > currentMax) {
        currentMax = data[i];
      }
    }

    return maxDelta;
  }

  //Method for concatenating data that will be savied in CSV. We will delete this.
  mergeData() {
    const merged = {};

    for (const [id, state] of this.connectionManager
      .getPortStates()
      .entries()) {
      for (const [stim, obj] of Object.entries(state.data)) {
        if (stim === "grandMean" || stim === "grandStdDev") continue;
        if (!merged[stim]) merged[stim] = {};
        merged[stim][id] = obj.avgPValue;
      }
    }
    return merged;
  }

  //Method for getting the max EDA delta and P-Value for a single stim.
  analyzeStim(id, round, newRoundFlag, oldStimValue, updateSigLineChartValue) {
    const state = this.connectionManager.ensurePortState(id); //Get the state for the ID.
    const edaDelta = this.findMaxDelta(state.stimEDAValues); //find the made value for the EDA values.

    if (!state.data[oldStimValue]) {
      //If there is no object with the previous stim value as the key, initialize it.
      state.data[oldStimValue] = {
        datapoints: [],
        rounds: [],
      };
    }

    state.data[oldStimValue].datapoints.push(edaDelta); //Add the edaDelta to the datapoints object.
    state.data[oldStimValue].rounds.push(round); //Add the round to the rounds object.

    if (newRoundFlag === true) {
      //Run if this is a new round.
      if (round === this.previousWindowStartRound + this.windowRounds) {
        //Check if the current round is the final round for the current window.
        const startRound = this.previousWindowStartRound; //Set the startRound.
        const stopRound = round; //Set the stopRound to the current round.
        state.data = analyzeRounds(state.data, startRound, stopRound); //Update state.data by analyzing the rounds.
        const mostRecentRoundTime =
          state.data.windowTimes[state.data.windowTimes.length - 1]; //Get the round time associated with the current window.

        //Update the significance chart with the most recent P value for the window.
        // console.log(state.data);
        Object.entries(state.data).forEach(([label, obj]) => {
          if (obj?.datapoints && obj.avgPValue?.length) {
            const lastAvgP = obj.avgPValue[obj.avgPValue.length - 1];
            // updateSigLineChartValue(lastAvgP, mostRecentRoundTime, label);
          }
        });

        this.previousWindowStartRound = round - this.overlapRounds; //Set the previous Window Start Round.
      }
    }

    return edaDelta;
  }

  //Method for resetting and recalculating stats for all stims. Run after updating window and overlap or uploading fresh data.
  reanalyzeAndDisplay(id, updateSigLineChartArray) {
    const state = this.connectionManager.ensurePortState(id); //Get the state associated with each port.

    if (state.data.grandMean) {
      state.data.grandMean = []; //Clear grand mean.
    }
    if (state.data.grandStdDev) {
      state.data.grandStdDev = []; //Clear grand standard deviation.
    }
    if (state.data.windowTimes) {
      state.data.windowTimes = []; //Clear window times.
    }

    Object.entries(state.data).forEach(([label, obj]) => {
      //Cycle through all the values in the data object.
      if (!obj.datapoints || !obj.rounds) return; //Only look for objects containing data about particular stims.
      if (obj.avg) {
        obj.avg = []; //Clear average.
      }
      if (obj.stdDev) {
        obj.stdDev = []; //Clear standard deviation.
      }
      if (obj.avgZScore) {
        obj.avgZScore = []; //Clear average Z-Score.
      }
      if (obj.avgPValue) {
        obj.avgPValue = []; //Clear average P-Value.
      }
    });

    console.log("this.windowRounds:", this.windowRounds);
    console.log("this.overlapRounds:", this.overlapRounds);

    //Get the current number of rounds.
    const totalRounds = state.data.roundTimes.length;

    console.log("totalRounds:", totalRounds);

    //Calculate the number of windows based on the number of rounds.
    let numWindows = 0;
    if (totalRounds >= this.windowRounds) {
      //Check that there are enough rounds for at least one window.
      numWindows =
        Math.floor(
          (totalRounds - this.windowRounds) /
            (this.windowRounds - this.overlapRounds)
        ) + 1; //Add 1 b/c you say "totalRounds - window", which accounts for the first window.
    }

    console.log("numWindow:", numWindows);

    if (numWindows) {
      for (let i = 0; i < numWindows; i++) {
        //Cycle through each new window.
        const startRound = i * (this.windowRounds - this.overlapRounds);
        const stopRound = startRound + this.windowRounds;
        state.data = analyzeRounds(state.data, startRound, stopRound); //Re-analyze the rounds for a given window.
      }

      this.previousWindowStartRound =
        (numWindows + 1) * (this.windowRounds - this.overlapRounds); //Update this.previousWindowStartRound

      //Update the significance chart with the new window times and P-Values.
      const timeArray = state.data.windowTimes;
      Object.entries(state.data).forEach(([label, obj]) => {
        if (obj?.datapoints && obj.avgPValue?.length) {
          updateSigLineChartArray(obj.avgPValue, timeArray, label);
        }
      });
    }
  }

  // Helper method to get or initialize port state
  getPortState(id) {
    if (!this.portState.has(id)) {
      this.portState.set(id, {
        previousValue: undefined,
        previousTime: undefined,
        dipFlag: false, // True if EDA increasing
        dipStartValue: undefined,
        dipStartTime: undefined,
        suppressUntil: 0,
      });
    }
    return this.portState.get(id);
  }

  analyzeIncomingDatapoint(value, now, id, connectionManager) {
    const portState = this.getPortState(id);

    // Reset dip value to 0
    if (!portState.dipFlag && this.dataProcessor) {
      this.dataProcessor.setDip(0);
    }

    if (
      this.calibrationActive ||
      (portState.suppressUntil && now < portState.suppressUntil)
    ) {
      portState.dipFlag = false;
      portState.previousValue = value;
      portState.previousTime = now;
      return;
    }
    if (
      portState.previousValue !== undefined &&
      (value > portState.previousValue ||
        (portState.dipFlag && value == portState.previousValue))
    ) {
      //Delta detected
      if (!portState.dipFlag) {
        //Start of delta
        portState.dipStartValue = portState.previousValue;
        portState.dipStartTime = portState.previousTime;
        portState.dipFlag = true;
      }
    } else {
      // This will be true if the value starts decreasing
      if (portState.dipFlag) {
        // End of delta
        let delta = portState.previousValue - portState.dipStartValue;

        const state = connectionManager.getPortStates().get(id);
        if (state && delta > 0) {
          if (!state.dipValues) {
            state.dipValues = []; //Initialize the dip value buffer if it does not exist.
          }
          if (!state.dipTime) {
            state.dipTime = []; //Initialize the dip time buffer if it does not exist.
          }
          state.dipValues.push(delta); //Add the EDA value to the buffer.
          console.log(`${delta} for ${id}`);
          state.dipTime.push(formatTimeCSV(new Date(portState.dipStartTime))); //Add the time value to the buffer.

          this.calculateDeltaSignificance(id, connectionManager);
        }

        portState.dipFlag = false;
      }
    }

    portState.previousValue = value;
    portState.previousTime = now;
  }

  suppressForCalibration(now, portId) {
    const portState = this.getPortState(portId);
    portState.dipFlag = false;
    portState.suppressUntil = now + 2000;
  }

  beginCalibrationSuppression() {
    // Reset dip flags for all ports
    for (const [id, portState] of this.portState.entries()) {
      portState.dipFlag = false;
    }
    this.calibrationActive = true;
  }

  endCalibrationSuppression(now, portId) {
    const portState = this.getPortState(portId);
    portState.dipFlag = false;
    portState.suppressUntil = now + 2000;
    // Note: calibrationActive is kept global, but individual ports can have suppressUntil
  }

  calculateDeltaSignificance(id, connectionManager) {
    const state = connectionManager.getPortStates().get(id);
    if (state) {
      const threshold = this.getPortThreshold(id);
      if (state.dipValues[state.dipValues.length - 1] >= threshold) {
        const dipValue = state.dipValues[state.dipValues.length - 1];
        console.log(`BIG DIP for ${id}!!!!`, dipValue);
        if (this.dataProcessor) {
          this.dataProcessor.setDip(dipValue);
        }
        this.updateScoreBar(dipValue, id);
      }
    }
  }

  initializeScoreBars() {
    // Initialize scores for each port
    this.portScores.set("sensor1", 0);
    this.portScores.set("sensor2", 0);

    // Get score bar elements
    const scoreBarContainer = document.getElementById("scoreBarContainer");
    if (scoreBarContainer) {
      scoreBarContainer.classList.remove("hidden");
      this.updateScoreBarDisplay("sensor1");
      this.updateScoreBarDisplay("sensor2");
    }

    this.maxScoreInput = document.getElementById("score-bar-max-input");
    this.maxScoreInput.value = this.maxScore;
    this.maxScoreInput.addEventListener("change", (e) => {
      this.handleMaxScoreInputChange(e);
    });
  }

  handleMaxScoreInputChange(e) {
    let max = e.target.value;

    if (max < 0) {
      max = 0;
      e.target.value = max;
    }

    this.maxScore = max;
    this.updateScoreBarDisplay("sensor1");
    this.updateScoreBarDisplay("sensor2");
  }

  updateScoreBar(dipValue, portId) {
    if (this.gameWon) return; // Don't update if game is already won

    // Get current score for this port
    const currentScore = this.portScores.get(portId) || 0;
    const newScore = currentScore + dipValue;
    this.portScores.set(portId, newScore);

    // Update the bar display
    this.updateScoreBarDisplay(portId);

    // Check for win condition
    if (newScore >= this.maxScore) {
      this.showWinMessage(portId);
    }
  }

  updateScoreBarDisplay(portId) {
    const score = this.portScores.get(portId) || 0;
    const percentage = Math.min((score / this.maxScore) * 100, 100);

    // Map portId to bar number
    const barNumber = portId === "sensor1" ? "1" : "2";
    const scoreBar = document.getElementById(`scoreBar${barNumber}`);
    const scoreValue = document.getElementById(`scoreValue${barNumber}`);

    if (scoreBar) {
      scoreBar.style.height = `${percentage}%`;
    }

    if (scoreValue) {
      scoreValue.textContent = Math.round(score);
    }
  }

  showWinMessage(portId) {
    if (this.gameWon) return; // Prevent multiple win messages

    this.gameWon = true;
    const playerNumber = portId === "sensor1" ? "1" : "2";
    const winMessage = document.getElementById("winMessage");
    const winMessageText = document.getElementById("winMessageText");

    if (winMessage && winMessageText) {
      winMessageText.textContent = `Player ${playerNumber} Wins!`;
      winMessage.classList.remove("hiddenFlex");
    }
  }

  resetScores() {
    this.portScores.set("sensor1", 0);
    this.portScores.set("sensor2", 0);
    this.gameWon = false;
    this.updateScoreBarDisplay("sensor1");
    this.updateScoreBarDisplay("sensor2");

    // Hide win message
    const winMessage = document.getElementById("winMessage");
    if (winMessage) {
      winMessage.classList.add("hiddenFlex");
    }
  }

  //Getters.
  getMergedData() {
    return this.mergedData;
  }

  getWindowRounds() {
    return this.windowRounds;
  }

  getOverlapPercent() {
    return this.overlapPercent;
  }

  resetThreshold(portId) {
    this.portThresholds.set(portId, this.thresholdDefault);
    const elements = this.getPortThresholdElements(portId);
    if (elements) {
      elements.input.value = this.thresholdDefault;
      elements.slider.value = this.thresholdDefault;
    }
  }
}
