import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import * as i0 from "@angular/core";
export function parseBool(s) {
    if (s == 'ON')
        return 1;
    else if (s == 'OFF')
        return 0;
    else
        return -1;
}
export class BasicLinechartComponent {
    constructor(renderer) {
        this.renderer = renderer;
        this.width = 900;
        this.height = 200;
        this.data = [];
        this.domain = [0, 0];
        this.range = [0, 0];
        this.rangeChange = new EventEmitter();
        this.currentTime = 0;
        this.currentTimeChange = new EventEmitter();
        this.title = 'Timeline : ';
        this.margin = { top: 20, right: 20, bottom: 30, left: 50 }; //marge interne au svg 
        this.dataZoom = [];
        this.idZoom = 0;
        this.minTime = 0;
        this.maxTime = 0;
        this.lengthTime = 0;
        this.svgWidth = 0;
        this.svgHeight = 0;
        this.scaleX = d3.scaleTime();
        this.scaleY = d3.scaleLinear();
        this.area = [];
        this.line = [];
        this.lastDatalength = 0;
        this.modeToolTips = "normal";
        this.currentTimeSelected = false;
        this.scrollbarSelected = false;
        this.lastPos = 0;
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
            this.idZoom = Math.round(Math.log(this.lengthTime / (this.range[1] - this.range[0])) / Math.log(1.5));
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
            this.activeZoom(event); })
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
        this.renderer.listen(this.scrollbar.nativeElement, 'mousedown', (event) => this.activeScrollbar(event));
        this.renderer.listen(this.zoneScrollbar.nativeElement, 'mouseleave', () => this.desactiveScrollbar());
        this.renderer.listen(this.zoneScrollbar.nativeElement, 'mouseup', () => this.desactiveScrollbar());
        this.renderer.listen(this.zoneScrollbar.nativeElement, 'mousemove', (event) => this.updateRange(event));
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
        this.scrollbarSelected = true;
        this.lastPos = event.clientX - this.margin.left;
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
        let lastLengthLocalTime = this.lengthTime / Math.pow(1.5, this.idZoom);
        let lastMinLocalTime = this.scale(this.dataZoom, "xMin");
        if ((event.deltaY > 0 && this.idZoom > 0) || event.deltaY < 0) {
            if (event.deltaY > 0 && this.idZoom > 0) {
                this.idZoom--;
            }
            else if (event.deltaY < 0) {
                this.idZoom++;
            }
            let pos = this.scaleX.invert(event.clientX - this.margin.left).getTime();
            let lengthLocalTime = this.lengthTime / Math.pow(1.5, this.idZoom);
            let minLocalTime = (lastMinLocalTime - pos) * (lengthLocalTime / lastLengthLocalTime) + pos;
            this.range = this.controlRange(minLocalTime, lengthLocalTime);
            if (lengthLocalTime > 10000) {
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
BasicLinechartComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "12.0.3", type: BasicLinechartComponent, selector: "lib-basic-linechart", inputs: { width: "width", height: "height", data: "data", domain: "domain", range: "range", currentTime: "currentTime" }, outputs: { rangeChange: "rangeChange", currentTimeChange: "currentTimeChange" }, viewQueries: [{ propertyName: "timeline", first: true, predicate: ["root"], descendants: true }, { propertyName: "scrollbar", first: true, predicate: ["scroll"], descendants: true }, { propertyName: "zoneScrollbar", first: true, predicate: ["zone"], descendants: true }], usesOnChanges: true, ngImport: i0, template: `
  <h2>{{ title }}</h2>
  <svg #root [attr.width]="width" [attr.height]="height"></svg>
  <div #zone><div #scroll></div></div>
  `, isInline: true });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0, type: BasicLinechartComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'lib-basic-linechart',
                    template: `
  <h2>{{ title }}</h2>
  <svg #root [attr.width]="width" [attr.height]="height"></svg>
  <div #zone><div #scroll></div></div>
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
            }], timeline: [{
                type: ViewChild,
                args: ['root']
            }], scrollbar: [{
                type: ViewChild,
                args: ['scroll']
            }], zoneScrollbar: [{
                type: ViewChild,
                args: ['zone']
            }], range: [{
                type: Input
            }], rangeChange: [{
                type: Output
            }], currentTime: [{
                type: Input
            }], currentTimeChange: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzaWMtbGluZWNoYXJ0LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2Jhc2ljLWxpbmVjaGFydC9zcmMvbGliL2Jhc2ljLWxpbmVjaGFydC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBYyxZQUFZLEVBQUUsS0FBSyxFQUFVLE1BQU0sRUFBNEIsU0FBUyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBR2hJLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFDOztBQVV6QixNQUFNLFVBQVUsU0FBUyxDQUFDLENBQVM7SUFDakMsSUFBRyxDQUFDLElBQUUsSUFBSTtRQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ2hCLElBQUksQ0FBQyxJQUFFLEtBQUs7UUFBRSxPQUFPLENBQUMsQ0FBQzs7UUFDdkIsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNqQixDQUFDO0FBWUQsTUFBTSxPQUFPLHVCQUF1QjtJQW1DbEMsWUFBb0IsUUFBbUI7UUFBbkIsYUFBUSxHQUFSLFFBQVEsQ0FBVztRQWxDOUIsVUFBSyxHQUFXLEdBQUcsQ0FBQztRQUNwQixXQUFNLEdBQVcsR0FBRyxDQUFDO1FBQ3JCLFNBQUksR0FBVyxFQUFFLENBQUM7UUFDbEIsV0FBTSxHQUFxQixDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztRQUlqQyxVQUFLLEdBQW9CLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlCLGdCQUFXLEdBQUcsSUFBSSxZQUFZLEVBQW1CLENBQUM7UUFDbkQsZ0JBQVcsR0FBVyxDQUFDLENBQUM7UUFDdkIsc0JBQWlCLEdBQUcsSUFBSSxZQUFZLEVBQVUsQ0FBQztRQUVsRCxVQUFLLEdBQVUsYUFBYSxDQUFDO1FBQzVCLFdBQU0sR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFB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QUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFFLElBQUksQ0FBQztRQUMzRSxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUN2RCxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLFdBQVcsQ0FBQztRQUNyRSxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQztRQUM3RCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUMsSUFBSSxDQUFDO1FBQzlELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ25ELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsTUFBTSxDQUFDO1FBQzVELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDO1FBQ3pELElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxDQUFDLEtBQWdCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNuSCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQztRQUN0RyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxTQUFT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b0JBQUUsT0FBTyxLQUFLLENBQUM7YUFDekU7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssWUFBWSxDQUFDLEdBQVksRUFBRSxTQUFnQjtRQUNqRCxJQUFJLEdBQUcsR0FBVyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUMxQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUUsR0FBRyxHQUFDLEdBQUcsQ0FBRSxHQUFDLEdBQUcsQ0FBQztJQUNuQyxDQUFDOztvSEE5ckJVLHVCQUF1Qjt3R0FBdkIsdUJBQXVCLDJpQkFSeEI7Ozs7R0FJVDsyRkFJVSx1QkFBdUI7a0JBVm5DLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLHFCQUFxQjtvQkFDL0IsUUFBUSxFQUFFOzs7O0dBSVQ7b0JBQ0QsTUFBTSxFQUFFLEVBQ1A7aUJBQ0Y7Z0dBRVUsS0FBSztzQkFBYixLQUFLO2dCQUNHLE1BQU07c0JBQWQsS0FBSztnQkFDRyxJQUFJO3NCQUFaLEtBQUs7Z0JBQ0csTUFBTTtzQkFBZCxLQUFLO2dCQUNhLFFBQVE7c0JBQTFCLFNBQVM7dUJBQUMsTUFBTTtnQkFDSSxTQUFTO3NCQUE3QixTQUFTO3VCQUFDLFFBQVE7Z0JBQ0EsYUFBYTtzQkFBL0IsU0FBUzt1QkFBQyxNQUFNO2dCQUNSLEtBQUs7c0JBQWIsS0FBSztnQkFDSSxXQUFXO3NCQUFwQixNQUFNO2dCQUNFLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0ksaUJBQWlCO3NCQUExQixNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBFdmVudEVtaXR0ZXIsIElucHV0LCBPbkluaXQsIE91dHB1dCwgUmVuZGVyZXIyLCBTaW1wbGVDaGFuZ2VzLCBWaWV3Q2hpbGQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U2NhbGVUaW1lLCBTY2FsZUxpbmVhcn0gZnJvbSAnZDMtc2NhbGUnO1xuaW1wb3J0IHtTZWxlY3Rpb259IGZyb20gJ2QzLXNlbGVjdGlvbic7XG5pbXBvcnQgKiBhcyBkMyBmcm9tICdkMyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YSB7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIHZhbHVlczogW251bWJlcixudW1iZXJdW107XG4gIGNvbG9yOiBzdHJpbmc7XG4gIHN0eWxlOiBcImxpbmVcIiB8IFwiYXJlYVwiIHwgXCJib3RoXCI7XG4gIGludGVycG9sYXRpb246IFwibGluZWFyXCIgfCBcInN0ZXBcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQm9vbChzOiBzdHJpbmcpIHtcbiAgaWYocz09J09OJykgcmV0dXJuIDE7XG4gIGVsc2UgaWYgKHM9PSdPRkYnKSByZXR1cm4gMDtcbiAgZWxzZSByZXR1cm4gLTE7XG59XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2xpYi1iYXNpYy1saW5lY2hhcnQnLFxuICB0ZW1wbGF0ZTogYFxuICA8aDI+e3sgdGl0bGUgfX08L2gyPlxuICA8c3ZnICNyb290IFthdHRyLndpZHRoXT1cIndpZHRoXCIgW2F0dHIuaGVpZ2h0XT1cImhlaWdodFwiPjwvc3ZnPlxuICA8ZGl2ICN6b25lPjxkaXYgI3Njcm9sbD48L2Rpdj48L2Rpdj5cbiAgYCxcbiAgc3R5bGVzOiBbXG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgQmFzaWNMaW5lY2hhcnRDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICBASW5wdXQoKSB3aWR0aDogbnVtYmVyID0gOTAwO1xuICBASW5wdXQoKSBoZWlnaHQ6IG51bWJlciA9IDIwMDsgXG4gIEBJbnB1dCgpIGRhdGE6IERhdGFbXSA9IFtdO1xuICBASW5wdXQoKSBkb21haW46IFtudW1iZXIsIG51bWJlcl0gPSBbMCwwXTtcbiAgQFZpZXdDaGlsZCgncm9vdCcpIHRpbWVsaW5lITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZCgnc2Nyb2xsJykgc2Nyb2xsYmFyITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZCgnem9uZScpIHpvbmVTY3JvbGxiYXIhOiBFbGVtZW50UmVmO1xuICBASW5wdXQoKSByYW5nZTogW251bWJlcixudW1iZXJdID0gWzAsMF07XG4gIEBPdXRwdXQoKSByYW5nZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8W251bWJlcixudW1iZXJdPigpO1xuICBASW5wdXQoKSBjdXJyZW50VGltZTogbnVtYmVyID0gMDtcbiAgQE91dHB1dCgpIGN1cnJlbnRUaW1lQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KCk7XG5cbiAgcHVibGljIHRpdGxlOnN0cmluZyA9ICdUaW1lbGluZSA6ICc7XG4gIHByaXZhdGUgbWFyZ2luID0geyB0b3A6IDIwLCByaWdodDogMjAsIGJvdHRvbTogMzAsIGxlZnQ6IDUwIH07IC8vbWFyZ2UgaW50ZXJuZSBhdSBzdmcgXG4gIHByaXZhdGUgZGF0YVpvb206IERhdGFbXSA9IFtdO1xuICBwcml2YXRlIGlkWm9vbTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtaW5UaW1lOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1heFRpbWU6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbGVuZ3RoVGltZTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBzdmdXaWR0aDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBzdmdIZWlnaHQ6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgc2NhbGVYOiBTY2FsZVRpbWU8bnVtYmVyLG51bWJlcj4gPSBkMy5zY2FsZVRpbWUoKTtcbiAgcHJpdmF0ZSBzY2FsZVk6IFNjYWxlTGluZWFyPG51bWJlcixudW1iZXI+ID0gZDMuc2NhbGVMaW5lYXIoKTtcbiAgcHJpdmF0ZSBzdmc6IGFueTtcbiAgcHJpdmF0ZSBhcmVhOiBkMy5BcmVhPFtudW1iZXIsIG51bWJlcl0+W10gPSBbXTtcbiAgcHJpdmF0ZSBsaW5lOiBkMy5MaW5lPFtudW1iZXIsIG51bWJlcl0+W10gPSBbXTtcbiAgcHJpdmF0ZSB0b29sdGlwITogU2VsZWN0aW9uPFNWR0dFbGVtZW50LHVua25vd24sbnVsbCx1bmRlZmluZWQ+O1xuICBwcml2YXRlIGxhc3REYXRhbGVuZ3RoOm51bWJlciA9IDA7XG4gIHByaXZhdGUgbW9kZVRvb2xUaXBzOiBcIm5vcm1hbFwiIHwgXCJpbnZlcnNlXCIgPSBcIm5vcm1hbFwiO1xuICBwcml2YXRlIGN1cnJlbnRUaW1lU2VsZWN0ZWQ6Ym9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIHNjcm9sbGJhclNlbGVjdGVkOmJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBsYXN0UG9zOiBudW1iZXIgPSAwO1xuICBcbiAgXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyMikgeyAgIFxuICB9XG5cbiAgLyoqXG4gICAqIENvcHkgZGF0YSBpbiBkYXRhWm9vbSwgYW5kIGJ1aWxkIHRpdGxlIFxuICAgKi9cbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuZGF0YVpvb20gPSBbLi4udGhpcy5kYXRhXTtcbiAgICB0aGlzLmxhc3REYXRhbGVuZ3RoPXRoaXMuZGF0YVpvb20ubGVuZ3RoO1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICBpZihpbmRleD09dGhpcy5kYXRhLmxlbmd0aC0xKSB0aGlzLnRpdGxlID0gdGhpcy50aXRsZStlbGVtZW50LmxhYmVsKycuJztcbiAgICAgIGVsc2UgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUrZWxlbWVudC5sYWJlbCArICcsICc7XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGxpbmVjaGFydFxuICAgKi9cbiAgcHVibGljIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50aW1lbGluZSAhPSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCB3ID0gdGhpcy50aW1lbGluZS5uYXRpdmVFbGVtZW50LndpZHRoLmFuaW1WYWwudmFsdWU7XG4gICAgICBsZXQgaCA9IHRoaXMudGltZWxpbmUubmF0aXZlRWxlbWVudC5oZWlnaHQuYW5pbVZhbC52YWx1ZTtcbiAgICAgIHRoaXMuc3ZnV2lkdGggPSAodyAtIHRoaXMubWFyZ2luLmxlZnQpIC0gdGhpcy5tYXJnaW4ucmlnaHQ7XG4gICAgICB0aGlzLnN2Z0hlaWdodCA9IChoIC0gdGhpcy5tYXJnaW4udG9wKSAtIHRoaXMubWFyZ2luLmJvdHRvbTtcbiAgICB9XG4gICAgdGhpcy5kYXRhLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHRoaXMuYnVpbGRTdHlsZURhdGEoZWxlbWVudCxpbmRleCkpO1xuICAgIHRoaXMuYnVpbGRab29tKCk7IFxuICAgIHRoaXMuYnVpbGRFdmVudCgpO1xuICAgIHRoaXMuZHJhd1Rvb2xUaXBzKCk7XG4gICAgdGhpcy5kcmF3QXhpcygpO1xuICAgIHRoaXMuZHJhd0xpbmVBbmRQYXRoKCk7XG4gICAgdGhpcy5kcmF3TGluZUN1cnJlbnRUaW1lKCk7XG4gICAgdGhpcy5kcmF3U2Nyb2xsYmFyKCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGxpbmVjaGFydCBvbiBkYXRhLCByYW5nZSBvciBjdXJyZW50IHRpbWUgY2hhbmdlc1xuICAgKiBAcGFyYW0ge1NpbXBsZUNoYW5nZXN9IGNoYW5nZXMgXG4gICAqL1xuICBwdWJsaWMgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzLmRhdGEmJiFjaGFuZ2VzLmRhdGEuZmlyc3RDaGFuZ2UpIHRoaXMudXBkYXRlQ2hhcnQoKTtcbiAgICBpZiAoKGNoYW5nZXMuZGF0YSYmIWNoYW5nZXMuZGF0YS5maXJzdENoYW5nZSYmdGhpcy5yYW5nZVswXSE9MCYmdGhpcy5yYW5nZVsxXSE9MCl8fChjaGFuZ2VzLnJhbmdlJiYhY2hhbmdlcy5yYW5nZS5maXJzdENoYW5nZSkpIHtcbiAgICAgIHRoaXMuaWRab29tPU1hdGgucm91bmQoTWF0aC5sb2codGhpcy5sZW5ndGhUaW1lLyh0aGlzLnJhbmdlWzFdLXRoaXMucmFuZ2VbMF0pKS9NYXRoLmxvZygxLjUpKTtcbiAgICAgIHRoaXMucmFuZ2U9dGhpcy5jb250cm9sUmFuZ2UodGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdLXRoaXMucmFuZ2VbMF0pO1xuICAgICAgaWYodGhpcy5kYXRhLmxlbmd0aCE9MCl7XG4gICAgICAgIHRoaXMudXBkYXRlRGF0YVpvb20odGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdmcodGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNoYW5nZXMuY3VycmVudFRpbWUmJiFjaGFuZ2VzLmN1cnJlbnRUaW1lLmZpcnN0Q2hhbmdlJiZ0aGlzLmRhdGEubGVuZ3RoIT0wKSB0aGlzLnVwZGF0ZUN1cnJlbnRUaW1lKCk7XG59XG5cbiAgLyoqXG4gICAqIEFkZCBldmVudCBsaXN0ZW5lcnMgb24gdGhlIHN2Z1xuICAgKi9cbiAgcHJpdmF0ZSBidWlsZEV2ZW50KCk6IHZvaWR7IC8vIGNyZWVyIHVuZSB0aW1lbGluZSBhdmVjIHVuZSBzZXVsIGRvbm7DqWVcbiAgICB0aGlzLnN2ZyA9IGQzLnNlbGVjdCh0aGlzLnRpbWVsaW5lLm5hdGl2ZUVsZW1lbnQpXG4gICAgLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHRoaXMubWFyZ2luLmxlZnQgKyAnLCcgKyB0aGlzLm1hcmdpbi50b3AgKyAnKScpO1xuICAgIGQzLnNlbGVjdCh0aGlzLnRpbWVsaW5lLm5hdGl2ZUVsZW1lbnQpLm9uKFwibW91c2Vtb3ZlXCIsIChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgaWYodGhpcy5jdXJyZW50VGltZVNlbGVjdGVkKSB0aGlzLm1vdmVDdXJyZW50VGltZShldmVudCk7XG4gICAgICBlbHNlIHRoaXMuc2hvd0luZm8oZXZlbnQpO1xuICAgIH0pXG4gICAgLm9uKFwibW91c2VsZWF2ZVwiLCAoKSA9PiB7IHRoaXMuY3VycmVudFRpbWVTZWxlY3RlZCA9IGZhbHNlOyB0aGlzLmhpZGVJbmZvKCkgfSlcbiAgICAub24oXCJ3aGVlbFwiLCAoZXZlbnQ6IFdoZWVsRXZlbnQpID0+IHtpZih0aGlzLmRhdGEubGVuZ3RoIT0wKXRoaXMuYWN0aXZlWm9vbShldmVudCl9KVxuICAgIC5vbihcIm1vdXNldXBcIiwgKCkgPT4gdGhpcy5jdXJyZW50VGltZVNlbGVjdGVkPWZhbHNlKVxuICAgIC5vbihcIm1vdXNlb3ZlclwiLCAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IGV2ZW50LnByZXZlbnREZWZhdWx0KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIHRoZSBzdHlsZSAoYXJlYSwgbGluZSBvciBib3RoKSBhbmQgdGhlIGludGVycG9sYXRpb24gKHN0cGUgb3IgbGluZWFyKSBvZiBsaW5lc1xuICAgKiBAcGFyYW0ge0RhdGF9IGVsZW1lbnQgXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBcbiAgICovXG4gIHByaXZhdGUgYnVpbGRTdHlsZURhdGEoZWxlbWVudDpEYXRhLCBpbmRleDpudW1iZXIpOiB2b2lke1xuICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwiYXJlYVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgIGlmKGVsZW1lbnQuaW50ZXJwb2xhdGlvbj09XCJzdGVwXCIpe1xuICAgICAgICB0aGlzLmFyZWFbaW5kZXhdPWQzLmFyZWEoKVxuICAgICAgICAueCgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgICAueTAodGhpcy5zdmdIZWlnaHQpXG4gICAgICAgIC55MSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKVxuICAgICAgICAuY3VydmUoZDMuY3VydmVTdGVwQWZ0ZXIpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuYXJlYVtpbmRleF09ZDMuYXJlYSgpXG4gICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgIC55MCh0aGlzLnN2Z0hlaWdodClcbiAgICAgICAgLnkxKChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpXG4gICAgICB9XG4gICAgfVxuICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwibGluZVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgIGlmKGVsZW1lbnQuaW50ZXJwb2xhdGlvbj09XCJzdGVwXCIpe1xuICAgICAgICB0aGlzLmxpbmVbaW5kZXhdPWQzLmxpbmUoKVxuICAgICAgICAueCgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgICAueSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKVxuICAgICAgICAuY3VydmUoZDMuY3VydmVTdGVwQWZ0ZXIpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMubGluZVtpbmRleF09ZDMubGluZSgpXG4gICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgIC55KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpXG4gICAgICB9XG4gICAgfVxuICAgIGlmKCF0aGlzLmNvbnRyb2xDb2xvcihlbGVtZW50LmNvbG9yKSl7XG4gICAgICBjb25zb2xlLndhcm4oXCJEYXRhIHdpdGggXCIgKyBlbGVtZW50LmxhYmVsICsgXCIgbGFiZWwsIGhhcyBhbiB1bnZhbGlkIGNvbG9yIGF0dHJpYnV0ZSAoXCIgKyBlbGVtZW50LmNvbG9yICsgXCIpLiBSZXBsYWNlIHdpdGggdGhlIGRlZmF1bHQgY29sb3IgKGJsYWNrKS5cIik7XG4gICAgICBlbGVtZW50LmNvbG9yPVwiYmxhY2tcIjtcbiAgICB9IFxuICB9XG5cbiAgLyoqXG4gICAqIFNhdmUgaW5mb3JtYXRpb24gZm9yIHpvb20uXG4gICAqL1xuICBwcml2YXRlIGJ1aWxkWm9vbSgpOiB2b2lke1xuICAgIHRoaXMubWluVGltZSA9IHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieE1pblwiKTtcbiAgICB0aGlzLm1heFRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInhNYXhcIik7XG4gICAgdGhpcy5sZW5ndGhUaW1lID0gdGhpcy5tYXhUaW1lIC0gdGhpcy5taW5UaW1lO1xuICAgIHRoaXMuaWRab29tPTA7XG4gIH1cblxuICAvKipcbiAgICogRHJhdyB0aGUgdG9vbHRpcHMncyBzdmdcbiAgICovXG4gIHByaXZhdGUgZHJhd1Rvb2xUaXBzKCk6IHZvaWR7IC8vY3JlZXIgbGUgdG9vbHRpcHNcbiAgICB0aGlzLnRvb2x0aXAgPSB0aGlzLnN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0b29sdGlwXCIpXG4gICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgIC8vIExlIGNlcmNsZSBleHTDqXJpZXVyIGJsZXUgY2xhaXJcbiAgICB0aGlzLnRvb2x0aXAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIiNDQ0U1RjZcIilcbiAgICAgICAgLmF0dHIoXCJyXCIsIDEwKTtcbiAgICAvLyBMZSBjZXJjbGUgaW50w6lyaWV1ciBibGV1IGZvbmPDqVxuICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwiIzM0OThkYlwiKVxuICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcIiNmZmZcIilcbiAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgXCIxLjVweFwiKVxuICAgICAgICAuYXR0cihcInJcIiwgNCk7XG4gICAgLy8gTGUgdG9vbHRpcCBlbiBsdWktbcOqbWUgYXZlYyBzYSBwb2ludGUgdmVycyBsZSBiYXNcbiAgICAvLyBJbCBmYXV0IGxlIGRpbWVuc2lvbm5lciBlbiBmb25jdGlvbiBkdSBjb250ZW51XG4gICAgaWYgKHRoaXMubW9kZVRvb2xUaXBzID09IFwibm9ybWFsXCIpIHtcbiAgICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJwb2x5bGluZVwiKVxuICAgICAgICAuYXR0cihcInBvaW50c1wiLCBcIjAsMCAwLDQwIDc1LDQwICA4MCw0NSAgODUsNDAgIDE2MCw0MCAgMTYwLDAgMCwwXCIpXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgXCIjZmFmYWZhXCIpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZVwiLFwiIzM0OThkYlwiKVxuICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsXCIwLjlcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsXCIxXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwtNTApXCIpO1xuICAgICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgIC8vIENldCDDqWzDqW1lbnQgY29udGllbmRyYSB0b3V0IG5vdHJlIHRleHRlXG4gICAgICAgIGxldCB0ZXh0ID0gdGhpcy50b29sdGlwLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAuc3R5bGUoXCJmb250LXNpemVcIiwgXCIxM3B4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiZm9udC1mYW1pbHlcIiwgXCJTZWdvZSBVSVwiKVxuICAgICAgICAgIC5zdHlsZShcImNvbG9yXCIsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwtNDIpXCIpO1xuICAgICAgICAvLyBFbGVtZW50IHBvdXIgbGEgZGF0ZSBhdmVjIHBvc2l0aW9ubmVtZW50IHNww6ljaWZpcXVlXG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiN1wiKVxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCI1XCIpXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTFcIik7XG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiLTkwXCIpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjE1XCIpXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTJcIik7XG4gICAgICB9KTtcbiAgICB9ZWxzZSB7XG4gICAgICB0aGlzLnRvb2x0aXAuYXBwZW5kKFwicG9seWxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJwb2ludHNcIiwgXCIwLDk1ICwgMCw1NSAsIDc1LDU1ICwgODAsNTAgLCA4NSw1NSAsIDE2MCw1NSAsIDE2MCw5NSAwLDk1XCIpXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgXCIjZmFmYWZhXCIpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZVwiLFwiIzM0OThkYlwiKVxuICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsXCIwLjlcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsXCIxXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwtNTApXCIpO1xuICAgICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgIC8vIENldCDDqWzDqW1lbnQgY29udGllbmRyYSB0b3V0IG5vdHJlIHRleHRlXG4gICAgICAgIGxldCB0ZXh0ID0gdGhpcy50b29sdGlwLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAuc3R5bGUoXCJmb250LXNpemVcIiwgXCIxM3B4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiZm9udC1mYW1pbHlcIiwgXCJTZWdvZSBVSVwiKVxuICAgICAgICAgIC5zdHlsZShcImNvbG9yXCIsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwtMzApXCIpO1xuICAgICAgICAvLyBFbGVtZW50IHBvdXIgbGEgZGF0ZSBhdmVjIHBvc2l0aW9ubmVtZW50IHNww6ljaWZpcXVlXG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiN1wiKVxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgNTAgKVxuICAgICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0b29sdGlwLWRhdGUxXCIpO1xuICAgICAgICB0ZXh0LmFwcGVuZChcInRzcGFuXCIpXG4gICAgICAgICAgLmF0dHIoXCJkeFwiLCBcIi04MFwiKVxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCIyMFwiKVxuICAgICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0b29sdGlwLWRhdGUyXCIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERyYXcgaG9yaXpvbnRhbCBhbmQgdmVydGljYWwgYXhpcyBhbmQgc2NhbGVcbiAgICovXG4gIHByaXZhdGUgZHJhd0F4aXMoKTogdm9pZHtcbiAgICB0aGlzLnNjYWxlWC5yYW5nZShbMCwgdGhpcy5zdmdXaWR0aF0pO1xuICAgIHRoaXMuc2NhbGVYLmRvbWFpbihbdGhpcy5taW5UaW1lLHRoaXMubWF4VGltZV0pO1xuICAgIHRoaXMuc2NhbGVZID0gZDMuc2NhbGVMaW5lYXIoKTtcbiAgICB0aGlzLnNjYWxlWS5yYW5nZShbdGhpcy5zdmdIZWlnaHQsIDBdKTtcbiAgICB0aGlzLnNjYWxlWS5kb21haW4odGhpcy5jb250cm9sRG9tYWluKCkpO1xuICAgIC8vIENvbmZpZ3VyZSB0aGUgWCBBeGlzXG4gICAgdGhpcy5zdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsJyArIHRoaXMuc3ZnSGVpZ2h0ICsgJyknKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3hBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNCb3R0b20odGhpcy5zY2FsZVgpKTtcbiAgICAvLyBDb25maWd1cmUgdGhlIFkgQXhpc1xuICAgIGlmKHRoaXMuZGlzY3JldGVWYWx1ZSh0aGlzLmRhdGEpKXtcbiAgICAgIHRoaXMuc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAneUF4aXMnKVxuICAgICAgLmNhbGwoZDMuYXhpc0xlZnQodGhpcy5zY2FsZVkpLnRpY2tzKHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieU1heFwiKSkpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5zdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd5QXhpcycpXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh0aGlzLnNjYWxlWSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3IGxpbmVzIG9uIHRoZSBsaW5lIGNoYXJ0XG4gICAqL1xuICBwcml2YXRlIGRyYXdMaW5lQW5kUGF0aCgpOiB2b2lke1xuICAgIHRoaXMuZGF0YVpvb20uZm9yRWFjaChcbiAgICAgIChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwiYXJlYVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgICAgICB0aGlzLnN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAgIC5kYXR1bSh0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXMpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2FyZWEnK2luZGV4KVxuICAgICAgICAgIC5hdHRyKCdkJywgdGhpcy5hcmVhW2luZGV4XSlcbiAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAwLjEpXG4gICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwLjMpXG4gICAgICAgICAgLnN0eWxlKCdmaWxsJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnMnB4JylcbiAgICAgICAgfVxuICAgICAgICBpZihlbGVtZW50LnN0eWxlPT1cImxpbmVcIiB8fCBlbGVtZW50LnN0eWxlPT1cImJvdGhcIil7XG4gICAgICAgICAgdGhpcy5zdmcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgICAuZGF0dW0oZWxlbWVudC52YWx1ZXMpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmUnK2luZGV4KVxuICAgICAgICAgIC5hdHRyKCdkJywgdGhpcy5saW5lW2luZGV4XSlcbiAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCAnbm9uZScpXG4gICAgICAgICAgLnN0eWxlKCdzdHJva2UnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzJweCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gIH1cblxuICAvKipcbiAgICogRHJhdyB0aGUgdmVydGljYWwgbGluZSB3aGljaCByZXByZXNlbnRzIHRoZSBjdXJyZW50IHRpbWVcbiAgICovXG4gIHByaXZhdGUgZHJhd0xpbmVDdXJyZW50VGltZSgpOiB2b2lke1xuICAgIGlmKHRoaXMuZGF0YS5sZW5ndGghPTApe1xuICAgICAgaWYodGhpcy5jdXJyZW50VGltZT09MCl7XG4gICAgICAgIHRoaXMuY3VycmVudFRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInhNaW5cIik7XG4gICAgICB9XG4gICAgICBsZXQgeDpudW1iZXI9MDtcbiAgICAgIHRoaXMuc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5kYXR1bShbW3RoaXMuY3VycmVudFRpbWUsdGhpcy5jb250cm9sRG9tYWluKClbMF1dLFt0aGlzLmN1cnJlbnRUaW1lLHRoaXMuc3ZnSGVpZ2h0XV0pXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjdXJyZW50VGltZUxpbmUnKVxuICAgICAgICAuYXR0cignZCcsIGQzLmxpbmUoKVxuICAgICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4geD10aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgICAgICAueSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKSlcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgJ25vbmUnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsICdyZWQnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICczcHgnKTtcbiAgICAgIHRoaXMuc3ZnLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2N1cnJlbnRUaW1lU2VsZWN0b3InKVxuICAgICAgICAuYXR0cignY3gnLCB4KVxuICAgICAgICAuYXR0cignY3knLCAtMTMpXG4gICAgICAgIC5hdHRyKCdyJywgNylcbiAgICAgICAgLmF0dHIoJ2ZpbGwnLCAncmVkJylcbiAgICAgICAgLm9uKFwibW91c2Vkb3duXCIsICgpID0+IHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRUaW1lU2VsZWN0ZWQ9dHJ1ZTtcbiAgICAgICAgICB0aGlzLmhpZGVJbmZvKCk7XG4gICAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERyYXcgdGhlIHNjcm9sbGJhciBhbmQgZXZlbnQgbGlzdGVuZXIgb24gaXQgIFxuICAgKi9cbiAgcHJpdmF0ZSBkcmF3U2Nyb2xsYmFyKCk6IHZvaWR7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUud2lkdGggPSB0aGlzLnN2Z1dpZHRoK1wicHhcIjtcbiAgICB0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5tYXJnaW5MZWZ0ID0gdGhpcy5tYXJnaW4ubGVmdCsgXCJweFwiO1xuICAgIHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmhlaWdodCA9IFwiMjBweFwiO1xuICAgIHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwibGlnaHRncmV5XCI7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCIxMHB4XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS53aWR0aCA9IHRoaXMuc3ZnV2lkdGgrXCJweFwiO1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gXCIyMHB4XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcImdyZXlcIjtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmJvcmRlclJhZGl1cyA9IFwiMTBweFwiO1xuICAgIHRoaXMucmVuZGVyZXIubGlzdGVuKHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQsICdtb3VzZWRvd24nLCAoZXZlbnQ6TW91c2VFdmVudCkgPT4gdGhpcy5hY3RpdmVTY3JvbGxiYXIoZXZlbnQpKTtcbiAgICB0aGlzLnJlbmRlcmVyLmxpc3Rlbih0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudCwgJ21vdXNlbGVhdmUnLCAoKSA9PiB0aGlzLmRlc2FjdGl2ZVNjcm9sbGJhcigpKTtcbiAgICB0aGlzLnJlbmRlcmVyLmxpc3Rlbih0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudCwgJ21vdXNldXAnLCAoKSA9PiB0aGlzLmRlc2FjdGl2ZVNjcm9sbGJhcigpKTtcbiAgICB0aGlzLnJlbmRlcmVyLmxpc3Rlbih0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudCwnbW91c2Vtb3ZlJywgKGV2ZW50Ok1vdXNlRXZlbnQpID0+IHRoaXMudXBkYXRlUmFuZ2UoZXZlbnQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgYWxsIHRoZSBsaW5lIGNoYXJ0IChob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBheGlzIGFuZCBzY2FsZSwgZGF0YSwgbGluZXMgYW5kIHJhbmdlKSBvbiBkYXRhIGNoYW5nZXMuIFxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVDaGFydCgpOiB2b2lke1xuICAgIHRoaXMuZGF0YVpvb20gPSBbLi4udGhpcy5kYXRhXTtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaChcbiAgICAgIChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICAgIHRoaXMuYnVpbGRTdHlsZURhdGEoZWxlbWVudCxpbmRleCk7XG4gICAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwiYXJlYVwiKSB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5saW5lJytpbmRleCkucmVtb3ZlKCk7XG4gICAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwibGluZVwiKSB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5hcmVhJytpbmRleCkucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMudGl0bGUgPSAnVGltZWxpbmUgOiAnO1xuICAgICAgICBpZihpbmRleD09dGhpcy5kYXRhLmxlbmd0aC0xKSB0aGlzLnRpdGxlID0gdGhpcy50aXRsZStlbGVtZW50LmxhYmVsKycuJztcbiAgICAgICAgZWxzZSB0aGlzLnRpdGxlID0gdGhpcy50aXRsZStlbGVtZW50LmxhYmVsICsgJywgJztcbiAgICB9KVxuICAgIHRoaXMuYnVpbGRab29tKCk7XG4gICAgdGhpcy5zY2FsZVguZG9tYWluKFt0aGlzLm1pblRpbWUsdGhpcy5tYXhUaW1lXSk7XG4gICAgdGhpcy5zY2FsZVkucmFuZ2UoW3RoaXMuc3ZnSGVpZ2h0LCAwXSk7XG4gICAgdGhpcy5jb250cm9sRG9tYWluKCk7XG4gICAgdGhpcy5zY2FsZVkuZG9tYWluKHRoaXMuY29udHJvbERvbWFpbigpKTtcbiAgICBpZih0aGlzLmRpc2NyZXRlVmFsdWUodGhpcy5kYXRhKSl7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy55QXhpcycpXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh0aGlzLnNjYWxlWSkudGlja3ModGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ5TWF4XCIpKSk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy55QXhpcycpXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh0aGlzLnNjYWxlWSkpO1xuICAgIH1cbiAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy54QXhpcycpLmNhbGwoZDMuYXhpc0JvdHRvbSh0aGlzLnNjYWxlWCkpO1xuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lTGluZScpLnJlbW92ZSgpO1xuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lU2VsZWN0b3InKS5yZW1vdmUoKTtcbiAgICB0aGlzLnVwZGF0ZUxpbmUoKTtcbiAgICB0aGlzLmRyYXdMaW5lQ3VycmVudFRpbWUoKTtcbiAgICB0aGlzLnVwZGF0ZVNjcm9sbGJhcih0aGlzLm1pblRpbWUsdGhpcy5tYXhUaW1lKTtcbiAgICB0aGlzLnVwZGF0ZVRvb2xUaXBzKCk7XG4gICAgZm9yKGxldCBpbmRleD10aGlzLmRhdGFab29tLmxlbmd0aDsgaW5kZXg8dGhpcy5sYXN0RGF0YWxlbmd0aDsgaW5kZXgrKyl7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5saW5lJytpbmRleCkucmVtb3ZlKCk7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5hcmVhJytpbmRleCkucmVtb3ZlKCk7XG4gICAgfVxuICAgIHRoaXMubGFzdERhdGFsZW5ndGg9dGhpcy5kYXRhWm9vbS5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGhvcml6b250YWwgYXhpcywgY3VycmVudCB0aW1lIGxpbmUsIGxpbmVzIGFuZCBzY3JvbGxiYXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbiBvZiB0aGUgbmV3IHJhbmdlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtYXggb2YgdGhlIG5ldyByYW5nZVxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVTdmcobWluOiBudW1iZXIsIG1heDogbnVtYmVyKXtcbiAgICB0aGlzLnNjYWxlWC5kb21haW4oW21pbixtYXhdKTtcbiAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy54QXhpcycpLmNhbGwoZDMuYXhpc0JvdHRvbSh0aGlzLnNjYWxlWCkpO1xuICAgIHRoaXMudXBkYXRlTGluZSgpO1xuICAgIHRoaXMudXBkYXRlQ3VycmVudFRpbWUoKTtcbiAgICB0aGlzLnVwZGF0ZVNjcm9sbGJhcihtaW4sbWF4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGRpc3BsYXkgb2YgbGluZXNcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlTGluZSgpOiB2b2lke1xuICAgIGxldCBsaW5lVXBkYXRlO1xuICAgIGxldCBhcmVhVXBkYXRlO1xuICAgIHRoaXMuZGF0YVpvb20uZm9yRWFjaCgoZWxlbWVudCxpbmRleCkgPT4ge1xuICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJhcmVhXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgICBhcmVhVXBkYXRlPSB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5hcmVhJytpbmRleCkuZGF0YShbdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzXSk7XG4gICAgICAgIGFyZWFVcGRhdGVcbiAgICAgICAgLmVudGVyKClcbiAgICAgICAgLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2FyZWEnK2luZGV4KVxuICAgICAgICAubWVyZ2UoYXJlYVVwZGF0ZSlcbiAgICAgICAgLmF0dHIoJ2QnLCB0aGlzLmFyZWFbaW5kZXhdKVxuICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAwLjEpXG4gICAgICAgIC5hdHRyKCdvcGFjaXR5JywgMC4zKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzJweCcpO1xuICAgICAgfVxuICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJsaW5lXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgICBsaW5lVXBkYXRlPSB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5saW5lJytpbmRleCkuZGF0YShbdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzXSk7XG4gICAgICAgIGxpbmVVcGRhdGVcbiAgICAgICAgLmVudGVyKClcbiAgICAgICAgLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmUnK2luZGV4KVxuICAgICAgICAubWVyZ2UobGluZVVwZGF0ZSlcbiAgICAgICAgLmF0dHIoJ2QnLCB0aGlzLmxpbmVbaW5kZXhdKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCAnbm9uZScpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnMnB4JylcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZSBjdXJyZW50IHRpbWUgbGluZVxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVDdXJyZW50VGltZSgpOiB2b2lke1xuICAgIGxldCBsaW5lVXBkYXRlID0gdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVMaW5lJykuZGF0dW0oW1t0aGlzLmN1cnJlbnRUaW1lLHRoaXMuY29udHJvbERvbWFpbigpWzBdXSxbdGhpcy5jdXJyZW50VGltZSx0aGlzLnN2Z0hlaWdodF1dKTtcbiAgICBsZXQgeDpudW1iZXI9MDtcbiAgICBsaW5lVXBkYXRlLmVudGVyKClcbiAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgIC5hdHRyKCdjbGFzcycsICdjdXJyZW50VGltZUxpbmUnKVxuICAgIC5tZXJnZShsaW5lVXBkYXRlKVxuICAgIC5hdHRyKCdkJywgZDMubGluZSgpXG4gICAgICAueCgoZDogbnVtYmVyW10pID0+IHg9dGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAueSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKSlcbiAgICAuc3R5bGUoJ2ZpbGwnLCAnbm9uZScpXG4gICAgLnN0eWxlKCdzdHJva2UnLCAncmVkJylcbiAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICczcHgnKTtcbiAgICBpZih0aGlzLmN1cnJlbnRUaW1lPj10aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpJiZ0aGlzLmN1cnJlbnRUaW1lPD10aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWF4XCIpKXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lTGluZScpLmF0dHIoJ2Rpc3BsYXknLCdibG9jaycpO1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVTZWxlY3RvcicpLmF0dHIoJ2Rpc3BsYXknLCdibG9jaycpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVMaW5lJykuYXR0cignZGlzcGxheScsJ25vbmUnKTtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lU2VsZWN0b3InKS5hdHRyKCdkaXNwbGF5Jywnbm9uZScpO1xuICAgIH1cbiAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZVNlbGVjdG9yJykuYXR0cignY3gnLHgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcG9zaXRpb24gb2YgdGhlIHNjcm9sbGJhclxuICAgKiBAcGFyYW0ge251bWJlcn0gbWluIG9mIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heCBvZiB0aGUgbmV3IHJhbmdlXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZVNjcm9sbGJhcihtaW46bnVtYmVyLCBtYXg6bnVtYmVyKTogdm9pZHtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLm1hcmdpbkxlZnQ9IHRoaXMuc3ZnV2lkdGgqKG1pbi10aGlzLm1pblRpbWUpLyh0aGlzLmxlbmd0aFRpbWUpICsgXCJweFwiO1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUud2lkdGg9IHRoaXMuc3ZnV2lkdGgqKG1heC1taW4pLyh0aGlzLmxlbmd0aFRpbWUpICsgXCJweFwiO1xuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZSB0aGUgcmFuZ2UsIGNvbnRyb2wgaXQsIHVwZGF0ZSBkYXRhcywgdXBkYXRlIHRoZSBsaW5lY2hhcnQgYW5kIHRoZW4gZW1pdCB0aGUgbmV3IHJhbmdlLlxuICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVSYW5nZShldmVudDogTW91c2VFdmVudCk6IHZvaWR7XG4gICAgaWYodGhpcy5zY3JvbGxiYXJTZWxlY3RlZCl7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgbGV0IGxlbmd0aExvY2FsVGltZSA9IHRoaXMucmFuZ2VbMV0tdGhpcy5yYW5nZVswXTtcbiAgICAgIGxldCBsYXN0TWluTG9jYWxUaW1lID0gdGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1pblwiKTtcbiAgICAgIGxldCBwb3MgPSBldmVudC5jbGllbnRYLXRoaXMubWFyZ2luLmxlZnQ7XG4gICAgICBpZih0aGlzLmxhc3RQb3M9PTApe1xuICAgICAgICB0aGlzLmxhc3RQb3M9IHBvcztcbiAgICAgIH1cbiAgICAgIGxldCBtaW5Mb2NhbFRpbWUgPSAocG9zLXRoaXMubGFzdFBvcykqdGhpcy5sZW5ndGhUaW1lL3RoaXMuc3ZnV2lkdGggKyBsYXN0TWluTG9jYWxUaW1lO1xuICAgICAgdGhpcy5yYW5nZSA9IHRoaXMuY29udHJvbFJhbmdlKG1pbkxvY2FsVGltZSxsZW5ndGhMb2NhbFRpbWUpO1xuICAgICAgdGhpcy51cGRhdGVEYXRhWm9vbSh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgdGhpcy51cGRhdGVTdmcodGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgIHRoaXMucmFuZ2VDaGFuZ2UuZW1pdCh0aGlzLnJhbmdlKTtcbiAgICAgIHRoaXMubGFzdFBvcz1wb3M7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZSB0aGlzLmRhdGFab29tIGF0IHJhbmdlIGNoYW5nZXNcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbiBvZiB0aGUgbmV3IHJhbmdlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtYXggb2YgdGhlIG5ldyByYW5nZSBcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlRGF0YVpvb20obWluOm51bWJlcixtYXg6bnVtYmVyKTogdm9pZHtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaCgoZWxlbWVudCxpbmRleCkgPT4ge1xuICAgICAgdGhpcy5kYXRhWm9vbVtpbmRleF09e1xuICAgICAgICBsYWJlbDogZWxlbWVudC5sYWJlbCxcbiAgICAgICAgdmFsdWVzOiBlbGVtZW50LnZhbHVlcy5maWx0ZXIoKGVsZW1lbnQ6IG51bWJlcltdKSA9PiBtaW4gPD0gZWxlbWVudFswXSAmJiBlbGVtZW50WzBdIDw9ICBtYXgpLFxuICAgICAgICBjb2xvcjogZWxlbWVudC5jb2xvcixcbiAgICAgICAgc3R5bGU6IGVsZW1lbnQuc3R5bGUsXG4gICAgICAgIGludGVycG9sYXRpb246IGVsZW1lbnQuaW50ZXJwb2xhdGlvblxuICAgIH19KSBcbiAgICBsZXQgdGltZTogbnVtYmVyW107XG4gICAgdGhpcy5kYXRhLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgIHRpbWU9W107XG4gICAgICBlbGVtZW50LnZhbHVlcy5mb3JFYWNoKChlbGVtZW50ID0+IHRpbWUucHVzaChlbGVtZW50WzBdKSkpO1xuICAgICAgbGV0IGkgPSBkMy5iaXNlY3RMZWZ0KHRpbWUsIG1pbiktMTtcbiAgICAgIGlmKGk+PTAmJmk8dGhpcy5kYXRhW2luZGV4XS52YWx1ZXMubGVuZ3RoKXtcbiAgICAgICAgdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzLnVuc2hpZnQoW21pbiwodGhpcy5kYXRhW2luZGV4XS52YWx1ZXNbaV1bMV0pXSk7XG4gICAgICB9XG4gICAgICB0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXMucHVzaChbbWF4LHRoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlc1t0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXMubGVuZ3RoLTFdWzFdXSk7XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW5kIGJ1aWxkIGEgbmV3IHRvb2x0aXBzXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZVRvb2xUaXBzKCk6IHZvaWR7XG4gICAgdGhpcy50b29sdGlwLnJlbW92ZSgpO1xuICAgIHRoaXMuZHJhd1Rvb2xUaXBzKCk7XG4gIH1cblxuICAvKipcbiAgICogQWN0aXZlIG1vdmVtZW50IG9mIHNjcm9sbGJhciBvbiBtb3VzZWRvd24gb24gaXRcbiAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBcbiAgICovIFxuICBwcml2YXRlIGFjdGl2ZVNjcm9sbGJhcihldmVudDogTW91c2VFdmVudCk6IHZvaWR7XG4gICAgdGhpcy5zY3JvbGxiYXJTZWxlY3RlZD10cnVlO1xuICAgIHRoaXMubGFzdFBvcz1ldmVudC5jbGllbnRYLXRoaXMubWFyZ2luLmxlZnQ7XG4gIH1cblxuICAvKipcbiAgICogRGVzYWN0aXZlIG1vdmVtZW50IG9mIHNjcm9sbGJhciBvbiBtb3VzZXVwIG9yIG1vdXNlbGVhdmUgb24gaXRcbiAgICovXG4gIHByaXZhdGUgZGVzYWN0aXZlU2Nyb2xsYmFyKCk6IHZvaWR7XG4gICAgdGhpcy5zY3JvbGxiYXJTZWxlY3RlZD1mYWxzZTtcbiAgICB0aGlzLmxhc3RQb3M9MDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaG93IHRoZSB0b29sdGlwcyBvbiB0aGUgbW92ZW1lbnQgb2YgdGhlIG1vdXNlXG4gICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgXG4gICAqL1xuICBwcml2YXRlIHNob3dJbmZvKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZHtcbiAgICBpZiAodGhpcy5kYXRhWm9vbVswXSAhPSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhWm9vbS5sZW5ndGggPDIpIHtcbiAgICAgIHZhciBkOiBudW1iZXI9MDtcbiAgICAgIHZhciB0OiBudW1iZXI9MDtcbiAgICAgIGxldCB0aW1lOiBudW1iZXJbXSA9IFtdO1xuICAgICAgdGhpcy5kYXRhWm9vbVswXS52YWx1ZXMuZm9yRWFjaCgoZWxlbWVudCkgPT4gdGltZS5wdXNoKGVsZW1lbnRbMF0pKTtcbiAgICAgIGxldCB4MCA9IHRoaXMuc2NhbGVYLmludmVydChldmVudC5jbGllbnRYIC0gdGhpcy5tYXJnaW4ubGVmdCkuZ2V0VGltZSgpO1xuICAgICAgbGV0IHggPSBkMy5iaXNlY3RSaWdodCh0aW1lLCB4MCk7XG4gICAgICBpZih4PnRoaXMuZGF0YVpvb21bMF0udmFsdWVzLmxlbmd0aC0xKXg9dGhpcy5kYXRhWm9vbVswXS52YWx1ZXMubGVuZ3RoLTE7XG4gICAgICBlbHNlIGlmICh4IDwgMCkgeCA9IDA7XG4gICAgICAgIGQgID0gdGhpcy5kYXRhWm9vbVswXS52YWx1ZXNbeF1bMV07XG4gICAgICAgIHQgPSB0aGlzLmRhdGFab29tWzBdLnZhbHVlc1t4XVswXTtcbiAgICAgIGxldCBkYXRlID0gbmV3IERhdGUodCkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZnJcIiwgeyB5ZWFyOiAnbnVtZXJpYycsIG1vbnRoOiAnbG9uZycsIGRheTogJ251bWVyaWMnLCBob3VyOiAnbnVtZXJpYycsIG1pbnV0ZTogJ251bWVyaWMnLCBzZWNvbmQ6ICdudW1lcmljJyB9KTtcbiAgICAgIGQzLnNlbGVjdEFsbCgnI3Rvb2x0aXAtZGF0ZTEnKVxuICAgICAgICAudGV4dChkYXRlKTtcbiAgICAgIGQzLnNlbGVjdEFsbCgnI3Rvb2x0aXAtZGF0ZTInKVxuICAgICAgICAudGV4dCh0aGlzLnJvdW5kRGVjaW1hbChkLCAyKSk7XG4gICAgICB0aGlzLnRvb2x0aXAuc3R5bGUoXCJkaXNwbGF5XCIsXCJibG9ja1wiKTtcbiAgICAgIHRoaXMudG9vbHRpcC5zdHlsZShcIm9wYWNpdHlcIiwgMTAwKTtcbiAgICAgIHRoaXMudG9vbHRpcC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgdGhpcy5zY2FsZVgodCkgKyBcIixcIiArIHRoaXMuc2NhbGVZKGQpICsgXCIpXCIpO1xuICAgICAgaWYgKHRoaXMuc2NhbGVZKGQpIDw9IDQwICogdGhpcy5kYXRhWm9vbS5sZW5ndGgpIHtcbiAgICAgICAgaWYgKHRoaXMubW9kZVRvb2xUaXBzICE9IFwiaW52ZXJzZVwiKSB7XG4gICAgICAgICAgdGhpcy5tb2RlVG9vbFRpcHMgPSBcImludmVyc2VcIjtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVRvb2xUaXBzKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLm1vZGVUb29sVGlwcyAhPSBcIm5vcm1hbFwiKSB7XG4gICAgICAgICAgdGhpcy5tb2RlVG9vbFRpcHMgPSBcIm5vcm1hbFwiO1xuICAgICAgICAgIHRoaXMudXBkYXRlVG9vbFRpcHMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIaWRlIHRoZSB0b29sdGlwcyB3aGVuIHRoZSBtb3VzZSBsZWF2ZSB0aGUgc3ZnIFxuICAgKi8gICBcbiAgcHJpdmF0ZSBoaWRlSW5mbygpOiB2b2lke1xuICAgIHRoaXMudG9vbHRpcC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcmFuZ2UgKHJlZHVjZSBvciBpbmNyZWFzZSkgb2YgdGhlIGxpbmVjaGFydCBvbiBzY3JvbGwgXG4gICAqIEBwYXJhbSB7V2hlZWxFdmVudH0gZXZlbnQgXG4gICAqL1xuICBwcml2YXRlIGFjdGl2ZVpvb20oZXZlbnQ6IFdoZWVsRXZlbnQpOiB2b2lke1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgbGV0IGxhc3RMZW5ndGhMb2NhbFRpbWUgPSB0aGlzLmxlbmd0aFRpbWUgLyBNYXRoLnBvdygxLjUsdGhpcy5pZFpvb20pO1xuICAgIGxldCBsYXN0TWluTG9jYWxUaW1lID0gdGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1pblwiKTtcbiAgICBpZigoZXZlbnQuZGVsdGFZPjAmJnRoaXMuaWRab29tPjApfHxldmVudC5kZWx0YVk8MCl7XG4gICAgICBpZihldmVudC5kZWx0YVk+MCYmdGhpcy5pZFpvb20+MCl7XG4gICAgICAgIHRoaXMuaWRab29tLS07XG4gICAgICB9ZWxzZSBpZihldmVudC5kZWx0YVk8MCl7XG4gICAgICAgIHRoaXMuaWRab29tKys7IFxuICAgICAgfVxuICAgICAgbGV0IHBvcyA9IHRoaXMuc2NhbGVYLmludmVydChldmVudC5jbGllbnRYLXRoaXMubWFyZ2luLmxlZnQpLmdldFRpbWUoKTtcbiAgICAgIGxldCBsZW5ndGhMb2NhbFRpbWUgPSB0aGlzLmxlbmd0aFRpbWUgLyBNYXRoLnBvdygxLjUsdGhpcy5pZFpvb20pO1xuICAgICAgbGV0IG1pbkxvY2FsVGltZSA9IChsYXN0TWluTG9jYWxUaW1lLXBvcykqKGxlbmd0aExvY2FsVGltZS9sYXN0TGVuZ3RoTG9jYWxUaW1lKSArIHBvcztcbiAgICAgIHRoaXMucmFuZ2UgPSB0aGlzLmNvbnRyb2xSYW5nZShtaW5Mb2NhbFRpbWUsbGVuZ3RoTG9jYWxUaW1lKTtcbiAgICAgIGlmKGxlbmd0aExvY2FsVGltZT4xMDAwMCl7XG4gICAgICAgIHRoaXMudXBkYXRlRGF0YVpvb20odGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdmcodGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgICAgdGhpcy5yYW5nZUNoYW5nZS5lbWl0KHRoaXMucmFuZ2UpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuaWRab29tLS07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgdmFsdWUgb2YgY3VycmVudCB0aW1lIG9uIHRoZSBtb3ZlbWVudCBvZiB0aGUgbW91c2VcbiAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBcbiAgICovXG4gIHByaXZhdGUgbW92ZUN1cnJlbnRUaW1lKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGxldCBwb3MgPSB0aGlzLnNjYWxlWC5pbnZlcnQoZXZlbnQuY2xpZW50WC10aGlzLm1hcmdpbi5sZWZ0KS5nZXRUaW1lKCk7XG4gICAgaWYocG9zPHRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNaW5cIikpe1xuICAgICAgdGhpcy5jdXJyZW50VGltZT10aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpO1xuICAgIH1lbHNlIGlmKHBvcz50aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWF4XCIpKXtcbiAgICAgIHRoaXMuY3VycmVudFRpbWU9dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1heFwiKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuY3VycmVudFRpbWU9cG9zO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUN1cnJlbnRUaW1lKCk7XG4gICAgdGhpcy5jdXJyZW50VGltZUNoYW5nZS5lbWl0KHRoaXMuY3VycmVudFRpbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnRyb2wgdGhlIHJhbmdlIGJhc2VkIG9uIGRhdGEncyB0aW1lc3RhbXAgYW5kIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbiBvZiB0aGUgbmV3IHJhbmdlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGggb2YgdGhlIG5ldyByYW5nZVxuICAgKiBAcmV0dXJucyBhIGFkanVzdGVkIHJhbmdlIGJhc2VkIG9uIGRhdGEncyB0aW1lc3RhbXBcbiAgICovXG4gIHByaXZhdGUgY29udHJvbFJhbmdlKG1pbjpudW1iZXIsIGxlbmd0aDpudW1iZXIpIDogW251bWJlcixudW1iZXJde1xuICAgIGlmKHRoaXMubWluVGltZT5taW4pIG1pbj10aGlzLm1pblRpbWU7XG4gICAgbGV0IG1heCA9IG1pbiArIGxlbmd0aDtcbiAgICBpZih0aGlzLm1heFRpbWU8bWF4KXtcbiAgICAgIG1heD10aGlzLm1heFRpbWU7XG4gICAgICBtaW49bWF4IC0gbGVuZ3RoO1xuICAgIH1cbiAgICBpZih0aGlzLm1pblRpbWU+bWluKSBtaW49dGhpcy5taW5UaW1lO1xuICAgIHJldHVybiBbbWluLG1heF07XG4gIH1cblxuICAvKipcbiAgICogQ29udHJvbCB0aGUgZG9tYWluIGJhc2VkIG9uIGRhdGEncyB2YWx1ZSB0eXBlIGFuZCB0aGUgaW5wdXQgZG9tYWluXG4gICAqIEByZXR1cm5zIGEgbmV3IGRvbWFpbiBhdXRvLXNjYWxlZCBpZiB0aGUgaW5wdXQgZG9tYWluIGlzIGVxdWFsIHRvIFswLDBdIG9yIHRoZSBkYXRhJ3MgdmFsdWUgYXJlIHBvc2l0aXZlIGludGVnZXJzLCBlbHNlIHJldHVybiB0aGUgaW5wdXQgZG9tYWluIFxuICAgKi9cbiAgcHJpdmF0ZSBjb250cm9sRG9tYWluKCk6W251bWJlcixudW1iZXJde1xuICAgIGlmKCh0aGlzLmRvbWFpblswXT09MCYmdGhpcy5kb21haW5bMV09PTApfHx0aGlzLmRpc2NyZXRlVmFsdWUodGhpcy5kYXRhKSl7XG4gICAgICByZXR1cm4gW3RoaXMuc2NhbGUodGhpcy5kYXRhLFwieU1pblwiKSx0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInlNYXhcIildO1xuICAgIH1lbHNle1xuICAgICAgcmV0dXJuIHRoaXMuZG9tYWluO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb250cm9sIHRoZSBjb2xvciBiYXNlZCBvbiBjc3MtY29sb3JzLW5hbWUgYW5kIGhleC1jb2xvci1jb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciBcbiAgICogQHJldHVybnMgZmFsc2UgaWYgdGhlIHBhcmFtIGNvbG9yIGlzbid0IGEgY3NzLWNvbG9ycy1uYW1lIG9yIGEgdmFsaWQgaGV4LWNvbG9yLWNvZGVcbiAgICovXG4gIHByaXZhdGUgY29udHJvbENvbG9yKGNvbG9yOiBzdHJpbmcpOmJvb2xlYW57XG4gICAgbGV0IHMgPSBuZXcgT3B0aW9uKCkuc3R5bGU7XG4gICAgcy5jb2xvciA9IGNvbG9yO1xuICAgIHJldHVybiBzLmNvbG9yIT1cIlwiO1xuICB9XG5cbiAgLyoqIFxuICAgKiBEZXRlcm1pbmUgdGhlIG1pbmltdW0gb3IgbWF4aW11bSBvZiB0aGUgaG9yaXpvbnRhbCBvciB2ZXJ0aWNhbCBheGlzIGluIGRhdGFcbiAgICogQHBhcmFtIHtEYXRhW119IGRhdGEgQXJyYXkgb2YgRGF0YVxuICAgKiBAcGFyYW0ge1wieE1pblwiIHwgXCJ4TWF4XCIgfCBcInlNaW5cIiB8IFwieU1heFwifSBzIHByZWNpc2Ugd2loY2ggc2NhbGUgd2Ugd2FudFxuICAgKiBAcmV0dXJucyB0aGUgdmFsdWUgdGhhdCBtYXRjaGVzIHdpdGggdGhlIHBhcmFtZXRlciBzIGluIGRhdGFcbiAgICovXG4gIHByaXZhdGUgc2NhbGUoZGF0YTogRGF0YVtdLCBzOiBcInhNaW5cIiB8IFwieE1heFwiIHwgXCJ5TWluXCIgfCBcInlNYXhcIik6IG51bWJlciB7XG4gICAgbGV0IHJlczogbnVtYmVyID0gMDtcbiAgICBkYXRhLmZvckVhY2goXG4gICAgICAoZWxlbWVudHMsaW5kZXgpID0+IGVsZW1lbnRzLnZhbHVlcy5mb3JFYWNoXG4gICAgICAoKGVsZW1lbnQsaSkgPT4ge1xuICAgICAgICBpZigocz09XCJ5TWluXCImJigoaT09MCYmaW5kZXg9PTApfHxlbGVtZW50WzFdPHJlcykpfHwocz09XCJ5TWF4XCImJigoaT09MCYmaW5kZXg9PTApfHxlbGVtZW50WzFdPnJlcykpKSByZXM9ZWxlbWVudFsxXTtcbiAgICAgICAgZWxzZSBpZigocz09XCJ4TWluXCImJigoaT09MCYmaW5kZXg9PTApfHxlbGVtZW50WzBdPHJlcykpfHwocz09XCJ4TWF4XCImJigoaT09MCYmaW5kZXg9PTApfHxlbGVtZW50WzBdPnJlcykpKSByZXM9ZWxlbWVudFswXTtcbiAgICAgIH0pXG4gICAgKVxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICAvKiogXG4gICpDaGVjayB0eXBlIG9mIGRhdGEgKHBvc2l0aXZlIGludGVnZXIgb3IgZmxvYXQpXG4gICpAcGFyYW0ge0RhdGFbXX0gZGF0YSBBcnJheSBvZiBEYXRhXG4gICpAcmV0dXJucyBmYWxzZSBpZiB0aGVyZSBpcyBhdCBsZWFzdCBvbmUgdmFsdWUgaW4gZGF0YSB0aGF0J3Mgbm90IGEgcG9zaXRpdmUgaW50ZWdlclxuICAqL1xuICBwcml2YXRlIGRpc2NyZXRlVmFsdWUoZGF0YTogRGF0YVtdKTogYm9vbGVhbntcbiAgICBmb3IobGV0IGk6bnVtYmVyPTA7aTxkYXRhLmxlbmd0aDtpKyspe1xuICAgICAgZm9yKGxldCBqOm51bWJlcj0wO2o8ZGF0YVtpXS52YWx1ZXMubGVuZ3RoO2orKyl7XG4gICAgICAgIGlmKGRhdGFbaV0udmFsdWVzW2pdWzFdIT1NYXRoLnJvdW5kKGRhdGFbaV0udmFsdWVzW2pdWzFdKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSb3VuZCBhIG51bWJlciB3aXRoIGEgcHJlY2lzaW9uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBudW0gXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gXG4gICAqIEByZXR1cm5zIGEgbnVtIHdpdGggYSBudW1iZXIgb2YgZGVjaW1hbCAocHJlY2lzaW9uKVxuICAgKi9cbiAgcHJpdmF0ZSByb3VuZERlY2ltYWwobnVtIDogbnVtYmVyLCBwcmVjaXNpb246bnVtYmVyKTogbnVtYmVye1xuICAgIGxldCB0bXA6IG51bWJlciA9IE1hdGgucG93KDEwLCBwcmVjaXNpb24pO1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCBudW0qdG1wICkvdG1wO1xuICB9XG59XG4iXX0=