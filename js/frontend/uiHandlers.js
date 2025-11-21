import { resetColorOptions } from "../utils.js";
import { showCentralModal } from "./modals.js";
import {
  stopSerial,
  resumeSerial,
} from "../backend/recordBackend/serialReader.js";
import {
  initSerialChart,
  clearSerialChart,
} from "./recordFrontend/serialChart.js";

//Class to handle button clicks for both the record and stim commands.
export class UIHandlers {
  // constructor(sessionManager, dataImporter, dataExporter, stimDisplay, connectionManager, calibrationManager, stimManager, stimPresets, dataProcessor) {
  constructor(
    sessionManager,
    dataImporter,
    dataExporter,
    stimDisplay,
    connectionManager,
    calibrationManager,
    stimPresets,
    stimAnalyzer,
    dataProcessor
  ) {
    this.sessionManager = sessionManager;
    this.dataImporter = dataImporter;
    this.dataExporter = dataExporter;
    this.stimDisplay = stimDisplay;
    this.connectionManager = connectionManager;
    this.calibrationManager = calibrationManager;
    // this.stimManager = stimManager;
    this.stimPresets = stimPresets;
    this.stimAnalyzer = stimAnalyzer;
    this.dataProcessor = dataProcessor;

    this.stopSerial = stopSerial;
    this.clearSerialChart = clearSerialChart;

    //State variables.
    this.firstStimFlag = true;
    this.oldStimValue = "";

    this.setupEventListeners();
  }

  setupEventListeners() {
    //import data button.
    const importButton = document.getElementById("importButton");
    const fileInput = document.getElementById("fileInput");
    if (importButton) {
      importButton.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => this.handleImportData(e));
    }

    //Calibration start button.
    const calStartButton = document.getElementById("calStartButton");
    if (calStartButton) {
      calStartButton.addEventListener("click", () => this.startSession());
    }

    //Stim start/stop button.
    const stimStartStopButton = document.getElementById("stimStartStopButton");
    if (stimStartStopButton) {
      stimStartStopButton.addEventListener("click", (e) =>
        this.handleStartStop(e)
      );
    }

    //Stim pause/resume button.
    const stimPauseResumeButton = document.getElementById(
      "stimPauseResumeButton"
    );
    if (stimPauseResumeButton) {
      stimPauseResumeButton.addEventListener("click", (e) =>
        this.handlePauseResume(e)
      );
    }

    //Save data button.
    const saveDataButton = document.getElementById("saveDataButton");
    if (saveDataButton) {
      saveDataButton.addEventListener("click", () => this.handleSaveData());
    }

