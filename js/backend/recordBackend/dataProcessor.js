import { formatTimeCSV } from '../../utils.js';

//Class to store take incoming EDA data and save it to temporary and long-term arrays. 
export class DataProcessor {
    constructor() {
        this.sessionCSVData = [];
        this.sensorCSVData = {};
        this.unifiedCSVData = {};
        this.currentPhase = 'auto-offset';
        this.currentGain = 20; // default gain value
        this.currentOffset = 700; // default offset value
        this.currentThreshold = 20; // default threshold value
        this.currentDip = 0; // default dip value
    }

    updateSessionCSVData(round, stim, type, startTime, stopTime) {
        if (!this.sessionCSVData) { //Initialize the session csvData array if it does not exist. 
            this.sessionCSVData = [];
        }
        
        const sessionCSVDataRow = []; //Create an empty row array. 
        sessionCSVDataRow.push(round); //Add the round. 
        sessionCSVDataRow.push(stim); //Add the stim. 
        sessionCSVDataRow.push(type); //Add the type of the stim ('Word' or 'Drawing'). 
        sessionCSVDataRow.push(formatTimeCSV(new Date(startTime))); //Add the start time of the stim. 
        sessionCSVDataRow.push(formatTimeCSV(new Date(stopTime))); //Add the stop time of the stim. 
        this.sessionCSVData.push(sessionCSVDataRow); //Push the row to the csvData array. 
    }

    //Method to update the sensor csvData array. 
    // updateSensorCSVData(id, state, round, oldStimType, oldStimValue) {
    updateSensorCSVData(id, state) {
        if (!this.sensorCSVData[id]) { //Initialize the csvData array if it does not exist. 
            this.sensorCSVData[id] = [];
        }
        
        for (let i = 0; i < state.stimEDATime.length; i++) { //Cycle through the entire temp array. 
            const sensorCSVDataRow = []; //Create an empty row array. 
            sensorCSVDataRow.push(state.stimEDATime[i]); //Add the time value.
            sensorCSVDataRow.push(state.stimEDAValues[i]); //Add the EDA value. 
            this.sensorCSVData[id].push(sensorCSVDataRow); //Push the row to the csvData array. 
        }
    }

    //Method to update the temporary buffer that stores the most recent time and EDA values.
    updateBuffer(value, now, id, connectionManager) {
        const state = connectionManager.getPortStates().get(id); //Get the ID for the port. 
        if (state) { 
            if (!state.stimEDAValues) {
                state.stimEDAValues = []; //Initialize the EDA buffer if it does not exist. 
            }
            if (!state.stimEDATime) {
                state.stimEDATime = []; //Initialize the time buffer if it does not exist. 
            }
            
            state.stimEDAValues.push(value); //Add the EDA value to the buffer. 
            state.stimEDATime.push(formatTimeCSV(new Date(now))); //Add the time value to the buffer. 
        }
    }

    //Method to update unified CSV data with all required columns
    updateUnifiedCSVData(value, now, id, connectionManager, stimAnalyzer) {
        if (!this.unifiedCSVData[id]) {
            this.unifiedCSVData[id] = [];
        }

        const unifiedCSVDataRow = [];
        unifiedCSVDataRow.push(formatTimeCSV(new Date(now))); // time
        unifiedCSVDataRow.push(value); // value
        unifiedCSVDataRow.push(this.currentGain); // gain
        unifiedCSVDataRow.push(this.currentOffset); // offset
        unifiedCSVDataRow.push(this.currentThreshold); // threshold
        unifiedCSVDataRow.push(this.currentDip); // dip
        unifiedCSVDataRow.push(this.currentPhase); // phase
        
        this.unifiedCSVData[id].push(unifiedCSVDataRow);

        // Reset the phase (since changes in gain/threshold/offset should only take one datapoint)
        if (this.currentPhase == 'manual-offset' || this.currentPhase == 'manual-gain' || this.currentPhase == 'manual-threshold') {
            this.currentPhase = 'game';
        }
    }

    //Methods to update current calibration values
    updateGain(gain) {
        this.currentGain = gain;
    }

    updateOffset(offset) {
        this.currentOffset = offset;
    }

    updateThreshold(threshold) {
        this.currentThreshold = threshold;
    }

    setPhase(phase) {
        this.currentPhase = phase;
    }

    setDip(dipValue) {
        this.currentDip = dipValue;
    }

    //Getter for session CSV data. 
    getSessionCSVData() {
        return this.sessionCSVData;
    }

    //Method to clear the session CSV data. 
    clearSessionCSVData() {
        this.sessionCSVData = {};
    }

    //Getter for sensor CSV data. 
    getSensorCSVData() {
        return this.sensorCSVData;
    }

    //Getter for unified CSV data
    getUnifiedCSVData() {
        return this.unifiedCSVData;
    }

    //Method to clear the sensor CSV data. 
    clearSensorCSVData() {
        this.sensorCSVData = {};
    }

    //Method to clear the unified CSV data
    clearUnifiedCSVData() {
        this.unifiedCSVData = {};
    }

    resetCurrentPhase() {
        this.currentPhase = 'auto-offset';
    }
}
