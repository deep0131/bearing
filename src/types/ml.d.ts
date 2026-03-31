declare module 'ml-knn' {
  export default class KNN {
    constructor(dataset: number[][], labels: number[], options?: { k?: number });
    predict(dataset: number[][]): number[];
    toJSON(): any;
    static load(model: any): KNN;
  }
}

declare module 'ml-random-forest' {
  export class RandomForestClassifier {
    constructor(options?: any);
    train(trainingSet: number[][], trainingValues: number[]): void;
    predict(toPredict: number[][]): number[];
    predictionValues(toPredict: number[][]): any;
    toJSON(): any;
    static load(model: any): RandomForestClassifier;
  }
}
