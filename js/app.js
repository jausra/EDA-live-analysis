import CreateStimObject from './stimObject.js';
import CreateStimDisplay from './stimDisplay.js';
import { connectPort, disconnectPort, startSerial, stopSerial, resumeSerial } from './serialReader.js'; 
import { initSerialChart, updateSerialChart, setAutoscroll, annotateChartWithStim, annotateChartWithDelta, clearSerialChart } from './serialChart.js';
import { resetColorOptions } from './utils.js';
import { analyze } from './stats.js';
import { initSigChart, updateSigChart } from './significanceChart.js';


//////////////////Modal Controls//////////////////

const stimControlToggleButton = document.getElementById('stimControlToggleButton');
const stimControlContainer = document.getElementById('stimControlContainer');
const stimDisplayContainerWrapper = document.getElementById('stimDisplayContainerWrapper');
const resultContainer = document.getElementById('resultContainer');

//Toggle the left modal
stimControlToggleButton.addEventListener("click", () => {
    const collapsed = stimControlContainer.classList.toggle("collapsed");
    if (!resultContainer.classList.contains("collapsed")) {
        resultContainer.classList.add("collapsed");
        resultToggleButton.innerHTML = "&#9664;";
    }
    if (collapsed) {
        stimDisplayContainerWrapper.classList.add("shifted");
        stimControlToggleButton.innerHTML = "&#9654;";
    } else {
        stimDisplayContainerWrapper.classList.remove("shifted");
        stimControlToggleButton.innerHTML = "&#9664;";
    }
})

//Toggle the right modal
resultToggleButton.addEventListener("click", () => {
    const collapsed = resultContainer.classList.toggle("collapsed");
    if (!stimControlContainer.classList.contains("collapsed")) {
        stimControlContainer.classList.add("collapsed");
        stimControlToggleButton.innerHTML = "&#9654;";
    }
    if (collapsed) {
        stimDisplayContainerWrapper.classList.add("shifted");
        resultToggleButton.innerHTML = "&#9664;";
    } else {
        stimDisplayContainerWrapper.classList.remove("shifted");
        resultToggleButton.innerHTML = "&#9654;";
    }
})

//////////////////Custom Stimulation Control//////////////////

//Create a stim object with a random order
const stimObject = new CreateStimObject('random');

//Get the dropdowns/text inputs for the custom stim sequence
const stimTypeSelector = document.getElementById('stimTypeSelector');
const stimValueWordInput = document.getElementById('stimValueWordInput');
const stimValueShapeSelector = document.getElementById('stimValueShapeSelector');
const stimValueColorSelector = document.getElementById('stimValueColorSelector');
const stimRatioSelector = document.getElementById('stimRatioSelector');
const stimTimeSelector = document.getElementById('stimTimeSelector');
const addStimButton = document.getElementById('addStimButton');

//Set the default values for the dropdowns/text inputs 
const stimTypeOptions = ['Word', 'Drawing'];
const stimValueShapeOptions = ['Circle', 'Square'];
const stimValueColorOptions = ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'White', 'Black'];
const stimRatioOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const stimTimeOptions = ['1 s', '2 s', '3 s', '4 s', '5 s', '6 s', '7 s', '8 s', '9 s', '10 s'];
function updateOptions(stimOptions, selector){
    stimOptions.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        selector.appendChild(option);
    })
}
updateOptions(stimTypeOptions, stimTypeSelector);
updateOptions(stimValueShapeOptions, stimValueShapeSelector);
updateOptions(stimValueColorOptions, stimValueColorSelector);
updateOptions(stimRatioOptions, stimRatioSelector);
updateOptions(stimTimeOptions, stimTimeSelector);

const stimPauseResumeButton = document.getElementById("stimPauseResumeButton");
const saveDataButton = document.getElementById("saveDataButton");

