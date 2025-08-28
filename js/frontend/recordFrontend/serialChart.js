import { randomColor, colorMap } from '../../utils.js';
let chart;
let autoscroll = true;
let autoscrollWindow = 5000;

export const annotationColorDict = {};

//Function to initialize the resistance vs time plot
export function initSerialChart(canvasId) {
// export function initSerialChart(canvasId, xMin, xMax) {
    const ctx = document.getElementById(canvasId).getContext('2d'); //Gets the drawing surface for 2D graphics.
    chart = new Chart(ctx, {
        type: 'line', //Line graph.
        data: { datasets: [] }, //Starts off with empty dataset array.
        options: {
            plugins: {
                legend: { display: false }, //Turn off the legend.
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
                        }
                    },
                    type: 'time', //Enables parsing of time values and formatting of labels.
                    time: { //Set each tick mark one second apart.
                        unit: 'second',
                    },
                    grid: { //Turn off the grid lines for the x-axis.
                        display: false
                    }, 
                    // min: xMin,
                    // max: xMax,
                },
                y: {
                    position: 'left', //Put the primary y-axis on the left of the graph.
                    title: { //Add the y-axis title.
                        display: true,
                        text: 'EDA Value (Port 1)',
                        color: 'purple',
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
                },
            }, 
            maintainAspectRatio: false, //The height to width ratio of the graph is not stagnant.
        },
        plugins: 
        [
            //'hideLabel' hides the delta value annotation the moment it hits the left side of the graph. 
            // Otherwise it bleeds into the y-axis tick labels. 
            {
                id: 'hideLabel',
                afterDraw(chart) {
                    const annotations = chart.options.plugins.annotation?.annotations; // Find chart annotations
                    if (!annotations) return; //Do nothing if no annotations found.

                    const xScale = chart.scales.x; //Extract x-axis features of chart.
                    const chartLeft = chart.chartArea.left; //Get the pixel value for the left-most part of the chart.

                    //Hide any annotation if the pixel value for its left-most section is to the left of 
                    // the pixel value for the left-most section of the chart.
                    for (const [key, annotation] of Object.entries(annotations)) {
                        const boxLeft = xScale.getPixelForValue(annotation.xMin); //Get the pixel value for the left-most part of the annotation.

                        if(boxLeft < chartLeft) {
                            annotation.label.color = 'rgba(0,0,0,0)';
                        } else {
                            annotation.label.color = '#000';
                        }
                    }
                }
            }
        ]
    })
}


// Function to set the x-axis minimum and maximum values of the chart
export function setSerialChartXRange(xMin, xMax) {
    if (chart && chart.options && chart.options.scales && chart.options.scales.x) {
        chart.options.scales.x.min = xMin;
        chart.options.scales.x.max = xMax;
        chart.update('none');
    }
}


