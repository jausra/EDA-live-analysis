import CreateStimObject from './stimObject.js';
import CreateStimDisplay from './stimDisplay.js';





//////////////////Stimulation Control Container//////////////////

const stimControlToggleButton = document.getElementById('stimControlToggleButton');
const stimControlContainer = document.getElementById('stimControlContainer');
const stimDisplayContainerWrapper = document.getElementById('stimDisplayContainerWrapper');

stimControlToggleButton.addEventListener("click", () => {
    const collapsed = stimControlContainer.classList.toggle("collapsed");
    if (collapsed) {
        stimDisplayContainerWrapper.classList.add("shifted");
        stimControlToggleButton.innerHTML = "&#9654;";
    } else {
        stimDisplayContainerWrapper.classList.remove("shifted");
        stimControlToggleButton.innerHTML = "&#9664;";
    }
})



//////////////////Stimulation Display Container//////////////////

const stimTypeSelector = document.getElementById('stimTypeSelector');
const stimValueWordInput = document.getElementById('stimValueWordInput');
const stimValueShapeSelector = document.getElementById('stimValueShapeSelector');
const stimValueColorSelector = document.getElementById('stimValueColorSelector');
const stimRatioSelector = document.getElementById('stimRatioSelector');
const stimTimeSelector = document.getElementById('stimTimeSelector');

const stimTypeOptions = ['Word', 'Drawing'];
const stimValueShapeOptions = ['Circle', 'Square'];
const stimValueColorOptions = ['Red', 'Blue'];
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

stimTypeSelector.addEventListener("change", () => {
    if (stimTypeSelector.value === 'Word'){
        stimValueWordInput.classList.remove('hidden');
        stimValueShapeSelector.classList.add('hidden');
        stimValueColorSelector.classList.add('hidden');

    } else if (stimTypeSelector.value === 'Drawing'){
        stimValueWordInput.classList.add('hidden');
        stimValueShapeSelector.classList.remove('hidden');
        stimValueColorSelector.classList.remove('hidden');
    } else {
        stimValueWordInput.classList.add('hidden');
        stimValueShapeSelector.classList.add('hidden');
        stimValueColorSelector.classList.add('hidden');
    }
})


let stimOrder = 'random';
let stimType = ['drawing', 'drawing', 'string', 'string', 'string', 'string'];
let stimValue = [
    {
        shape: 'square',
        color: 'blue'
    },
    {
        shape: 'circle',
        color: 'red'
    },
    'C', 'D', 'E', 'F'
];
let stimRatio = [1, 1, 1, 1, 1, 1];
let stimTime = [1000, 1000, 1000, 1000, 1000, 1000];

const stimObject = new CreateStimObject(stimOrder, stimType, stimValue, stimRatio, stimTime);
const displayTarget = document.getElementById("stimDisplay");
let stimDisplay = new CreateStimDisplay(displayTarget, stimObject);

document.getElementById("stimStartToggleButton").addEventListener("click", (e) => {
    if (!stimDisplay.running){
        stimDisplay.start();
        e.target.textContent = "Stop";
        stimDisplay.running = true;
    } else {
        stimDisplay.stop();
        e.target.textContent = "Start";
        stimDisplay.running = false;
    }
})