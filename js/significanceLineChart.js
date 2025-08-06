import { annotationColorDict } from './serialChart.js';

let chart;

export function initSigLineChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    chart = new Chart(ctx, {
        type: 'line', 
        data: {
            datasets: []
        },
        options: {
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
                        text: 'P-Value',
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
                },
            },
        },
    });
}

function forceAlphaToOne(color) {
    return color.replace(/rgba?\((\d+), ?(\d+), ?(\d+)(?:, ?[\d.]+)?\)/, 'rgba($1, $2, $3, 1)');
}

export function updateSigLineChart(value, time, id) {
    const stimColor = forceAlphaToOne(annotationColorDict[id]);
    let dataset = chart.data.datasets.find(ds => ds.label === id);

    if (!dataset) {
        dataset = {
            label: id,
            data: [],
            pointBackgroundColor: stimColor, 
            pointBorderColor: stimColor,
            borderColor: stimColor,
            backgroundColor: stimColor,
        };
        chart.data.datasets.push(dataset);
    }

    dataset.data.push({ x: time, y: value });

    chart.update('none');
}

export function clearSigLineChart() {}