//Function for getting or creating the dataset for a given port ID. 
function getDataset(id) {
    let dataset = chart.data.datasets.find(ds => ds.label === id);

    // If the dataset does not exist, create it
    if (!dataset) {
        // Ensure y2 axis exists if we're adding sensor2
        if (id === 'sensor2' && !chart.options.scales.y2) {
            chart.options.scales.y2 = {
                position: 'right',
                title: { // Add the secondary y-axis title
                    display: true,
                    text: 'EDA Value (Port 2)',
                    color: 'green',
                    font: {
                        weight: 'bold',
                        size: 16,
                    }
                },
                ticks: { // Add the secondary y-axis ticks
                    color: '#000',
                    font: {
                        weight: 'bold',
                        size: 14,
                    }
                },
            }
        }

        // Add the dataset to 'chart.data.datasets'.
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

    return dataset;
}

// Function to add a single data point ('value') at the time it was received ('now') for a given plot with label 'id'
export function updateSerialChartValue(value, now, id) {
    let dataset = getDataset(id); //Find or create the dataset with label 'id'
    dataset.data.push({ x: now, y: value }); //Encapsulate the time and resistance value into an object and push it to the dataset's data array

    // If autoscroll is enabled, set the x-axis max and min to show the most recent 5-seconds
    // To-Do: make the window size adjustable
    if (autoscroll) {
        const maxX = Date.now();
        const minX = maxX - autoscrollWindow;

        chart.options.scales.x.min = minX;
        chart.options.scales.x.max = maxX;
    }

    chart.update('none'); //Apply changes to the chart with no animation
}

// Function to add a single data point ('value') at the time it was received ('now') for a given plot with label 'id'
export function updateSerialChartArray(valueArray, timeArray, id) {
    let dataset = getDataset(id); // Find or initialize the dataset with label 'id'

    // Replace the dataset with valueArray and timeArray
    dataset.data = valueArray.map((value, index) => ({
        x: timeArray[index],
        y: value
    }));

    chart.update('none'); // Apply changes to the chart with no animation
}

document.getElementById("autoscrollSerChartButton").addEventListener("click", () => {
    autoscroll = true;
});

//Function to draw colored box and show stimulus label during relevant timepoints.
export function annotateChartWithStim(stim, color='random', startTime, stopTime) {
    //Check if the stim has an associated color. If not, assign it a color (random or predefined).
    if (!(stim in annotationColorDict)){
        if (color === 'random'){
            annotationColorDict[stim] = randomColor();
        } else {
            annotationColorDict[stim] = color;
        }
    }

    //Add the colored box and stim label to the graph at the relevant timepoints. 
    chart.options.plugins.annotation.annotations[`stim-${startTime}`] = {
        type: 'box', //Draw a rectangular box. 
        xMin: startTime, //Define the start time of the box.
        xMax: stopTime, //Define the stop time of the box.
        backgroundColor: annotationColorDict[stim], //Color the box based on the lookup table 'annotationColorDict'.
        label: { //Adds a label inside the annotation box. 
            content: stim.split(' '), //Splits the stim string into multiple lines if it contains a space.
            enabled: true, //Makes sure the label is shown. 
            position: 'start', //Position the label at xMin.
            textAlign: 'left', //Left-align the label.
            font: {
                size: 24,
                weight: 'bold',
            },
            color: 'blue', //Sets the label text color to blue. 
            clip: true, //Ensures the text label is clipped so it doesn't overflow outside the box. 
        },
    };
    chart.update();
}

//Function to add a label with the max decreasing change in resistance to the graph for the most recent stim that finished. 
//To-Do: Enable adding labels for any number of ports.
export function annotateChartWithDelta(portDeltas, stim, startTime) {
    const key = `stim-${startTime}`; //Get the key associated with the stim that just finished its cycle.
    const annotation = chart.options.plugins.annotation.annotations[key]; //Get the value for that key, which we will modify.
    if (!annotation) return;

    //For each sensor, append the label within the chart's colored square with the corresponding max decreasing change in resistance
    for (const {id, delta} of portDeltas) {
        if (id === 'sensor1') {
            annotation.label.content.push(`1: ${delta}`);
        } else {
            annotation.label.content.push(`2: ${delta}`);
        }
    }
    chart.update();
}

// Function to annotate the chart with imported session data
export function annotateChartWithImportedSession(sessionData) {
    if (!sessionData || !sessionData.rounds || !sessionData.stims || !sessionData.types || !sessionData.startTimes || !sessionData.stopTimes) {
        console.warn('Invalid session data provided for annotation');
        return;
    }

    // Clear any existing annotations first
    if (chart.options.plugins.annotation?.annotations) {
        chart.options.plugins.annotation.annotations = {};
    }

    // Create annotations for each round/stim
    for (let i = 0; i < sessionData.rounds.length; i++) {
        const stim = sessionData.stims[i];
        const type = sessionData.types[i];
        const startTime = sessionData.startTimes[i];
        const stopTime = sessionData.stopTimes[i];

        // Skip if we don't have valid time data
        if (!startTime || !stopTime || isNaN(startTime) || isNaN(stopTime)) {
            continue;
        }

        // Check if the stim has an associated color, if not assign a random one
        if (!(stim in annotationColorDict)) {
            if (type === "Drawing") {
                const color = stim.split(" ")[0];
                annotationColorDict[stim] = colorMap[color];
            } else {
                annotationColorDict[stim] = randomColor();
            }
        }

        // Add the colored box and stim label to the graph
        chart.options.plugins.annotation.annotations[`stim-${startTime}`] = {
            type: 'box',
            xMin: startTime,
            xMax: stopTime,
            backgroundColor: annotationColorDict[stim],
            label: {
                content: stim.split(' '),
                enabled: true,
                position: 'start',
                textAlign: 'left',
                font: {
                    size: 24,
                    weight: 'bold',
                },
                color: 'blue',
                clip: true,
            },
        };
    }

    chart.update();
}

//Function to clear the resistance vs time plot
export function clearSerialChart(connectionManager) {
    chart.data.datasets = []; //Clear the dataset array. 

    if (chart.options.scales.y2) { //Clear the second y-axis if it exists.
        delete chart.options.scales.y2;
        chart.update();
    }

    for (const [id, state] of connectionManager.getPortStates().entries()) { //Cycle through each port connection. 
        let dataset = getDataset(id); //Find the dataset with label 'id'. If it does not exist, initialize it. If there is more than one dataset, add a second y-axis for it. 

        dataset.data = []; //Clear all data from the dataset.

        //Clear all labels/boxes from the graph
        if(chart.options.plugins.annotation.annotations) {
            chart.options.plugins.annotation.annotations = {}; 
        }

        chart.update();
    }
}

export function serChartZoomOut() {
    autoscroll = false;
    chart.options.scales.x.min = undefined;
    chart.options.scales.x.max = undefined;
    chart.update('none');
}

export function setSerChartAutoscrollWindow(window){
    autoscrollWindow = window;
}

export function getSerChartAutoscrollWindow(){
    return autoscrollWindow;
}