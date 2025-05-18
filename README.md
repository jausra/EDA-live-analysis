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

# Key Takeaways

-Use setTimeout and make the function call itself to create a loop that accepts variable timing inputs.
