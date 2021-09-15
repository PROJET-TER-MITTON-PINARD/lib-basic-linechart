import * as i0 from '@angular/core';
import { Injectable, EventEmitter, Component, Input, ViewChild, Output, HostListener, NgModule } from '@angular/core';
import * as d3 from 'd3';

/**
 * Service that give 6 example of dataset and function to parse DATA and Data from string.
 */
class DataService {
    /**
     * Constructor
     * Launch generateExample with parameters this.str to fill all Dataset
     */
    constructor() {
        /**
         * str is an example of data's string
         */
        this.str = `  
  "2016-07-25 15:47:24,459";"PC6";"OFF"
  "2016-07-25 19:47:24,459";"PC6";"ON"
  "2016-07-26 05:47:24,459";"PC6";"OFF"
  "2016-07-26 06:47:24,459";"PC6";"ON"
  "2016-07-26 06:59:24,459";"PC6";"OFF"
  "2016-07-26 18:21:24,459";"PC6";"ON"
  "2016-07-27 11:00:24,459";"PC6";"OFF"
  "2016-07-28 08:32:24,459";"PC6";"ON"
  "2016-07-28 18:15:24,459";"PC6";"OFF"
  "2016-07-29 09:06:24,459";"PC6";"ON"
  "2016-07-29 19:36:24,459";"PC6";"OFF"
  "2016-07-25 15:47:24,459";"PC5";"OFF"
  "2016-07-25 22:47:24,459";"PC5";"ON"
  "2016-07-25 22:55:24,459";"PC5";"OFF"
  "2016-07-26 07:29:24,459";"PC5";"ON"
  "2016-07-26 20:59:24,459";"PC5";"OFF"
  "2016-07-27 06:21:24,459";"PC5";"ON"
  "2016-07-27 13:00:24,459";"PC5";"OFF"
  "2016-07-28 06:32:24,459";"PC5";"ON"
  "2016-07-28 14:15:24,459";"PC5";"OFF"
  "2016-07-29 06:06:24,459";"PC5";"ON"
  "2016-07-29 19:36:24,459";"PC5";"OFF"
  "2016-07-25 15:47:19,423";"Temperature_Cuisine";"26.7"
  "2016-07-25 15:48:20,279";"Temperature_Cuisine";"26.740000000000002"
  "2016-07-25 15:50:00,776";"Temperature_Cuisine";"26.76"
  "2016-07-25 15:55:00,275";"Temperature_Cuisine";"26.72"
  "2016-07-25 16:10:00,202";"Temperature_Cuisine";"26.68"
  "2016-07-25 16:15:00,197";"Temperature_Cuisine";"26.64"
  "2016-07-25 16:24:50,493";"Temperature_Cuisine";"26.560000000000002"
  "2016-07-25 16:29:50,204";"Temperature_Cuisine";"26.5"
  "2016-07-25 16:34:50,177";"Temperature_Cuisine";"26.46"
  "2016-07-25 16:39:50,128";"Temperature_Cuisine";"26.5"
  "2016-07-25 16:44:50,065";"Temperature_Cuisine";"26.52"
  "2016-07-25 15:47:19,423";"Temperature_Salon";"26.34"
  "2016-07-25 15:48:05,264";"Temperature_Salon";"26.38"
  "2016-07-25 15:53:05,275";"Temperature_Salon";"26.36"
  "2016-07-25 15:58:05,252";"Temperature_Salon";"26.34"
  "2016-07-25 16:08:05,234";"Temperature_Salon";"26.32"
  "2016-07-25 16:13:05,237";"Temperature_Salon";"26.28"
  "2016-07-25 16:23:05,172";"Temperature_Salon";"26.22"
  "2016-07-25 16:28:05,244";"Temperature_Salon";"26.16"
  "2016-07-25 16:29:55,490";"Temperature_Salon";"26.14"
  "2016-07-25 15:47:19,423";"PC3";"ON"
  "2016-07-25 15:48:20,279";"PC3";"OFF"
  "2016-07-25 15:50:00,776";"PC3";"ON"
  "2016-07-25 15:55:00,275";"PC3";"OFF"
  "2016-07-25 16:10:00,202";"PC3";"ON"
  "2016-07-25 16:15:00,197";"PC3";"OFF"
  "2016-07-25 16:24:50,493";"PC3";"ON"
  "2016-07-25 16:29:50,204";"PC3";"OFF"
  "2016-07-25 16:34:50,177";"PC3";"ON"
  "2016-07-25 16:39:50,128";"PC3";"OFF"
  "2016-07-25 16:44:50,065";"PC3";"ON"
  `;
        /**
         * Dataset 1
         */
        this.dataExample1 = [];
        /**
         * Dataset 2
         */
        this.dataExample2 = [];
        /**
         * Dataset 3
         */
        this.dataExample3 = [];
        /**
         * Dataset 4
         */
        this.dataExample4 = [];
        /**
         * Dataset 5
         */
        this.dataExample5 = [];
        /**
         * Dataset 6
         */
        this.dataExample6 = [];
        this.generateExample(this.str);
    }
    /**
     * Parse of str to obtain DATA[]
     * @param str
     * @param sensorId
     * @param f
     * @returns DATA[]
     */
    parse(str, sensorId, f) {
        /**
         * Const to parse DATA
         */
        const L = str.trim().split("\n").map(s => s.trim()).filter(s => s !== "")
            .map(s => s.split(";").map(s => s.slice(1, -1)))
            .filter(tab => tab[1] === sensorId)
            .map(([t, id, v]) => ({
            timestamp: (new Date((t.replace(",", "."))).getTime()),
            value: f(v),
            sensorId: id
        }));
        return L;
    }
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
    generateData(str, label, color, style, interpolation, f) {
        let d = this.parse(str, label, f);
        let v = [];
        d.forEach(element => v.push([element.timestamp, element.value]));
        let da = {
            label: label,
            values: v,
            color: color,
            style: style,
            interpolation: interpolation
        };
        return da;
    }
    /**
     * Transform string in number
     * @param s
     * @returns 1 if s=='ON', 0 if s=='OFF' else -1
     */
    parseBool(s) {
        if (s == 'ON')
            return 1;
        else if (s == 'OFF')
            return 0;
        else
            return -1;
    }
    /**
     * Generate all dataset
     * @param str
     */
    generateExample(str) {
        let d2 = this.parse(str, "PC5", this.parseBool);
        let v2 = [];
        d2.forEach(element => v2.push([element.timestamp, element.value]));
        let x = 0;
        v2.forEach(element => {
            element[1] = x;
            x = this.getRandomInt(x);
        });
        let da2 = {
            label: "PC4",
            values: v2,
            color: "purple",
            style: "line",
            interpolation: "linear"
        };
        this.dataExample2.push(this.generateData(str, "PC6", "#124568", "both", "step", this.parseBool));
        this.dataExample1.push(da2);
        this.dataExample4.push(this.generateData(str, "Temperature_Salon", "purple", "line", "linear", parseFloat));
        this.dataExample3.push(this.generateData(str, "PC5", "pink", "line", "step", this.parseBool));
        this.dataExample3.push(this.generateData(str, "PC6", "#124568", "both", "step", this.parseBool));
        this.dataExample5.push(this.generateData(str, "Temperature_Cuisine", "gold", "line", "step", parseFloat));
        this.dataExample6.push(this.generateData(str, "PC3", "green", "both", "step", this.parseBool));
    }
    /**
     * Get +1 or -1 on the param x
     * @param x
     * @returns x+1 or x-1 (random)
     */
    getRandomInt(x) {
        let alea;
        if (x == 0) {
            return 1;
        }
        else {
            alea = Math.round(Math.random());
            if (alea == 0) {
                return x - 1;
            }
            else {
                return x + 1;
            }
        }
    }
}
DataService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0, type: DataService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
DataService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0, type: DataService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0, type: DataService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: function () { return []; } });

