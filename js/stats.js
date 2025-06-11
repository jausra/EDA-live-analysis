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

export function analyze(data) {
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