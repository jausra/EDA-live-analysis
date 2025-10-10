//Color options to be associated with unique stims. 
const ogColorOptions = [
    "rgba(255, 0, 0, 0.2)",       // red
    "rgba(0, 255, 0, 0.2)",       // green
    "rgba(0, 0, 255, 0.2)",       // blue
    "rgba(255, 255, 0, 0.2)",     // yellow
    "rgba(0, 255, 255, 0.2)",     // cyan
    "rgba(255, 0, 255, 0.2)",     // magenta
    "rgba(255, 165, 0, 0.2)",     // orange
    "rgba(128, 0, 128, 0.2)",     // purple
    "rgba(0, 128, 0, 0.2)",       // dark green
    "rgba(0, 128, 128, 0.2)",     // teal
    "rgba(255, 192, 203, 0.2)",   // pink
    "rgba(165, 42, 42, 0.2)",     // brown
    "rgba(128, 0, 0, 0.2)",       // maroon
    "rgba(128, 128, 0, 0.2)",     // olive
    "rgba(0, 0, 128, 0.2)",       // navy
    "rgba(0, 255, 127, 0.2)",     // spring green
    "rgba(255, 105, 180, 0.2)",   // hot pink
    "rgba(255, 215, 0, 0.2)",     // gold
    "rgba(255, 69, 0, 0.2)",      // orange red
    "rgba(75, 0, 130, 0.2)"       // indigo
];

//Copy it. 
let colorOptions = [...ogColorOptions];

//Function to generate a random color from colorOptions.
export function randomColor() {
    if (colorOptions.length === 0) resetColorOptions();
    return colorOptions.splice(Math.floor(colorOptions.length*Math.random()), 1)[0];
}

//Function to reset the color options to the originals. 
export function resetColorOptions() {
    colorOptions = [...ogColorOptions];
}

//A color map object. 
export const colorMap = {
    'Red': 'rgba(255, 0, 0, 0.2)',
    'Blue': 'rgba(0, 0, 255, 0.2)',
    'Green': 'rgba(0, 128, 0, 0.2)',
    'Yellow': 'rgba(255, 255, 0, 0.2)',
    'Orange': 'rgba(255, 165, 0, 0.2)',
    'Purple': 'rgba(128, 0, 128, 0.2)',
    'White': 'rgba(255, 255, 255, 0.2)',
    'Black': 'rgba(0, 0, 0, 0.2)',
};

//Function to format the time the EDA value was received. Format is 'YYYY-MM-DD HH:mm:SS.sss'.
export function formatTimeCSV(date) {
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0') + ':' +
        String(date.getSeconds()).padStart(2, '0') + '.' +
        String(date.getMilliseconds()).padStart(3, '0');
}