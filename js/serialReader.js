// let port = null;
// let reader = null;
// let readableStreamClosed = null;

const ports = new Map();

// export async function requestPort() {
export async function connectPort(id) {
    const state = ports.get(id);
    if (state && state.port) {
        return null;
    }

    const port = await navigator.serial.requestPort();

    for (const [id, state] of ports.entries()) {
        if (state.port) {
            if (port === state.port) {
                return null;
            }
        }
    }
    
    ports.set(id, {
        port, 
        reader: null,
        readableStreamClosed: null,
        buffer: '',
    });
    return port;
}

export function disconnectPort(id) {
    ports.delete(id);
} 

export async function startSerial(id, onData) {
    const state = ports.get(id);
    if (!state || !state.port) throw new Error(`No port for ID ${id}`);

    await state.port.open({ baudRate: 9600 });

    const textDecoder = new TextDecoderStream();
    state.readableStreamClosed = state.port.readable.pipeTo(textDecoder.writable);

    const lineStream = textDecoder.readable
        .pipeThrough(new TransformStream({
            transform(chunk, controller) {
                state.buffer += chunk;
                let lines = state.buffer.split('\n');
                state.buffer = lines.pop();
                for (const line of lines) {
                    controller.enqueue(line.trim());
                }
            },
            flush(controller) {
                if (state.buffer) {
                    controller.enqueue(state.buffer.trim());
                }
            }
        }));

    state.reader = lineStream.getReader();

    //Set up writing
    const textEncoder = new TextEncoderStream();
    state.writableStreamClosed = textEncoder.readable.pipeTo(state.port.writable);
    state.writer = textEncoder.writable.getWriter();

    //Read loop
    (async () => {
        try {
            while (true) {
                const { value, done } = await state.reader.read();
                console.log(value);
                const now = Date.now();
                if (done) {
                    state.reader.releaseLock();
                    break;
                }
                // const number = parseInt(value, 10);
                const number = value;
                if (!isNaN(number)) {
                    onData(number, now, id);
                }
            }
        } catch (err) {
            console.error(`Error reading from port ${id}:`, err);
        }
    })();
}

// export async function stopSerial() {
export async function stopSerial(id) {
    const state = ports.get(id);
    if (!state || !state.port) throw new Error(`No port for ID ${id}`);
    
    // const textEncoder = new TextEncoderStream();
    // const writer = textEncoder.writable.getWriter();
    // const writableStreamClosed = textEncoder.readable.pipeTo(state.port.writable);

    // state.reader.cancel();
    await state.reader.cancel();
    await state.readableStreamClosed.catch(() => { /* Ignore the error */ });

    // writer.close();
    await state.writer.close();
    await state.writableStreamClosed;

    await state.port.close();
}

export async function resumeSerial(id, onData) {
    const state = ports.get(id);
    if (!state || !state.port) throw new Error(`No port for ID ${id}`);

    //const ports = await navigator.serial.getPorts();
    const availablePorts = await navigator.serial.getPorts();

    const matchingPort = availablePorts.find(p => p === state.port);

    // await port.open({ baudRate: 9600 });
    await matchingPort.open({ baudRate: 9600 });
    const textDecoder = new TextDecoderStream();
    // readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    state.readableStreamClosed = matchingPort.readable.pipeTo(textDecoder.writable);
    const lineStream = textDecoder.readable
        .pipeThrough(new TransformStream({
            transform(chunk, controller) {
                // buffer += chunk;
                state.buffer += chunk;
                // let lines = buffer.split('\n');
                let lines = state.buffer.split('\n');
                // buffer = lines.pop();
                state.buffer = lines.pop();
                for (const line of lines) {
                    controller.enqueue(line.trim());
                }
            },
            flush(controller) {
                // if (buffer) {
                if (state.buffer) {
                    // controller.enqueue(buffer.trim());
                    controller.enqueue(state.buffer.trim());
                }
            }
        }));

    // reader = lineStream.getReader();
    state.reader = lineStream.getReader();
    
    (async () => { 
        try {
            while (true) {
                // const { value, done } = await reader.read(); 
                const { value, done } = await state.reader.read(); 
                const now = Date.now();
                if (done) {
                    // reader.releaseLock();
                    state.reader.releaseLock();
                    break;
                }

                const text = value.trim();
                const number = parseInt(text, 10);
                if (!isNaN(number)) {
                    // onData(number, id);
                    onData(number, now, id);
                }
            }
        } catch (err) {
            console.error(`Error reading from port ${id}:`, err);
        }
    })();
}

export async function serialWrite(id, command) {
    const state = ports.get(id);
    if (!state || !state.port) throw new Error(`No port for ID ${id}`);

    // const encoded = new TextEncoder().encode(command);
    // await state.writer.write(encoded);
    await state.writer.write(command);
}

// let port = null;
// let reader = null;
// let readableStreamClosed = null;

// export async function requestPort() {
//     port = await navigator.serial.requestPort();
// }

// export async function startSerial(onData) {
//     await port.open({ baudRate: 9600 });

//     const textDecoder = new TextDecoderStream();
//     readableStreamClosed = port.readable.pipeTo(textDecoder.writable);

//     const lineStream = textDecoder.readable
//         .pipeThrough(new TransformStream({
//             transform(chunk, controller) {
//                 buffer += chunk;
//                 let lines = buffer.split('\n');
//                 buffer = lines.pop();
//                 for (const line of lines) {
//                     controller.enqueue(line.trim());
//                 }
//             },
//             flush(controller) {
//                 if (buffer) {
//                     controller.enqueue(buffer.trim());
//                 }
//             }
//         }));

//     let buffer = '';
//     reader = lineStream.getReader();

//     (async () => {
//         while (true) {
//             const { value, done } = await reader.read();
//             if (done) {
//                 reader.releaseLock();
//                 break;
//             }

//             const number = parseInt(value, 10);
//             if (!isNaN(number)) {
//                 onData(number);
//             }
//         }
//     })();
// }

// export async function stopSerial() {
//     const textEncoder = new TextEncoderStream();
//     const writer = textEncoder.writable.getWriter();
//     const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);

//     reader.cancel();
//     await readableStreamClosed.catch(() => { /* Ignore the error */ });

//     writer.close();
//     await writableStreamClosed;

//     await port.close();
// }

// export async function resumeSerial(onData) {
//     const ports = await navigator.serial.getPorts();
//     if(ports.length > 0) {
//         port = ports[0];
//         await port.open({ baudRate: 9600 });
//         const textDecoder = new TextDecoderStream();
//         readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
//         const lineStream = textDecoder.readable
//             .pipeThrough(new TransformStream({
//                 transform(chunk, controller) {
//                     buffer += chunk;
//                     let lines = buffer.split('\n');
//                     buffer = lines.pop();
//                     for (const line of lines) {
//                         controller.enqueue(line.trim());
//                     }
//                 },
//                 flush(controller) {
//                     if (buffer) {
//                         controller.enqueue(buffer.trim());
//                     }
//                 }
//             }));

//         let buffer = '';
//         reader = lineStream.getReader();
        
//         (async () => { 
//             while (true) {
//                 const { value, done } = await reader.read(); 
//                 if (done) {
//                     reader.releaseLock();
//                     break;
//                 }

//                 const text = value.trim();
//                 const number = parseInt(text, 10);
//                 if (!isNaN(number)) {
//                     onData(number);
//                 }
//             }
//         })();
//     }
// }