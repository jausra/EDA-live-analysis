import CreateStimObject from './stimBackend/stimObject.js';
import StimManager from './stimBackend/stimManager.js';
import StimPresets from './stimBackend/stimPresets.js';
import CreateStimDisplay from './stimFrontend/stimDisplay.js';
import { startSerial, stopSerial, resumeSerial, serialWrite } from './recordBackend/serialReader.js'; 
import { initSerialChart, updateSerialChart, setAutoscroll, annotateChartWithStim, annotateChartWithDelta, clearSerialChart } from './recordFrontend/serialChart.js';
import { resetColorOptions } from './utils.js';
import { analyzeAll, analyzeRounds } from './recordBackend/stats.js';
import { initSigBarChart, updateSigBarChart, clearSigBarChart } from './recordFrontend/significanceBarChart.js';
import { initSigLineChart, updateSigLineChart, clearSigLineChart } from './recordFrontend/significanceLineChart.js';
import { showCentralModal } from './modals.js';
import { ConnectionManager } from './recordBackend/connectionManager.js';

//Record Backend. 
const connectionManager = new ConnectionManager();

//Stim Backend. 
const stimObject = new CreateStimObject('random');
const stimManager = new StimManager(stimObject);
const stimPresets = new StimPresets(stimObject);

const stimPauseResumeButton = document.getElementById("stimPauseResumeButton");
const saveDataButton = document.getElementById("saveDataButton");
function toggleStimControlDisable(isDisabled) {
    stimPauseResumeButton.disabled = !isDisabled;
    saveDataButton.disabled = isDisabled;
    backButton.disabled = isDisabled;
    stimManager.toggleStimControlDisable(isDisabled);
}

//////////////////General Stimulation Control//////////////////

const calibrateButton = document.getElementById("calibrateButton");
const stimStartStopButton = document.getElementById("stimStartStopButton");
const gameTitleContainer = document.getElementById("gameTitleContainer");
const backButton = document.getElementById("backButton");
const gameContainer = document.getElementById("gameContainer");
const connContainer = document.getElementById("connContainer");
const gameTitle = document.getElementById("gameTitle");
function toggleHideGameButtons() {
    gameContainer.classList.toggle("hiddenFlex");
    connContainer.classList.toggle("hiddenFlex");
}

const debugGameButton = document.getElementById("debugGameButton");
debugGameButton.addEventListener("click", () => {
    toggleHideGameButtons()
    gameTitleContainer.classList.toggle("hiddenFlex");
    calibrateButton.classList.toggle("hiddenFlex");
    stimPauseResumeButton.classList.toggle("hiddenFlex");
    stimStartStopButton.classList.toggle("hiddenFlex");
    saveDataButton.classList.toggle("hiddenFlex");
    gameTitle.textContent = "Debug";
    addDebugStim();
})

const breathingGameButton = document.getElementById("breathingGameButton");
breathingGameButton.addEventListener("click", () => {
    toggleHideGameButtons()
    gameTitleContainer.classList.toggle("hiddenFlex");
    calibrateButton.classList.toggle("hiddenFlex");
    stimPauseResumeButton.classList.toggle("hiddenFlex");
    stimStartStopButton.classList.toggle("hiddenFlex");
    saveDataButton.classList.toggle("hiddenFlex");
    gameTitle.textContent = "Breathing Game";
    addBreathingGameStim();
})

const redDotGameButton = document.getElementById("redDotGameButton");
redDotGameButton.addEventListener("click", () => {
    toggleHideGameButtons()
    gameTitleContainer.classList.toggle("hiddenFlex");
    calibrateButton.classList.toggle("hiddenFlex");
    stimPauseResumeButton.classList.toggle("hiddenFlex");
    stimStartStopButton.classList.toggle("hiddenFlex");
    saveDataButton.classList.toggle("hiddenFlex");
    gameTitle.textContent = "Red Dot Game";
    addRedDotGameStim();
})

