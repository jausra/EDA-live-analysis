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
    console.log("after connection:")
    console.log(ports)
    return port;
}

export function disconnectPort(id) {
    ports.delete(id);
    console.log("after disconnection:")
    console.log(ports)
} 

// export async function startSerial(onData) {
export async function startSerial(id, onData) {
    const state = ports.get(id);
    if (!state || !state.port) throw new Error(`No port for ID ${id}`);

    // await port.open({ baudRate: 9600 });
    await state.port.open({ baudRate: 9600 });

    const textDecoder = new TextDecoderStream();
    // readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    state.readableStreamClosed = state.port.readable.pipeTo(textDecoder.writable);

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

    // let buffer = '';
    // reader = lineStream.getReader();
    state.reader = lineStream.getReader();

    (async () => {
        try {
            while (true) {
                // const { value, done } = await reader.read();
                const { value, done } = await state.reader.read();
                if (done) {
                    // reader.releaseLock();
                    state.reader.releaseLock();
                    break;
                }

                const number = parseInt(value, 10);
                if (!isNaN(number)) {
                    onData(number, id);
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
    
    const textEncoder = new TextEncoderStream();
    const writer = textEncoder.writable.getWriter();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);

    // reader.cancel();
    state.reader.cancel();
    // await readableStreamClosed.catch(() => { /* Ignore the error */ });
    await state.readableStreamClosed.catch(() => { /* Ignore the error */ });

    writer.close();
    await writableStreamClosed;

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
                if (done) {
                    // reader.releaseLock();
                    state.reader.releaseLock();
                    break;
                }

                const text = value.trim();
                const number = parseInt(text, 10);
                if (!isNaN(number)) {
                    onData(number, id);
                }
            }
        } catch (err) {
            console.error(`Error reading from port ${id}:`, err);
        }
    })();
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