import { randomColor } from './utils.js';
let chart;
let autoscroll = true;
const AUTOSCROLL_WINDOW = 50;
const annotationColorDict = {};

export function initChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            //labels: [],
            datasets: [{
                label: 'EDA',
                data: [],
                pointRadius: 0,
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        boxHeight: 2,
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 16,
                        }
                    }
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
                }, 
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'second',
                    },
                }
            }, 
            maintainAspectRatio: false,
        }
    })
}

export function updateChart(value) {
    const now = Date.now();

    chart.data.datasets[0].data.push({ x: now, y: value})

    if (autoscroll) {
        const recentData = chart.data.datasets[0].data.slice(`-${AUTOSCROLL_WINDOW}`);
        //const recentData = chart.data.datasets[0].data.slice(-50);
        const minX = recentData[0].x;
        const maxX = recentData[recentData.length - 1].x;

        chart.options.scales.x.min = minX;
        chart.options.scales.x.max = maxX;
    }

    chart.update('none');
}

export function setAutoscroll(value) {
    autoscroll = value;
}

export function annotateChartWithStim(stim, color='random', startTime, stopTime) {
    if (!(stim in annotationColorDict)){
        if (color === 'random'){
            annotationColorDict[stim] = randomColor();
        } else {
            annotationColorDict[stim] = color;
        }
    }
    chart.options.plugins.annotation.annotations[`stim-${startTime}`] = {
        type: 'box',
        xMin: startTime,
        xMax: stopTime,
        backgroundColor: annotationColorDict[stim],
        label: {
            content: stim.split('\n'),
            enabled: true,
            position: 'center',
            textAlign: 'center',
            font: {
                size: 24,
                weight: 'bold',
            },
            color: '#000',
        },
    };
    chart.update();
}