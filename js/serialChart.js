//import 'chartjs-adapter-date-fns';
let chart;
let autoscroll = true;
const AUTOSCROLL_WINDOW = 50;

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

    // console.log(`autoscroll: ${autoscroll}`);

    if (autoscroll) {
        //const recentData = chart.data.datasets[0].data.slice(`-${AUTOSCROLL_WINDOW}`);
        const recentData = chart.data.datasets[0].data.slice(-50);
        const minX = recentData[0].x;
        const maxX = recentData[recentData.length - 1].x;

        chart.options.scales.x.min = minX;
        chart.options.scales.x.max = maxX;
    }

    chart.update('none');

    // if (chart.data.labels.length > 50) {
    //     chart.data.labels.shift();
    //     chart.data.datasets[0].data.shift();
    // }
}

export function setAutoscroll(value) {
    autoscroll = value;
}

export function annotateChartWithStim(stim, startTime, stopTime) {
    chart.options.plugins.annotation.annotations[`stim-${startTime}`] = {
        type: 'box',
        xMin: startTime,
        xMax: stopTime,
        backgroundColor: 'rgba(127, 127, 255, 0.2)',
        label: {
            content: stim,
            enabled: true,
            position: center,
        },
    };
    chart.update();
}