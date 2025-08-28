//Function to calculate the average of an array. 
function getAvg(array) {
    //The reduce method combines all elements of an array into a single value. 
    // The callback '(a, b) => a + b' adds the accumulator 'a' and the current element 'b'.
    // The second argument '0' initializes the accumulator 'a' to 0. 
    return array.reduce((a, b) => a + b, 0) / array.length;
}

//Function to calculate the variance of an array. 
function getVariance(array) {
    const avg = getAvg(array);
    //The reduce method combines all elements of an array into a single value. 
    // The callback '(a, b) => a + (b - avg) ** 2, 0)' adds the accumulator 'a' to the current value minus the average of the array squared. 
    // The second argument '0' initializes the accumulator 'a' to 0. 
    return array.reduce((a, b) => a + (b - avg) ** 2, 0) / (array.length - 1);
}

//Function to calculate the standard deviation of an array. 
function getStdDev(array) {
    const variance = getVariance(array);
    return Math.sqrt(variance);
}

//Function to calculate the z-score for each value in an array. 
function getZScore(array, avg, stdDev) {
    //'map' creates a new array by applying the function '(val - avg) / stdDev' to each val. 
    return array.map(val => ((val - avg) / stdDev));
}

//Function to calculate the p-value for each z-score in an array. 
function getPValue(zScores) {
    //'map' creates a new array by applying the function '1 - jStat.normal.cdf(z, 0, 1)' to each z-score. 
    // The CDF gives the probability that a normally distributed random value is less than or equal to z. 
    // If zScores is [-1.96, 0, 1.96], the function would return [0.025, 0.5, 0.975].
    return zScores.map(z => ( 1 - jStat.normal.cdf(z, 0, 1) ));
}

export function analyzeAll(data) {
    //calculate average and standard deviation for individual stimuli
    Object.entries(data).forEach(([label, obj]) => {
        if (obj && obj.datapoints){
            const vals = obj.datapoints;
            
            const avg = getAvg(vals);
            obj.avg = avg;
    
            if (obj.datapoints.length > 1) {
                const stdDev = getStdDev(vals);
                obj.stdDev = stdDev;
            }
        }
    });

    // create array of all values
    const allValues = Object.entries(data).flatMap(([, obj]) => Array.isArray(obj.datapoints) ? obj.datapoints : []);

    //calculate grand average
    const grandMean = getAvg(allValues);
    data.grandMean = grandMean;

    if ( allValues.length > 1) {
        //calculate grand standard deviation
        const grandStdDev = getStdDev(allValues);
        data.grandStdDev = grandStdDev;

        //calculate z-scores and p-values for each stimulus relative to grand average and grand standard deviation
        Object.entries(data).forEach(([label, obj]) => {
            if (obj && obj.datapoints) {
                const zScores = getZScore(obj.datapoints, grandMean, grandStdDev);
                obj.zScores = zScores;

                const avgZScore = getAvg(zScores);
                obj.avgZScore = avgZScore;

                const pValues = getPValue(zScores);
                obj.pValues = pValues;

                const avgPValue = getAvg(pValues);
                //Use "1 - avgPValue" for reading the significance graph easier
                //obj.avgPValue = avgPValue;
                obj.avgPValue = 1 - avgPValue;
            }
        })
    }

    return data;
}

//Function for calculating the following for a given range of rounds:
//Average across all stims.
//Standard deviation across all stims.
//Z-Score for individual stims. 
//P-value for individual stims.
//Average timepoint across all stims for the given rounds. 
export function analyzeRounds(data, startRound, stopRound) {
    //calculate average and standard deviation for individual stimuli
    const allValues = []
    Object.entries(data).forEach(([label, obj]) => { //Check all the values in the data object. 
        if (!obj.datapoints || !obj.rounds) return; //We are only interested in the values that are objects with stim keys. 

        if (!obj.avg) { obj.avg = []; } //If the avg array is not present, initialize it. 
        //Set vals to the max decreasing changes in resistance that occur during the desired rounds.
        const vals = obj.datapoints.filter((_, i) => obj.rounds[i] >= startRound && obj.rounds[i] <= stopRound);
        const avg = vals.length ? getAvg(vals) : null; //If vals is not empty, calculate its average. 
        obj.avg.push(avg); //Push the average value to the avg array. 

        //Repeat the same process as above, but this time for standard deviation. 
        if (!obj.stdDev) {
            obj.stdDev = [];
        }
        const stdDev = vals.length ? getStdDev(vals) : null;
        obj.stdDev.push(stdDev);

        //Add vals to to the allValues array, which stores values across all stims. 
        // The spread operator '...' ensures we push individual values in 'vals', and not entire 'vals' array. 
        allValues.push(...vals);
    });

    if ( allValues.length > 1) { //Check if there are values during the desired rounds. 
        if (!data.grandMean) { //push the average of allValues to grandMean
            data.grandMean = [];
        }
        const grandMean = getAvg(allValues);
        data.grandMean.push(grandMean);

        if (!data.grandStdDev) { //push the standard deviation of allValues to grandStdDev
            data.grandStdDev = [];
        }
        const grandStdDev = getStdDev(allValues);
        data.grandStdDev.push(grandStdDev);

        Object.entries(data).forEach(([label, obj]) => { //Cycle through all the values in the data object. 
            if (!obj.datapoints || !obj.rounds) return; //We are only interested in the values that are objects with stim keys. 
            const vals = obj.datapoints.filter((_, i) => obj.rounds[i] >= startRound && obj.rounds[i] <= stopRound); //get the vals for the stim for the desired rounds again. 
            
            // if (!obj.zScores) {
            //     obj.zScores = [];
            // }
            const zScores = getZScore(vals, grandMean, grandStdDev); //Get the z-score for the stim for the desired rounds. 
            // obj.zScores.push(zScores);

            if (!obj.avgZScore) {
                obj.avgZScore = [];
            }
            const avgZScore = getAvg(zScores);
            obj.avgZScore.push(avgZScore); //Push 'avgZScore' to the stim's 'avgZScore' array. 

            // if (!obj.pValues) {
            //     obj.pValues = [];
            // }
            const pValues = getPValue(zScores); //Get the p-value for the stim for the desired rounds. 
            // obj.pValues.push(pValues);

            if (!obj.avgPValue) {
                obj.avgPValue = [];
            }
            const avgPValue = getAvg(pValues); 
            //Use "1 - avgPValue" for reading the significance graph easier
            //obj.avgPValue.push(avgPValue);
            obj.avgPValue.push(1 - avgPValue); //Push 'avgPValue' to the stim's 'avgPValue' array. 
        });
    }

    //Add the average time for thw window to the data object's 'windowTimes' array. 
    if (!data.windowTimes) {
        data.windowTimes = [];
    }
    const windowTimes = data.roundTimes.slice(startRound, stopRound +1);
    const avgWindowTime = getAvg(windowTimes);
    data.windowTimes.push(avgWindowTime);

    return data; //return the data object. 
}