//Check if all dropdowns/text inputs are entered after updating one of them
[
    stimTypeSelector, 
    stimValueWordInput, 
    stimValueShapeSelector, 
    stimValueColorSelector, 
    stimRatioSelector, 
    stimTimeSelector
].forEach(item => {
    item.addEventListener('change', checkForValidInputs);
    item.addEventListener('input', checkForValidInputs);
});
function checkForValidInputs() {
    const stimType = stimTypeSelector.value;

    const isRatioTimeValid = stimRatioSelector.value !== '' && stimTimeSelector.value !== '';

    let isTypeValid = false;

    if (stimType == "Word") {
        isTypeValid = stimValueWordInput.value.trim() !== '';
    } else if (stimType == "Drawing"){
        isTypeValid = stimValueShapeSelector.value !== '' && stimValueColorSelector.value !== '';
    }

    stimValueWordInput.classList.toggle('hidden', stimType !== "Word");
    stimValueShapeSelector.classList.toggle('hidden', stimType !== "Drawing");
    stimValueColorSelector.classList.toggle('hidden', stimType !== "Drawing");

    const allValid = stimType !== '' && isRatioTimeValid && isTypeValid;
    addStimButton.disabled = !allValid;
    addStimButton.classList.add('addStimButton');
    addStimButton.classList.toggle('hidden', !allValid);
}
checkForValidInputs();


//Toggle the randomness of the stim order
const stimRandomizerButton = document.getElementById("stimRandomizerButton");
stimRandomizerButton.addEventListener("click", () => {
    if(stimObject.stimOrder === 'random') {
        stimObject.stimOrder = 'ordered';
        stimRandomizerButton.textContent = 'Random: OFF';
        stimRandomizerButton.style.backgroundColor = '#0277BD';
        document.querySelectorAll('.stimItemOrder').forEach(orderItem => {
            orderItem.classList.remove('hidden');
        });
    } else if (stimObject.stimOrder === 'ordered') {
        stimObject.stimOrder = 'random';
        stimRandomizerButton.textContent = 'Random: ON';
        stimRandomizerButton.style.backgroundColor = '#E1C93F'
        document.querySelectorAll('.stimItemOrder').forEach(orderItem => {
            orderItem.classList.add('hidden');
        });
    }
});

const stimItemContainer = document.getElementById('stimItemContainer');

