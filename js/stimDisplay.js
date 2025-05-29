import { colorMap } from "./utils.js";

export default class CreateStimDisplay{

    constructor(displayTarget, countdownTarget, compressedStimObject) {
        this.displayTarget = displayTarget;
        this.countdownTarget = countdownTarget;
        this.index = 0;
        this.previousLastValue = -1;
        this.compressedStimObject = compressedStimObject;
        this.running = false;
        this.paused = false;
        this.timeoutID = null;
        this.animationID = null;

        this.expandedType = [];
        this.expandedValue = [];
        this.expandedTime = [];

        this.ogExpandedType = [];
        this.ogExpandedValue = [];
        this.ogExpandedTime = [];

        this.stimDisplayListeners = [];

        this.currentEDAValues = [];
    }

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
        this.expandedType = this.applyShuffledIndices(this.ogExpandedType, shuffledIndices);
        this.expandedValue = this.applyShuffledIndices(this.ogExpandedValue, shuffledIndices);
        this.expandedTime = this.applyShuffledIndices(this.ogExpandedTime, shuffledIndices);
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
        this.clearCountdown(this.countdownTarget);
    }

    advance() {
        this.index = this.index + 1;
        if (this.index === this.expandedValue.length){
            this.index = 0;
            if(this.compressedStimObject.stimOrder === 'random') {
                this.randomizeValues();
            }
        }
        this.showCurrent();
    }

    showCurrent() {
        const type = this.expandedType[this.index];
        const value = this.expandedValue[this.index];

        const startTime = Date.now();
        const duration = this.expandedTime[this.index];
        const stopTime = startTime + duration;

        this.displayTarget.innerHTML = '';

        if(type === 'Word') {
            this.displayTarget.textContent = value;
            const wordWidth = this.displayTarget.scrollWidth;
            const containerWidth = this.displayTarget.clientWidth;
            if (wordWidth > 0.8*containerWidth) {
                const scale = 0.8*containerWidth / wordWidth;
                this.displayTarget.style.transform = `translate(-50%, -50%) scale(${scale})`;
            }

            this.stimDisplayListeners.forEach(cb => cb({
                stim: value,
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

            this.stimDisplayListeners.forEach(cb => cb({
                stim: `${value.color}\n${value.shape}`,
                color: colorMap[value.color],
                startTime,
                stopTime
            }));
        }
        this.drawCountdown(this.countdownTarget, this.expandedTime[this.index])
    }

    drawCountdown(canvas, duration) {
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
    
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = "#ddd";
            ctx.lineWidth = 15;
            ctx.stroke();
    
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

    clearCountdown(canvas) {
        if (this.animationID !== null){
            cancelAnimationFrame(this.animationID);
            this.animationID = null;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    onStimDisplay(callback){
        this.stimDisplayListeners.push(callback);
    }
}