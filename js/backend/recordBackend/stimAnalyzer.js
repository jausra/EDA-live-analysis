import { analyzeRounds } from './stats.js';
import { formatTimeCSV } from '../../utils.js';

//Class for analyzing the raw EDA data. 
export class StimAnalyzer {
    constructor(connectionManager, dataProcessor) {
        this.connectionManager = connectionManager;
        this.dataProcessor = dataProcessor;
        this.mergedData = {};
        this.previousWindowStartRound = 0;
        this.windowRounds = 4;
        this.overlapPercent = 0.25;
        this.overlapRounds = this.calculateOverlapRounds(this.windowRounds, this.overlapPercent);

        this.previousValue;
        this.previousTime;
        this.dipFlag = false;
        this.dipStartValue;
        this.dipStartTime;
        this.suppressUntil = 0;
        this.calibrationActive = false;

        this.setupThreshold();
    }

    setupThreshold() {
        this.thresholdInput = document.getElementById("threshold-input");
        this.thresholdSlider = document.getElementById("threshold-slider");

        // Threshold constants
        this.thresholdMin = 1;
        this.thresholdMax = 80;
        this.thresholdDefault = 20;

        // Set slider ranges and default values
        this.threshold = this.thresholdDefault;
        this.thresholdSlider.min = this.thresholdMin;
        this.thresholdSlider.max = this.thresholdMax;
        this.thresholdInput.value = this.thresholdDefault;
        this.thresholdSlider.value = this.thresholdDefault;

        //Threshold input change handler.
        this.thresholdInput.addEventListener("change", (e) => {
            this.handleThresholdInputChange(e);
        });

        //Threshold slider change handler.
        this.thresholdSlider.addEventListener("change", (e) => {
            this.handleThresholdSliderChange(e);
        });
    }   

    //Handle changes in offset text input. 
    handleThresholdInputChange(e) {
        this.threshold = e.target.value;
        const thresholdMin = parseFloat(this.thresholdSlider.min); //Convert from string to float.
        const thresholdMax = parseFloat(this.thresholdSlider.max); //Convert from string to float.

        //Modify the text if it is outside the min/max. 
        if (this.threshold < thresholdMin) {
            this.threshold = thresholdMin;
            e.target.value = this.threshold;
        }
        if (this.threshold > thresholdMax) {
            this.threshold = thresholdMax;
            e.target.value = this.threshold;
        }
        
        if (this.dataProcessor) {
            this.dataProcessor.updateThreshold(this.threshold);
            this.dataProcessor.setPhase('manual-threshold');
        }
        
        this.thresholdSlider.value = this.threshold; //Make the slider reflect the text input.
    }

    //Handle changes in offset slider. 
    handleThresholdSliderChange(e) {
        this.threshold = e.target.value;
        const thresholdMin = parseFloat(this.thresholdSlider.min); //Convert from string to float.
        const thresholdMax = parseFloat(this.thresholdSlider.max); //Convert from string to float.

        //Modify the slider if it is outside the min/max. 
        if (this.threshold < thresholdMin) {
            this.threshold = thresholdMin;
        }
        if (this.threshold > thresholdMax) {
            this.threshold = thresholdMax;
        }
        
        if (this.dataProcessor) {
            this.dataProcessor.updateThreshold(this.threshold);
            this.dataProcessor.setPhase('manual-threshold');
        }
        
        this.thresholdInput.value = this.threshold; //Make the text input reflect the slider.
    }

    //Method for calculating the number of rounds for the overlap. 
    calculateOverlapRounds(window, overlap) {
        return Math.round(window * overlap);
    }

    //Method for setting the window length and can calculating overlap rounds. This is run when you update the window slider. 
    setWindowRounds(rounds) {
        this.windowRounds = rounds;
        this.overlapRounds = this.calculateOverlapRounds(this.windowRounds, this.overlapPercent);
    }

