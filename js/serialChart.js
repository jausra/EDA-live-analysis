import { randomColor } from './utils.js';
let chart;
let autoscroll = true;
const AUTOSCROLL_WINDOW = 50;
const annotationColorDict = {};

export function initSerialChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
            //     {
            //     label: 'EDA',
            //     data: [],
            //     pointRadius: 0,
            // }
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
                    title: {
                        display: true,
                        text: 'EDA Value (ADC)',
                        color: '#000',
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

// export function updateSerialChart(value) {
export function updateSerialChart(value, id) {
    const now = Date.now();

    let dataset = chart.data.datasets.find(ds => ds.label === id);

    if (!dataset) {
        dataset = {
            label: id,
            data: [],
            pointRadius:0,
        };
        chart.data.datasets.push(dataset);
    }

    // chart.data.datasets[0].data.push({ x: now, y: value});

    dataset.data.push({ x: now, y: value })

    if (autoscroll) {
        // const recentData = chart.data.datasets[0].data.slice(`-${AUTOSCROLL_WINDOW}`);
        // const minX = recentData[0].x;
        // const maxX = recentData[recentData.length - 1].x;
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
            color: '#000',
            clip: true,
            //z: 0
        },
    };
    previousStartTime = startTime;
    chart.update();
}

export function annotateChartWithDelta(edaDelta) {
    if (`stim-${previousStartTime}` in chart.options.plugins.annotation.annotations) {
        const label = chart.options.plugins.annotation.annotations[`stim-${previousStartTime}`].label;

        label.content = [label.content, edaDelta];
        
        chart.update();
    }
}

export function clearSerialChart() {
    chart.data.datasets[0].data = [];
    chart.options.plugins.annotation.annotations = {};
    chart.update();
}