const customGameButton = document.getElementById("customGameButton");
const stimGenAndRand = document.getElementById("stimGenAndRand");
customGameButton.addEventListener("click", () => {
    toggleHideGameButtons()
    stimGenAndRand.classList.toggle("hiddenFlex", false);
    calibrateButton.classList.toggle("hiddenFlex");
    gameTitleContainer.classList.toggle("hiddenFlex");
    stimPauseResumeButton.classList.toggle("hiddenFlex");
    stimStartStopButton.classList.toggle("hiddenFlex");
    saveDataButton.classList.toggle("hiddenFlex");
    gameTitle.textContent = "Custom Game";
})

backButton.addEventListener("click", () => {
    toggleHideGameButtons()
    stimGenAndRand.classList.toggle("hiddenFlex", true);
    gameTitleContainer.classList.toggle("hiddenFlex");
    calibrateButton.classList.toggle("hiddenFlex");
    stimPauseResumeButton.classList.toggle("hiddenFlex");
    stimStartStopButton.classList.toggle("hiddenFlex");
    saveDataButton.classList.toggle("hiddenFlex");
    gameTitle.textContent = "";
    stimManager.clearStimItems();
})

//Add items to the stim object for the debug game
function addDebugStim() {
    stimPresets.addDebugStim();
    calibrateButton.disabled = false;
    stimManager.renderStimItemContainer();
}

//Add items to the stim object for the breathing game
function addBreathingGameStim() {
    stimPresets.addBreathingGameStim();
    calibrateButton.disabled = false;
    stimManager.renderStimItemContainer();
}

//Add items to the stim objects for the red dot game
function addRedDotGameStim() {
    stimPresets.addRedDotGameStim();
    calibrateButton.disabled = false;
    stimManager.renderStimItemContainer();
}

const calContainer = document.getElementById("calContainer");
calibrateButton.addEventListener("click", async () => {
    try{
        // clearSigBarChart();
        clearSigLineChart();
        stimStartStopButton.disabled = false;
        calibrateButton.disabled = true;
        calContainer.classList.toggle("hiddenFlex", false);

        for (const [id, state] of connectionManager.getPortStates().entries()) {
            connectionManager.resetEDAValues(id);
            clearSerialChart(id);
        }
        for (const [id, state] of connectionManager.getPortStates().entries()) {
            await startSerial(id, updateSerialChart);
        }
    } catch {
        console.error("Could not read from serial port");
    }
});


const offsetMin = 4; //kOhm
// const offsetMax = 2000; //kOhm USE
const offsetMax = 2000; //kOhm
const offsetDefault = 1000; //kOhm 
// const gainMin = 1; //kOhm USE
const gainMin = 0.4; //kOhm
// const gainMax = 100; //kOhm USE
const gainMax = 100; //kOhm
const gainDefault = 10; //kOhm

const calOffsetInput = document.getElementById("calOffsetInput");
const calOffsetSlider = document.getElementById("calOffsetSlider");
const calGainInput = document.getElementById("calGainInput");
const calGainSlider = document.getElementById("calGainSlider");

calOffsetSlider.min = offsetMin;
calOffsetSlider.max = offsetMax;
calOffsetInput.value = offsetDefault;
calOffsetSlider.value = offsetDefault;

calGainSlider.min = gainMin;
calGainSlider.max = gainMax;
calGainInput.value = gainDefault;
calGainSlider.value = gainDefault;

calOffsetInput.addEventListener("change", (e) => {
    let inputOffset = e.target.value;
    if (inputOffset < offsetMin) {
        inputOffset = offsetMin;
        e.target.value = inputOffset;
    }
    if (inputOffset > offsetMax) {
        inputOffset = offsetMax;
        e.target.value = inputOffset;
    }
    calOffsetSlider.value = inputOffset;
    console.log("calOffsetInput updated to", inputOffset);
    console.log("calOffsetSlider is now", calOffsetSlider.value);
});

