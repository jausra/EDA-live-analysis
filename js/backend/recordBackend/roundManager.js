//Class to manage the rounds during stimulation. 
export class RoundManager {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.firstStimFlag = true;
        this.previousStartTime = null;
        this.previousStopTime = null;
        this.newRoundFlag = false;
        this.stateRound = 0;
        this.previousRound = -1;
        this.previousRoundStartTime = null;
        this.previousRoundStopTime = null;
        this.currentRoundStartTime = null;
        this.previousRoundAverageTime = null;
        this.oldStimType = ''; //Necessary when exporting to CSV and later importing the CSV
        this.currentStimType = '';
        this.oldStimValue = '';
        this.currentStimValue = '';
    }

    //Method for handling a new round. It updates the 'state.data.roundTimes' array. 
    handleNewRound(round, startTime) {
        if (round !== this.previousRound) { //Check if it is a new round. 
            this.previousRoundStartTime = this.currentRoundStartTime;
            this.currentRoundStartTime = startTime;
            this.previousRoundStopTime = startTime;
            
            if (round > 1) {
                //Find the timestamp associated with the round. 
                this.previousRoundAverageTime = (this.previousRoundStopTime - this.previousRoundStartTime) / 2 + this.previousRoundStartTime;
                
                for (const [id, state] of this.connectionManager.getPortStates().entries()) {
                    if (!state.data) { //If state.data does not exist, initialize it. 
                        state.data = {};
                    }
                    if (!state.data.roundTimes) { //If state.data.roundtimes does not exist, initialize it. 
                        state.data.roundTimes = [];
                    }
                    //Add the round time to state.data.roundtimes
                    state.data.roundTimes.push(this.previousRoundAverageTime);
                }
                
                this.newRoundFlag = true; //Set newRoundFlag to true, we will use it in handleGameStimulus. 
            }
            this.previousRound = round;
        }
    }

    handleGameStimulus(stim, round, color, startTime, stopTime, stimDisplay, stimAnalyzer, updateSigLineChartValue, updateSensorCSVData, updateSessionCSVData, annotateChartWithDelta, annotateChartWithStim) {
        this.handleNewRound(round, startTime); //Check if there's a new round. If so, mark its time. 
        this.getCurrentStim(stimDisplay);
        if (!this.firstStimFlag) { //Check if this isn't the very first stimulus. 
            const portDeltas = []; //Create an array for displaying the EDA delta on the serial chart.
            for (const [id, state] of this.connectionManager.getPortStates().entries()) {
                //updateCSVData(id, state, this.stateRound, this.oldStimType, this.oldStimValue);
                updateSessionCSVData(this.stateRound, this.oldStimValue, this.oldStimType, this.previousStartTime, this.previousStopTime);
                updateSensorCSVData(id, state);
                
                let edaDeltaDisplay = stimAnalyzer.analyzeStim( //Get the EDA delta and P-values for the most recent stim. 
                    id, 
                    this.stateRound, 
                    this.newRoundFlag, 
                    this.oldStimValue, 
                    updateSigLineChartValue
                );
                portDeltas.push({ id, delta: edaDeltaDisplay }); //Add the port ID and eda delta to portDeltas for display on the serial chart. 
                
                state.stimEDAValues = []; //Clear EDA value buffer. 
                state.stimEDATime = []; //Clear EDA time buffer. 
            }
            annotateChartWithDelta(portDeltas, this.currentStimValue, this.previousStartTime); //Add the deltas to the serial chart annotation. 
            this.oldStimType = this.currentStimType;
            this.oldStimValue = this.currentStimValue;
        } else { //Do nothing but update the stim if this is the first stim. 
            this.oldStimType = this.currentStimType;
            this.oldStimValue = this.currentStimValue;
            this.firstStimFlag = false;
        }
        
        // updateSessionCSVData(round, stim, this.currentStimType, startTime);
        annotateChartWithStim(stim, color, startTime, stopTime); //Add the stim name to the serial chart annotation. 
        this.previousStartTime = startTime;
        this.previousStopTime = stopTime;
        this.stateRound = round;
        this.newRoundFlag = false;
    }

    //Method to get the current stim based on whether it is a word or a shape. 
    getCurrentStim(stimDisplay) {
        if (typeof(stimDisplay.expandedValue[stimDisplay.index]) === 'string') {
            this.currentStimType = "Word";
            this.currentStimValue = stimDisplay.expandedValue[stimDisplay.index];
        } else if (typeof(stimDisplay.expandedValue[stimDisplay.index]) === 'object') {
            this.currentStimType = "Drawing";
            this.currentStimValue = `${stimDisplay.expandedValue[stimDisplay.index].color} ${stimDisplay.expandedValue[stimDisplay.index].shape}`;
        }
    }

    // Method to calculate deltas and statistics for imported data 
    handleImportedData(data, updateSigLineChartValue, stimAnalyzer, annotateChartWithDelta) {
        // Check the session data
        if (!data || !data.session.rounds || !data.session.stims || !data.session.types || !data.session.startTimes || !data.session.stopTimes) {
            console.warn('Invalid session data provided for analysis');
            return;
        }

        // Check the sensor data
        for (const sensorId in data.sensors) {
            const sensor = data.sensors[sensorId];
            if (!sensor || !sensor.times || !sensor.values) {
                console.warn('Invalid sensor data provided for analysis');
                return;
            }
        }

        this.resetParameters(); // Reset the parameters initialized in the constructor
        
        for (let i = 0; i < data.session.rounds.length; i++){ // Iterate through each stim
            const round = data.session.rounds[i];
            const stim = data.session.stims[i];
            const type = data.session.types[i];
            const startTime = data.session.startTimes[i];
            const stopTime = data.session.stopTimes[i];

            this.handleNewRound(round, startTime);

            const portDeltas = []; // Set portDeltas to be empty

            for (const sensorId in data.sensors) { //Cycle through each sensor CSV
                this.connectionManager.getPortStates().get(sensorId).stimEDATime = []; // Clear stimEDATime
                this.connectionManager.getPortStates().get(sensorId).stimEDAValues = []; // Clear stimEDAValues
                const sensor = data.sensors[sensorId];
                // Find all indices where the sensor time is within the current (session) round's start and stop time
                for (let j = 0; j < sensor.times.length; j++) {
                    const time = sensor.times[j];
                    if (time > startTime && time < stopTime) {
                        this.connectionManager.getPortStates().get(sensorId).stimEDATime.push(time); // Update stimEDATime with relevant values
                        this.connectionManager.getPortStates().get(sensorId).stimEDAValues.push(sensor.values[j]); // Update stimEDAValues with relevant values
                    }
                }

                let edaDeltaDisplay = stimAnalyzer.analyzeStim( //Get the EDA delta and P-values for the most recent stim. 
                    sensorId, 
                    round, 
                    this.newRoundFlag, 
                    stim, 
                    updateSigLineChartValue
                );

                portDeltas.push({ sensorId, delta: edaDeltaDisplay });

                annotateChartWithDelta(portDeltas, stim, startTime);

                // for (const [id, state] of this.connectionManager.getPortStates().entries()) {
                //     console.log(state);
                // }
            }

            // Add the deltas to the serial chart



            // for (const [id, state] of this.connectionManager.getPortStates().entries()) {
            //     const edaDelta = this.findMaxDelta(state.stimEDAValues);

            //     if (!state.data[stim]) { //If there is no object with the previous stim value as the key, initialize it. 
            //         state.data[oldStimValue] = { 
            //             datapoints: [],
            //             rounds: []
            //         };
            //     }

            //     state.data[oldStimValue].datapoints.push(edaDelta);
            //     state.data[oldStimValue].rounds.push(round);
            // }
        }

        for (const [id, state] of this.connectionManager.getPortStates().entries()) {
            console.log(state);
        }
        
    }

    // Method to reset the parameters initilized in the constructor
    resetParameters() {
        this.previousRound = -1;
        this.previousRoundStartTime = null;
        this.previousRoundStopTime = null;
        this.currentRoundStartTime = null;
        this.previousRoundAverageTime = null;
    }

    resetFirstStim() {
        this.firstStimFlag = true;
    }

    isFirstStim() {
        return this.firstStimFlag;
    }

    getOldStimType() {
        return this.oldStimType;
    }

    getCurrentStimType() {
        return this.currentStimType;
    }

    getOldStimValue() {
        return this.oldStimValue;
    }

    getCurrentStimValue() {
        return this.currentStimValue;
    }

    getStateRound() {
        return this.stateRound;
    }

    getNewRoundFlag() {
        return this.newRoundFlag;
    }
}
