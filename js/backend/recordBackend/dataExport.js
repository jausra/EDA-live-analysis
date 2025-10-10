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

    //Method for generating the headers for the unified CSV files. 
    generateUnifiedCSVHeaders() {
        const baseColumns = ['time', 'value', 'gain', 'offset', 'threshold', 'dip', 'phase']; //Create the headers.
        return baseColumns.join(',') + '\n'; //Format the headers for CSV compatibility. 
    }

    //Method for generating the CSV structure with notes
    generateUnifiedCSVWithNotes(notes, headers, data) {
        let csvContent = '';
        csvContent += 'Notes\n'; // First row: Notes label
        csvContent += `"${notes.replace(/"/g, '""')}"\n`; // Second row: Notes content (escape quotes)
        csvContent += '\n'; // Third row: Empty row
        csvContent += headers; // Fourth row: Headers
        csvContent += data; // Fifth row onwards: Data
        return csvContent;
    }

    //Method for converting an array to CSV format. 
    arrayToCSV(data) {
        return data.map(row => 
            row.map(item => item).join(",") //Add "," between columns. 
        ).join("\n"); //Add newlines between rows. 
    }

    //Method for saving unified data
    async saveUnifiedData(sessionStartTime, unifiedCSVData) {
        try {
            // Get the notes from the textarea
            const notesTextarea = document.getElementById('notes-textarea');
            const notes = notesTextarea ? notesTextarea.value : '';
            
            const rootFolder = await window.showDirectoryPicker(); //Let the user select the folder they want to save the data in. 
            const sessionFolder = await rootFolder.getDirectoryHandle(sessionStartTime, { create: true }); //Create a sub-folder with the session time. 
            
            const unifiedCSVHeaders = this.generateUnifiedCSVHeaders();
            for (const [id, data] of Object.entries(unifiedCSVData)) {
                const dataCSV = this.arrayToCSV(data);
                const fullCSVContent = this.generateUnifiedCSVWithNotes(notes, unifiedCSVHeaders, dataCSV);
                
                const unifiedCSVName = `${sessionStartTime}_${id}_unified.csv`; //Name the unified CSV file. 
                const unifiedCSVFile = await sessionFolder.getFileHandle(unifiedCSVName, { create: true }); //Create the unified CSV file. 
                const writable = await unifiedCSVFile.createWritable(); //Create a writable stream to the file. 
                await writable.write(fullCSVContent); //Write the complete CSV content with notes
                await writable.close(); //Close the stream. 
            }
        } catch (error) {
            console.error("Error saving unified data:", error);
        }
    }

    //Method for saving data (legacy)
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
