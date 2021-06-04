import { ElementRef, EventEmitter, OnInit, Renderer2, SimpleChanges } from '@angular/core';
import * as i0 from "@angular/core";
export interface Data {
    label: string;
    values: [number, number][];
    color: string;
    style: "line" | "area" | "both";
    interpolation: "linear" | "step";
}
export declare class BasicLinechartComponent implements OnInit {
    private renderer;
    width: number;
    height: number;
    data: Data[];
    domain: [number, number];
    timeline: ElementRef;
    scrollbar: ElementRef;
    zoneScrollbar: ElementRef;
    range: [number, number];
    rangeChange: EventEmitter<[number, number]>;
    currentTime: number;
    currentTimeChange: EventEmitter<number>;
    title: string;
    private margin;
    private dataZoom;
    private idZoom;
    private minTime;
    private maxTime;
    private lengthTime;
    private svgWidth;
    private svgHeight;
    private scaleX;
    private scaleY;
    private svg;
    private area;
    private line;
    private tooltip;
    private lastDatalength;
    private modeToolTips;
    private currentTimeSelected;
    private scrollbarSelected;
    private lastPos;
    constructor(renderer: Renderer2);
    /**
     * Copy data in dataZoom, and build title
     */
    ngOnInit(): void;
    /**
     * Initialize linechart
     */
    ngAfterViewInit(): void;
    /**
     * Update linechart on data, range or current time changes
     * @param {SimpleChanges} changes
     */
    ngOnChanges(changes: SimpleChanges): void;
    /**
     * Add event listeners on the svg
     */
    private buildEvent;
    /**
     * Build the style (area, line or both) and the interpolation (stpe or linear) of lines
     * @param {Data} element
     * @param {number} index
     */
    private buildStyleData;
    /**
     * Save information for zoom.
     */
    private buildZoom;
    /**
     * Draw the tooltips's svg
     */
    private drawToolTips;
    /**
     * Draw horizontal and vertical axis and scale
     */
    private drawAxis;
    /**
     * Draw lines on the line chart
     */
    private drawLineAndPath;
    /**
     * Draw the vertical line which represents the current time
     */
    private drawLineCurrentTime;
    /**
     * Draw the scrollbar and event listener on it
     */
    private drawScrollbar;
    /**
     * Update all the line chart (horizontal and vertical axis and scale, data, lines and range) on data changes.
     */
    private updateChart;
    /**
     * Update horizontal axis, current time line, lines and scrollbar
     * @param {number} min of the new range
     * @param {number} max of the new range
     */
    private updateSvg;
    /**
     * Update the display of lines
     */
    private updateLine;
    /**
     * Update the position of the current time line
     */
    private updateCurrentTime;
    /**
     * Update the position of the scrollbar
     * @param {number} min of the new range
     * @param {number} max of the new range
     */
    private updateScrollbar;
    /**
     * Change the range, control it, update datas, update the linechart and then emit the new range.
     * @param {MouseEvent} event
     */
    private updateRange;
    /**
     * Change this.dataZoom at range changes
     * @param {number} min of the new range
     * @param {number} max of the new range
     */
    private updateDataZoom;
    /**
     * Remove and build a new tooltips
     */
    private updateToolTips;
    /**
     * Active movement of scrollbar on mousedown on it
     * @param {MouseEvent} event
     */
    private activeScrollbar;
    /**
     * Desactive movement of scrollbar on mouseup or mouseleave on it
     */
    private desactiveScrollbar;
    /**
     * Show the tooltips on the movement of the mouse
     * @param {MouseEvent} event
     */
    private showInfo;
    /**
     * Hide the tooltips when the mouse leave the svg
     */
    private hideInfo;
    /**
     * Update the range (reduce or increase) of the linechart on scroll
     * @param {WheelEvent} event
     */
    private activeZoom;
    /**
     * Update the value of current time on the movement of the mouse
     * @param {MouseEvent} event
     */
    private moveCurrentTime;
    /**
     * Control the range based on data's timestamp and the new range
     * @param {number} min of the new range
     * @param {number} length of the new range
     * @returns a adjusted range based on data's timestamp
     */
    private controlRange;
    /**
     * Control the domain based on data's value type and the input domain
     * @returns a new domain auto-scaled if the input domain is equal to [0,0] or the data's value are positive integers, else return the input domain
     */
    private controlDomain;
    /**
     * Control the color based on css-colors-name and hex-color-code
     * @param {string} color
     * @returns false if the param color isn't a css-colors-name or a valid hex-color-code
     */
    private controlColor;
    /**
     * Determine the minimum or maximum of the horizontal or vertical axis in data
     * @param {Data[]} data Array of Data
     * @param {"xMin" | "xMax" | "yMin" | "yMax"} s precise wihch scale we want
     * @returns the value that matches with the parameter s in data
     */
    private scale;
    /**
    *Check type of data (positive integer or float)
    *@param {Data[]} data Array of Data
    *@returns false if there is at least one value in data that's not a positive integer
    */
    private discreteValue;
    /**
     * Round a number with a precision
     * @param {number} num
     * @param {number} precision
     * @returns a num with a number of decimal (precision)
     */
    private roundDecimal;
    static ɵfac: i0.ɵɵFactoryDeclaration<BasicLinechartComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<BasicLinechartComponent, "lib-basic-linechart", never, { "width": "width"; "height": "height"; "data": "data"; "domain": "domain"; "range": "range"; "currentTime": "currentTime"; }, { "rangeChange": "rangeChange"; "currentTimeChange": "currentTimeChange"; }, never, never>;
}
