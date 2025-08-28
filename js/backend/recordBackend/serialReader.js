const ports = new Map(); //Map to store connection states by ID.

//Function to connect to a serial port using Web Serial API.
export async function connectPort(id) {
    const state = ports.get(id); //Get the connection state 'state' associated with 'id' from the Map 'ports'.
    if (state && state.port) { //If 'state' already has a 'port', return 'null', since we are already connected.
        return null;
    }

    //Opens the browser's serial port chooser dialog. User selects a connected serial device. 'port' is a 'SerialPort' object.
    const port = await navigator.serial.requestPort(); 

    for (const [id, state] of ports.entries()) { //Loops through all entries in the ports map.
        if (state.port) { //Checks if there is a 'port' for the 'state' of each 'ports' entry.
            if (port === state.port) { //Check if the user-selected port matches the port of the 'state'.
                return null; //Return null to indicate the user-selected port is already in use. 
            }
        }
    }
    
    //Store the new connection as a 'id' and 'state' key-value pair. 
    ports.set(id, {
        port, //The user-selected 'SerialPort' object. 
        reader: null, //This will be set later when we start reading from the port.
        readableStreamClosed: null, //Stores a promise that resolves when the reading stops. 
        buffer: '', //Stores incoming serial data chunks until they're processed. 
    });
    return port; //Let's the user start working with the newly opened 'SerialPort' object. 
}

//Function to remove the entry from the 'ports' Map that has 'id' as its key. 
export function disconnectPort(id) {
    ports.delete(id);
} 

async function setupSerialStreams(port, state, onData, id) {
    await port.open({ baudRate: 9600 }); //Open the serial connection at 9600 baud. 

    const textDecoder = new TextDecoderStream();//Create a TextDecoderStream to turn incoming bytes into readable text.
    //Connect the port's readable stream to the textDecoder's writable end. 
    // Saves the promise 'readableStreamClosed' so you can track when the stream stops.  
    state.readableStreamClosed = port.readable.pipeTo(textDecoder.writable);

    //Pipe the decoded text through a custom TransformStream. 
    const lineStream = textDecoder.readable.pipeThrough(new TransformStream({
        transform(chunk, controller) {
            state.buffer += chunk; //Add each chunk to a buffer. 
            let lines = state.buffer.split('\n'); //Split state.buffer on a newline '\n'.
            state.buffer = lines.pop(); //Keeps any incomplete lines in state.buffer until another line arrives. 
            for (const line of lines) {
                controller.enqueue(line.trim()); //Send out the completed lines. 
            }
        },
        flush(controller) {
            if (state.buffer) {
                controller.enqueue(state.buffer.trim());
            }
        }
    }));

    state.reader = lineStream.getReader(); //Create a reader for pulling data out of 'lineStream'. 

    //Read loop. 
    (async () => {
        try {
            while (true) {
                const { value, done } = await state.reader.read(); //Wait for data from 'state.reader'.
                const now = Date.now(); //Get the datetime at the time of the read. 
                if (done) { //If done reading, break out of the loop. 
                    state.reader.releaseLock();
                    break;
                }

                if (!isNaN(value)) {
                    onData(value, now, id); //Call the onData callback. 
                }
            }
        } catch (err) {
            console.error(`Error reading from port ${id}:`, err);
        }
    })();
}

export async function startSerial(id, onData) {
    const state = ports.get(id);//Gets the connection state for 'id'.
    //If the connection state 'state' does not exist, or the 'SerialPort' object of state does not exist, exit the funtion.
    if (!state || !state.port) throw new Error(`No port for ID ${id}`);

    await setupSerialStreams(state.port, state, onData, id);

    //Set up writing.
    const textEncoder = new TextEncoderStream();//Create a new TextEncoderStream to turn outgoing text into bytes. 
    //'textEncoder.readable' emits bytes that are then piped to the serial port's input stream 'state.port.writable'. 
    // The returned promise is stored in 'state.writableStreamClosed' so you can later await it if you need to know when writing is done. 
    state.writableStreamClosed = textEncoder.readable.pipeTo(state.port.writable);
    state.writer = textEncoder.writable.getWriter();//Create 'state.writer' to feed it strings that will then be sent out. 
}

//Function to stop reading, stop writing, and close the port. 
export async function stopSerial(id) {
    const state = ports.get(id);//Gets the connection state for 'id'.
    //If the connection state 'state' does not exist, or the 'SerialPort' object of state does not exist, exit the funtion.
    if (!state || !state.port) throw new Error(`No port for ID ${id}`);

    await state.reader.cancel(); //Tells the reader loop to stop immediately.
    await state.readableStreamClosed.catch(() => {}); //Waits until readable stream pipeline has shut down, ignores the error. 

    await state.writer.close(); //Close the serial writer. 
    await state.writableStreamClosed; //Waits until the writable pipeline completely shuts down. 

    await state.port.close(); //Physically closes the connection to the hardware. 
}

export async function resumeSerial(id, onData) {
    const state = ports.get(id);//Gets the connection state for 'id'.
    //If the connection state 'state' does not exist, or the 'SerialPort' object of state does not exist, exit the funtion.
    if (!state || !state.port) throw new Error(`No port for ID ${id}`);

    //Returns a Promise that resolves into an array of currently available serial ports that the user has granted access to. 
    const availablePorts = await navigator.serial.getPorts();
    const matchingPort = availablePorts.find(p => p === state.port); //Searches for 'state.port' amongst the currently available ports. 
    if (!matchingPort) throw new Error(`Port not found for ID ${id}`);

    await setupSerialStreams(matchingPort, state, onData, id);
}

//Function that writes a command to the port with ID 'id'.
export async function serialWrite(id, command) {
    const state = ports.get(id);//Gets the connection state for 'id'.
    //If the connection state 'state' does not exist, or the 'SerialPort' object of state does not exist, exit the funtion.
    if (!state || !state.port) throw new Error(`No port for ID ${id}`);
    await state.writer.write(command); //Uses the previously created TextEncoderStream writer 'state.writer' to write the command string to the serial port. 
}