calOffsetSlider.addEventListener("change", (e) => {
    let sliderOffset = e.target.value;
    if (sliderOffset < offsetMin) {
        sliderOffset = offsetMin;
    }
    if (sliderOffset > offsetMax) {
        sliderOffset = offsetMax;
    }
    calOffsetInput.value = sliderOffset;
    console.log("calOffsetSlider updated to", sliderOffset);
    console.log("calOffsetInput is now", calOffsetInput.value);
});

calGainInput.addEventListener("change", (e) => {
    let inputGain = e.target.value;
    if (inputGain < gainMin) {
        inputGain = gainMin;
        e.target.value = inputGain;
    }
    if (inputGain > gainMax) {
        inputGain = gainMax;
        e.target.value = inputGain;
    }
    calGainSlider.value = inputGain;
    console.log("calGainInput updated to", inputGain);
    console.log("calGainSlider is now", calGainSlider.value);
});

calGainSlider.addEventListener("change", (e) => {
    let sliderGain = e.target.value;
    if (sliderGain < gainMin) {
        sliderGain = gainMin;
    }
    if (sliderGain > gainMax) {
        sliderGain = gainMax;
    }
    calGainInput.value = sliderGain;
    console.log("calGainSlider updated to", sliderGain);
    console.log("calGainInput is now", calGainInput.value);
});

const calSubmitButton = document.getElementById("calSubmitButton");
calSubmitButton.addEventListener("click", async () => {
    const command = `SET R_OFF ${calOffsetInput.value} R_GAIN ${calGainInput.value}\n`;
    // const command = 'a';
    // const command = '\n';
    // const command = 'n\n';
    for (const [id, state] of portStates.entries()) {
        console.log("sending command to ID:", id);
        await serialWrite(id, command);
    }
});

function formatTimeFilename(date) {
    return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0') + '_' +
    String(date.getHours()).padStart(2, '0') + '-' +
    String(date.getMinutes()).padStart(2, '0') + '-' +
    String(date.getSeconds()).padStart(2, '0') + '-' +
    String(date.getMilliseconds()).padStart(3, '0');
}

async function startSession() {
    try{
        stimDisplay.running = true;
        // toggleStimControlDisable(true);
        // stimStartStopButton.textContent = "Stop";
        stimStartStopButton.disabled = true;
        for (const [id, state] of portStates.entries()) {
            // resetEDAValues(id); //maybe put back (but I think it is being taken care of in cal)
            stopSerial(id); //new
            clearSerialChart(id);
        }
        oldStimValue = '';

        resetColorOptions();
        // updateSigBarChart({});

        sessionStartTime = formatTimeFilename(new Date(Date.now()));

        calContainer.classList.toggle("hiddenFlex", true);

        await showInitialCountdown();
        toggleStimControlDisable(true);
        stimStartStopButton.disabled = false;
        stimStartStopButton.textContent = "Stop";
        //await startSerial(portID, updateInterface); //problem
        for (const [id, state] of connectionManager.getPortStates().entries()) {
            await startSerial(id, updateInterface);
        }
        stimDisplay.start();
    } 
    catch {
        console.error("Could not read from serial port");
    }
}

const calStartButton = document.getElementById("calStartButton");
calStartButton.addEventListener("click", startSession);

//Start/stop running the application
let sessionStartTime = null;
stimStartStopButton.addEventListener("click", async (e) => {
    //const portID = 'sensor1';
    if (!stimDisplay.running){
        showCentralModal();
        startSession();
    } else {
        //stopSerial(portID);
        for (const [id, state] of connectionManager.getPortStates().entries()) {
            stopSerial(id);
            state.stimEDAValues = [];
            state.stimEDATime = [];
        }
        stimStartStopButton.disabled = true;
        calibrateButton.disabled = false;
        stimDisplay.stop();
        e.target.textContent = "Start";
        stimDisplay.running = false;
        toggleStimControlDisable(false);
        firstStimFlag = true;
    }
})

