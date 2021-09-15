import { Data } from './basic-linechart.component';
import * as i0 from "@angular/core";
export declare class DataService {
    /**
     * str is an example of data's string
     */
    private str;
    /**
     * Dataset 1
     */
    dataExample1: Data[];
    /**
     * Dataset 2
     */
    dataExample2: Data[];
    /**
     * Dataset 3
     */
    dataExample3: Data[];
    /**
     * Dataset 4
     */
    dataExample4: Data[];
    /**
     * Dataset 5
     */
    dataExample5: Data[];
    /**
     * Dataset 6
     */
    dataExample6: Data[];
    /**
     * Constructor
     * Launch generateExample with parameters this.str to fill all Dataset
     */
    constructor();
    /**
     * Parse of str to obtain DATA[]
     * @param str
     * @param sensorId
     * @param f
     * @returns DATA[]
     */
    private parse;
    /**
     * Parse of str to obtain Data[]
     * @param str
     * @param label
     * @param color
     * @param style
     * @param interpolation
     * @param f
     * @returns Data[]
     */
    generateData(str: string, label: string, color: string, style: "both" | "line" | "area", interpolation: "step" | "linear", f: (s: string) => number): Data;
    /**
     * Transform string in number
     * @param s
     * @returns 1 if s=='ON', 0 if s=='OFF' else -1
     */
    parseBool(s: string): number;
    /**
     * Generate all dataset
     * @param str
     */
    private generateExample;
    /**
     * Get +1 or -1 on the param x
     * @param x
     * @returns x+1 or x-1 (random)
     */
    private getRandomInt;
    static ɵfac: i0.ɵɵFactoryDeclaration<DataService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<DataService>;
}