    //Method for setting the overlap percent and can calculating overlap rounds. This is run when you update the overlap slider. 
    setOverlapPercent(overlap) {
        this.overlapPercent = (overlap * 0.01).toFixed(2);
        this.overlapRounds = this.calculateOverlapRounds(this.windowRounds, this.overlapPercent);
    }

    //Method for calculating the largest negative change in EDA during a single stim. 
    findMaxDelta(data) {
        if (data.length < 2) return 0; //Don't valculate if there are less than 3 data points. 

        let currentMax = data[0]; //Set the current max to the value of the first data point. 
        let maxDelta = 0; //Set the maximum change value to 0.

        for (let i = 1; i < data.length; i++) { //Starting with the second data point, increment by 1 over the entire array. 
            const delta = currentMax - data[i]; //Set delta to the currentMax minus the current datapoint. 
            //If the delta is greater than the max delta, set the max delta to the delta. 
            if (delta > maxDelta) {
                maxDelta = delta; 
            }
            //If the data point is higher than the current max, set the current max to the data point. 
            if (data[i] > currentMax) { 
                currentMax = data[i];
            }
        }

        return maxDelta;
    }

    //Method for concatenating data that will be savied in CSV. We will delete this. 
    mergeData() {
        const merged = {};

        for (const [id, state] of this.connectionManager.getPortStates().entries()) {
            for (const [stim, obj] of Object.entries(state.data)) {
                if (stim === 'grandMean' || stim === 'grandStdDev') continue;
                if (!merged[stim]) merged[stim] = {};
                merged[stim][id] = obj.avgPValue;
            }
        }
        return merged;
    }

    //Method for getting the max EDA delta and P-Value for a single stim. 
    analyzeStim(id, round, newRoundFlag, oldStimValue, updateSigLineChartValue) {
        const state = this.connectionManager.ensurePortState(id); //Get the state for the ID. 
        const edaDelta = this.findMaxDelta(state.stimEDAValues); //find the made value for the EDA values. 
        
        if (!state.data[oldStimValue]) { //If there is no object with the previous stim value as the key, initialize it. 
            state.data[oldStimValue] = { 
                datapoints: [],
                rounds: []
            };
        }
        
        state.data[oldStimValue].datapoints.push(edaDelta); //Add the edaDelta to the datapoints object. 
        state.data[oldStimValue].rounds.push(round); //Add the round to the rounds object. 

        if (newRoundFlag === true) { //Run if this is a new round. 
            if (round === (this.previousWindowStartRound + this.windowRounds)) { //Check if the current round is the final round for the current window.  
                const startRound = this.previousWindowStartRound;  //Set the startRound. 
                const stopRound = round; //Set the stopRound to the current round. 
                state.data = analyzeRounds(state.data, startRound, stopRound); //Update state.data by analyzing the rounds. 
                const mostRecentRoundTime = state.data.windowTimes[state.data.windowTimes.length - 1]; //Get the round time associated with the current window. 
                
                //Update the significance chart with the most recent P value for the window.
                // console.log(state.data);
                Object.entries(state.data).forEach(([label, obj]) => {
                    if (obj?.datapoints && obj.avgPValue?.length) {
                        const lastAvgP = obj.avgPValue[obj.avgPValue.length - 1];
                        // updateSigLineChartValue(lastAvgP, mostRecentRoundTime, label); 
                    }
                });
                
                this.previousWindowStartRound = round - this.overlapRounds; //Set the previous Window Start Round. 
            }
        }
        
        return edaDelta;
    }

