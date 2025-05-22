export default class CreateStimDisplay{

    constructor(displayTarget, compressedStimObject) {
        this.displayTarget = displayTarget;
        this.index = 0;
        this.previousLastValue = -1;
        this.compressedStimObject = compressedStimObject;
        this.running = false;
        this.paused = false;
        this.timeoutID = null;

        this.expandedType = [];
        this.expandedValue = [];
        this.expandedTime = [];
    }

    start() {
        this.expandedType = [];
        this.expandedValue = [];
        this.expandedTime = [];

        this.expandValues();
        if(this.compressedStimObject.stimOrder === 'random') {
            this.randomizeValues();
        }
        this.index = 0;
        console.log(`this.compressedStimObject: ${this.compressedStimObject}`);
        console.log(`this.expandedType: ${this.expandedType}`);
        console.log(`this.expandedValue: ${this.expandedValue}`);
        console.log(`this.expandedTime: ${this.expandedTime}`);

        this.showCurrent();
        this.scheduleNext();
    }

    expandValues() {
        for (let i = 0; i < this.compressedStimObject.stimValue.length; i++){
            const repeat = this.compressedStimObject.stimRatio[i];
            for (let j = 0; j < repeat; j++){
                this.expandedType.push(this.compressedStimObject.stimType[i]);
                this.expandedValue.push(this.compressedStimObject.stimValue[i]);
                this.expandedTime.push(this.compressedStimObject.stimTime[i]);
            }
        }
    }

    randomizeValues() {
        let shuffledIndices = this.shuffleIndices(this.expandedValue.length);
        this.expandedType = this.applyShuffledIndices(this.expandedType, shuffledIndices);
        this.expandedValue = this.applyShuffledIndices(this.expandedValue, shuffledIndices);
        this.expandedTime = this.applyShuffledIndices(this.expandedTime, shuffledIndices);
    }

    shuffleIndices(length) {
        const indices = Array.from({ length }, (_, i) => i);
        let currentIndex = length;
        while (currentIndex != 0){
            let randomIndex = Math.floor(Math.random() * currentIndex)
            currentIndex--;

            [indices[currentIndex], indices[randomIndex]] = 
            [indices[randomIndex], indices[currentIndex]];
        }

        if(indices[0] === this.previousLastValue){
            [indices[0], indices[1]] = 
            [indices[1], indices[0]];
        }

        this.previousLastValue = indices[length-1];

        return indices;
    }

    applyShuffledIndices(originalArray, shuffledIndices) {
        return shuffledIndices.map((i) => originalArray[i]);
    }

    scheduleNext() {
        this.timeoutID = setTimeout(() => {
            if(!this.running) return;
            this.advance();
            this.scheduleNext();
        }, this.expandedTime[this.index]);
    }

    pause() {
        if (this.timeoutID) {
            clearInterval(this.timeoutID);
            this.timeoutID = null;
        }
    }

    resume() {
        this.showCurrent();
        this.scheduleNext();
    }

    stop() {
        if (this.timeoutID) {
            clearInterval(this.timeoutID);
            this.timeoutID = null;
        }
        this.displayTarget.innerHTML = '';
    }

    advance() {
        this.index = this.index + 1;
        if (this.index === this.expandedValue.length){
            this.index = 0;
            this.randomizeValues();
        }
        this.showCurrent();
    }

    showCurrent() {
        const type = this.expandedType[this.index];
        const value = this.expandedValue[this.index];

        this.displayTarget.innerHTML = '';

        if(type === 'Word') {
            this.displayTarget.textContent = this.expandedValue[this.index];
        }
        else if (type === 'Drawing') {
            const drawing = document.createElement('div');
            drawing.style.width = '100px';
            drawing.style.height = '100px';
            drawing.style.backgroundColor = value.color.toLowerCase();

            if(value.shape === 'Circle'){
                drawing.style.borderRadius = '50%';
            }
            else if(value.shape === 'Square'){
                drawing.style.borderRadius = '0%';
            }
            this.displayTarget.appendChild(drawing);
        }
    }
}