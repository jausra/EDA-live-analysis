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

        let shuffledIndices = this.shuffleIndices(this.stimObject.stimValue.length);
        this.stimObject.stimType = this.applyShuffledIndices(this.stimObject.stimType, shuffledIndices);
        this.stimObject.stimValue = this.applyShuffledIndices(this.stimObject.stimValue, shuffledIndices);
        this.stimObject.stimRatio = this.applyShuffledIndices(this.stimObject.stimRatio, shuffledIndices);
        this.stimObject.stimTime = this.applyShuffledIndices(this.stimObject.stimTime, shuffledIndices);

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
            this.showCurrent();
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
        this.displayTarget.textContent = this.stimObject.stimValue[this.index];
    }
}