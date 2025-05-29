let port = null;
let reader = null;
let readableStreamClosed = null;

export async function startSerial(onData) {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    const textDecoder = new TextDecoderStream();
    readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    reader = textDecoder.readable.getReader();
    (async () => { 
        while (true) {
            const { value, done } = await reader.read(); 
            if (done) {
                reader.releaseLock();
                break;
            }

            const text = value.trim();
            const number = parseInt(text, 10);
            if (!isNaN(number)) {
                onData(number);
            }
        }
    })();
}

export async function stopSerial() {
    const textEncoder = new TextEncoderStream();
    const writer = textEncoder.writable.getWriter();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);

    reader.cancel();
    await readableStreamClosed.catch(() => { /* Ignore the error */ });

    writer.close();
    await writableStreamClosed;

    await port.close();
}