import { annotationColorDict } from './serialChart.js';
let autoscroll = true;
let chart;
let autoscrollWindow = 5;

//Function to initialize the P-value vs time plot
export function initSigLineChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d'); //Gets the drawing surface for 2D graphics.
    chart = new Chart(ctx, {
        type: 'line', //Line graph.
        data: { datasets: [] }, //Starts off with empty dataset array.
        options: {
            plugins: {
                // legend: { display: false }, //Turn off the legend.
                zoom: {
                    pan: { //Enables pan along the x-axis.
                        enabled: true,
                        mode: 'x',
                        onPan: () => { //If panning, turn off autoscroll.
                            autoscroll = false;
                        },
                    },
                    zoom: { //Enables zooming on the x-axis.
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true,
                        },
                        mode: 'x',
                        onZoom: () => { //If zooming, turn off autoscroll.
                            autoscroll = false;
                        },
                    },
                }
            },
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
            maintainAspectRatio: false, //The height to width ratio of the graph is not stagnant.
        },
    });
}

//Function to set the alpha value of the rgba color to 1.0.
function forceAlphaToOne(color) {
    return color.replace(/rgba?\((\d+), ?(\d+), ?(\d+)(?:, ?[\d.]+)?\)/, 'rgba($1, $2, $3, 1)');
}

//Function for getting or creating the dataset for a given port ID. 
function getDataset(id) {
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

    return dataset;
}

//Function to add a single data point ('value') at time 'time' for a given plot with label 'id'.
// Number of rounds to show when autoscroll is enabled
let visibleData = [];
export function updateSigLineChartValue(value, time, id) {
    let dataset = getDataset(id); // Find or create the dataset with label 'id'.

    dataset.data.push({ x: time, y: value }); // Add the new data point

    if (autoscroll) {
        // Optionally, set the x-axis min/max to match the visible rounds
        if (chart.options && chart.options.scales && chart.options.scales.x) {
            if (dataset.data.length > autoscrollWindow) {
                visibleData = dataset.data.slice(-autoscrollWindow);
            } else {
                visibleData = dataset.data;
            }
            if (visibleData.length > 0) {
                chart.options.scales.x.min = visibleData[0].x;
                chart.options.scales.x.max = visibleData[visibleData.length - 1].x;
            }
        }
    }

    chart.update('none');
}

//Function to replace existing dataset with  an entire array ('valueArray') at times 'timeArray' for a given plot with label 'id'.
export function updateSigLineChartArray(valueArray, timeArray, id) {
    let dataset = getDataset(id); //Find or create the dataset with label 'id'.

    //Replace the dataset with valueArray and timeArray. 
    dataset.data = valueArray.map((value, index) => ({
        x: timeArray[index],
        y: value
    }));

    chart.update('none');
}

document.getElementById("autoscrollSigChartButton").addEventListener("click", () => {
    autoscroll = true;
    console.log("chart.data.datasets[0]:", chart.data.datasets[0])
    if (chart.data.datasets[0].data.length > autoscrollWindow) {
        visibleData = chart.data.datasets[0].data.slice(-autoscrollWindow);
        console.log("visibleData:", visibleData);
    } else {
        visibleData = chart.data.datasets[0].data;
    }
    if (visibleData.length > 0) {
        console.log("visibleData[0].x:", visibleData[0].x);
        chart.options.scales.x.min = visibleData[0].x;
        console.log("visibleData[visibleData.length - 1].x:", visibleData[visibleData.length - 1].x);
        chart.options.scales.x.max = visibleData[visibleData.length - 1].x;
    }
    chart.update('none');
});

export function clearSigLineChart() {}

export function sigChartZoomOut() {
    autoscroll = false;
    chart.options.scales.x.min = undefined;
    chart.options.scales.x.max = undefined;
    chart.update('none');
}

export function setSigChartAutoscrollWindow(window){
    autoscrollWindow = window;
}

export function getSigChartAutoscrollWindow(){
    return autoscrollWindow;
}