//For each item in the stim object, render a square representing its properties
function renderStimItemContainer() {
    
    stimItemContainer.innerHTML = '';

    for (let i = 0; i < stimObject.stimType.length; i++){
        let stimItem = document.createElement('div');
        stimItem.style.textAlign = 'center';
        stimItem.classList.add('stimItem');
        stimItem.dataset.index = i;

        if(stimObject.stimType[i] === 'Word'){
            //const word = document.createElement('span');
            const word = document.createElement('div');
            word.textContent = stimObject.stimValue[i];
            word.classList.add('stimItemValue');
            stimItem.appendChild(word);

            stimItemContainer.appendChild(stimItem);

            //If the word is too long, shrink it
            const stimItemWidth = stimItem.clientWidth;
            const wordWidth = word.scrollWidth;
            if (wordWidth > (0.9*stimItemWidth)) {
                const scale = (0.9*stimItemWidth)/wordWidth;
                word.style.transform = `translate(-50%, -50%) scale(${scale})`;
            }
            //If the word is too long, shrink it
            const stimItemHeight = stimItem.clientHeight;
            const wordHeight = word.scrollHeight;
            if (wordHeight > (0.6*stimItemHeight)) {
                const scale = (0.6*stimItemHeight)/wordHeight;
                word.style.transform = `translate(-50%, -50%) scale(${scale})`;
            }

        } else if (stimObject.stimType[i] === 'Drawing'){
            const drawing = document.createElement('div');
            drawing.style.width = '100px';
            drawing.style.height = '100px';
            drawing.style.backgroundColor = stimObject.stimValue[i].color;
            drawing.classList.add('stimItemValue');

            if(stimObject.stimValue[i].shape === 'Circle'){
                drawing.style.borderRadius = '50%';
            }
            else if(stimObject.stimValue[i].shape === 'Square'){
                drawing.style.borderRadius = '0%';
            }
            stimItem.appendChild(drawing);
            stimItemContainer.appendChild(stimItem);
        };

        const displayTime = document.createElement('div');
        displayTime.textContent = `${stimObject.stimTime[i]/1000} s`;
        displayTime.classList.add('stimItemTime');
        stimItem.appendChild(displayTime);

        if (stimObject.stimRatio[i] > 1){
            const displayRatio = document.createElement('div');
            displayRatio.textContent = `${stimObject.stimRatio[i]}x`;
            displayRatio.classList.add('stimItemRatio');
            stimItem.appendChild(displayRatio);
        }

        const displayOrder = document.createElement('input');
        displayOrder.type = 'text';
        displayOrder.value = `${i + 1}`;
        displayOrder.classList.add('stimItemOrder');
        if(stimObject.stimOrder === 'random') {
            displayOrder.classList.add('hidden');
        }

        displayOrder.addEventListener("change", () => {
            const order = parseInt(displayOrder.value);
            if(!isNaN(order) && order > 0) {
                Object.entries(stimObject).forEach(([key, value]) => {
                    if(key !== 'stimOrder') {
                        if(order > stimObject.stimType.length){
                            const [item] = stimObject[key].splice(i, 1);
                            stimObject[key].push(item);
                        } else {
                            [stimObject[key][i], stimObject[key][order-1]] = 
                            [stimObject[key][order-1], stimObject[key][i]];
                        }
                    }
                })
            }
            renderStimItemContainer();
        })

        stimItem.appendChild(displayOrder);

        const deleteStimItemButton = document.createElement('button');
        deleteStimItemButton.classList.add('deleteStimButton', 'fa-solid', 'fa-trash');
        deleteStimItemButton.addEventListener("click", () => {
            const index = parseInt(stimItem.dataset.index);
            stimObject.stimType.splice(index, 1);
            stimObject.stimValue.splice(index, 1);
            stimObject.stimRatio.splice(index, 1);
            stimObject.stimTime.splice(index, 1);

            //If all stim items have been cleared, disable the start button
            if (
                stimObject.stimType.length === 0 &&
                stimObject.stimValue.length === 0 &&
                stimObject.stimRatio.length === 0 &&
                stimObject.stimTime.length === 0
            ) {
                stimStartStopButton.disabled = true;
            }

            renderStimItemContainer();
        })
        stimItem.appendChild(deleteStimItemButton);
    }
}

function clearStimItems() {
    stimItemContainer.innerHTML = '';
    stimObject.stimOrder = '';
    stimObject.stimType = [];
    stimObject.stimValue = [];
    stimObject.stimRatio = [];
    stimObject.stimTime = [];
    stimTypeSelector.value = "";
    stimRatioSelector.value = "";
    stimTimeSelector.value = "";
    stimValueWordInput.value = "";
    checkForValidInputs();
}

//Push a new item to the stim object based on the current dropdowns/text input
addStimButton.addEventListener("click", () => {
    stimObject.stimType.push(stimTypeSelector.value);
    if (stimTypeSelector.value == 'Word'){
        stimObject.stimValue.push(stimValueWordInput.value)
    } else if (stimTypeSelector.value == 'Drawing'){
        stimObject.stimValue.push({
            shape: stimValueShapeSelector.value,
            color: stimValueColorSelector.value
        });
    };
    stimObject.stimRatio.push(stimRatioSelector.value);
    stimObject.stimTime.push(1000 * parseFloat(stimTimeSelector.value));

    stimStartStopButton.disabled = false;
    renderStimItemContainer();
});


function toggleStimControlDisable(isDisabled) {
    stimPauseResumeButton.disabled = !isDisabled;
    saveDataButton.disabled = isDisabled;
    backButton.disabled = isDisabled
    document.getElementById("stimRandomizerButton").disabled = isDisabled;
    document.getElementById("stimTypeSelector").disabled = isDisabled;
    document.getElementById("stimValueShapeSelector").disabled = isDisabled;
    document.getElementById("stimValueColorSelector").disabled = isDisabled;
    document.getElementById("stimValueWordInput").disabled = isDisabled;
    document.getElementById("stimRatioSelector").disabled = isDisabled;
    document.getElementById("stimTimeSelector").disabled = isDisabled;
    document.getElementById("addStimButton").disabled = isDisabled;
    document.querySelectorAll('.deleteStimButton').forEach(button => {
        button.disabled = isDisabled;
    });
    document.querySelectorAll('.stimItemOrder').forEach(input => {
        input.disabled = isDisabled;
    });
}