    //Method for resetting and recalculating stats for all stims. Run after updating window and overlap or uploading fresh data. 
    reanalyzeAndDisplay(id, updateSigLineChartArray) {
        const state = this.connectionManager.ensurePortState(id); //Get the state associated with each port. 
        
        if (state.data.grandMean) {
            state.data.grandMean = []; //Clear grand mean. 
        }
        if (state.data.grandStdDev) {
            state.data.grandStdDev = []; //Clear grand standard deviation. 
        }
        if (state.data.windowTimes) {
            state.data.windowTimes = []; //Clear window times. 
        }
        
        Object.entries(state.data).forEach(([label, obj]) => { //Cycle through all the values in the data object. 
            if (!obj.datapoints || !obj.rounds) return; //Only look for objects containing data about particular stims. 
            if (obj.avg) { 
                obj.avg = []; //Clear average.
            }
            if (obj.stdDev) { 
                obj.stdDev = []; //Clear standard deviation.
            }
            if (obj.avgZScore) { 
                obj.avgZScore = []; //Clear average Z-Score.
            }
            if (obj.avgPValue) { 
                obj.avgPValue = []; //Clear average P-Value.
            }
        });

        console.log("this.windowRounds:", this.windowRounds);
        console.log("this.overlapRounds:", this.overlapRounds);

        //Get the current number of rounds. 
        const totalRounds = state.data.roundTimes.length;

        console.log("totalRounds:", totalRounds);

        //Calculate the number of windows based on the number of rounds. 
        let numWindows = 0;
        if (totalRounds >= this.windowRounds) {//Check that there are enough rounds for at least one window. 
            numWindows = Math.floor((totalRounds - this.windowRounds)/(this.windowRounds - this.overlapRounds)) + 1; //Add 1 b/c you say "totalRounds - window", which accounts for the first window. 
        }

        console.log("numWindow:", numWindows)
        
        if (numWindows) {
            for (let i = 0; i < numWindows; i++) { //Cycle through each new window. 
                const startRound = i * (this.windowRounds - this.overlapRounds);
                const stopRound = startRound + this.windowRounds;
                state.data = analyzeRounds(state.data, startRound, stopRound); //Re-analyze the rounds for a given window.
            }

            this.previousWindowStartRound = (numWindows + 1) * (this.windowRounds - this.overlapRounds); //Update this.previousWindowStartRound

            //Update the significance chart with the new window times and P-Values.
            const timeArray = state.data.windowTimes;
            Object.entries(state.data).forEach(([label, obj]) => {
                if (obj?.datapoints && obj.avgPValue?.length) {
                    updateSigLineChartArray(obj.avgPValue, timeArray, label);
                }
            });
        }
    }

    analyzeIncomingDatapoint(value, now, id, connectionManager) {
        console.log("analyzing");

        // Reset dip value to 0
        if (!this.dipFlag && this.dataProcessor) {
            this.dataProcessor.setDip(0);
        }

        if (this.calibrationActive || (this.suppressUntil && now < this.suppressUntil)) {
            this.dipFlag = false;
            this.previousValue = value;
            this.previousTime = now;
            return;
        }
        if(value > this.previousValue || (this.dipFlag && value == this.previousValue)){ //Delta detected
            if (!this.dipFlag) { //Start of delta
                this.dipStartValue = this.previousValue;
                this.dipStartTime = this.previousTime;
                this.dipFlag = true;
            }
        } else {
            if (this.dipFlag) { // End of delta
                let delta = this.previousValue - this.dipStartValue;

                const state = connectionManager.getPortStates().get(id);
                if (state && delta > 0) { 
                    if (!state.dipValues) {
                        state.dipValues = []; //Initialize the dip value buffer if it does not exist. 
                    }
                    if (!state.dipTime) {
                        state.dipTime = []; //Initialize the dip time buffer if it does not exist. 
                    }
                    state.dipValues.push(delta); //Add the EDA value to the buffer. 
                    console.log(delta);
                    state.dipTime.push(formatTimeCSV(new Date(this.dipStartTime))); //Add the time value to the buffer. 
                
                    this.calculateDeltaSignificance(id, connectionManager);
                }

                this.dipFlag = false;
            }
        }

        this.previousValue = value;
        this.previousTime = now;
    }

    suppressForCalibration(now) {
        this.dipFlag = false;
        this.suppressUntil = now + 2000;
    }

