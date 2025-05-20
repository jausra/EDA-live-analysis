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
const stimValueShapeSelector = document.getElementById('stimValueShapeSelector');
const stimValueColorSelector = document.getElementById('stimValueColorSelector');

const stimTypeOptions = ['Word', 'Drawing'];
const stimValueShapeOptions = ['Circle', 'Square'];
const stimValueColorOptions = ['Red', 'Blue'];

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