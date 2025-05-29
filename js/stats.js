function avg(array) {
    return array.reduce((a, b) => {a + b}) / array.length;
}

//array of deltas for each stimulus
stats[oldStimValue].delta.push(edaDelta)
const delta = stats[oldStimValue].delta;
//average of deltas
stats[oldStimValue].avgDelta = delta.reduce((a, b) => a + b, 0) / delta.length;
const avgDelta = stats[oldStimValue].avgDelta;
//variance of deltas
stats[oldStimValue].varDelta = delta.reduce((a, b) => a + (b - avgDelta) ** 2, 0) / (delta.length - 1);


//create groups for ANOVA
let allValues = [];
let labels = [];
Object.entries(stats).forEach(([label, values]) => {
    allValues.push(...values.delta);
    labels.push(...Array(values.delta.length).fill(label));
})

//ANOVA