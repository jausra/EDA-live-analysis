import { serChartZoomOut, getSerChartAutoscrollWindow, setSerChartAutoscrollWindow } from "./serialChart.js";
import { sigChartZoomOut, getSigChartAutoscrollWindow, setSigChartAutoscrollWindow } from "./significanceLineChart.js";

//Class for managing significance chart controls. 
export class ChartControls {
    constructor(stimAnalyzer, connectionManager, updateSigLineChartArray) {
        this.stimAnalyzer = stimAnalyzer;
        this.connectionManager = connectionManager;
        this.updateSigLineChartArray = updateSigLineChartArray;

        this.setupSliders();
        this.setupButtons();
    }

    //Method to initialize the sliders. 
    setupSliders() {
        const windowMin = 1; // Minimim window size in rounds
        const windowMax = 30; // Maximum window size in rounds
        const windowDefault = 4; // Default window size in rounds

        const overlapMin = 5; // Minimim overlap in percent
        const overlapMax = 75; // Maximum overlap in percent
        const overlapDefault = 25; // Default overlap in percent
        const overlapStepSize = 5; // Overlap step size

        const sigLineWindowText = document.getElementById("sigLineWindowText");
        const sigLineWindowSlider = document.getElementById("sigLineWindowSlider");
        const sigLineOverlapText = document.getElementById("sigLineOverlapText");
        const sigLineOverlapSlider = document.getElementById("sigLineOverlapSlider");

        if (sigLineWindowSlider && sigLineWindowText) {
            //Set the window slider properties. 
            sigLineWindowSlider.min = windowMin;
            sigLineWindowSlider.max = windowMax;
            sigLineWindowText.textContent = windowDefault;
            sigLineWindowSlider.value = windowDefault;

            sigLineWindowSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value); //Get the number from the slider.
                sigLineWindowText.textContent = value; //Set the text to that number. 
                this.stimAnalyzer.setWindowRounds(value); //Set the window rounds and calculate the overlap rounds. 
            });
        }

        if (sigLineOverlapSlider && sigLineOverlapText) {
            //Set the overlap slider properties. 
            sigLineOverlapSlider.min = overlapMin;
            sigLineOverlapSlider.max = overlapMax;
            sigLineOverlapText.textContent = `${overlapDefault}%`;
            sigLineOverlapSlider.value = overlapDefault;
            sigLineOverlapSlider.step = overlapStepSize;

            sigLineOverlapSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value); //Get the number from the slider.
                sigLineOverlapText.textContent = `${value}%`; //Set the text to that number. 
                this.stimAnalyzer.setOverlapPercent(value); //Set the overlap and calculate the overlap rounds.
            });
        }

        const sigSubmitButton = document.getElementById("sigLineSubmitButton"); // Set up the submit button
        sigSubmitButton.addEventListener("click", () => {
            this.submitSliderParams();
        });
    }

    // Method to submit the window size and overlap, and update the significance chart accordingly
    submitSliderParams() {
        // For each port, reanalyze its data and display it in the significance chart
        for (const id of this.connectionManager.getPortStates().keys()) {
            this.stimAnalyzer.reanalyzeAndDisplay(id, this.updateSigLineChartArray);
        }
    }

    // Method for initializing the buttons that control the graphs
    setupButtons() {
        // Serial chart zoom out
        const resetSerChartButton = document.getElementById("resetSerChartButton");
        resetSerChartButton.addEventListener("click", () => {
            serChartZoomOut();
        });

        // Submit new serial chart autoscroll window
        let serChartAutoscrollWindow = getSerChartAutoscrollWindow();
        const autoscrollSerChartButton = document.getElementById("autoscrollSerChartButton");
        autoscrollSerChartButton.innerHTML = `${serChartAutoscrollWindow/1000}s<br><span style="letter-spacing:-4px;">&#9658;&#9658;</span>`;

        // Increase serial chart autoscroll window
        const increaseSerChartAutoscrollWindowButton = document.getElementById("increaseSerChartAutoscrollWindowButton");
        increaseSerChartAutoscrollWindowButton.addEventListener("click", () => {
            this.increaseSerChartAutoscrollWindow();
        });

        // Decrease serial chart autoscroll window
        const decreaseSerChartAutoscrollWindowButton = document.getElementById("decreaseSerChartAutoscrollWindowButton");
        decreaseSerChartAutoscrollWindowButton.addEventListener("click", () => {
            this.decreaseSerChartAutoscrollWindow();
        });

        // Significance chart zoom out
        const resetSigChartButton = document.getElementById("resetSigChartButton");
        resetSigChartButton.addEventListener("click", () => {
            sigChartZoomOut();
        });

        // Submit new significance chart autoscroll window
        let sigChartAutoscrollWindow = getSigChartAutoscrollWindow();
        const autoscrollSigChartButton = document.getElementById("autoscrollSigChartButton");
        autoscrollSigChartButton.innerHTML = `${sigChartAutoscrollWindow} rds<br><span style="letter-spacing:-4px;">&#9658;&#9658;</span>`;

        // Increase significance chart autoscroll window
        const increaseSigChartAutoscrollWindowButton = document.getElementById("increaseSigChartAutoscrollWindowButton");
        increaseSigChartAutoscrollWindowButton.addEventListener("click", () => {
            this.increaseSigChartAutoscrollWindow();
        });

        // Decrease significance chart autoscroll window
        const decreaseSigChartAutoscrollWindowButton = document.getElementById("decreaseSigChartAutoscrollWindowButton");
        decreaseSigChartAutoscrollWindowButton.addEventListener("click", () => {
            this.decreaseSigChartAutoscrollWindow();
        });
    }

    // Method to increase the serial chart autoscroll window
    increaseSerChartAutoscrollWindow() {
        const options = [1000, 2000, 5000, 10000, 20000, 30000, 60000];
        let current = getSerChartAutoscrollWindow();
        let idx = options.indexOf(current);
        if (idx === -1) {
            // If current value is not in options, default to the smallest
            idx = 0;
        }
        if (idx < options.length - 1) {
            setSerChartAutoscrollWindow(options[idx + 1]);
        }
        // Optionally, update the button label if needed
        const autoscrollSerChartButton = document.getElementById("autoscrollSerChartButton");
        if (autoscrollSerChartButton) {
            autoscrollSerChartButton.innerHTML = `${getSerChartAutoscrollWindow()/1000}s<br><span style="letter-spacing:-4px;">&#9658;&#9658;</span>`;
        }
    }

    // Method to decrease the serial chart autoscroll window
    decreaseSerChartAutoscrollWindow() {
        const options = [1000, 2000, 5000, 10000, 20000, 30000, 60000];
        let current = getSerChartAutoscrollWindow();
        let idx = options.indexOf(current);
        if (idx === -1) {
            // If current value is not in options, default to the largest
            idx = options.length - 1;
        }
        if (idx > 0) {
            setSerChartAutoscrollWindow(options[idx - 1]);
        }
        // Optionally, update the button label if needed
        const autoscrollSerChartButton = document.getElementById("autoscrollSerChartButton");
        if (autoscrollSerChartButton) {
            autoscrollSerChartButton.innerHTML = `${getSerChartAutoscrollWindow()/1000}s<br><span style="letter-spacing:-4px;">&#9658;&#9658;</span>`;
        }
    }

    // Method to increase the significance chart autoscroll window
    increaseSigChartAutoscrollWindow() {
        const options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];
        let current = getSigChartAutoscrollWindow();
        let idx = options.indexOf(current);
        if (idx === -1) {
            // If current value is not in options, default to the smallest
            idx = 0;
        }
        if (idx < options.length - 1) {
            setSigChartAutoscrollWindow(options[idx + 1]);
        }
        // Optionally, update the button label if needed
        const autoscrollSigChartButton = document.getElementById("autoscrollSigChartButton");
        if (autoscrollSigChartButton) {
            autoscrollSigChartButton.innerHTML = `${getSigChartAutoscrollWindow()} rds<br><span style="letter-spacing:-4px;">&#9658;&#9658;</span>`;
        }
    }

    // Method to decrease the significance chart autoscroll window
    decreaseSigChartAutoscrollWindow() {
        const options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];
        let current = getSigChartAutoscrollWindow();
        let idx = options.indexOf(current);
        if (idx === -1) {
            // If current value is not in options, default to the largest
            idx = options.length - 1;
        }
        if (idx > 0) {
            setSigChartAutoscrollWindow(options[idx - 1]);
        }
        // Optionally, update the button label if needed
        const autoscrollSigChartButton = document.getElementById("autoscrollSigChartButton");
        if (autoscrollSigChartButton) {
            autoscrollSigChartButton.innerHTML = `${getSigChartAutoscrollWindow()} rds<br><span style="letter-spacing:-4px;">&#9658;&#9658;</span>`;
        }
    }
}
