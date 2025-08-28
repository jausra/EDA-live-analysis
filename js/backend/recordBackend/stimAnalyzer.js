import { analyzeRounds } from './stats.js';

//Class for analyzing the raw EDA data. 
export class StimAnalyzer {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.mergedData = {};
        this.previousWindowStartRound = 0;
        this.windowRounds = 4;
        this.overlapPercent = 0.25;
        this.overlapRounds = this.calculateOverlapRounds(this.windowRounds, this.overlapPercent);
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
                        updateSigLineChartValue(lastAvgP, mostRecentRoundTime, label); 
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
}
