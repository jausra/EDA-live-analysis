import CreateStimObject from './backend/stimBackend/stimObject.js';
// import StimManager from './backend/stimBackend/stimManager.js';
import StimPresets from './backend/stimBackend/stimPresets.js';
import CreateStimDisplay from './frontend/stimFrontend/stimDisplay.js';
import { initSerialChart, updateSerialChartValue, annotateChartWithStim, annotateChartWithDelta } from './frontend/recordFrontend/serialChart.js';
import { initSigLineChart, updateSigLineChartValue, updateSigLineChartArray } from './frontend/recordFrontend/significanceLineChart.js';
import { ConnectionManager } from './backend/recordBackend/connectionManager.js';
import { CalibrationManager } from './backend/recordBackend/calibration.js';
import { SessionManager } from './backend/sessionManager.js';
import { DataImporter } from './backend/recordBackend/dataImport.js';
import { DataExporter } from './backend/recordBackend/dataExport.js';
import { UIHandlers } from './frontend/uiHandlers.js';
import { StimAnalyzer } from './backend/recordBackend/stimAnalyzer.js';
import { RoundManager } from './backend/recordBackend/roundManager.js';
import { DataProcessor } from './backend/recordBackend/dataProcessor.js';
import { ChartControls } from './frontend/recordFrontend/chartControls.js';

//Record Backend. 
const connectionManager = new ConnectionManager();
const dataExporter = new DataExporter();
const dataProcessor = new DataProcessor();
const stimAnalyzer = new StimAnalyzer(connectionManager, dataProcessor);
const roundManager = new RoundManager(connectionManager);
const dataImporter = new DataImporter(connectionManager, roundManager, stimAnalyzer);

//Stim Backend. 
const stimObject = new CreateStimObject('random');
// const stimManager = new StimManager(stimObject);
const stimPresets = new StimPresets(stimObject);

//Record Frontend.
const chartControls = new ChartControls(stimAnalyzer, connectionManager, updateSigLineChartArray);
initSerialChart('serialChart');
initSigLineChart('sigLineChart');

//Stim Frontend.
const stimDisplay = new CreateStimDisplay(stimObject);

//Record/Stim Backend.
const sessionManager = new SessionManager(stimDisplay, connectionManager, roundManager, stimAnalyzer, dataProcessor);
const calibrationManager = new CalibrationManager(connectionManager, sessionManager, stimPresets, stimDisplay, roundManager, stimAnalyzer, dataProcessor);

//Record/Stim Frontend.
// const uiHandlers = new UIHandlers(sessionManager, dataImporter, dataExporter, stimDisplay, connectionManager, calibrationManager, stimManager, stimPresets, dataProcessor);
const uiHandlers = new UIHandlers(sessionManager, dataImporter, dataExporter, stimDisplay, connectionManager, calibrationManager, stimPresets, stimAnalyzer, dataProcessor);

//Function to be called every time we record new data for calibration. 
function updateInterfaceCal(value, now, id) {
    updateSerialChartValue(value, now, id);
    dataProcessor.updateBuffer(value, now, id, connectionManager);
    dataProcessor.updateUnifiedCSVData(value, now, id, connectionManager, stimAnalyzer);
}
window.updateInterfaceCal = updateInterfaceCal;

//Function to be called every time we record new data for the game. 
function updateInterfaceGame(value, now, id) {
    updateSerialChartValue(value, now, id);
    dataProcessor.updateBuffer(value, now, id, connectionManager);
    stimAnalyzer.analyzeIncomingDatapoint(value, now, id, connectionManager);
    dataProcessor.updateUnifiedCSVData(value, now, id, connectionManager, stimAnalyzer);
}
window.updateInterfaceGame = updateInterfaceGame;

//Function to be called every time we have a new stim. 
// stimDisplay.onStimDisplay(({ stim, round, color, startTime, stopTime }) => {
//     roundManager.handleStimulus(
//         stim, 
//         round, 
//         color, 
//         startTime, 
//         stopTime,
//         stimDisplay, 
//         stimAnalyzer, 
//         updateSigLineChartValue, 
//         (id, state) => dataProcessor.updateSensorCSVData(id, state),
//         (round_, stim_, type_, startTime_, stopTime_) => dataProcessor.updateSessionCSVData(round_, stim_, type_, startTime_, stopTime_),
//         annotateChartWithDelta, 
//         annotateChartWithStim
//     );
// });

//window.csvData = dataProcessor.getCSVData();
window.mergedData = stimAnalyzer.getMergedData();
