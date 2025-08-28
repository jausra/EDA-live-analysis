//Class to manage the stim object. 
export default class StimManager {
    constructor(stimObject) {
        this.stimObject = stimObject;
        this.stimTypeSelector = document.getElementById('stimTypeSelector');
        this.stimValueWordInput = document.getElementById('stimValueWordInput');
        this.stimValueShapeSelector = document.getElementById('stimValueShapeSelector');
        this.stimValueColorSelector = document.getElementById('stimValueColorSelector');
        this.stimRatioSelector = document.getElementById('stimRatioSelector');
        this.stimTimeSelector = document.getElementById('stimTimeSelector');
        this.addStimButton = document.getElementById('addStimButton');
        this.stimRandomizerButton = document.getElementById("stimRandomizerButton");
        this.stimItemContainer = document.getElementById('stimItemContainer');
        
        this.initOptions();
        this.bindEvents();
        this.checkForValidInputs();
    }

    //Method to initialize the options for creating custom stims. 
    initOptions() {
        const stimTypeOptions = ['Word', 'Drawing'];
        const stimValueShapeOptions = ['Circle', 'Square'];
        const stimValueColorOptions = ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'White', 'Black'];
        const stimRatioOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const stimTimeOptions = ['1 s', '2 s', '3 s', '4 s', '5 s', '6 s', '7 s', '8 s', '9 s', '10 s'];