//Pause/resume the running application
stimPauseResumeButton.addEventListener("click", async (e) => {
    //const portID = 'sensor1';
    if (stimDisplay.paused){
        try{
            showCentralModal();

            await showInitialCountdown();
            //await resumeSerial(portID, updateInterface);
            console.log("portStates.entries():", connectionManager.getPortStates().entries())
            for (const [id, state] of connectionManager.getPortStates().entries()) {
                state.stimEDAValues = [];
                state.stimEDATime = [];
                await resumeSerial(id, updateInterface);
            }
            stimDisplay.resume();
            e.target.textContent = "Pause";
            stimDisplay.paused = false;
        } 
        catch {
            console.error('Serial port did not connect');
        }
    } else {
        //stopSerial(portID);
        for (const [id, state] of connectionManager.getPortStates().entries()) {
            //stopSerial(id);
            await stopSerial(id);
            state.stimEDAValues = [];
            state.stimEDATime = [];
        }
        stimDisplay.pause();
        e.target.textContent = "Resume";
        stimDisplay.paused = true;
        firstStimFlag = true;
    }
})

//Show the initial 3 2 1 countdown
async function showInitialCountdown() {
    await new Promise((resolve) => {
        const displayText = document.getElementById("stimDisplay");
        let currentNumber = 3;
        displayText.textContent = currentNumber;

        const interval = setInterval(() => {
            currentNumber--;
            if (currentNumber > 0){
                displayText.textContent = currentNumber;
            } else {
                clearInterval(interval);
                displayText.textContent = '';
                resolve(); 
            }
        }, 1000);
    })
}

function generateCSVHeaders() {
    const baseColumns = ['time', 'value', 'stim'];
    const stimColumns = [];
    for (const [ stim, _ ] of Object.entries(mergedData)) {
        const stimPrefix = stim.replace(/\s+/g, '_');
        stimColumns.push(
            `${stimPrefix}_max_delta`,
            `${stimPrefix}_z_scr`,
            `${stimPrefix}_z_scr_cum`,
            `${stimPrefix}_p_val`,
            `${stimPrefix}_p_val_cum`
        );
    }
    const combinedColumns = [...baseColumns, ...stimColumns];
    return combinedColumns.join(",") + "\n";
}

saveDataButton.addEventListener("click", async () => {
    const rootFolder = await window.showDirectoryPicker();
    const sessionFolder = await rootFolder.getDirectoryHandle(sessionStartTime, { create: true });
    
    const csvHeaders = generateCSVHeaders();
    for (const [id, state] of connectionManager.getPortStates().entries()) {
        const csvName = `${sessionStartTime}_${id}.csv`;
        const csvFile = await sessionFolder.getFileHandle(csvName, { create: true });
        const writable = await csvFile.createWritable();
        await writable.write(csvHeaders);
        await writable.write(arrayToCSV(csvData[id]));
        await writable.close();
    }
});

//////////////////Stimulation Display//////////////////
const displayTarget = document.getElementById("stimDisplay");
const radialGaugeTarget = document.getElementById("stimRadialGauge");
let stimDisplay = new CreateStimDisplay(displayTarget, radialGaugeTarget, stimObject);

//////////////////Data Results/////////////////////////
document.getElementById("resetZoomButton").addEventListener("click", () => {
    setAutoscroll(true);
});

initSerialChart('serialChart');

function updateInterface(value, now, id) {
    updateSerialChart(value, now, id);
    updateEDA(value, now, id);
}

function updateCSVData(id, state, round) {
    if(!csvData[id]) {csvData[id] = [];}
    for (let i = 0; i < state.stimEDATime.length; i++) {
        const csvDataRow = [];
        csvDataRow.push(state.stimEDATime[i]);
        csvDataRow.push(state.stimEDAValues[i]);
        csvDataRow.push(oldStimValue);
        csvDataRow.push(round);
        csvData[id].push(csvDataRow);
    }
}

