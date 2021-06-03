import { Data } from './basic-linechart.component';
import * as i0 from "@angular/core";
export interface DATA<T> {
    timestamp: number;
    value: T;
    sensorId: string;
}
export declare class DataService {
    str: string;
    dataExample1: Data[];
    dataExample2: Data[];
    dataExample3: Data[];
    dataExample4: Data[];
    dataExample5: Data[];
    dataExample6: Data[];
    dataExample7: Data[];
    constructor();
    parse<T>(str: string, sensorId: string, f: (s: string) => T): DATA<T>[];
    private generateData;
    private getRandomInt;
    static ɵfac: i0.ɵɵFactoryDeclaration<DataService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<DataService>;
}
