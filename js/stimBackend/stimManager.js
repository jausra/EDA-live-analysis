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

    //Method to toggle the randomness of 
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

    addStim() {
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

        this.stimObject.addStim(type, value, ratio, time);
        
        // Enable calibrate button when stims are added
        const calibrateButton = document.getElementById('calibrateButton');
        if (calibrateButton) {
            calibrateButton.disabled = false;
        }
        
        this.renderStimItemContainer();
    }

    renderStimItemContainer() {
        this.stimItemContainer.innerHTML = '';

        for (let i = 0; i < this.stimObject.stimType.length; i++) {
            let stimItem = document.createElement('div');
            stimItem.style.textAlign = 'center';
            stimItem.classList.add('stimItem');
            stimItem.dataset.index = i;

            if (this.stimObject.stimType[i] === 'Word') {
                const word = document.createElement('div');
                word.textContent = this.stimObject.stimValue[i];
                word.classList.add('stimItemValue');
                stimItem.appendChild(word);

                this.stimItemContainer.appendChild(stimItem);

                // Handle word scaling
                this.scaleWordIfNeeded(stimItem, word);

            } else if (this.stimObject.stimType[i] === 'Drawing') {
                const drawing = document.createElement('div');
                drawing.style.width = '100px';
                drawing.style.height = '100px';
                drawing.style.backgroundColor = this.stimObject.stimValue[i].color;
                drawing.classList.add('stimItemValue');

                if (this.stimObject.stimValue[i].shape === 'Circle') {
                    drawing.style.borderRadius = '50%';
                } else if (this.stimObject.stimValue[i].shape === 'Square') {
                    drawing.style.borderRadius = '0%';
                }
                stimItem.appendChild(drawing);
                this.stimItemContainer.appendChild(stimItem);
            }

            // Add time display
            this.addTimeDisplay(stimItem, i);
            
            // Add ratio display
            if (this.stimObject.stimRatio[i] > 1) {
                this.addRatioDisplay(stimItem, i);
            }

            // Add order input
            this.addOrderInput(stimItem, i);

            // Add delete button
            this.addDeleteButton(stimItem, i);
        }
    }

    scaleWordIfNeeded(stimItem, word) {
        // Scale width if needed
        const stimItemWidth = stimItem.clientWidth;
        const wordWidth = word.scrollWidth;
        if (wordWidth > (0.9 * stimItemWidth)) {
            const scale = (0.9 * stimItemWidth) / wordWidth;
            word.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }

        // Scale height if needed
        const stimItemHeight = stimItem.clientHeight;
        const wordHeight = word.scrollHeight;
        if (wordHeight > (0.6 * stimItemHeight)) {
            const scale = (0.6 * stimItemHeight) / wordHeight;
            word.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    }

    addTimeDisplay(stimItem, index) {
        const displayTime = document.createElement('div');
        displayTime.textContent = `${this.stimObject.stimTime[index] / 1000} s`;
        displayTime.classList.add('stimItemTime');
        stimItem.appendChild(displayTime);
    }

    addRatioDisplay(stimItem, index) {
        const displayRatio = document.createElement('div');
        displayRatio.textContent = `${this.stimObject.stimRatio[index]}x`;
        displayRatio.classList.add('stimItemRatio');
        stimItem.appendChild(displayRatio);
    }

    addOrderInput(stimItem, index) {
        const displayOrder = document.createElement('input');
        displayOrder.type = 'text';
        displayOrder.value = `${index + 1}`;
        displayOrder.classList.add('stimItemOrder');
        
        if (this.stimObject.stimOrder === 'random') {
            displayOrder.classList.add('hidden');
        }

        displayOrder.addEventListener("change", () => {
            this.handleOrderChange(index, displayOrder.value);
        });

        stimItem.appendChild(displayOrder);
    }

    handleOrderChange(index, newOrder) {
        const order = parseInt(newOrder);
        if (!isNaN(order) && order > 0) {
            Object.entries(this.stimObject).forEach(([key, value]) => {
                if (key !== 'stimOrder') {
                    if (order > this.stimObject.stimType.length) {
                        const [item] = this.stimObject[key].splice(index, 1);
                        this.stimObject[key].push(item);
                    } else {
                        [this.stimObject[key][index], this.stimObject[key][order - 1]] = 
                        [this.stimObject[key][order - 1], this.stimObject[key][index]];
                    }
                }
            });
        }
        this.renderStimItemContainer();
    }

    addDeleteButton(stimItem, index) {
        const deleteStimItemButton = document.createElement('button');
        deleteStimItemButton.classList.add('deleteStimButton', 'fa-solid', 'fa-trash');
        deleteStimItemButton.addEventListener("click", () => {
            this.stimObject.removeStim(index);
            
            // If all stim items have been cleared, disable the calibrate button
            if (!this.stimObject.hasItems()) {
                const calibrateButton = document.getElementById('calibrateButton');
                if (calibrateButton) {
                    calibrateButton.disabled = true;
                }
            }
            
            this.renderStimItemContainer();
        });
        stimItem.appendChild(deleteStimItemButton);
    }

    clearStimItems() {
        this.stimItemContainer.innerHTML = '';
        this.stimObject.clear();
        this.stimTypeSelector.value = "";
        this.stimRatioSelector.value = "";
        this.stimTimeSelector.value = "";
        this.stimValueWordInput.value = "";
        this.checkForValidInputs();
    }

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

        // Handle delete buttons and order inputs
        document.querySelectorAll('.deleteStimButton').forEach(button => {
            button.disabled = isDisabled;
        });
        document.querySelectorAll('.stimItemOrder').forEach(input => {
            input.disabled = isDisabled;
        });
    }
}
