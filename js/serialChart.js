import { randomColor } from './utils.js';
let chart;
let autoscroll = true;
const AUTOSCROLL_WINDOW = 50;

export const annotationColorDict = {};

export function initSerialChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
        ]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        onPan: () => { 
                            autoscroll = false;
                         },
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true,
                        },
                        mode: 'x',
                        onZoom: () => { 
                            autoscroll = false;
                        },
                    },
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (HH:MM:SS)',
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 16,
                        },
                    },
                    ticks: {
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 14,
                        },
                    },
                    type: 'time',
                    time: {
                        unit: 'second',
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    position: 'left',
                    title: {
                        display: true,
                        text: 'EDA Value (Port 1)',
                        color: 'purple',
                        font: {
                            weight: 'bold',
                            size: 16,
                        }
                    },
                    ticks: {
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 14,
                        }
                    },
                },
            }, 
            maintainAspectRatio: false,
        },
        plugins: [{
            id: 'hideLabel',
            afterDraw(chart) {
                const annotations = chart.options.plugins.annotation?.annotations;
                if (!annotations) return;

                const xScale = chart.scales.x;
                const chartLeft = chart.chartArea.left;

                for (const [key, annotation] of Object.entries(annotations)) {
                    const boxLeft = xScale.getPixelForValue(annotation.xMin);

                    if(boxLeft < chartLeft) {
                        annotation.label.color = 'rgba(0,0,0,0)';
                    } else {
                        annotation.label.color = '#000';
                    }
                }
            }
        }]
    })
}

export function updateSerialChart(value, now, id) {
    // const now = Date.now();

    let dataset = chart.data.datasets.find(ds => ds.label === id);

    dataset.data.push({ x: now, y: value });

    if (autoscroll) {
        const maxX = Date.now();
        const minX = maxX - 5000;

        chart.options.scales.x.min = minX;
        chart.options.scales.x.max = maxX;
    }

    chart.update('none');
}

export function setAutoscroll(value) {
    autoscroll = value;
}

let previousStartTime;

export function annotateChartWithStim(stim, color='random', startTime, stopTime) {
    if (!(stim in annotationColorDict)){
        if (color === 'random'){
            annotationColorDict[stim] = randomColor();
        } else {
            annotationColorDict[stim] = color;
        }
    }
    chart.options.plugins.annotation.annotations[`stim-${startTime}`] = {
        //drawTime: 'beforeDraw',
        type: 'box',
        xMin: startTime,
        xMax: stopTime,
        backgroundColor: annotationColorDict[stim],
        label: {
            content: stim.split('\n'),
            enabled: true,
            //position: 'center',
            position: 'start',
            textAlign: 'left',
            font: {
                size: 24,
                weight: 'bold',
            },
            color: 'blue',
            clip: true,
            //z: 0
        },
    };
    previousStartTime = startTime;
    chart.update();
}

export function annotateChartWithDelta(portDeltas, stim, previousStartTime) {
    const key = `stim-${previousStartTime}`;
    const annotation = chart.options.plugins.annotation.annotations[key];
    if (!annotation) return;

    for (const {id, delta} of portDeltas) {
        if (id === 'sensor1') {
            annotation.label.content.push(`1: ${delta}`);
        } else {
            annotation.label.content.push(`2: ${delta}`);
        }
    }
    chart.update();
}



export function clearSerialChart(id) {
    let dataset = chart.data.datasets.find(ds => ds.label === id);

    if (!dataset) {
        const multiplePorts = chart.data.datasets.length > 0;

        if (multiplePorts && !chart.options.scales.y2) {
            chart.options.scales.y2 = {
                position: 'right',
                title: {
                    display: true,
                    text: 'EDA Value (Port 2)',
                    color: 'green',
                    font: {
                        weight: 'bold',
                        size: 16,
                    }
                },
                ticks: {
                    color: '#000',
                    font: {
                        weight: 'bold',
                        size: 14,
                    }
                },
            }
        }

        dataset = {
            label: id,
            data: [],
            pointRadius:0,
            borderColor: id === 'sensor1' ? 'purple' : 'green', 
            backgroundColor: id === 'sensor1' ? 'purple' : 'green',
            yAxisID: id === 'sensor1' ? 'y' : 'y2'
        };
        chart.data.datasets.push(dataset);
    }
    
    dataset.data = []

    if(chart.options.plugins.annotation.annotations) {
        chart.options.plugins.annotation.annotations = {}; //update to include ID 
    }

    chart.update();
}