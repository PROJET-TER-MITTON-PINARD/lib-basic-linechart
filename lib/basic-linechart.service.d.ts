import { Data } from './basic-linechart.component';
import * as i0 from "@angular/core";
export declare function parseBool(s: string): number;
export declare class DataService {
    private str;
    dataExample1: Data[];
    dataExample2: Data[];
    dataExample3: Data[];
    dataExample4: Data[];
    dataExample5: Data[];
    dataExample6: Data[];
    dataExample7: Data[];
    constructor();
    private parse;
    generateData(label: string, color: string, style: "both" | "line" | "area", interpolation: "step" | "linear", f: (s: string) => number): Data;
    private generateExample;
    private getRandomInt;
    static ɵfac: i0.ɵɵFactoryDeclaration<DataService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<DataService>;
}
