import { initSerialChart, clearSerialChart, setSerialChartXRange, updateSerialChartArray, annotateChartWithImportedSession, annotateChartWithDelta } from "../../frontend/recordFrontend/serialChart.js";
import { updateSigLineChartValue } from "../../frontend/recordFrontend/significanceLineChart.js";

// Class for importing data
export class DataImporter {

    constructor(connectionManager, roundManager, stimAnalyzer) {
        this.connectionManager = connectionManager;
        this.roundManager = roundManager;
        this.stimAnalyzer = stimAnalyzer;
        // Store imported data as properties
        this.importedData = {
            session: null,
            sensors: {}
        };
    }

    async importData(event) {

        const files = event.target.files; // User will select the folder containing the CSV files
        if (!files || files.length === 0) return; // Check that the folder contains files

        // clearSerialChart(this.connectionManager); // Clear the graph if there is any old data on it

        // Reset imported data 
        this.importedData = {
            session: null,
            sensors: {}
        };

        // First pass: find and process session file
        for (const file of files) {
            if (!file.name.endsWith(".csv")) continue;
            if (file.name.includes("_session.csv")) {

                await this.processSessionFile(file);
                // Annotate the chart with the imported session data
                
                if (this.importedData.session) {
                    // Set the x min and max for the chart
                    let xMin = this.importedData.session.startTimes[0]; 
                    let xMax = this.importedData.session.stopTimes[this.importedData.session.stopTimes.length - 1];
                    setSerialChartXRange(xMin, xMax);
                    
                    annotateChartWithImportedSession(this.importedData.session);
                }
                break;
            }
        }

        // Second pass: process sensor files
        for (const file of files) {
            if (!file.name.endsWith(".csv")) continue;
            
            if (file.name.includes("_sensor")) {
                await this.processSensorFile(file);
            }
        }

        this.roundManager.handleImportedData(this.importedData, updateSigLineChartValue, this.stimAnalyzer, annotateChartWithDelta);
    }

    // Method for extracting the data from the session file 
    async processSessionFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const csvText = e.target.result;
                const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
                const headers = lines[0].split(',');

                // Create array of row objects
                const data = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const row = {};
                    headers.forEach((header, i) => {
                        row[header.trim()] = values[i]?.trim();
                    });
                    return row;
                });

                // Extract specific columns
                const roundArray = data.map(row => parseInt(row.round));
                const stimArray = data.map(row => row.stim?.trim());
                const typeArray = data.map(row => row.type?.trim());
                const startTimeArray = data.map(row => new Date(row.start_time).getTime());
                const stopTimeArray = data.map(row => new Date(row.stop_time).getTime());

                // Store session data
                this.importedData.session = {
                    rounds: roundArray,
                    stims: stimArray,
                    types: typeArray,
                    startTimes: startTimeArray,
                    stopTimes: stopTimeArray,
                };

                resolve();
            };

            reader.readAsText(file);
        });
    }

    // Method for extracting the data from each sensor file 
    async processSensorFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const csvText = e.target.result;
                const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
                const headers = lines[0].split(',');

                //Create array of row objects.
                const data = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const row = {};
                    headers.forEach((header, i) => {
                        row[header.trim()] = values[i]?.trim();
                    });
                    return row;
                });

                // Extract sensor data
                const timeArray = data.map(row => new Date(row.time).getTime());
                const valueArray = data.map(row => parseFloat(row.value));

                // Extract sensor ID from filename
                const sensorId = this.extractSensorIdFromFilename(file.name);
                this.connectionManager.ensurePortState(sensorId); // Need to add state to port states
                
                // Store sensor data
                this.importedData.sensors[sensorId] = {
                    times: timeArray,
                    values: valueArray,
                };
                
                updateSerialChartArray(valueArray, timeArray, sensorId); // Plot the sensor data in the serial chart
                resolve();
            };

            reader.readAsText(file);
        });
    }

    // Method for getting the device ID from the filename.
    extractIdFromFilename(filename) {
        const base = filename.replace(".csv", ""); //Remove ".csv" from the end of the filename. 

        const parts = base.split("_"); //Split on "_".

        return parts[parts.length - 1]; //Get the device ID from the last value of the parts array. 
    }

    // Method for extracting sensor ID from sensor filename
    extractSensorIdFromFilename(filename) {
        const base = filename.replace(".csv", "");
        const parts = base.split("_");
        return parts[parts.length - 1]; // Returns "sensor1", "sensor2", etc.
    }

    // Method for plotting the imported data on the serial chart.
    plotImportedSerialData(id, timeArray, valueArray) {
        
        // for (const [id, state] of this.connectionManager.getPortStates().entries()) {
        // }
        
        
    }

    // Method for annotating the imported serial data. 
    annotateImportedSerialData(id){
        
    }

    // Getter methods to access imported data.
    getSessionData() {
        return this.importedData.session;
    }

    getSensorData(sensorId) {
        return this.importedData.sensors[sensorId];
    }

    getAllSensorData() {
        return this.importedData.sensors;
    }

    getAllImportedData() {
        return this.importedData;
    }
}