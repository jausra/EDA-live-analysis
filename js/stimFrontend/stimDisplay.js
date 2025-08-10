import { colorMap } from "../utils.js";

export default class CreateStimDisplay{

    constructor(displayTarget, radialGaugeTarget, compressedStimObject) {
        this.displayTarget = displayTarget; //Word or drawing target. 
        this.radialGaugeTarget = radialGaugeTarget; //Radial gauge target. 
        this.index = 0;
        this.round = 1;
        this.previousLastValue = -1;
        this.compressedStimObject = compressedStimObject;
        this.running = false;
        this.paused = false;
        this.timeoutID = null;
        this.animationID = null;

        //Vairables to store the expanded array of stim after factoring in ratios. 
        this.expandedType = [];
        this.expandedValue = [];
        this.expandedTime = [];

        //Variables to store the initial order of the stims
        this.ogExpandedType = [];
        this.ogExpandedValue = [];
        this.ogExpandedTime = [];

        this.stimDisplayListeners = [];

        this.currentEDAValues = [];
    }

    //Method to start the stim display. 
    start() {
        this.expandedType = [];
        this.expandedValue = [];
        this.expandedTime = [];

        this.expandValues();
        if(this.compressedStimObject.stimOrder === 'random') {
            this.ogExpandedType = this.expandedType;
            this.ogExpandedValue = this.expandedValue;
            this.ogExpandedTime = this.expandedTime;
            this.randomizeValues();
        }
        this.index = 0;

        this.showCurrent();
        this.scheduleNext();
    }

    //Method to multiply stimulus items if their ratio is > 1. 
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

    //Method to randomize the order of the stims. 
    randomizeValues() {
        let shuffledIndices = this.shuffleIndices(this.expandedValue.length);
        this.expandedType = this.applyShuffledIndices(this.ogExpandedType, shuffledIndices);
        this.expandedValue = this.applyShuffledIndices(this.ogExpandedValue, shuffledIndices);
        this.expandedTime = this.applyShuffledIndices(this.ogExpandedTime, shuffledIndices);
    }

    //Method to create an array of random indices. 
    shuffleIndices(length) {
        //Here, the first argument is an object with a length key. 
        // The second argument is a mapping function, where the index of each value becomes the value in the final array. 
        const indices = Array.from({ length }, (_, i) => i);
        let currentIndex = length;
        while (currentIndex != 0){
            let randomIndex = Math.floor(Math.random() * currentIndex)
            currentIndex--;

            [indices[currentIndex], indices[randomIndex]] = 
            [indices[randomIndex], indices[currentIndex]];
        }

        //If the first stim is the same as the previous last stim, swap the first and the second stim. 
        if(indices[0] === this.previousLastValue){
            [indices[0], indices[1]] = 
            [indices[1], indices[0]];
        }
        this.previousLastValue = indices[length-1];

        return indices;
    }

    //Method to change the order of an array based on another array of shuffled indices. 
    applyShuffledIndices(originalArray, shuffledIndices) {
        return shuffledIndices.map((i) => originalArray[i]);
    }

    //Method to change the stim after some period of time. 
    scheduleNext() {
        //setTimeout schedules a callback function to run AFTER a set delay. 
        this.timeoutID = setTimeout(() => {
            if(!this.running) return;
            this.advance();
            this.scheduleNext();
        }, this.expandedTime[this.index]);
    }

    //This method resets 'this.timeoutID', so that when original stim cycle finishes, the next stim is not shown. 
    pause() {
        if (this.timeoutID) {
            clearInterval(this.timeoutID);
            this.timeoutID = null;
        }
    }

    //Method to resume the stim display.
    resume() {
        this.showCurrent();
        this.scheduleNext();
    }

    //Method to reset 'this.timeoutID', and clear the radial gauge
    stop() {
        if (this.timeoutID) {
            clearInterval(this.timeoutID);
            this.timeoutID = null;
        }
        this.displayTarget.innerHTML = '';
        this.clearRadialGauge(this.radialGaugeTarget);
    }

    //Method to advance the index and round, the run 'this.showCurrent'. 
    advance() {
        this.index = this.index + 1;
        if (this.index === this.expandedValue.length){
            this.index = 0;
            this.round = this.round + 1;
            if(this.compressedStimObject.stimOrder === 'random') {
                this.randomizeValues();
            }
        }
        this.showCurrent();
    }

    //Method to show the current stim. 
    showCurrent() {
        const type = this.expandedType[this.index];
        const value = this.expandedValue[this.index];

        //Get the start and stop time indicating when the gauge is empty vs full. 
        const startTime = Date.now();
        const duration = this.expandedTime[this.index];
        const stopTime = startTime + duration;

        this.displayTarget.innerHTML = ''; //Clear the stim previously displayed. 

        if(type === 'Word') {
            this.displayTarget.textContent = value;

            //If the word is wider than the available space, scale down its size. 
            const wordWidth = this.displayTarget.scrollWidth;
            const containerWidth = this.displayTarget.clientWidth;
            if (wordWidth > 0.8*containerWidth) {
                const scale = 0.8*containerWidth / wordWidth;
                this.displayTarget.style.transform = `translate(-50%, -50%) scale(${scale})`;
            }

            //Run the callback functions with the stim information. This will be displayed in the serial chart. 
            this.stimDisplayListeners.forEach(cb => cb({
                stim: value,
                round: this.round,
                color: 'random',
                startTime,
                stopTime
            }));
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

            //Run the callback functions with the stim information. This will be displayed in the serial chart. 
            this.stimDisplayListeners.forEach(cb => cb({
                stim: `${value.color}\n${value.shape}`,
                round: this.round,
                color: colorMap[value.color], //Use the colorMap (utils.js) to get the rgba from string. 
                startTime,
                stopTime
            }));
        }
        //Once the stim word/drawing has been displayed, cycle the radial gauge from empty to full over the duration. 
        this.drawRadialGauge(this.radialGaugeTarget, this.expandedTime[this.index]);
    }

    //Method to incrementally fill out the radial gauge from 0 to 360 degrees. 
    drawRadialGauge(canvas, duration) {
        const self = this;
        const ctx = canvas.getContext("2d");
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 200;
        const startAngle = Math.PI / 2;
    
        let startTime = null;
    
        function drawFrame(timestamp) {
            
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime);
            const progress = Math.min(elapsed / duration, 1);
            const endAngle = startAngle + progress * Math.PI * 2;
    
            ctx.clearRect(0, 0, canvas.width, canvas.height);
    
            //Draw the background circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = "#ddd";
            ctx.lineWidth = 15;
            ctx.stroke();
    
            //Draw the fill circle in increments. 
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.strokeStyle = "#00aaff";
            ctx.lineWidth = 15;
            ctx.stroke();
    
            if (progress < 1) {
                self.animationID = requestAnimationFrame(drawFrame);
            }
        }
    
        self.animationID = requestAnimationFrame(drawFrame);
    }

    //Method to clear the radial gauge. 
    clearRadialGauge(canvas) {
        if (this.animationID !== null){
            cancelAnimationFrame(this.animationID);
            this.animationID = null;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    //Method to add a callback to 'this.stimDisplayListeners'
    onStimDisplay(callback){
        this.stimDisplayListeners.push(callback);
    }
}