function arrayToCSV(data) {
    return data.map(row => 
        row.map(item => 
            item
        ).join(",")
    ).join("\n");
}

let windowRounds = 4;
let overlapPercent = 0.25;

function calculateOverlapRounds(window, overlap) {
    const overlapRounds = Math.round(window * overlap);
    return overlapRounds;
}

let overlapRounds = calculateOverlapRounds(windowRounds, overlapPercent);

let firstStimFlag = true;
let previousStartTime = null;
let newRoundFlag = false;
let stateRound = 0;
let previousRound = 0;
let previousRoundStartTime = null;
let previousRoundStopTime = null;
let currentRoundStartTime = null;
let previousRoundAverageTime = null;
const csvData = {};
stimDisplay.onStimDisplay(({ stim, round, color, startTime, stopTime }) => {
    if (round !== previousRound) { 
        previousRoundStartTime = currentRoundStartTime;
        currentRoundStartTime = startTime;
        previousRoundStopTime = startTime;
        if (round > 1) {
            previousRoundAverageTime = (previousRoundStopTime - previousRoundStartTime)/2 + previousRoundStartTime;
                    for (const [id, state] of connectionManager.getPortStates().entries()) {
            if (!state.data) {
                state.data = {};
            }
            if (!state.data.roundTimes) {
                state.data.roundTimes = [];
            }
            state.data.roundTimes.push(previousRoundAverageTime);
            // console.log(state.data);
        }
            newRoundFlag = true;
        }
        previousRound = round;
    }
    
    if (!firstStimFlag) {
        const portDeltas = [];
        for (const [id, state] of connectionManager.getPortStates().entries()) {
            let edaDeltaDisplay = analyzeEDA(id, stateRound, newRoundFlag, windowRounds, overlapRounds);
            portDeltas.push({ id, delta: edaDeltaDisplay });
            updateCSVData(id, state, round); //push time, value, stim, and round to 'csvData' object
            state.stimEDAValues = [];
            state.stimEDATime = [];
        }
        annotateChartWithDelta(portDeltas, currentStimValue, previousStartTime);
        oldStimValue = currentStimValue;
    } else  {
        getCurrentStim();
        oldStimValue = currentStimValue;
        firstStimFlag = false;
    }
    annotateChartWithStim(stim, color, startTime, stopTime);
    previousStartTime = startTime;
    stateRound = round;
    newRoundFlag = false;
});

const windowMin = 1;
const windowMax = 30;
const windowDefault = 4;

const overlapMin = 0.05;
const overlapMax = 0.25;
const overlapDefault = 100;

const sigLineWindowText = document.getElementById("sigLineWindowText");
const sigLineWindowSlider = document.getElementById("sigLineWindowSlider");
const sigLineOverlapText = document.getElementById("sigLineOverlapText");
const sigLineOverlapSlider = document.getElementById("sigLineOverlapSlider");

sigLineWindowSlider.min = windowMin;
sigLineWindowSlider.max = windowMax;
sigLineWindowText.textContent = windowDefault;
sigLineWindowSlider.value = windowDefault;

sigLineOverlapSlider.min = overlapMin;
sigLineOverlapSlider.max = overlapMax;
sigLineOverlapText.textContent = overlapDefault;
sigLineOverlapSlider.value = overlapDefault;

//////////////////Data Analysis/////////////////////////
// initSigBarChart('sigBarChart');
initSigLineChart('sigLineChart');

// portStates is now managed by connectionManager

// let stimEDAValues = [];
let oldStimValue = '';
// let data = [];

// ensurePortState is now handled by connectionManager

// cancelPortState is now handled by connectionManager

// updateGameButtonClickability is now handled by connectionManager

// resetEDAValues is now handled by connectionManager

