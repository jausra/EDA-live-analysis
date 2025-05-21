import CreateStimObject from './stimObject.js';
import CreateStimDisplay from './stimDisplay.js';


//////////////////Stimulation Control//////////////////

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

const stimObject = new CreateStimObject();

const stimTypeSelector = document.getElementById('stimTypeSelector');
const stimValueWordInput = document.getElementById('stimValueWordInput');
const stimValueShapeSelector = document.getElementById('stimValueShapeSelector');
const stimValueColorSelector = document.getElementById('stimValueColorSelector');
const stimRatioSelector = document.getElementById('stimRatioSelector');
const stimTimeSelector = document.getElementById('stimTimeSelector');
const addStimButton = document.getElementById('addStimButton');

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

stimTypeSelector.addEventListener("change", () => {
    if (stimTypeSelector.value === 'Word'){
        addStimButton.classList.remove('hidden');
        stimValueWordInput.classList.remove('hidden');
        stimValueShapeSelector.classList.add('hidden');
        stimValueColorSelector.classList.add('hidden');
    } else if (stimTypeSelector.value === 'Drawing'){
        addStimButton.classList.remove('hidden');
        stimValueWordInput.classList.add('hidden');
        stimValueShapeSelector.classList.remove('hidden');
        stimValueColorSelector.classList.remove('hidden');
    } else {
        addStimButton.classList.add('hidden');
        stimValueWordInput.classList.add('hidden');
        stimValueShapeSelector.classList.add('hidden');
        stimValueColorSelector.classList.add('hidden');
    }
})

function renderStimItemContainer() {
    const stimItemContainer = document.getElementById('stimItemContainer');
    stimItemContainer.innerHTML = '';

    for (let i = 0; i < stimObject.stimType.length; i++){
        let stimItem = document.createElement('div');
        stimItem.classList.add('stimItem');

        if(stimObject.stimType[i] === 'Word'){
            const word = document.createElement('span');
            word.textContent = stimObject.stimValue[i];
            stimItem.appendChild(word);
            stimItemContainer.appendChild(stimItem);

            //If the word is too long, shrink it
            const stimItemWidth = stimItem.clientWidth;
            const wordWidth = word.scrollWidth;
            if (wordWidth > (0.9*stimItemWidth)) {
                const scale = (0.9*stimItemWidth)/wordWidth;
                word.style.transform = `scale(${scale})`;
            }
        } else if (stimObject.stimType[i] === 'Drawing'){
            const drawing = document.createElement('div');
            drawing.style.width = '100px';
            drawing.style.height = '100px';
            drawing.style.backgroundColor = stimObject.stimValue[i].color;

            if(stimObject.stimValue[i].shape === 'Circle'){
                drawing.style.borderRadius = '50%';
            }
            else if(stimObject.stimValue[i].shape === 'Square'){
                drawing.style.borderRadius = '0%';
            }
            stimItem.appendChild(drawing);
            stimItemContainer.appendChild(stimItem);
        };
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
        })
    };
    stimObject.stimRatio.push(stimRatioSelector.value);
    stimObject.stimTime.push(1000 * parseFloat(stimTimeSelector.value));

    renderStimItemContainer();
});

document.getElementById("stimStartToggleButton").addEventListener("click", (e) => {
    console.log(stimObject);
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

//////////////////Stimulation Display//////////////////

const displayTarget = document.getElementById("stimDisplay");
let stimDisplay = new CreateStimDisplay(displayTarget, stimObject);