//////////////////General Stimulation Control//////////////////

// const folderBox = document.getElementById("folderBox");
// folderBox.addEventListener("click", async() => {

// })

const connBox1 = document.getElementById("connBox1");
connBox1.addEventListener("click", async (e) => {
    const portID = 'sensor1';
    if (e.target.classList.contains('connected')) {
        disconnectPort(portID);
        cancelPortState(portID);
        e.target.innerHTML = "+";
        e.target.classList.remove('connected');
    } else {
        try{
            const port = await connectPort(portID);
            const portState = ensurePortState(portID);
            if (port) {
                e.target.innerHTML = "&#8644;";
                e.target.classList.add('connected');
            }
        } catch {
            console.log("Serial port did not connect");
        }
    }
    updateGameButtonClickability();
});
connBox1.addEventListener("mouseenter", (e) => {
    if (e.target.classList.contains("connected")) {
        e.target.innerHTML = '&#10005';
    }
});
connBox1.addEventListener("mouseleave", (e) => {
    if (e.target.classList.contains("connected")) {
        e.target.innerHTML = "&#8644;";
    }
});

const connBox2 = document.getElementById("connBox2");
connBox2.addEventListener("click", async (e) => {
    const portID = 'sensor2';
    if (e.target.classList.contains('connected')) {
        disconnectPort(portID);
        cancelPortState(portID);
        e.target.innerHTML = "+";
        e.target.classList.remove('connected');
    } else {
        try{
            const port = await connectPort(portID);
            const portState = ensurePortState(portID);
            if (port) {
                e.target.innerHTML = "&#8644;";
                e.target.classList.add('connected');
            }
        } catch {
            console.log("Serial port did not connect");
        }
    }
    updateGameButtonClickability();
});
connBox2.addEventListener("mouseenter", (e) => {
    if (e.target.classList.contains("connected")) {
        e.target.innerHTML = '&#10005';
    }
});
connBox2.addEventListener("mouseleave", (e) => {
    if (e.target.classList.contains("connected")) {
        e.target.innerHTML = "&#8644;";
    }
});


const stimStartStopButton = document.getElementById("stimStartStopButton");
const gameTitleContainer = document.getElementById("gameTitleContainer");
const backButton = document.getElementById("backButton");
const gameContainer = document.getElementById("gameContainer");
const gameButtons = document.querySelectorAll(".gameButton");
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
    stimPauseResumeButton.classList.toggle("hiddenFlex");
    stimStartStopButton.classList.toggle("hiddenFlex");
    saveDataButton.classList.toggle("hiddenFlex");
    gameTitle.textContent = "";
    clearStimItems();
})

//Add items to the stim object for the breathing game
function addDebugStim() {
    stimObject.stimOrder = 'random';
    
    stimObject.stimType.push('Word');
    stimObject.stimValue.push('a')
    stimObject.stimRatio.push('1');
    stimObject.stimTime.push(1000);

    stimObject.stimType.push('Word');
    stimObject.stimValue.push('b')
    stimObject.stimRatio.push('1');
    stimObject.stimTime.push(1000);

    stimObject.stimType.push('Word');
    stimObject.stimValue.push('c')
    stimObject.stimRatio.push('1');
    stimObject.stimTime.push(1000);

    stimStartStopButton.disabled = false;
    renderStimItemContainer();
}

