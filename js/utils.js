const colorOptions = [
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

export function randomColor() {
    return colorOptions.splice(Math.floor(colorOptions.length*Math.random()), 1)[0];
}

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