        this.updateOptions(stimTypeOptions, this.stimTypeSelector);
        this.updateOptions(stimValueShapeOptions, this.stimValueShapeSelector);
        this.updateOptions(stimValueColorOptions, this.stimValueColorSelector);
        this.updateOptions(stimRatioOptions, this.stimRatioSelector);
        this.updateOptions(stimTimeOptions, this.stimTimeSelector);
    }

    //Method for adding the custom stim options to the dropdown selectors. 
    updateOptions(stimOptions, selector) {
        stimOptions.forEach(optionText => {
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = optionText;
            selector.appendChild(option);
        });
    }

    //Method for adding event listeners custom stim option dropdowns/buttons.
    bindEvents() {
        //Add event listeners for when dropdowns/text inputs get updated to check if we can add the stim. 
        [
            this.stimTypeSelector, 
            this.stimValueWordInput, 
            this.stimValueShapeSelector, 
            this.stimValueColorSelector, 
            this.stimRatioSelector, 
            this.stimTimeSelector
        ].forEach(item => {
            item.addEventListener('change', () => this.checkForValidInputs());
            item.addEventListener('input', () => this.checkForValidInputs());
        });

        //Button for adding the stim. 
        this.addStimButton.addEventListener("click", () => this.addStim());

        //Button for toggling randomness of stim order. 
        this.stimRandomizerButton.addEventListener("click", () => this.toggleRandomness());
    }

    //Method for checking if the 'addStimButton' should be visible. 
    checkForValidInputs() {
        //Check if an option from the default dropdowns is selected.
        const stimType = this.stimTypeSelector.value;
        const isRatioTimeValid = this.stimRatioSelector.value !== '' && this.stimTimeSelector.value !== '';

        //Check if the text input/dowpdows are filled out based on the 'stimType' type. 
        let isTypeValid = false;
        if (stimType === "Word") {
            isTypeValid = this.stimValueWordInput.value.trim() !== '';
        } else if (stimType === "Drawing") {
            isTypeValid = this.stimValueShapeSelector.value !== '' && this.stimValueColorSelector.value !== '';
        }

        this.stimValueWordInput.classList.toggle('hidden', stimType !== "Word"); //Hide word input if the stimType is not 'Word'.
        this.stimValueShapeSelector.classList.toggle('hidden', stimType !== "Drawing"); //Hide shape input if the stimType is not 'Drawing'.
        this.stimValueColorSelector.classList.toggle('hidden', stimType !== "Drawing"); //Hide color input if the stimType is not 'Drawing'.

        //Show 'addStimButton' if all requirements are met. 
        const allValid = stimType !== '' && isRatioTimeValid && isTypeValid;
        this.addStimButton.classList.toggle('hidden', !allValid);
    }

    //Method to toggle the randomness of stim items. 
    toggleRandomness() {
        if (this.stimObject.stimOrder === 'random') {
            this.stimObject.stimOrder = 'ordered';
            this.stimRandomizerButton.textContent = 'Random: OFF';
            this.stimRandomizerButton.style.backgroundColor = '#0277BD';
            document.querySelectorAll('.stimItemOrder').forEach(orderItem => {
                orderItem.classList.remove('hidden');
            });
        } else if (this.stimObject.stimOrder === 'ordered') {
            this.stimObject.stimOrder = 'random';
            this.stimRandomizerButton.textContent = 'Random: ON';
            this.stimRandomizerButton.style.backgroundColor = '#E1C93F';
            document.querySelectorAll('.stimItemOrder').forEach(orderItem => {
                orderItem.classList.add('hidden');
            });
        }
    }

    //Method to take the values in the dropdowns/ text inputs and create a new stim item based on them. 
    addStim() {
        //Get the values from the dropdowns/text inputs
        const type = this.stimTypeSelector.value;
        let value;
        
        if (type === 'Word') {
            value = this.stimValueWordInput.value;
        } else if (type === 'Drawing') {
            value = {
                shape: this.stimValueShapeSelector.value,
                color: this.stimValueColorSelector.value
            };
        }

        const ratio = this.stimRatioSelector.value;
        const time = 1000 * parseFloat(this.stimTimeSelector.value);
        
        this.stimObject.addStim(type, value, ratio, time); //Add the stim item to the stimObject. 
        
        //Enable calibrate button when stims are added.
        const calibrateButton = document.getElementById('calibrateButton');
        if (calibrateButton) {
            calibrateButton.disabled = false;
        }
        
        this.renderStimItemContainer();
    }

    //Method to add visualizers of each stim item to 'stimItemContainer'.
    renderStimItemContainer() {
        this.stimItemContainer.innerHTML = ''; //Clear the 'stimItemContainer'. 

        for (let i = 0; i < this.stimObject.stimType.length; i++) { //Cycle through each stim item in 'stimObject'. 
            let stimItem = document.createElement('div');
            stimItem.style.textAlign = 'center';
            stimItem.classList.add('stimItem'); //Style the 'stimItem'
            stimItem.dataset.index = i; //Adds index metadata to the DOM element. 

            if (this.stimObject.stimType[i] === 'Word') {
                const word = document.createElement('div'); //Create the element inside the 'stimItem' div.
                word.textContent = this.stimObject.stimValue[i]; //Add the text. 
                word.classList.add('stimItemValue'); //Center the word in the 'stimItem' div. 
                stimItem.appendChild(word); //Add the 'word' to the 'stimItem'.

                this.stimItemContainer.appendChild(stimItem); //Add the 'stimItem' to the stimItemContainer'.

                this.scaleWordIfNeeded(stimItem, word); //Scale the word if it is too wide. 
            } else if (this.stimObject.stimType[i] === 'Drawing') {
                const drawing = document.createElement('div'); //Create the element inside the 'stimItem' div.
                drawing.style.width = '100px'; //Set x-width
                drawing.style.height = '100px'; //Set y-width
                drawing.style.backgroundColor = this.stimObject.stimValue[i].color; //Give the shape color. 
                drawing.classList.add('stimItemValue'); //Center the drawing in the 'stimItem' div. 

                if (this.stimObject.stimValue[i].shape === 'Circle') { //Create circle.
                    drawing.style.borderRadius = '50%';
                } else if (this.stimObject.stimValue[i].shape === 'Square') { //Create square.
                    drawing.style.borderRadius = '0%';
                }
                stimItem.appendChild(drawing); //Add the 'drawing' to the 'stimItem'.
                this.stimItemContainer.appendChild(stimItem); //Add the 'stimItem' to the stimItemContainer'.
            }
            
            this.addTimeDisplay(stimItem, i); //Add time display to the 'stimItem'. 
            
            if (this.stimObject.stimRatio[i] > 1) { //Add ratio display to the 'stimItem'. 
                this.addRatioDisplay(stimItem, i);
            }

            this.addOrderInput(stimItem, i); //Add order input to the 'stimItem'. 

            this.addDeleteButton(stimItem, i); //Add delete button to the 'stimItem'. 
        }
    }

    //Function to scale the word inside the stimItem if it is too large. 
    scaleWordIfNeeded(stimItem, word) {
        // Scale width if needed
        const stimItemWidth = stimItem.clientWidth; //Get the 'stimItem' width. 
        const wordWidth = word.scrollWidth; //Get the 'word' width. 
        if (wordWidth > (0.9 * stimItemWidth)) { //Check if 'word' width is greater than 'stimItem' width x0.9. 
            //Scale accordingly.
            const scale = (0.9 * stimItemWidth) / wordWidth; 
            word.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }

        // Scale height if needed
        const stimItemHeight = stimItem.clientHeight; //Get the 'stimItem' height. 
        const wordHeight = word.scrollHeight; //Get the 'word' height. 
        if (wordHeight > (0.6 * stimItemHeight)) { //Check if 'word' height is greater than 'stimItem' height x0.6. 
            //Scale accordingly.
            const scale = (0.6 * stimItemHeight) / wordHeight;
            word.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    }

    //Method to add display showing how long the stim is running for. 
    addTimeDisplay(stimItem, index) {
        const displayTime = document.createElement('div'); //Create a new div. 
        displayTime.textContent = `${this.stimObject.stimTime[index] / 1000} s`; //Add the time as text. 
        displayTime.classList.add('stimItemTime'); //Style the div. 
        stimItem.appendChild(displayTime); //Add 'displayTime' to 'stimItem'. 
    }

    //Method to add display showing the ratio of the stim. 
    addRatioDisplay(stimItem, index) {
        const displayRatio = document.createElement('div'); //Create a new div. 
        displayRatio.textContent = `${this.stimObject.stimRatio[index]}x`; //Add the ratio as text. 
        displayRatio.classList.add('stimItemRatio'); //Style the div. 
        stimItem.appendChild(displayRatio); //Add 'displayRatio' to 'stimItem'. 
    }

    addOrderInput(stimItem, index) {
        const displayOrder = document.createElement('input'); //Create a new text input. 
        displayOrder.type = 'text';
        displayOrder.value = `${index + 1}`; //Add the initial order as the default input text. 
        displayOrder.classList.add('stimItemOrder'); //Style the input. 
        
        if (this.stimObject.stimOrder === 'random') { //Hide the order if it is random. 
            displayOrder.classList.add('hidden');
        }

        displayOrder.addEventListener("change", () => { //Monitor for changes in the order. 
            this.handleOrderChange(index, displayOrder.value); 
        });

        stimItem.appendChild(displayOrder); //Add 'displayOrder' to 'stimItem'. 
    }

    //Method to handle changes in the stim item order. 
    handleOrderChange(index, newOrder) {
        const order = parseInt(newOrder);
        if (!isNaN(order) && order > 0) {
            Object.entries(this.stimObject).forEach(([key, value]) => {
                if (key !== 'stimOrder') {
                    if (order > this.stimObject.stimType.length) { //Ensure that all other stimObject properties get re=ordered correctly. 
                        const [item] = this.stimObject[key].splice(index, 1); //Get the stimObject attribute in the new order. 
                        this.stimObject[key].push(item); //Push it back into stimObject. 
                    } else { //Swap the stim items based on the order you input. 
                        [this.stimObject[key][index], this.stimObject[key][order - 1]] = 
                        [this.stimObject[key][order - 1], this.stimObject[key][index]];
                    }
                }
            });
        }
        this.renderStimItemContainer(); //Render the stimItemContainer. 
    }

    //Method to add a delete button to each stim item. 
    addDeleteButton(stimItem, index) {
        const deleteStimItemButton = document.createElement('button'); //Create the button
        deleteStimItemButton.classList.add('deleteStimButton', 'fa-solid', 'fa-trash'); //Add styling. 
        deleteStimItemButton.addEventListener("click", () => {
            this.stimObject.removeStim(index); //Remove the stim item upon delete .
            
            //If all stim items have been cleared, disable the calibrate button.
            if (!this.stimObject.hasItems()) {
                const calibrateButton = document.getElementById('calibrateButton');
                if (calibrateButton) {
                    calibrateButton.disabled = true;
                }
            }
            
            this.renderStimItemContainer(); //Render the stimItemContainer. 
        });
        stimItem.appendChild(deleteStimItemButton); //Add the delete button to the 'stimItem'. 
    }

    //Method to reset all stim items. 
    clearStimItems() { 
        this.stimItemContainer.innerHTML = '';
        this.stimObject.clear();
        this.stimTypeSelector.value = "";
        this.stimRatioSelector.value = "";
        this.stimTimeSelector.value = "";
        this.stimValueWordInput.value = "";
        this.checkForValidInputs();
    }

    //Method to disable and enable custom stim modifiers. 
    toggleStimControlDisable(isDisabled) {
        const controls = [
            this.stimRandomizerButton,
            this.stimTypeSelector,
            this.stimValueShapeSelector,
            this.stimValueColorSelector,
            this.stimValueWordInput,
            this.stimRatioSelector,
            this.stimTimeSelector,
            this.addStimButton
        ];

        controls.forEach(control => {
            if (control) control.disabled = isDisabled;
        });

        //Handle delete buttons and order inputs.
        document.querySelectorAll('.deleteStimButton').forEach(button => {
            button.disabled = isDisabled;
        });
        document.querySelectorAll('.stimItemOrder').forEach(input => {
            input.disabled = isDisabled;
        });
    }
}
