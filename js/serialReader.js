export async function startSerial(onData) {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
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
}