class BasicLinechartComponent {
    /**
     * Constructor : Init renderer
     * @param renderer
     */
    constructor(renderer) {
        this.renderer = renderer;
        /**
         * Input width of the component
         * Default value : 900
         */
        this.width = 900;
        /**
         * Input height of the compenent
         * Default value : 200
         */
        this.height = 200;
        /**
         * Input data array that the component display
         * Default value : []
         */
        this.data = [];
        /**
         * Input domain of the Axis Y
         * Works only for continuous values
         * Default value : [0,0]
         */
        this.domain = [0, 0];
        /**
         * Input speed of zoom between 0 and 1
         * Default value : 0.2
         */
        this.speedZoom = 0.2;
        /**
         * Input range of timestamp
         * Default value : [0,0]
         */
        this.range = [0, 0];
        /**
         * Output rangeChange that emit range
         */
        this.rangeChange = new EventEmitter();
        /**
         * Input currentTime
         * Default value : 0
         */
        this.currentTime = 0;
        /**
         * Output currentTimeChange that emit currentTime
         */
        this.currentTimeChange = new EventEmitter();
        /**
         * Title of the component
         */
        this.title = 'Timeline : ';
        /**
         * Margin of the component
         */
        this.margin = { top: 20, right: 20, bottom: 20, left: 50 }; //marge interne au svg 
        /**
         * dataZoom is a copy of data with the range specify
         */
        this.dataZoom = [];
        /**
         * idZoom is the number of wheel notch
         */
        this.idZoom = 0;
        /**
         * It's the smallest timestamp of data
         */
        this.minTime = 0;
        /**
         * It's the biggest timestamp of data
         */
        this.maxTime = 0;
        /**
         * It's the difference between the smallest and the biggest
         */
        this.lengthTime = 0;
        /**
         * Width of the svg
         */
        this.svgWidth = 0;
        /**
         * Height of the svg
         */
        this.svgHeight = 0;
        /**
         * Scale of the X axis
         */
        this.scaleX = d3.scaleTime();
        /**
         * Scale of the Y axis
         */
        this.scaleY = d3.scaleLinear();
        /**
         * Array of area definition
         */
        this.area = [];
        /**
         * Array of line definition
         */
        this.line = [];
        /**
         * data length before the new change
         */
        this.lastDatalength = 0;
        /**
         * Mode of the tooltip
         */
        this.modeToolTips = "normal";
        /**
         * true if the currentTimeline is selected
         */
        this.currentTimeSelected = false;
        /**
         * true if the scrollbar is selected
         */
        this.scrollbarSelected = false;
        /**
         * Last position of the mouse
         */
        this.lastPos = 0;
        /**
         * true if the CTRL Key of keyBoard is push
         */
        this.zoomSelected = false;
    }
    handleKeyDown(event) {
        if (event.ctrlKey && !this.zoomSelected) {
            this.zoomSelected = true;
        }
    }
    handleKeyUp() {
        this.zoomSelected = false;
    }
    /**
     * Copy data in dataZoom, and build title
     */
    ngOnInit() {
        this.dataZoom = [...this.data];
        this.lastDatalength = this.dataZoom.length;
        this.data.forEach((element, index) => {
            if (index == this.data.length - 1)
                this.title = this.title + element.label + '.';
            else
                this.title = this.title + element.label + ', ';
        });
    }
    /**
     * Initialize linechart
     */
    ngAfterViewInit() {
        if (this.timeline != undefined) {
            let w = this.timeline.nativeElement.width.animVal.value;
            let h = this.timeline.nativeElement.height.animVal.value;
            this.svgWidth = (w - this.margin.left) - this.margin.right;
            this.svgHeight = (h - this.margin.top) - this.margin.bottom;
        }
        this.data.forEach((element, index) => this.buildStyleData(element, index));
        this.controlSpeedZoom();
        this.buildZoom();
        this.buildEvent();
        this.drawToolTips();
        this.drawAxis();
        this.drawLineAndPath();
        this.drawLineCurrentTime();
        this.drawScrollbar();
    }
    /**
     * Update linechart on data, range or current time changes
     * @param {SimpleChanges} changes
     */
    ngOnChanges(changes) {
        if (changes.data && !changes.data.firstChange)
            this.updateChart();
        if ((changes.data && !changes.data.firstChange && this.range[0] != 0 && this.range[1] != 0) || (changes.range && !changes.range.firstChange)) {
            this.idZoom = Math.round(Math.log(this.lengthTime / (this.range[1] - this.range[0])) / Math.log(1 + this.speedZoom));
            this.range = this.controlRange(this.range[0], this.range[1] - this.range[0]);
            if (this.data.length != 0) {
                this.updateDataZoom(this.range[0], this.range[1]);
                this.updateSvg(this.range[0], this.range[1]);
            }
        }
        if (changes.currentTime && !changes.currentTime.firstChange && this.data.length != 0)
            this.updateCurrentTime();
    }
    /**
     * Add event listeners on the svg
     */
    buildEvent() {
        this.svg = d3.select(this.timeline.nativeElement)
            .append('g')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
        d3.select(this.timeline.nativeElement).on("mousemove", (event) => {
            if (this.currentTimeSelected)
                this.moveCurrentTime(event);
            else
                this.showInfo(event);
        })
            .on("mouseleave", () => { this.currentTimeSelected = false; this.hideInfo(); })
            .on("wheel", (event) => { if (this.data.length != 0)
            if (this.zoomSelected) {
                this.activeZoom(event);
            } })
            .on("mouseup", () => this.currentTimeSelected = false)
            .on("mouseover", (event) => event.preventDefault());
    }
    /**
     * Build the style (area, line or both) and the interpolation (stpe or linear) of lines
     * @param {Data} element
     * @param {number} index
     */
    buildStyleData(element, index) {
        if (element.style == "area" || element.style == "both") {
            if (element.interpolation == "step") {
                this.area[index] = d3.area()
                    .x((d) => this.scaleX(d[0]))
                    .y0(this.svgHeight)
                    .y1((d) => this.scaleY(d[1]))
                    .curve(d3.curveStepAfter);
            }
            else {
                this.area[index] = d3.area()
                    .x((d) => this.scaleX(d[0]))
                    .y0(this.svgHeight)
                    .y1((d) => this.scaleY(d[1]));
            }
        }
        if (element.style == "line" || element.style == "both") {
            if (element.interpolation == "step") {
                this.line[index] = d3.line()
                    .x((d) => this.scaleX(d[0]))
                    .y((d) => this.scaleY(d[1]))
                    .curve(d3.curveStepAfter);
            }
            else {
                this.line[index] = d3.line()
                    .x((d) => this.scaleX(d[0]))
                    .y((d) => this.scaleY(d[1]));
            }
        }
        if (!this.controlColor(element.color)) {
            console.warn("Data with " + element.label + " label, has an unvalid color attribute (" + element.color + "). Replace with the default color (black).");
            element.color = "black";
        }
    }
    /**
     * Save information for zoom.
     */
    buildZoom() {
        this.minTime = this.scale(this.data, "xMin");
        this.maxTime = this.scale(this.data, "xMax");
        this.lengthTime = this.maxTime - this.minTime;
        this.idZoom = 0;
    }
    /**
     * Draw the tooltips's svg
     */
    drawToolTips() {
        this.tooltip = this.svg.append("g")
            .attr("id", "tooltip")
            .style("display", "none");
        // Le cercle extérieur bleu clair
        this.tooltip.append("circle")
            .attr("fill", "#CCE5F6")
            .attr("r", 10);
        // Le cercle intérieur bleu foncé
        this.tooltip.append("circle")
            .attr("fill", "#3498db")
            .attr("stroke", "#fff")
            .attr("stroke-width", "1.5px")
            .attr("r", 4);
        // Le tooltip en lui-même avec sa pointe vers le bas
        // Il faut le dimensionner en fonction du contenu
        if (this.modeToolTips == "normal") {
            this.tooltip.append("polyline")
                .attr("points", "0,0 0,40 75,40  80,45  85,40  160,40  160,0 0,0")
                .style("fill", "#fafafa")
                .style("stroke", "#3498db")
                .style("opacity", "0.9")
                .style("stroke-width", "1")
                .attr("transform", "translate(-80,-50)");
            this.dataZoom.forEach((element) => {
                // Cet élément contiendra tout notre texte
                let text = this.tooltip.append("text")
                    .style("font-size", "13px")
                    .style("font-family", "Segoe UI")
                    .style("color", element.color)
                    .style("fill", element.color)
                    .attr("transform", "translate(-80,-42)");
                // Element pour la date avec positionnement spécifique
                text.append("tspan")
                    .attr("dx", "7")
                    .attr("dy", "5")
                    .attr("id", "tooltip-date1");
                text.append("tspan")
                    .attr("dx", "-90")
                    .attr("dy", "15")
                    .attr("id", "tooltip-date2");
            });
        }
        else {
            this.tooltip.append("polyline")
                .attr("points", "0,95 , 0,55 , 75,55 , 80,50 , 85,55 , 160,55 , 160,95 0,95")
                .style("fill", "#fafafa")
                .style("stroke", "#3498db")
                .style("opacity", "0.9")
                .style("stroke-width", "1")
                .attr("transform", "translate(-80,-50)");
            this.dataZoom.forEach((element) => {
                // Cet élément contiendra tout notre texte
                let text = this.tooltip.append("text")
                    .style("font-size", "13px")
                    .style("font-family", "Segoe UI")
                    .style("color", element.color)
                    .style("fill", element.color)
                    .attr("transform", "translate(-80,-30)");
                // Element pour la date avec positionnement spécifique
                text.append("tspan")
                    .attr("dx", "7")
                    .attr("dy", 50)
                    .attr("id", "tooltip-date1");
                text.append("tspan")
                    .attr("dx", "-80")
                    .attr("dy", "20")
                    .attr("id", "tooltip-date2");
            });
        }
    }
    /**
     * Draw horizontal and vertical axis and scale
     */
    drawAxis() {
        this.scaleX.range([0, this.svgWidth]);
        this.scaleX.domain([this.minTime, this.maxTime]);
        this.scaleY = d3.scaleLinear();
        this.scaleY.range([this.svgHeight, 0]);
        this.scaleY.domain(this.controlDomain());
        // Configure the X Axis
        this.svg.append('g')
            .attr('transform', 'translate(0,' + this.svgHeight + ')')
            .attr('class', 'xAxis')
            .call(d3.axisBottom(this.scaleX));
        // Configure the Y Axis
        if (this.discreteValue(this.data)) {
            this.svg.append('g')
                .attr('class', 'yAxis')
                .call(d3.axisLeft(this.scaleY).ticks(this.scale(this.data, "yMax")));
        }
        else {
            this.svg.append('g')
                .attr('class', 'yAxis')
                .call(d3.axisLeft(this.scaleY));
        }
    }
    /**
     * Draw lines on the line chart
     */
    drawLineAndPath() {
        this.dataZoom.forEach((element, index) => {
            if (element.style == "area" || element.style == "both") {
                this.svg.append('path')
                    .datum(this.dataZoom[index].values)
                    .attr('class', 'area' + index)
                    .attr('d', this.area[index])
                    .attr("stroke-width", 0.1)
                    .attr('opacity', 0.3)
                    .style('fill', element.color)
                    .style('stroke', element.color)
                    .style('stroke-width', '2px');
            }
            if (element.style == "line" || element.style == "both") {
                this.svg.append('path')
                    .datum(element.values)
                    .attr('class', 'line' + index)
                    .attr('d', this.line[index])
                    .style('fill', 'none')
                    .style('stroke', element.color)
                    .style('stroke-width', '2px');
            }
        });
    }
    /**
     * Draw the vertical line which represents the current time
     */
    drawLineCurrentTime() {
        if (this.data.length != 0) {
            if (this.currentTime == 0) {
                this.currentTime = this.scale(this.data, "xMin");
            }
            let x = 0;
            this.svg.append('path')
                .datum([[this.currentTime, this.controlDomain()[0]], [this.currentTime, this.svgHeight]])
                .attr('class', 'currentTimeLine')
                .attr('d', d3.line()
                .x((d) => x = this.scaleX(d[0]))
                .y((d) => this.scaleY(d[1])))
                .style('fill', 'none')
                .style('stroke', 'red')
                .style('stroke-width', '3px');
            this.svg.append('circle')
                .attr('class', 'currentTimeSelector')
                .attr('cx', x)
                .attr('cy', -13)
                .attr('r', 7)
                .attr('fill', 'red')
                .on("mousedown", () => {
                this.currentTimeSelected = true;
                this.hideInfo();
            });
        }
    }
    /**
     * Draw the scrollbar and event listener on it
     */
    drawScrollbar() {
        this.zoneScrollbar.nativeElement.style.width = this.svgWidth + "px";
        this.zoneScrollbar.nativeElement.style.marginLeft = this.margin.left + "px";
        this.zoneScrollbar.nativeElement.style.height = "20px";
        this.zoneScrollbar.nativeElement.style.backgroundColor = "lightgrey";
        this.zoneScrollbar.nativeElement.style.borderRadius = "10px";
        this.scrollbar.nativeElement.style.width = this.svgWidth + "px";
        this.scrollbar.nativeElement.style.height = "20px";
        this.scrollbar.nativeElement.style.backgroundColor = "grey";
        this.scrollbar.nativeElement.style.borderRadius = "10px";
        this.compo.nativeElement.style.width = this.svgWidth + this.margin.left + "px";
        this.compo.nativeElement.style.padding = "10px 10px 10px 10px";
        this.renderer.listen(this.scrollbar.nativeElement, 'mousedown', (event) => this.activeScrollbar(event));
        this.renderer.listen(window, 'mouseup', () => this.desactiveScrollbar());
        this.renderer.listen(window, 'mousemove', (event) => this.updateRange(event));
    }
    /**
     * Update all the line chart (horizontal and vertical axis and scale, data, lines and range) on data changes.
     */
    updateChart() {
        this.dataZoom = [...this.data];
        this.data.forEach((element, index) => {
            this.buildStyleData(element, index);
            if (element.style == "area")
                this.svg.selectAll('.line' + index).remove();
            if (element.style == "line")
                this.svg.selectAll('.area' + index).remove();
            this.title = 'Timeline : ';
            if (index == this.data.length - 1)
                this.title = this.title + element.label + '.';
            else
                this.title = this.title + element.label + ', ';
        });
        this.buildZoom();
        this.scaleX.domain([this.minTime, this.maxTime]);
        this.scaleY.range([this.svgHeight, 0]);
        this.controlDomain();
        this.scaleY.domain(this.controlDomain());
        if (this.discreteValue(this.data)) {
            this.svg.selectAll('.yAxis')
                .call(d3.axisLeft(this.scaleY).ticks(this.scale(this.data, "yMax")));
        }
        else {
            this.svg.selectAll('.yAxis')
                .call(d3.axisLeft(this.scaleY));
        }
        this.svg.selectAll('.xAxis').call(d3.axisBottom(this.scaleX));
        this.svg.selectAll('.currentTimeLine').remove();
        this.svg.selectAll('.currentTimeSelector').remove();
        this.updateLine();
        this.drawLineCurrentTime();
        this.updateScrollbar(this.minTime, this.maxTime);
        this.updateToolTips();
        for (let index = this.dataZoom.length; index < this.lastDatalength; index++) {
            this.svg.selectAll('.line' + index).remove();
            this.svg.selectAll('.area' + index).remove();
        }
        this.lastDatalength = this.dataZoom.length;
    }
    /**
     * Update horizontal axis, current time line, lines and scrollbar
     * @param {number} min of the new range
     * @param {number} max of the new range
     */
    updateSvg(min, max) {
        this.scaleX.domain([min, max]);
        this.svg.selectAll('.xAxis').call(d3.axisBottom(this.scaleX));
        this.updateLine();
        this.updateCurrentTime();
        this.updateScrollbar(min, max);
    }
    /**
     * Update the display of lines
     */
    updateLine() {
        let lineUpdate;
        let areaUpdate;
        this.dataZoom.forEach((element, index) => {
            if (element.style == "area" || element.style == "both") {
                areaUpdate = this.svg.selectAll('.area' + index).data([this.dataZoom[index].values]);
                areaUpdate
                    .enter()
                    .append("path")
                    .attr('class', 'area' + index)
                    .merge(areaUpdate)
                    .attr('d', this.area[index])
                    .attr("stroke-width", 0.1)
                    .attr('opacity', 0.3)
                    .style('fill', element.color)
                    .style('stroke', element.color)
                    .style('stroke-width', '2px');
            }
            if (element.style == "line" || element.style == "both") {
                lineUpdate = this.svg.selectAll('.line' + index).data([this.dataZoom[index].values]);
                lineUpdate
                    .enter()
                    .append("path")
                    .attr('class', 'line' + index)
                    .merge(lineUpdate)
                    .attr('d', this.line[index])
                    .style('fill', 'none')
                    .style('stroke', element.color)
                    .style('stroke-width', '2px');
            }
        });
    }
    /**
     * Update the position of the current time line
     */
    updateCurrentTime() {
        let lineUpdate = this.svg.selectAll('.currentTimeLine').datum([[this.currentTime, this.controlDomain()[0]], [this.currentTime, this.svgHeight]]);
        let x = 0;
        lineUpdate.enter()
            .append("path")
            .attr('class', 'currentTimeLine')
            .merge(lineUpdate)
            .attr('d', d3.line()
            .x((d) => x = this.scaleX(d[0]))
            .y((d) => this.scaleY(d[1])))
            .style('fill', 'none')
            .style('stroke', 'red')
            .style('stroke-width', '3px');
        if (this.currentTime >= this.scale(this.dataZoom, "xMin") && this.currentTime <= this.scale(this.dataZoom, "xMax")) {
            this.svg.selectAll('.currentTimeLine').attr('display', 'block');
            this.svg.selectAll('.currentTimeSelector').attr('display', 'block');
        }
        else {
            this.svg.selectAll('.currentTimeLine').attr('display', 'none');
            this.svg.selectAll('.currentTimeSelector').attr('display', 'none');
        }
        this.svg.selectAll('.currentTimeSelector').attr('cx', x);
    }
    /**
     * Update the position of the scrollbar
     * @param {number} min of the new range
     * @param {number} max of the new range
     */
    updateScrollbar(min, max) {
        this.scrollbar.nativeElement.style.marginLeft = this.svgWidth * (min - this.minTime) / (this.lengthTime) + "px";
        this.scrollbar.nativeElement.style.width = this.svgWidth * (max - min) / (this.lengthTime) + "px";
    }
    /**
     * Change the range, control it, update datas, update the linechart and then emit the new range.
     * @param {MouseEvent} event
     */
    updateRange(event) {
        if (this.scrollbarSelected) {
            event.preventDefault();
            let lengthLocalTime = this.range[1] - this.range[0];
            let lastMinLocalTime = this.scale(this.dataZoom, "xMin");
            let pos = event.clientX - this.margin.left;
            if (this.lastPos == 0) {
                this.lastPos = pos;
            }
            let minLocalTime = (pos - this.lastPos) * this.lengthTime / this.svgWidth + lastMinLocalTime;
            this.range = this.controlRange(minLocalTime, lengthLocalTime);
            this.updateDataZoom(this.range[0], this.range[1]);
            this.updateSvg(this.range[0], this.range[1]);
            this.rangeChange.emit(this.range);
            this.lastPos = pos;
        }
    }
    /**
     * Change this.dataZoom at range changes
     * @param {number} min of the new range
     * @param {number} max of the new range
     */
    updateDataZoom(min, max) {
        this.data.forEach((element, index) => {
            this.dataZoom[index] = {
                label: element.label,
                values: element.values.filter((element) => min <= element[0] && element[0] <= max),
                color: element.color,
                style: element.style,
                interpolation: element.interpolation
            };
        });
        let time;
        this.data.forEach((element, index) => {
            time = [];
            element.values.forEach((element => time.push(element[0])));
            let i = d3.bisectLeft(time, min) - 1;
            if (i >= 0 && i < this.data[index].values.length) {
                this.dataZoom[index].values.unshift([min, (this.data[index].values[i][1])]);
            }
            this.dataZoom[index].values.push([max, this.dataZoom[index].values[this.dataZoom[index].values.length - 1][1]]);
        });
    }
    /**
     * Remove and build a new tooltips
     */
    updateToolTips() {
        this.tooltip.remove();
        this.drawToolTips();
    }
    /**
     * Active movement of scrollbar on mousedown on it
     * @param {MouseEvent} event
     */
    activeScrollbar(event) {
        if (this.idZoom != 0) {
            this.scrollbarSelected = true;
            this.lastPos = event.clientX - this.margin.left;
        }
    }
    /**
     * Desactive movement of scrollbar on mouseup or mouseleave on it
     */
    desactiveScrollbar() {
        this.scrollbarSelected = false;
        this.lastPos = 0;
    }
    /**
     * Show the tooltips on the movement of the mouse
     * @param {MouseEvent} event
     */
    showInfo(event) {
        if (this.dataZoom[0] != undefined && this.dataZoom.length < 2) {
            var d = 0;
            var t = 0;
            let time = [];
            this.dataZoom[0].values.forEach((element) => time.push(element[0]));
            let x0 = this.scaleX.invert(event.clientX - this.margin.left).getTime();
            let x = d3.bisectRight(time, x0);
            if (x > this.dataZoom[0].values.length - 1)
                x = this.dataZoom[0].values.length - 1;
            else if (x < 0)
                x = 0;
            d = this.dataZoom[0].values[x][1];
            t = this.dataZoom[0].values[x][0];
            let date = new Date(t).toLocaleDateString("fr", { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
            d3.selectAll('#tooltip-date1')
                .text(date);
            d3.selectAll('#tooltip-date2')
                .text(this.roundDecimal(d, 2));
            this.tooltip.style("display", "block");
            this.tooltip.style("opacity", 100);
            this.tooltip.attr("transform", "translate(" + this.scaleX(t) + "," + this.scaleY(d) + ")");
            if (this.scaleY(d) <= 40 * this.dataZoom.length) {
                if (this.modeToolTips != "inverse") {
                    this.modeToolTips = "inverse";
                    this.updateToolTips();
                }
            }
            else {
                if (this.modeToolTips != "normal") {
                    this.modeToolTips = "normal";
                    this.updateToolTips();
                }
            }
        }
    }
    /**
     * Hide the tooltips when the mouse leave the svg
     */
    hideInfo() {
        this.tooltip.style("display", "none");
    }
    /**
     * Update the range (reduce or increase) of the linechart on scroll
     * @param {WheelEvent} event
     */
    activeZoom(event) {
        event.preventDefault();
        let lastLengthLocalTime = this.lengthTime / Math.pow(1 + this.speedZoom, this.idZoom);
        let lastMinLocalTime = this.scale(this.dataZoom, "xMin");
        if ((event.deltaY > 0 && this.idZoom > 0) || event.deltaY < 0) {
            if (event.deltaY > 0 && this.idZoom > 0) {
                this.idZoom--;
            }
            else if (event.deltaY < 0) {
                this.idZoom++;
            }
            let pos = this.scaleX.invert(event.clientX - this.margin.left).getTime();
            let lengthLocalTime = this.lengthTime / Math.pow(1 + this.speedZoom, this.idZoom);
            if (lengthLocalTime > 200) {
                let minLocalTime = (lastMinLocalTime - pos) * (lengthLocalTime / lastLengthLocalTime) + pos;
                this.range = this.controlRange(minLocalTime, lengthLocalTime);
                this.updateDataZoom(this.range[0], this.range[1]);
                this.updateSvg(this.range[0], this.range[1]);
                this.rangeChange.emit(this.range);
            }
            else {
                this.idZoom--;
            }
        }
    }
    /**
     * Update the value of current time on the movement of the mouse
     * @param {MouseEvent} event
     */
    moveCurrentTime(event) {
        event.preventDefault();
        let pos = this.scaleX.invert(event.clientX - this.margin.left).getTime();
        if (pos < this.scale(this.dataZoom, "xMin")) {
            this.currentTime = this.scale(this.dataZoom, "xMin");
        }
        else if (pos > this.scale(this.dataZoom, "xMax")) {
            this.currentTime = this.scale(this.dataZoom, "xMax");
        }
        else {
            this.currentTime = pos;
        }
        this.updateCurrentTime();
        this.currentTimeChange.emit(this.currentTime);
    }
    /**
     * Control the range based on data's timestamp and the new range
     * @param {number} min of the new range
     * @param {number} length of the new range
     * @returns a adjusted range based on data's timestamp
     */
    controlRange(min, length) {
        if (this.minTime > min)
            min = this.minTime;
        let max = min + length;
        if (this.maxTime < max) {
            max = this.maxTime;
            min = max - length;
        }
        if (this.minTime > min)
            min = this.minTime;
        return [min, max];
    }
    /**
     * Control the domain based on data's value type and the input domain
     * @returns a new domain auto-scaled if the input domain is equal to [0,0] or the data's value are positive integers, else return the input domain
     */
    controlDomain() {
        if ((this.domain[0] == 0 && this.domain[1] == 0) || this.discreteValue(this.data)) {
            return [this.scale(this.data, "yMin"), this.scale(this.data, "yMax")];
        }
        else {
            return this.domain;
        }
    }
    /**
     * Control the color based on css-colors-name and hex-color-code
     * @param {string} color
     * @returns false if the param color isn't a css-colors-name or a valid hex-color-code
     */
    controlColor(color) {
        let s = new Option().style;
        s.color = color;
        return s.color != "";
    }
    /**
     * Control the speedZoom if it isn't between 0 and 1.
     */
    controlSpeedZoom() {
        if (this.speedZoom <= 0) {
            this.speedZoom = 0.1;
        }
        else if (this.speedZoom > 1) {
            this.speedZoom = 1;
        }
    }
    /**
     * Determine the minimum or maximum of the horizontal or vertical axis in data
     * @param {Data[]} data Array of Data
     * @param {"xMin" | "xMax" | "yMin" | "yMax"} s precise wihch scale we want
     * @returns the value that matches with the parameter s in data
     */
    scale(data, s) {
        let res = 0;
        data.forEach((elements, index) => elements.values.forEach((element, i) => {
            if ((s == "yMin" && ((i == 0 && index == 0) || element[1] < res)) || (s == "yMax" && ((i == 0 && index == 0) || element[1] > res)))
                res = element[1];
            else if ((s == "xMin" && ((i == 0 && index == 0) || element[0] < res)) || (s == "xMax" && ((i == 0 && index == 0) || element[0] > res)))
                res = element[0];
        }));
        return res;
    }
    /**
    *Check type of data (positive integer or float)
    *@param {Data[]} data Array of Data
    *@returns false if there is at least one value in data that's not a positive integer
    */
    discreteValue(data) {
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].values.length; j++) {
                if (data[i].values[j][1] != Math.round(data[i].values[j][1]))
                    return false;
            }
        }
        return true;
    }
    /**
     * Round a number with a precision
     * @param {number} num
     * @param {number} precision
     * @returns a num with a number of decimal (precision)
     */
    roundDecimal(num, precision) {
        let tmp = Math.pow(10, precision);
        return Math.round(num * tmp) / tmp;
    }
}
BasicLinechartComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0, type: BasicLinechartComponent, deps: [{ token: i0.Renderer2 }], target: i0.ɵɵFactoryTarget.Component });
BasicLinechartComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "12.0.3", type: BasicLinechartComponent, selector: "lib-basic-linechart", inputs: { width: "width", height: "height", data: "data", domain: "domain", speedZoom: "speedZoom", range: "range", currentTime: "currentTime" }, outputs: { rangeChange: "rangeChange", currentTimeChange: "currentTimeChange" }, host: { listeners: { "window:keydown": "handleKeyDown($event)", "window:keyup": "handleKeyUp($event)" } }, viewQueries: [{ propertyName: "timeline", first: true, predicate: ["root"], descendants: true }, { propertyName: "scrollbar", first: true, predicate: ["scroll"], descendants: true }, { propertyName: "zoneScrollbar", first: true, predicate: ["zone"], descendants: true }, { propertyName: "compo", first: true, predicate: ["element"], descendants: true }], usesOnChanges: true, ngImport: i0, template: `
  <div #element>
  <h2>{{ title }}</h2>
  <svg #root [attr.width]="width" [attr.height]="height"></svg>
  <div #zone><div #scroll></div></div>
  </div>
  `, isInline: true });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0, type: BasicLinechartComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'lib-basic-linechart',
                    template: `
  <div #element>
  <h2>{{ title }}</h2>
  <svg #root [attr.width]="width" [attr.height]="height"></svg>
  <div #zone><div #scroll></div></div>
  </div>
  `,
                    styles: []
                }]
        }], ctorParameters: function () { return [{ type: i0.Renderer2 }]; }, propDecorators: { width: [{
                type: Input
            }], height: [{
                type: Input
            }], data: [{
                type: Input
            }], domain: [{
                type: Input
            }], speedZoom: [{
                type: Input
            }], timeline: [{
                type: ViewChild,
                args: ['root']
            }], scrollbar: [{
                type: ViewChild,
                args: ['scroll']
            }], zoneScrollbar: [{
                type: ViewChild,
                args: ['zone']
            }], compo: [{
                type: ViewChild,
                args: ['element']
            }], range: [{
                type: Input
            }], rangeChange: [{
                type: Output
            }], currentTime: [{
                type: Input
            }], currentTimeChange: [{
                type: Output
            }], handleKeyDown: [{
                type: HostListener,
                args: ['window:keydown', ['$event']]
            }], handleKeyUp: [{
                type: HostListener,
                args: ['window:keyup', ['$event']]
            }] } });

class BasicLinechartModule {
}
BasicLinechartModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0, type: BasicLinechartModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
BasicLinechartModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0, type: BasicLinechartModule, declarations: [BasicLinechartComponent], exports: [BasicLinechartComponent] });
BasicLinechartModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0, type: BasicLinechartModule, imports: [[]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0, type: BasicLinechartModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [
                        BasicLinechartComponent,
                    ],
                    imports: [],
                    exports: [
                        BasicLinechartComponent
                    ]
                }]
        }] });

/*
 * Public API Surface of basic-linechart
 */

/**
 * Generated bundle index. Do not edit.
 */

export { BasicLinechartComponent, BasicLinechartModule, DataService };
//# sourceMappingURL=basic-linechart.js.map
