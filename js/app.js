import CreateStimObject from './stimObject.js';
import CreateStimDisplay from './stimDisplay.js';
import { requestPort, startSerial, stopSerial, resumeSerial } from './serialReader.js';
import { initChart, updateChart, setAutoscroll, annotateChartWithStim, clearChart } from './serialChart.js';
import { resetColorOptions } from './utils.js';
//import { drawCountdown } from './stimCountdown.js';


//////////////////Stimulation Control//////////////////

const stimControlToggleButton = document.getElementById('stimControlToggleButton');
const stimControlContainer = document.getElementById('stimControlContainer');
const stimDisplayContainerWrapper = document.getElementById('stimDisplayContainerWrapper');
const resultContainer = document.getElementById('resultContainer');

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

const stimObject = new CreateStimObject('random');

const stimTypeSelector = document.getElementById('stimTypeSelector');
const stimValueWordInput = document.getElementById('stimValueWordInput');
const stimValueShapeSelector = document.getElementById('stimValueShapeSelector');
const stimValueColorSelector = document.getElementById('stimValueColorSelector');
const stimRatioSelector = document.getElementById('stimRatioSelector');
const stimTimeSelector = document.getElementById('stimTimeSelector');
const addStimButton = document.getElementById('addStimButton');

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

checkForValidInputs();

const stimRandomizerButton = document.getElementById("stimRandomizerButton");
stimRandomizerButton.addEventListener("click", () => {
    if(stimObject.stimOrder === 'random') {
        stimObject.stimOrder = 'ordered';
        stimRandomizerButton.textContent = 'Random: OFF';
        stimRandomizerButton.style.backgroundColor = '#0277BD';
        document.querySelectorAll('.stimItemOrder').forEach(orderItem => {
            orderItem.classList.remove('hidden');
        })
    } else if (stimObject.stimOrder === 'ordered') {
        stimObject.stimOrder = 'random';
        stimRandomizerButton.textContent = 'Random: ON';
        stimRandomizerButton.style.backgroundColor = '#E1C93F'
        document.querySelectorAll('.stimItemOrder').forEach(orderItem => {
            orderItem.classList.add('hidden');
        })
    }
})

function renderStimItemContainer() {
    const stimItemContainer = document.getElementById('stimItemContainer');
    stimItemContainer.innerHTML = '';

    for (let i = 0; i < stimObject.stimType.length; i++){
        let stimItem = document.createElement('div');
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

            if (
                stimObject.stimType.length === 0 &&
                stimObject.stimValue.length === 0 &&
                stimObject.stimRatio.length === 0 &&
                stimObject.stimTime.length === 0
            ) {
                document.getElementById('stimStartStopButton').disabled = true;
            }

            renderStimItemContainer();
        })
        stimItem.appendChild(deleteStimItemButton);
    }
}

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

    document.getElementById('stimStartStopButton').disabled = false;
    renderStimItemContainer();
});

function toggleStimControlDisable(isDisabled) {
    document.getElementById("stimPauseResumeButton").disabled = !isDisabled;
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
    })
    document.querySelectorAll('.stimItemOrder').forEach(input => {
        input.disabled = isDisabled;
    })
}

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

document.getElementById("stimStartStopButton").addEventListener("click", async (e) => {
    if (!stimDisplay.running){
        try{
            resetEDAValues();
            resetColorOptions();
            clearChart();
            await requestPort();

            e.target.textContent = "Stop";
            stimDisplay.running = true;
            toggleStimControlDisable(true);
            stimControlContainer.classList.toggle("collapsed");
            stimDisplayContainerWrapper.classList.add("shifted");
            stimControlToggleButton.innerHTML = "&#9654;";

            await showInitialCountdown();
            await startSerial(updateInterface);
            stimDisplay.start();
        } 
        catch {
            console.error('Serial port did not connect');
        }
    } else {
        stopSerial();
        stimDisplay.stop();
        e.target.textContent = "Start";
        stimDisplay.running = false;
        toggleStimControlDisable(false);
    }
})

document.getElementById("stimPauseResumeButton").addEventListener("click", async (e) => {
    if (stimDisplay.paused){
        try{
            stimEDAValues = [];

            stimControlContainer.classList.toggle("collapsed");
            stimDisplayContainerWrapper.classList.add("shifted");
            stimControlToggleButton.innerHTML = "&#9654;";

            await showInitialCountdown();

            //await startSerial(updateInterface);
            await resumeSerial(updateInterface);
            stimDisplay.resume();
            e.target.textContent = "Pause";
            stimDisplay.paused = false;
        } 
        catch {
            console.error('Serial port did not connect');
        }
    } else {
        stopSerial();
        stimDisplay.pause();
        e.target.textContent = "Resume";
        stimDisplay.paused = true;
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

initChart('serialChart');

function updateInterface(value) {
    updateChart(value);
    updateEDA(value);
}

stimDisplay.onStimDisplay(({ stim, color, startTime, stopTime }) => {
    annotateChartWithStim(stim, color, startTime, stopTime);
})

//////////////////Data Analysis/////////////////////////
let stimEDAValues = [];
let oldStimValue = '';
let stats = [];

function resetEDAValues() {
    stimEDAValues = [];
    oldStimValue = '';
    stats = [];
}

function updateEDA(value) {
    let currentStimValue;
    if (typeof(stimDisplay.expandedValue[stimDisplay.index]) === 'string'){
        currentStimValue = stimDisplay.expandedValue[stimDisplay.index]
    } else if (typeof(stimDisplay.expandedValue[stimDisplay.index]) === 'object') {
        currentStimValue = `${stimDisplay.expandedValue[stimDisplay.index].color} ${stimDisplay.expandedValue[stimDisplay.index].shape}`
    }

    if ( oldStimValue === '') {
        oldStimValue = currentStimValue;
    }
    
    if( currentStimValue !== oldStimValue && stimEDAValues.length > 0){
        let edaMin = Math.min(...stimEDAValues)
        let edaMax = Math.max(...stimEDAValues)
        let edaDelta = edaMax - edaMin;
        if(!stats[oldStimValue]) {
            stats[oldStimValue] = { 
                delta: [], 
                avgDelta: 0,
                varDelta: 0
            };
        }
        

        stimEDAValues = [];
        //oldStimValue = stimDisplay.expandedValue[stimDisplay.index];
        oldStimValue = currentStimValue;
    }

    stimEDAValues.push(value);
}