//Add items to the stim object for the breathing game
function addBreathingGameStim() {
    stimObject.stimOrder = 'ordered';
    
    stimObject.stimType.push('Word');
    stimObject.stimValue.push('Deep Inhale (5s)\nDeep Exhale (5s)')
    stimObject.stimRatio.push('1');
    stimObject.stimTime.push(10000);

    stimObject.stimType.push('Word');
    stimObject.stimValue.push('Normal Breathing')
    stimObject.stimRatio.push('3');
    stimObject.stimTime.push(10000);

    stimStartStopButton.disabled = false;
    renderStimItemContainer();
}

//Add items to the stim objects for the red dot game
function addRedDotGameStim() {
    stimObject.stimOrder = 'random';
    
    stimObject.stimType.push('Drawing');
    stimObject.stimValue.push({
        shape: 'Circle',
        color: 'Red'
    });
    stimObject.stimRatio.push('1');
    stimObject.stimTime.push(9000);

    stimObject.stimType.push('Drawing');
    stimObject.stimValue.push({
        shape: 'Circle',
        color: 'White'
    });
    stimObject.stimRatio.push('4');
    stimObject.stimTime.push(9000);

    stimStartStopButton.disabled = false;
    renderStimItemContainer();
}

function formatTimeFilename(date) {
    return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0') + '_' +
    String(date.getHours()).padStart(2, '0') + '-' +
    String(date.getMinutes()).padStart(2, '0') + '-' +
    String(date.getSeconds()).padStart(2, '0') + '-' +
    String(date.getMilliseconds()).padStart(3, '0');
}

