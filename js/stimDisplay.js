export default class CreateStimDisplay{

    constructor(displayTarget, stimObject) {
        this.displayTarget = displayTarget,
        this.index = 0,
        this.previousLastValue = 0;
        this.stimObject = stimObject,
        this.running = false
        this.timeoutID = null;
    }

    start() {
        if(this.stimObject.stimOrder === 'random'){
            this.randomizeValues();
        }
        this.showCurrent();
        this.scheduleNext();
    }

    randomizeValues() {
        const expandedStimType = []
        const expandedStimValue = []
        const expandedStimRatio = []
        const expandedStimTime = []

        for (let i = 0; i < this.stimObject.stimValue.length; i++){
            const repeat = this.stimObject.stimRatio[i];
            for (let j = 0; j < repeat; j++){
                expandedStimType.push(this.stimObject.stimType[i]);
                expandedStimValue.push(this.stimObject.stimValue[i]);
                expandedStimRatio.push(1);
                expandedStimTime.push(this.stimObject.stimTime[i]);
            }
        }

        let shuffledIndices = this.shuffleIndices(expandedStimValue.length);
        this.stimObject.stimType = this.applyShuffledIndices(expandedStimType, shuffledIndices);
        this.stimObject.stimValue = this.applyShuffledIndices(expandedStimValue, shuffledIndices);
        this.stimObject.stimRatio = this.applyShuffledIndices(expandedStimRatio, shuffledIndices);
        this.stimObject.stimTime = this.applyShuffledIndices(expandedStimTime, shuffledIndices);
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
        }, this.stimObject.stimTime[this.index]);

    }

    stop() {
        if (this.timeoutID) {
            clearInterval(this.timeoutID);
            this.timeoutID = null;
        }
    }

    advance() {
        
        this.index = this.index + 1;
        if (this.index === this.stimObject.stimValue.length){
            this.index = 0;
            this.randomizeValues();
        }
        this.showCurrent();
    }

    showCurrent() {
        const type = this.stimObject.stimType[this.index];
        const value = this.stimObject.stimValue[this.index];

        this.displayTarget.innerHTML = '';

        if(type === 'Word') {
            this.displayTarget.textContent = this.stimObject.stimValue[this.index];
        }
        else if (type === 'Drawing') {
            const drawing = document.createElement('div');
            drawing.style.width = '100px';
            drawing.style.height = '100px';
            drawing.style.backgroundColor = value.color.toLowerCase();
            console.log(`color: ${value.color.toLowerCase()}`);

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