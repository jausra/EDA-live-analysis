//Class to store take incoming EDA data and save it to temporary and long-term arrays. 
export class DataProcessor {
    constructor() {
        this.sessionCSVData = [];
        this.sensorCSVData = {};
    }

    updateSessionCSVData(round, stim, type, startTime, stopTime) {
        if (!this.sessionCSVData) { //Initialize the session csvData array if it does not exist. 
            this.sessionCSVData = [];
        }
        
        const sessionCSVDataRow = []; //Create an empty row array. 
        sessionCSVDataRow.push(round); //Add the round. 
        sessionCSVDataRow.push(stim); //Add the stim. 
        sessionCSVDataRow.push(type); //Add the type of the stim ('Word' or 'Drawing'). 
        sessionCSVDataRow.push(this.formatTimeCSV(new Date(startTime))); //Add the start time of the stim. 
        sessionCSVDataRow.push(this.formatTimeCSV(new Date(stopTime))); //Add the stop time of the stim. 
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
            state.stimEDATime.push(this.formatTimeCSV(new Date(now))); //Add the time value to the buffer. 
        }
    }

    //Method to format the time the EDA value was received. Format is 'YYYY-MM-DD HH:mm:SS.sss'.
    formatTimeCSV(date) {
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0') + ' ' +
            String(date.getHours()).padStart(2, '0') + ':' +
            String(date.getMinutes()).padStart(2, '0') + ':' +
            String(date.getSeconds()).padStart(2, '0') + '.' +
            String(date.getMilliseconds()).padStart(3, '0');
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

    //Method to clear the sensor CSV data. 
    clearSensorCSVData() {
        this.sensorCSVData = {};
    }
}
