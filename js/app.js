import CreateStimObject from './stimObject.js';
import CreateStimDisplay from './stimDisplay.js';

let stimOrder = 'random';
let stimType = ['drawing', 'string', 'string', 'string', 'string', 'string'];
let stimValue = [
    {
        shape: 'square',
        color: 'blue'
    },
    'B', 'C', 'D', 'E', 'F'
];
let stimRatio = [1, 1, 1, 1, 1, 1];
let stimTime = [1000, 1000, 1000, 1000, 1000, 1000];

const stimObject = new CreateStimObject(stimOrder, stimType, stimValue, stimRatio, stimTime);
const displayTarget = document.getElementById("stimDisplay");
let stimDisplay = new CreateStimDisplay(displayTarget, stimObject);

document.getElementById("startStim").addEventListener("click", (e) => {
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