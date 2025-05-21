export default class CreateStimObject{
    constructor(stimOrder = 'random', stimType = [], stimValue = [], stimRatio = [], stimTime = []){
        this.stimOrder = stimOrder,
        this.stimType = stimType,
        this.stimValue = stimValue,
        this.stimRatio = stimRatio,
        this.stimTime = stimTime
    }
}