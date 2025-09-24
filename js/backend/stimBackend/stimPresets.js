//Class to create stim presets. 
export default class StimPresets {
    constructor(stimObject) {
        this.stimObject = stimObject;
    }

    //Add breathing game preset.
    addCalibrateStim() {
        this.stimObject.clear();
        this.stimObject.stimOrder = 'ordered';
        
        this.stimObject.addStim('Word', 'Normal Breathing', 1, 10000);
        this.stimObject.addStim('Word', 'Deep Inhale (5s)\nDeep Exhale (5s)', 1, 10000);
    }

    //Add debug game preset. 
    addDebugStim() {
        this.stimObject.clear();
        this.stimObject.stimOrder = 'random';
        
        this.stimObject.addStim('Word', 'a', 1, 1000);
        this.stimObject.addStim('Word', 'b', 1, 1000);
        this.stimObject.addStim('Word', 'c', 1, 1000);
    }

    //Add breathing game preset.
    addBreathingGameStim() {
        this.stimObject.clear();
        this.stimObject.stimOrder = 'ordered';
        
        this.stimObject.addStim('Word', 'Deep Inhale (5s)\nDeep Exhale (5s)', 1, 10000);
        this.stimObject.addStim('Word', 'Normal Breathing', 3, 10000);
    }

    //Add red dot game preset.
    addRedDotGameStim() {
        this.stimObject.clear();
        this.stimObject.stimOrder = 'random';
        
        this.stimObject.addStim('Drawing', {
            shape: 'Circle',
            color: 'Red'
        }, 1, 9000);

        this.stimObject.addStim('Drawing', {
            shape: 'Circle',
            color: 'White'
        }, 4, 9000);
    }

    //Get all available preset names.
    getPresetNames() {
        return [
            'Debug',
            'Breathing Game',
            'Red Dot Game'
        ];
    }

    //Apply preset by name.
    applyPreset(presetName) {
        switch (presetName) {
            case 'Calibrate':
                this.addCalibrateStim();
                break;
            case 'Debug':
                this.addDebugStim();
                break;
            case 'Breathing Game':
                this.addBreathingGameStim();
                break;
            case 'Red Dot Game':
                this.addRedDotGameStim();
                break;
            case 'Custom Game':
                break; //Don't do anything since we add parameters to the stimObject seperate from this module.
            default:
                console.warn(`Unknown preset: ${presetName}`);
        }
    }
}
