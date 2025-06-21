let chart;

export function initSigChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Average P-value',
                data: [],
                base: 0.5,
                backgroundColor: (context) => {
                    const value = context.raw;

                    if (value < 0.2) return 'darkred';
                    if (value < 0.4) return 'red';
                    if (value < 0.6) return 'lightgray';
                    if (value < 0.8) return 'lightblue';
                    if (value < 0.9) return 'blue';
                    if (value < 0.95) return 'darkblue';
                    if (value < 0.99) return 'purple';
                    return 'gold';
                }
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Significance (1 - PValue)',
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 16
                        }
                    },
                    ticks: {
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 14
                        }
                    },
                    min: 0,
                    max: 1,
                    grid: {
                        display: false
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Stimulus',
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 16
                        }
                    },
                    ticks: {
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 14
                        }
                    },
                    grid: {
                        display: false
                    },
                }
            }, 
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                datalabels: { 
                    anchor: 'center',
                    formatter: (value) => {
                        if (value === null || isNaN(value)) {
                            return null;
                        }
                        return Number(value).toFixed(3);
                    },
                    color: (context) => {
                        const value = context.dataset.data[context.dataIndex];
                        return (value >= 0.4 && value < 0.8) ? '#000' : '#fff';
                    },
                    font: {
                        weight: 'bold'
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

export function updateSigChart(data) {
    // console.log("data:");
    // console.log(data);
    // const sorted = Object.entries(data).filter(([label, obj]) => Array.isArray(obj.datapoints)).sort(
    //     ([, objA], [, objB]) => (
    //         objB.avgPValue - objA.avgPValue
    //     )
    // );
    // const labels = sorted.map(([label]) => label);
    // const pValues = sorted.map(([, obj]) => obj.avgPValue);

    const labels = [];
    const values = [];

    const sortedStims = Object.entries(data)
        .map(([stim, streams]) => {
            const pValues = Object.values(streams).filter(
                p => typeof p === 'number' && !isNaN(p)
            );

            const avgPValue = pValues.length > 0 
                ? pValues.reduce((a, b) => a + b, 0) / pValues.length
                : 1;

            return { stim, streams, avgPValue };
        })
        .sort((a, b) => b.avgPValue - a.avgPValue);

    for (const { stim, streams } of sortedStims) {
        for (const [stream, pValue] of Object.entries(streams)) {
            if (typeof pValue === 'number' && !isNaN(pValue)){
                labels.push(`${stim}\n${stream}`);
                values.push(pValue);
            }
        }

        labels.push('');
        values.push(null);
    }

    chart.data.labels = labels;
    chart.data.datasets[0].data = values;

    chart.update();
}

export function clearSigChart() {
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.update();
}