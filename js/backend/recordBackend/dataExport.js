//Class for exporting data. 
export class DataExporter {

    //Method for generating the headers for the singular session CSV file. 
    generateSessionCSVHeaders() {
        const baseColumns = ['round', 'stim', 'type', 'start_time', 'stop_time']; //Create the headers.
        return baseColumns.join(',') + '\n'; //Format the headers for CSV compatibility. 
    }
    
    //Method for generating the headers for the sensor CSV files. 
    generateSensorCSVHeaders() {
        const baseColumns = ['time', 'value']; //Create the headers.
        return baseColumns.join(',') + '\n'; //Format the headers for CSV compatibility. 
    }

    //Method for converting an array to CSV format. 
    arrayToCSV(data) {
        return data.map(row => 
            row.map(item => item).join(",") //Add "," between columns. 
        ).join("\n"); //Add newlines between rows. 
    }

    //Method for saving data
    async saveData(sessionStartTime, sessionCSVData, sensorCSVData, connectionManager) {
        try {
            const rootFolder = await window.showDirectoryPicker(); //Let the user select the folder they want to save the data in. 
            const sessionFolder = await rootFolder.getDirectoryHandle(sessionStartTime, { create: true }); //Create a sub-folder with the session time. 
            
            const sessionCSVHeaders = this.generateSessionCSVHeaders();
            const sessionCSVName = `${sessionStartTime}_session.csv`; //Name the session CSV file. 
            const sessionCSVFile = await sessionFolder.getFileHandle(sessionCSVName, { create: true }); //Create the session CSV file. 
            const writable = await sessionCSVFile.createWritable(); //Create a writable stream to the file. 
            await writable.write(sessionCSVHeaders); //Add the headers. 
            await writable.write(this.arrayToCSV(sessionCSVData)); //Add the session data. 
            await writable.close(); //Closer the stream. 

            const sensorCSVHeaders = this.generateSensorCSVHeaders();
            for (const [id, state] of connectionManager.getPortStates().entries()) {
                const sensorCSVName = `${sessionStartTime}_${id}.csv`; //Name the sensor CSV file. 
                const sensorCSVFile = await sessionFolder.getFileHandle(sensorCSVName, { create: true }); //Create the sensor CSV file. 
                const writable = await sensorCSVFile.createWritable(); //Create a writable stream to the file. 
                await writable.write(sensorCSVHeaders); //Add the headers. 
                await writable.write(this.arrayToCSV(sensorCSVData[id])); //Add the sensor data. 
                await writable.close(); //Closer the stream. 
            }
        } catch (error) {
            console.error("Error saving data:", error);
        }
    }
}
