# EDA-live-analysis

A program for viewing and analyzing EDA data using basic javascript.

## Overview

This repository documents my progress of combining several features of javascript including live data plotting via a serial port, performing mathematical operations on the data, and outputting a visual stimulation to produce real-time effects on EDA.

# Technologies

HTML,
CSS,
Javascript (no frameworks)

# Challenges and Solutions

- **Challenge**: Making sure that no two stimulations in a row are identical.
- **Solution**: During the stimulation shuffle phase, make sure the last stimulation is not the same as the current first stimulation.

- **Challenge**: When selecting stimuli for display, need a way to tie the stimuli in the selection panel to the stimulus object, in order to delete items from the stimulus object from the selection panel.
- **Solution**: Use the built-in dataset data-index attribute to tie the indices of items beterrn selection panel and stimulus object (that gets displayed when you start the stimulus display).

# Key Takeaways

-Use setTimeout and make the function call itself to create a loop that accepts variable timing inputs.
-When initializing a set of variable with a for-loop, closures allow you to remember the order in which the variables were created, so you can access and use their index at a later time, even after the for-loop is done running.
