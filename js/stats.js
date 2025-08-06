//average calculation
function getAvg(array) {
    return array.reduce((a, b) => a + b, 0) / array.length;
}

//variance calculation
function getVariance(array) {
    const avg = getAvg(array);
    return array.reduce((a, b) => a + (b - avg) ** 2, 0) / (array.length - 1);
}

//standard deviation calculation
function getStdDev(array) {
    const vari = getVariance(array);
    return Math.sqrt(vari);
}

//z-score calculation
function getZScore(array, avg, stdDev) {
    return array.map(val => ((val - avg) / stdDev));
}

//p-value calculation
function getPValue(zScores) {
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

export function analyzeRounds(data, startRound, stopRound) {
    //calculate average and standard deviation for individual stimuli
    const allValues = []
    Object.entries(data).forEach(([label, obj]) => {
        if (!obj.datapoints || !obj.rounds) return;
        if (!obj.avg) {
            obj.avg = [];
        }
        const vals = obj.datapoints.filter((_, i) => obj.rounds[i] >= startRound && obj.rounds[i] <= stopRound);
        const avg = vals.length ? getAvg(vals) : null;
        obj.avg.push(avg);

        if (!obj.stdDev) {
            obj.stdDev = [];
        }
        const stdDev = vals.length ? getStdDev(vals) : null;
        obj.stdDev.push(stdDev);

        allValues.push(...vals);
    });

    if ( allValues.length > 1) {
        if (!data.grandMean) {
            data.grandMean = [];
        }
        const grandMean = getAvg(allValues);
        data.grandMean.push(grandMean);

        if (!data.grandStdDev) {
            data.grandStdDev = [];
        }
        const grandStdDev = getStdDev(allValues);
        data.grandStdDev.push(grandStdDev);

        Object.entries(data).forEach(([label, obj]) => {
            if (!obj.datapoints || !obj.rounds) return;
            if (!obj.avg) {
                obj.avg = [];
            }
            const vals = obj.datapoints.filter((_, i) => obj.rounds[i] >= startRound && obj.rounds[i] <= stopRound);
            
            // if (!obj.zScores) {
            //     obj.zScores = [];
            // }
            const zScores = getZScore(vals, grandMean, grandStdDev);
            // obj.zScores.push(zScores);

            if (!obj.avgZScore) {
                obj.avgZScore = [];
            }
            const avgZScore = getAvg(zScores);
            obj.avgZScore.push(avgZScore);

            // if (!obj.pValues) {
            //     obj.pValues = [];
            // }
            const pValues = getPValue(zScores);
            // obj.pValues.push(pValues);

            if (!obj.avgPValue) {
                obj.avgPValue = [];
            }
            const avgPValue = getAvg(pValues);
            //Use "1 - avgPValue" for reading the significance graph easier
            //obj.avgPValue.push(avgPValue);
            obj.avgPValue.push(1 - avgPValue);
        });
    }

    if (!data.windowTimes) {
        data.windowTimes = [];
    }
    const windowRoundTimes = data.roundTimes.slice(startRound, stopRound +1);
    const avgWindowRoundTime = getAvg(windowRoundTimes);
    data.windowTimes.push(avgWindowRoundTime);

    return data;
}