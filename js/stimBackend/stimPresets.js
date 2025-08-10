export default class StimPresets {
    constructor(stimObject) {
        this.stimObject = stimObject;
    }

    // Debug game preset
    addDebugStim() {
        this.stimObject.clear();
        this.stimObject.stimOrder = 'random';
        
        this.stimObject.addStim('Word', 'a', 1, 1000);
        this.stimObject.addStim('Word', 'b', 1, 1000);
        this.stimObject.addStim('Word', 'c', 1, 1000);
    }

    // Breathing game preset
    addBreathingGameStim() {
        this.stimObject.clear();
        this.stimObject.stimOrder = 'ordered';
        
        this.stimObject.addStim('Word', 'Deep Inhale (5s)\nDeep Exhale (5s)', 1, 10000);
        this.stimObject.addStim('Word', 'Normal Breathing', 3, 10000);
    }

    // Red dot game preset
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

    // Get all available preset names
    getPresetNames() {
        return [
            'Debug',
            'Breathing Game',
            'Red Dot Game'
        ];
    }

    // Apply preset by name
    applyPreset(presetName) {
        switch (presetName) {
            case 'Debug':
                this.addDebugStim();
                break;
            case 'Breathing Game':
                this.addBreathingGameStim();
                break;
            case 'Red Dot Game':
                this.addRedDotGameStim();
                break;
            default:
                console.warn(`Unknown preset: ${presetName}`);
        }
    }

    // Check if current stim object matches a preset
    matchesPreset(presetName) {
        const currentStim = this.stimObject;
        
        switch (presetName) {
            case 'Debug':
                return this.matchesDebugPreset(currentStim);
            case 'Breathing Game':
                return this.matchesBreathingPreset(currentStim);
            case 'Red Dot Game':
                return this.matchesRedDotPreset(currentStim);
            default:
                return false;
        }
    }

    matchesDebugPreset(stim) {
        if (stim.stimOrder !== 'random' || stim.stimType.length !== 3) return false;
        
        const expectedTypes = ['Word', 'Word', 'Word'];
        const expectedValues = ['a', 'b', 'c'];
        const expectedRatios = [1, 1, 1];
        const expectedTimes = [1000, 1000, 1000];

        return this.arraysEqual(stim.stimType, expectedTypes) &&
               this.arraysEqual(stim.stimValue, expectedValues) &&
               this.arraysEqual(stim.stimRatio, expectedRatios) &&
               this.arraysEqual(stim.stimTime, expectedTimes);
    }

    matchesBreathingPreset(stim) {
        if (stim.stimOrder !== 'ordered' || stim.stimType.length !== 2) return false;
        
        const expectedTypes = ['Word', 'Word'];
        const expectedValues = ['Deep Inhale (5s)\nDeep Exhale (5s)', 'Normal Breathing'];
        const expectedRatios = [1, 3];
        const expectedTimes = [10000, 10000];

        return this.arraysEqual(stim.stimType, expectedTypes) &&
               this.arraysEqual(stim.stimValue, expectedValues) &&
               this.arraysEqual(stim.stimRatio, expectedRatios) &&
               this.arraysEqual(stim.stimTime, expectedTimes);
    }

    matchesRedDotPreset(stim) {
        if (stim.stimOrder !== 'random' || stim.stimType.length !== 2) return false;
        
        const expectedTypes = ['Drawing', 'Drawing'];
        const expectedValues = [
            { shape: 'Circle', color: 'Red' },
            { shape: 'Circle', color: 'White' }
        ];
        const expectedRatios = [1, 4];
        const expectedTimes = [9000, 9000];

        return this.arraysEqual(stim.stimType, expectedTypes) &&
               this.arraysEqual(stim.stimValue, expectedValues) &&
               this.arraysEqual(stim.stimRatio, expectedRatios) &&
               this.arraysEqual(stim.stimTime, expectedTimes);
    }

    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        
        for (let i = 0; i < a.length; i++) {
            if (typeof a[i] === 'object' && typeof b[i] === 'object') {
                if (!this.objectsEqual(a[i], b[i])) return false;
            } else if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    objectsEqual(a, b) {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        
        for (const key of keysA) {
            if (a[key] !== b[key]) return false;
        }
        return true;
    }
}