//Start/stop running the application
let sessionStartTime = null;
stimStartStopButton.addEventListener("click", async (e) => {
    //const portID = 'sensor1';
    if (!stimDisplay.running){
        try{
            for (const [id, state] of portStates.entries()) {
                resetEDAValues(id);
                clearSerialChart(id);
            }
            oldStimValue = '';

            resetColorOptions();
            updateSigChart({});

            e.target.textContent = "Stop";
            stimDisplay.running = true;
            toggleStimControlDisable(true);
            stimControlContainer.classList.toggle("collapsed");
            stimDisplayContainerWrapper.classList.add("shifted");
            stimControlToggleButton.innerHTML = "&#9654;";

            sessionStartTime = formatTimeFilename(new Date(Date.now()));

            await showInitialCountdown();
            //await startSerial(portID, updateInterface); //problem
            for (const [id, state] of portStates.entries()) {
                await startSerial(id, updateInterface);
            }
            stimDisplay.start();
        } 
        catch {
            console.error("Could not read from serial port");
        }
    } else {
        //stopSerial(portID);
        for (const [id, state] of portStates.entries()) {
            stopSerial(id);
            state.stimEDAValues = [];
            state.stimEDATime = [];
        }
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
            stimControlContainer.classList.toggle("collapsed");
            stimDisplayContainerWrapper.classList.add("shifted");
            stimControlToggleButton.innerHTML = "&#9654;";

            await showInitialCountdown();
            //await resumeSerial(portID, updateInterface);
            for (const [id, state] of portStates.entries()) {
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
        for (const [id, state] of portStates.entries()) {
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
        // console.log("stim:", stim);
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
    // console.log(csvHeaders);
    for (const [id, state] of portStates.entries()) {
        const csvName = `${sessionStartTime}_${id}.csv`;
        const csvFile = await sessionFolder.getFileHandle(csvName, { create: true });
        const writable = await csvFile.createWritable();
        await writable.write(csvHeaders);
        await writable.write(arrayToCSV(csvData[id]));
        await writable.close();
    }
})

//////////////////Stimulation Display//////////////////
const displayTarget = document.getElementById("stimDisplay");
const countdownTarget = document.getElementById("stimCountdown");
let stimDisplay = new CreateStimDisplay(displayTarget, countdownTarget, stimObject);

//////////////////Data Results/////////////////////////
document.getElementById("resetZoomButton").addEventListener("click", () => {
    setAutoscroll(true);
});

initSerialChart('serialChart');

function updateInterface(value, now, id) {
    updateSerialChart(value, now, id);
    updateEDA(value, now, id);
}

function updateCSVData(id, state) {
    // console.log("----------ID-----------", id);
    // console.log("state.stimEDATime.length:", state.stimEDATime.length);
    if(!csvData[id]) {csvData[id] = [];}
    for (let i = 0; i < state.stimEDATime.length; i++) {
        const csvDataRow = [];
        csvDataRow.push(state.stimEDATime[i]);
        csvDataRow.push(state.stimEDAValues[i]);
        csvDataRow.push(oldStimValue);
        for (const [key, value] of Object.entries(state.data)) {
            if (key === 'grandMean' || key === 'grandStdDev') continue ;
            // console.log("key:", key);
            for (const [k, v] of Object.entries(value)) {
                if (k === 'avg' || k === 'stdDev') continue;
                console.log("k:", k);
                console.log("v", v);
                if (k === 'avgPValue') {
                    csvDataRow.push((1 - v).toFixed(3));
                    // console.log("1 - v:", (1 - v).toFixed(3));
                } else if (k === 'avgZScore') {
                    csvDataRow.push(v.toFixed(3));
                    // console.log("v:", v.toFixed(3));
                } else {
                    if (isNaN(v[v.length - 1])) {
                        csvDataRow.push(v[v.length - 1]);
                    } else {
                        csvDataRow.push(v[v.length - 1].toFixed(3));
                    }
                    // console.log("v:", v.at(-1));
                }
            }
        }
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

let firstStimFlag = true;
let previousStartTime = null;
const csvData = {};
stimDisplay.onStimDisplay(({ stim, color, startTime, stopTime }) => {
    if (!firstStimFlag) {
        const portDeltas = [];
        // console.log("~~~~~~Port States:~~~~~~~", portStates);
        for (const [id, state] of portStates.entries()) {
            let edaDeltaDisplay = analyzeEDA(id);
            portDeltas.push({ id, delta: edaDeltaDisplay });
            // console.log("ID", id);
            // console.log("state.stimEDATime:", state.stimEDATime);
            updateCSVData(id, state);
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
})

//////////////////Data Analysis/////////////////////////
initSigChart('sigChart');

const portStates = new Map();

// let stimEDAValues = [];
let oldStimValue = '';
// let data = [];

function ensurePortState(id) {
    if (!portStates.has(id)) {
        portStates.set(id, {
            stimEDAValues: [],
            stimEDATime: [],
            // oldStimValue: '',
            data: [],
        })
    }
    return portStates.get(id);
}

function cancelPortState(id) {
    if (portStates.has(id)) {
        portStates.delete(id)
    }
}

function updateGameButtonClickability() {

    const gameButtonDisable = portStates.size === 0 

    gameButtons.forEach(button => {
        if (gameButtonDisable) {
            button.classList.toggle("disabled", true);
        } else {
            button.classList.toggle("disabled", false);
        }
    })
}

function resetEDAValues(id) {
    if (portStates.has(id)) {
        const state = portStates.get(id);
        state.stimEDAValues = [];
        state.stimEDATime = [];
        // state.oldStimValue = '';
        state.data = [];
    }
    // stimEDAValues = [];
    // oldStimValue = '';
    // data = [];
}

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
    const state = portStates.get(id);
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

    for (const [id, state] of portStates.entries()) {
        for (const [stim, obj] of Object.entries(state.data)) {
            if (stim === 'grandMean' || stim === 'grandStdDev') continue;
            if (!merged[stim]) merged[stim] = {};
            merged[stim][id] = obj.avgPValue;
        }
    }
    return merged;
}

let mergedData = {};

function analyzeEDA(id) {
    const state = ensurePortState(id);
    getCurrentStim();
    const edaDelta = findMaxDelta(state.stimEDAValues);
    if(!state.data[oldStimValue]) {
        state.data[oldStimValue] = { 
            datapoints: []
        };
    }
    state.data[oldStimValue].datapoints.push(edaDelta);
    state.data = analyze(state.data);

    mergedData = mergeData();

    //updateSigChart(state.data, id);
    updateSigChart(mergedData);
    
    // oldStimValue = currentStimValue;
    return edaDelta;
}