function formatTimeCSV(date) {
    return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0') + ' ' +
    String(date.getHours()).padStart(2, '0') + ':' +
    String(date.getMinutes()).padStart(2, '0') + ':' +
    String(date.getSeconds()).padStart(2, '0') + '.' +
    String(date.getMilliseconds()).padStart(3, '0');
}

function updateEDA(value, now, id) {
    const state = connectionManager.getPortStates().get(id);
    state.stimEDAValues.push(value);
    state.stimEDATime.push(formatTimeCSV(new Date(now)));
}

let currentStimValue;
function getCurrentStim() {
    if (typeof(stimDisplay.expandedValue[stimDisplay.index]) === 'string'){
        currentStimValue = stimDisplay.expandedValue[stimDisplay.index]
    } else if (typeof(stimDisplay.expandedValue[stimDisplay.index]) === 'object') {
        currentStimValue = `${stimDisplay.expandedValue[stimDisplay.index].color} ${stimDisplay.expandedValue[stimDisplay.index].shape}`
    }
}

function findMaxDelta(data) {
    if (data.length < 2) return 0;

    let currentMax = data[0];
    let maxDelta = 0;

    for (let i = 1; i < data.length; i++) {
        const delta = currentMax - data[i];
        if (delta > maxDelta) {
            maxDelta = delta;
        };
        if (data[i] > currentMax) {
            currentMax = data[i];
        };
    }

    return maxDelta;
}

let tester = {
    a: {
        sense1: 0.1,
        sense2: 0.2
    },
    b: {
        sense1: 0.3,
        sense2: 0.4
    },
    c: {
        sense1: 0.5,
        sense2: 0.6
    }
}

function mergeData() {
    const merged = {};

    for (const [id, state] of connectionManager.getPortStates().entries()) {
        for (const [stim, obj] of Object.entries(state.data)) {
            if (stim === 'grandMean' || stim === 'grandStdDev') continue;
            if (!merged[stim]) merged[stim] = {};
            merged[stim][id] = obj.avgPValue;
        }
    }
    return merged;
}

let mergedData = {};
let previousWindowStartRound = 0;

function analyzeEDA(id, round, newRoundFlag, windowRounds, overlapRounds) {
    const state = connectionManager.ensurePortState(id);
    getCurrentStim();
    const edaDelta = findMaxDelta(state.stimEDAValues);
    if(!state.data[oldStimValue]) {
        state.data[oldStimValue] = { 
            datapoints: [],
            rounds: []
        };
    }
    state.data[oldStimValue].datapoints.push(edaDelta);
    state.data[oldStimValue].rounds.push(round);

    if (newRoundFlag == true) {
        if (round == (previousWindowStartRound + windowRounds)) {
            const startRound = previousWindowStartRound;
            const  stopRound = round;
            state.data = analyzeRounds(state.data, startRound, stopRound);
            const mostRecentRoundTime = state.data.windowTimes[state.data.windowTimes.length - 1];
            Object.entries(state.data).forEach(([label, obj]) => {
                if(obj?.datapoints && obj.avgPValue?.length){
                    const lastAvgP = obj.avgPValue[obj.avgPValue.length - 1];
                    updateSigLineChart(lastAvgP, mostRecentRoundTime, label);
                }
            });
            
            // console.log(state.data);
            previousWindowStartRound = round - overlapRounds;
        }
    }

    // state.data = analyzeAll(state.data);
    // mergedData = mergeData(); //save avgPValue of each stim into mergedData
    // updateSigBarChart(mergedData);

    // oldStimValue = currentStimValue;
    return edaDelta;
}

const sigChartContainer = document.getElementById("sigChartContainer");
const movingSigChartContainer = document.getElementById("movingSigChartContainer");
sigChartContainer.addEventListener("click", () => {
    sigChartContainer.classList.add("hiddenFlex");
    sigChartContainer.classList.toggle("hiddenFlex");
})