    beginCalibrationSuppression() {
        this.dipFlag = false;
        this.calibrationActive = true;
    }

    endCalibrationSuppression(now) {
        this.dipFlag = false;
        this.calibrationActive = false;
        this.suppressUntil = now + 2000;
    }

    calculateDeltaSignificance(id, connectionManager) {
        const state = connectionManager.getPortStates().get(id);
        if (state) { 
            if (state.dipValues[state.dipValues.length - 1] >= this.threshold) {
                const dipValue = state.dipValues[state.dipValues.length - 1];
                console.log("BIG DIP!!!!", dipValue);
                if (this.dataProcessor) {
                    this.dataProcessor.setDip(dipValue);
                }
                this.triggerFireworks(dipValue);
            }
        }
    }

    triggerFireworks(dipValue) {
        const stimDisplayContainer = document.getElementById('stimDisplayContainer');
        if (stimDisplayContainer) {
            // Calculate number of fireworks based on dip amplitude
            // Minimum 1 firework, maximum 8 fireworks
            // Scale based on how much the dip exceeds the threshold
            const excessOverThreshold = dipValue - this.threshold;
            const maxExcess = 50; // Assume 50 is a very large dip
            const normalizedExcess = Math.min(excessOverThreshold / maxExcess, 1);
            const fireworkCount = Math.max(1, Math.ceil(1 + normalizedExcess * 7));
            
            console.log(`Triggering ${fireworkCount} fireworks for dip value: ${dipValue}`);
            
            // Create multiple fireworks with slight delays for visual effect
            for (let i = 0; i < fireworkCount; i++) {
                setTimeout(() => {
                    this.createFirework(stimDisplayContainer);
                }, i * 100); // 100ms delay between each firework
            }
        }
    }

    triggerFirework() {
        const stimDisplayContainer = document.getElementById('stimDisplayContainer');
        if (stimDisplayContainer) {
            this.createFirework(stimDisplayContainer);
        }
    }

    createFirework(container) {
        // Get random position within the container
        const containerRect = container.getBoundingClientRect();
        const maxX = containerRect.width - 50; // Leave some margin
        const maxY = containerRect.height - 50;
        const randomX = Math.random() * maxX;
        const randomY = Math.random() * maxY;
        
        // Create firework container
        const firework = document.createElement('div');
        firework.style.position = 'absolute';
        firework.style.top = `${randomY}px`;
        firework.style.left = `${randomX}px`;
        firework.style.transform = 'translate(-50%, -50%)';
        firework.style.pointerEvents = 'none';
        firework.style.zIndex = '1000';
        firework.style.width = '0';
        firework.style.height = '0';
        
        // Create particles
        const particleCount = 50;
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.borderRadius = '50%';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.boxShadow = '0 0 10px currentColor';
            particle.style.left = '0';
            particle.style.top = '0';
            
            // Random direction and distance
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 100 + Math.random() * 150;
            const lifetime = 1500 + Math.random() * 1000;
            
            const x = Math.cos(angle) * velocity;
            const y = Math.sin(angle) * velocity;
            
            firework.appendChild(particle);
            
            // Animate particle
            const animation = particle.animate([
                { 
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                { 
                    transform: `translate(${x}px, ${y}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: lifetime,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            
            // Ensure particle is removed after animation
            animation.addEventListener('finish', () => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
        }
        
        container.appendChild(firework);
        
        // Remove firework container after animation
        setTimeout(() => {
            if (firework.parentNode) {
                firework.parentNode.removeChild(firework);
            }
        }, 3000);
    }

    //Getters. 
    getMergedData() {
        return this.mergedData;
    }

    getWindowRounds() {
        return this.windowRounds;
    }

    getOverlapPercent() {
        return this.overlapPercent;
    }

    resetThreshold() {
        this.threshold = this.thresholdDefault;
        this.thresholdInput.value = this.threshold;
        this.thresholdSlider.value = this.threshold;
    }
}
