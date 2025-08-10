import { annotationColorDict } from './serialChart.js';

let chart;

//Function to initialize the P-value vs time plot
export function initSigLineChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d'); //Gets the drawing surface for 2D graphics.
    chart = new Chart(ctx, {
        type: 'line', //Line graph.
        data: { datasets: [] }, //Starts off with empty dataset array.
        options: {
            scales: {
                x: {
                    title: { //Add the x-axis title.
                        display: true,
                        text: 'Time (HH:MM:SS)',
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 16,
                        },
                    },
                    ticks: { //Add the x-axis ticks.
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 14,
                        },
                    },
                    type: 'time', //Enables parsing of time values and formatting of labels.
                    time: { //Set each tick mark one second apart.
                        unit: 'second',
                    },
                    grid: { //Turn off the grid lines for the x-axis.
                        display: false
                    }
                }, 
                y: {
                    position: 'left', //Put the y-axis on the left of the graph.
                    title: { //Add the y-axis title.
                        display: true,
                        text: 'P-Value',
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 16,
                        }
                    },
                    ticks: { //Add the y-axis ticks.
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 14,
                        }
                    },
                    min: 0,
                    max: 1,
                },
            },
        },
    });
}

//Function to set the alpha value of the rgba color to 1.0.
function forceAlphaToOne(color) {
    return color.replace(/rgba?\((\d+), ?(\d+), ?(\d+)(?:, ?[\d.]+)?\)/, 'rgba($1, $2, $3, 1)');
}

//Function to add a single data point ('value') at time 'time' for a given plot with label 'id'.
export function updateSigLineChart(value, time, id) {
    const stimColor = forceAlphaToOne(annotationColorDict[id]); //Get the color for the stim.
    
    //See if the key 'id' exists in the dataset array. If not, initialize it. 
    let dataset = chart.data.datasets.find(ds => ds.label === id);
    if (!dataset) {
        dataset = {
            label: id,
            data: [],
            pointBackgroundColor: stimColor, //Data point fill color.
            pointBorderColor: stimColor, //Data point border color. 
            borderColor: stimColor, //Legend border color.
            backgroundColor: stimColor, //Legend fill color.
        };
        chart.data.datasets.push(dataset);
    }

    dataset.data.push({ x: time, y: value }); //Encapsulate the time and P-value into an object and push it to the dataset's data array.

    chart.update('none');
}

export function clearSigLineChart() {}