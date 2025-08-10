//Class that holds the information about each stim. 
export default class CreateStimObject{
    constructor(stimOrder = '', stimType = [], stimValue = [], stimRatio = [], stimTime = []){
        this.stimOrder = stimOrder;
        this.stimType = stimType;
        this.stimValue = stimValue;
        this.stimRatio = stimRatio;
        this.stimTime = stimTime;
    }

    //Add a new stim item.
    addStim(type, value, ratio, time) {
        this.stimType.push(type);
        this.stimValue.push(value);
        this.stimRatio.push(ratio);
        this.stimTime.push(time);
    }

    //Remove stim item at specific index.
    removeStim(index) {
        this.stimType.splice(index, 1);
        this.stimValue.splice(index, 1);
        this.stimRatio.splice(index, 1);
        this.stimTime.splice(index, 1);
    }

    //Clear all stim items.
    clear() {
        this.stimOrder = '';
        this.stimType = [];
        this.stimValue = [];
        this.stimRatio = [];
        this.stimTime = [];
    }

    //Check if stim object has any items.
    hasItems() {
        return this.stimType.length > 0;
    }

    //Get stim item at specific index.
    getStim(index) {
        if (index >= 0 && index < this.stimType.length) {
            return {
                type: this.stimType[index],
                value: this.stimValue[index],
                ratio: this.stimRatio[index],
                time: this.stimTime[index]
            };
        }
        return null;
    }

    //Get total number of stim items.
    getItemCount() {
        return this.stimType.length;
    }
}