    //Game buttons.
    this.setupGameButtonListeners();
  }

  setupGameButtonListeners() {
    //Debug game button.
    const debugGameButton = document.getElementById("debugGameButton");
    if (debugGameButton) {
      debugGameButton.addEventListener("click", () => {
        this.handleGameButtonClick({
          gameTitleText: "Debug",
          presetName: "Debug",
        });
      });
    }

    //Breathing game button.
    const breathingGameButton = document.getElementById("breathingGameButton");
    if (breathingGameButton) {
      breathingGameButton.addEventListener("click", () => {
        this.handleGameButtonClick({
          gameTitleText: "Breathing Game",
          presetName: "Breathing Game",
        });
      });
    }

    //Red dot game button.
    const redDotGameButton = document.getElementById("redDotGameButton");
    if (redDotGameButton) {
      redDotGameButton.addEventListener("click", () => {
        this.handleGameButtonClick({
          gameTitleText: "Red Dot Game",
          presetName: "Red Dot Game",
        });
      });
    }

    //Custom game button.
    const customGameButton = document.getElementById("customGameButton");
    if (customGameButton) {
      customGameButton.addEventListener("click", () => {
        this.handleGameButtonClick({
          hideStimGenAndRand: false,
          gameTitleText: "Custom Game",
          presetName: "Custom Game",
        });
      });
    }

    const streamButton = document.getElementById("streamButton");
    if (streamButton) {
      streamButton.addEventListener("click", () => {
        this.msiHandleStreamButtonClick();
      });
    }

    //Normal game button.
    const msiNormalGameButton = document.getElementById("msiNormalGameButton");
    if (msiNormalGameButton) {
      msiNormalGameButton.addEventListener("click", async () => {
        await this.msiHandleGameButtonClick({
          gameTitleText: "Normal",
          presetName: "Normal",
        });
      });
    }

    //Back button.
    const backButton = document.getElementById("backButton");
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.handleGameButtonClick({
          hideStimGenAndRand: true,
          gameTitleText: "",
          presetName: null,
        });
      });
    }
  }

  //Method to toggle button disables. For comments, assume "isDisabled" is set to "true".
  toggleStimControlDisable(isDisabled) {
    // const stimPauseResumeButton = document.getElementById("stimPauseResumeButton");
    // const saveDataButton = document.getElementById("saveDataButton");
    // const backButton = document.getElementById("backButton");
    // if (stimPauseResumeButton) stimPauseResumeButton.disabled = !isDisabled; //Enable the pause button.
    // if (saveDataButton) saveDataButton.disabled = isDisabled; //Disable the save button.
    // if (backButton) backButton.disabled = isDisabled; //Disable the back button.
    // if (this.stimManager) {
    //     this.stimManager.toggleStimControlDisable(isDisabled); //Disable the stim item boxes (no modifications allowed).
    // }
  }

  //Method to hide the game and port connection buttons. Run after clicking a game or back button.
  toggleHideGameButtons() {
    const gameContainer = document.getElementById("gameContainer");
    const connContainer = document.getElementById("connContainer");
    const importContainer = document.getElementById("importContainer");

    if (gameContainer) gameContainer.classList.toggle("hiddenFlex"); //Hide or show game buttons.
    if (connContainer) connContainer.classList.toggle("hiddenFlex"); //Hide or show port connection buttons.
    if (importContainer) importContainer.classList.toggle("hiddenFlex"); //Hide or show import button.
  }

  //Method to handle when a game button or the back button is clicked.
  handleGameButtonClick({
    hideStimGenAndRand = null,
    gameTitleText = "",
    presetName = null,
  } = {}) {
    // this.toggleHideGameButtons(); //Hide the game buttons and the port connection buttons.
    // const stimGenAndRand = document.getElementById("stimGenAndRand");
    // const gameTitleContainer = document.getElementById("gameTitleContainer");
    // const stimPauseResumeButton = document.getElementById("stimPauseResumeButton");
    // const stimStartStopButton = document.getElementById("stimStartStopButton");
    // const saveDataButton = document.getElementById("saveDataButton");
    // const gameTitle = document.getElementById("gameTitle");
    // if (hideStimGenAndRand !== null && stimGenAndRand) {
    //     stimGenAndRand.classList.toggle("hiddenFlex", hideStimGenAndRand); //If you choose custom game, show the stim creator tool.
    // }
    // if (gameTitleContainer) gameTitleContainer.classList.toggle("hiddenFlex"); //Show or hide the game title.
    // if (this.calibrationManager) this.calibrationManager.toggleCalibrateButtonVisibility(); //Show or hide the calibrate button.
    // if (stimPauseResumeButton) stimPauseResumeButton.classList.toggle("hiddenFlex"); //Show or hide the pause button.
    // if (stimStartStopButton) stimStartStopButton.classList.toggle("hiddenFlex"); //Show or hide the start button.
    // if (saveDataButton) saveDataButton.classList.toggle("hiddenFlex"); //Show or hide the save button
    // if (gameTitle) gameTitle.textContent = gameTitleText; //Set the game title.
    // if (presetName && this.stimPresets) {
    //     this.stimPresets.applyPreset(presetName); //Apply the stim items based on the game.
    //     if (this.calibrationManager) this.calibrationManager.enableCalibrateButton(); //Enable the calibration button.
    //     // if (this.stimManager) this.stimManager.renderStimItemContainer(); //Show the stim items.
    // }
    // if (gameTitleText === "" && this.stimManager) { //If you click the back button, hide the stim items (game buttons will be in their place).
    //     this.stimManager.clearStimItems();
    // }
  }

  msiHandleStreamButtonClick() {
    streamButton.classList.toggle("disabled", true);
    msiNormalGameButton.classList.toggle("disabled", false);
    this.calibrationManager.msiStartStream();
  }

  //Method to handle when a game button or the back button is clicked.
  async msiHandleGameButtonClick({
    gameTitleText = "",
    presetName = null,
  } = {}) {
    try {
      // this.toggleHideGameButtons(); //Hide the game buttons and the port connection buttons.

      // const gameTitleContainer = document.getElementById("gameTitleContainer");
      // const stimPauseResumeButton = document.getElementById("stimPauseResumeButton");
      // const stimStartStopButton = document.getElementById("stimStartStopButton");
      // const saveDataButton = document.getElementById("saveDataButton");
      // const gameTitle = document.getElementById("gameTitle");

      // if (gameTitleContainer) gameTitleContainer.classList.toggle("hiddenFlex"); //Show or hide the game title.
      // // if (this.calibrationManager) this.calibrationManager.toggleCalibrateButtonVisibility(); //Show or hide the calibrate button.
      // if (stimPauseResumeButton) stimPauseResumeButton.classList.toggle("hiddenFlex"); //Show or hide the pause button.
      // if (stimStartStopButton) stimStartStopButton.classList.toggle("hiddenFlex"); //Show or hide the start button.
      // if (saveDataButton) saveDataButton.classList.toggle("hiddenFlex"); //Show or hide the save button
      // if (gameTitle) gameTitle.textContent = gameTitleText; //Set the game title.

      // if (presetName && this.stimPresets) {
      //     this.stimPresets.msiApplyPreset(presetName); //Apply the stim items based on the game.
      //     if (this.calibrationManager) this.calibrationManager.enableCalibrateButton(); //Enable the calibration button.
      //     if (this.stimManager) this.stimManager.renderStimItemContainer(); //Show the stim items.
      // }

      // if (this.calibrationManager) this.calibrationManager.enableCalibrateButton(); //Enable the calibration button.
      // if (this.stimManager) this.stimManager.renderStimItemContainer(); //Show the stim items.

      // if (gameTitleText === "" && this.stimManager) { //If you click the back button, hide the stim items (game buttons will be in their place).
      //     this.stimManager.clearStimItems();
      // }
      if (msiNormalGameButton.innerText === "Play") {
        msiNormalGameButton.innerHTML = "Reset";
        this.calibrationManager.msiBeginCal(presetName);
      } else if (msiNormalGameButton.innerText === "Reset") {
        streamButton.classList.toggle("disabled", false);
        msiNormalGameButton.classList.toggle("disabled", true);
        msiNormalGameButton.innerHTML = "Play";

        for (const [id, state] of this.connectionManager
          .getPortStates()
          .entries()) {
          await this.stopSerial(id);
        }
        this.clearSerialChart(this.connectionManager);

        this.calibrationManager.hideBreathingCue();
        this.stimAnalyzer.resetScores();
      }
    } catch (error) {
      console.error("Could not read from serial port", error);
    }
  }

  async handleImportData(event) {
    //Import data. Need to use fileInput b/c using vanilla JS.
    await this.dataImporter.importData(event);
  }

  //Method to start the session after clicking the caibration button.
  async startSession() {
    //Run start session in the session manager.
    // let xMax = Date.now();
    // let xMin = xMax - 5000;
    // initSerialChart('serialChart', xMin, xMax);
    await this.sessionManager.startSession(
      resetColorOptions,
      // Need to use arrow function to lock the 'this' context, so 'this.StimManager' will be available.
      (isDisabled) => this.toggleStimControlDisable(isDisabled),
      window.updateInterfaceGame //This needs to be available globally or passed in.
    );
  }

  //Method to start or stop the session after clicking the start/stop button.
  async handleStartStop(e) {
    if (!this.stimDisplay.running) {
      //If the session is not running, start running
      showCentralModal(); //Shift focus to the central modal.
      await this.startSession(); //Start the session.
    } else {
      //If the session is running, stop running.
      for (const [id, state] of this.connectionManager
        .getPortStates()
        .entries()) {
        //Check each port state.
        await this.stopSerial(id); //Stop the session.
        state.stimEDAValues = []; //Clear values array.
        state.stimEDATime = []; //Clear time array.
      }

      const stimStartStopButton = document.getElementById(
        "stimStartStopButton"
      );
      if (stimStartStopButton) {
        //Disable and change the text of the start button.
        stimStartStopButton.disabled = true;
        stimStartStopButton.textContent = "Start";
      }

      this.calibrationManager.enableCalibrateButton(); //Enable the calibration button.
      this.stimDisplay.stop(); //Stop displaying stimuli.
      this.stimDisplay.running = false; //Set stimDisplay to running.
      //window.toggleStimControlDisable(false); // This needs to be available globally or passed in
      this.toggleStimControlDisable(false);
      this.firstStimFlag = true; //Reset the first stim flag.
    }
  }

  //Method to pause or resume the session using the pause/resume button.
  async handlePauseResume(e) {
    if (this.stimDisplay.paused) {
      //Resume the session.
      try {
        showCentralModal(); //Focus on the central modal.
        await this.sessionManager.showInitialCountdown(); //Show the initial countdown.

        for (const [id, state] of this.connectionManager
          .getPortStates()
          .entries()) {
          //Cycle through each port connection.
          state.stimEDAValues = []; //Clear the temporary values array.
          state.stimEDATime = []; //Clear the temporary time array.
          await resumeSerial(id, window.updateInterfaceGame); //Resume reading from serial.
        }

        this.stimDisplay.resume(); //Resume the stim display.
        const stimPauseResumeButton = document.getElementById(
          "stimPauseResumeButton"
        );
        if (stimPauseResumeButton) {
          stimPauseResumeButton.textContent = "Pause"; //Switch the text on the pause/resume button to "Pause".
        }
        this.stimDisplay.paused = false; //Set the "paused" flag to false.
      } catch (error) {
        console.error("Serial port did not connect", error);
      }
    } else {
      for (const [id, state] of this.connectionManager
        .getPortStates()
        .entries()) {
        //Cycle through each port connection.
        await this.stopSerial(id); //Stop the serial connection.
        state.stimEDAValues = []; //Clear the temporary values array.
        state.stimEDATime = []; //Clear the temporary time array.
      }

      this.dataProcessor.clearUnifiedCSVData();

      this.stimDisplay.pause(); //Pause the stim display.
      const stimPauseResumeButton = document.getElementById(
        "stimPauseResumeButton"
      );
      if (stimPauseResumeButton) {
        stimPauseResumeButton.textContent = "Resume"; //Switch the text on the pause/resume button to "Resume".
      }
      this.stimDisplay.paused = true; //Set the "paused" flag to true.
      this.firstStimFlag = true; //Set the "firstStimFlag" flag to true.
    }
  }

  // Method to handle data saving upon clicking the save button.
  async handleSaveData() {
    const sessionStartTime = this.sessionManager.getSessionStartTime(); // Get the session start time.
    if (sessionStartTime) {
      await this.dataExporter.saveUnifiedData(
        // Save the unified data.
        sessionStartTime,
        this.dataProcessor.getUnifiedCSVData() // Unified CSV data.
      );
    }

    // Stop streaming from serial
    for (const [id, state] of this.connectionManager
      .getPortStates()
      .entries()) {
      await this.stopSerial(id);
    }
    this.clearSerialChart(this.connectionManager); // Clear the cahrt

    this.stimDisplay.running = false;
    this.stimDisplay.clearOnStimDisplay();
    this.stimDisplay.stop();
    this.stimDisplay.resetRound();

    // Clear the notes
    const notesTextarea = document.getElementById("notes-textarea");
    notesTextarea.value = "";

    // Reset digipot values and reset current phase
    this.calibrationManager.hideBreathingCue();
    this.calibrationManager.resetROff();
    this.calibrationManager.resetRGain();
    this.stimAnalyzer.resetThreshold();
    this.dataProcessor.resetCurrentPhase();
  }

  //Getters and setters for state.
  getFirstStimFlag() {
    return this.firstStimFlag;
  }

  setFirstStimFlag(value) {
    this.firstStimFlag = value;
  }

  getOldStimValue() {
    return this.oldStimValue;
  }

  setOldStimValue(value) {
    this.oldStimValue = value;
  }
}
