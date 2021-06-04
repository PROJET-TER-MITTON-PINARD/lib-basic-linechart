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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzaWMtbGluZWNoYXJ0LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2Jhc2ljLWxpbmVjaGFydC9zcmMvbGliL2Jhc2ljLWxpbmVjaGFydC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBYyxZQUFZLEVBQUUsS0FBSyxFQUFVLE1BQU0sRUFBNEIsU0FBUyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBR2hJLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFDOztBQVV6QixNQUFNLFVBQVUsU0FBUyxDQUFDLENBQVM7SUFDakMsSUFBRyxDQUFDLElBQUUsSUFBSTtRQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ2hCLElBQUksQ0FBQyxJQUFFLEtBQUs7UUFBRSxPQUFPLENBQUMsQ0FBQzs7UUFDdkIsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNqQixDQUFDO0FBWUQsTUFBTSxPQUFPLHVCQUF1QjtJQW1DbEMsWUFBb0IsUUFBbUI7UUFBbkIsYUFBUSxHQUFSLFFBQVEsQ0FBVztRQWxDOUIsVUFBSyxHQUFXLEdBQUcsQ0FBQztRQUNwQixXQUFNLEdBQVcsR0FBRyxDQUFDO1FBQ3JCLFNBQUksR0FBVyxFQUFFLENBQUM7UUFDbEIsV0FBTSxHQUFxQixDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztRQUlqQyxVQUFLLEdBQW9CLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlCLGdCQUFXLEdBQUcsSUFBSSxZQUFZLEVBQW1CLENBQUM7UUFDbkQsZ0JBQVcsR0FBVyxDQUFDLENBQUM7UUFDdkIsc0JBQWlCLEdBQUcsSUFBSSxZQUFZLEVBQVUsQ0FBQztRQUVsRCxVQUFLLEdBQVUsYUFBYSxDQUFDO1FBQzVCLFdBQU0sR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFB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QUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFFLElBQUksQ0FBQztRQUMzRSxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUN2RCxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLFdBQVcsQ0FBQztRQUNyRSxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQztRQUM3RCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUMsSUFBSSxDQUFDO1FBQzlELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ25ELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsTUFBTSxDQUFDO1FBQzVELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDO1FBQ3pELElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxDQUFDLEtBQWdCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNuSCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQztRQUN0RyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxTQUFT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QztvQkFBRSxPQUFPLEtBQUssQ0FBQzthQUN6RTtTQUNGO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSyxZQUFZLENBQUMsR0FBWSxFQUFFLFNBQWdCO1FBQ2pELElBQUksR0FBRyxHQUFXLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBRSxHQUFHLEdBQUMsR0FBRyxDQUFFLEdBQUMsR0FBRyxDQUFDO0lBQ25DLENBQUM7O29IQTlyQlUsdUJBQXVCO3dHQUF2Qix1QkFBdUIsMmlCQVJ4Qjs7OztHQUlUOzJGQUlVLHVCQUF1QjtrQkFWbkMsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUscUJBQXFCO29CQUMvQixRQUFRLEVBQUU7Ozs7R0FJVDtvQkFDRCxNQUFNLEVBQUUsRUFDUDtpQkFDRjtnR0FFVSxLQUFLO3NCQUFiLEtBQUs7Z0JBQ0csTUFBTTtzQkFBZCxLQUFLO2dCQUNHLElBQUk7c0JBQVosS0FBSztnQkFDRyxNQUFNO3NCQUFkLEtBQUs7Z0JBQ2EsUUFBUTtzQkFBMUIsU0FBUzt1QkFBQyxNQUFNO2dCQUNJLFNBQVM7c0JBQTdCLFNBQVM7dUJBQUMsUUFBUTtnQkFDQSxhQUFhO3NCQUEvQixTQUFTO3VCQUFDLE1BQU07Z0JBQ1IsS0FBSztzQkFBYixLQUFLO2dCQUNJLFdBQVc7c0JBQXBCLE1BQU07Z0JBQ0UsV0FBVztzQkFBbkIsS0FBSztnQkFDSSxpQkFBaUI7c0JBQTFCLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIEVsZW1lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5wdXQsIE9uSW5pdCwgT3V0cHV0LCBSZW5kZXJlcjIsIFNpbXBsZUNoYW5nZXMsIFZpZXdDaGlsZCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTY2FsZVRpbWUsIFNjYWxlTGluZWFyfSBmcm9tICdkMy1zY2FsZSc7XG5pbXBvcnQge1NlbGVjdGlvbn0gZnJvbSAnZDMtc2VsZWN0aW9uJztcbmltcG9ydCAqIGFzIGQzIGZyb20gJ2QzJztcblxuZXhwb3J0IGludGVyZmFjZSBEYXRhIHtcbiAgbGFiZWw6IHN0cmluZztcbiAgdmFsdWVzOiBbbnVtYmVyLG51bWJlcl1bXTtcbiAgY29sb3I6IHN0cmluZztcbiAgc3R5bGU6IFwibGluZVwiIHwgXCJhcmVhXCIgfCBcImJvdGhcIjtcbiAgaW50ZXJwb2xhdGlvbjogXCJsaW5lYXJcIiB8IFwic3RlcFwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VCb29sKHM6IHN0cmluZykge1xuICBpZihzPT0nT04nKSByZXR1cm4gMTtcbiAgZWxzZSBpZiAocz09J09GRicpIHJldHVybiAwO1xuICBlbHNlIHJldHVybiAtMTtcbn1cblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnbGliLWJhc2ljLWxpbmVjaGFydCcsXG4gIHRlbXBsYXRlOiBgXG4gIDxoMj57eyB0aXRsZSB9fTwvaDI+XG4gIDxzdmcgI3Jvb3QgW2F0dHIud2lkdGhdPVwid2lkdGhcIiBbYXR0ci5oZWlnaHRdPVwiaGVpZ2h0XCI+PC9zdmc+XG4gIDxkaXYgI3pvbmU+PGRpdiAjc2Nyb2xsPjwvZGl2PjwvZGl2PlxuICBgLFxuICBzdHlsZXM6IFtcbiAgXVxufSlcbmV4cG9ydCBjbGFzcyBCYXNpY0xpbmVjaGFydENvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gIEBJbnB1dCgpIHdpZHRoOiBudW1iZXIgPSA5MDA7XG4gIEBJbnB1dCgpIGhlaWdodDogbnVtYmVyID0gMjAwOyBcbiAgQElucHV0KCkgZGF0YTogRGF0YVtdID0gW107XG4gIEBJbnB1dCgpIGRvbWFpbjogW251bWJlciwgbnVtYmVyXSA9IFswLDBdO1xuICBAVmlld0NoaWxkKCdyb290JykgdGltZWxpbmUhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKCdzY3JvbGwnKSBzY3JvbGxiYXIhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKCd6b25lJykgem9uZVNjcm9sbGJhciE6IEVsZW1lbnRSZWY7XG4gIEBJbnB1dCgpIHJhbmdlOiBbbnVtYmVyLG51bWJlcl0gPSBbMCwwXTtcbiAgQE91dHB1dCgpIHJhbmdlQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxbbnVtYmVyLG51bWJlcl0+KCk7XG4gIEBJbnB1dCgpIGN1cnJlbnRUaW1lOiBudW1iZXIgPSAwO1xuICBAT3V0cHV0KCkgY3VycmVudFRpbWVDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4oKTtcblxuICBwdWJsaWMgdGl0bGU6c3RyaW5nID0gJ1RpbWVsaW5lIDogJztcbiAgcHJpdmF0ZSBtYXJnaW4gPSB7IHRvcDogMjAsIHJpZ2h0OiAyMCwgYm90dG9tOiAzMCwgbGVmdDogNTAgfTsgLy9tYXJnZSBpbnRlcm5lIGF1IHN2ZyBcbiAgcHJpdmF0ZSBkYXRhWm9vbTogRGF0YVtdID0gW107XG4gIHByaXZhdGUgaWRab29tOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1pblRpbWU6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbWF4VGltZTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBsZW5ndGhUaW1lOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHN2Z1dpZHRoOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHN2Z0hlaWdodDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBzY2FsZVg6IFNjYWxlVGltZTxudW1iZXIsbnVtYmVyPiA9IGQzLnNjYWxlVGltZSgpO1xuICBwcml2YXRlIHNjYWxlWTogU2NhbGVMaW5lYXI8bnVtYmVyLG51bWJlcj4gPSBkMy5zY2FsZUxpbmVhcigpO1xuICBwcml2YXRlIHN2ZzogYW55O1xuICBwcml2YXRlIGFyZWE6IGQzLkFyZWE8W251bWJlciwgbnVtYmVyXT5bXSA9IFtdO1xuICBwcml2YXRlIGxpbmU6IGQzLkxpbmU8W251bWJlciwgbnVtYmVyXT5bXSA9IFtdO1xuICBwcml2YXRlIHRvb2x0aXAhOiBTZWxlY3Rpb248U1ZHR0VsZW1lbnQsdW5rbm93bixudWxsLHVuZGVmaW5lZD47XG4gIHByaXZhdGUgbGFzdERhdGFsZW5ndGg6bnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtb2RlVG9vbFRpcHM6IFwibm9ybWFsXCIgfCBcImludmVyc2VcIiA9IFwibm9ybWFsXCI7XG4gIHByaXZhdGUgY3VycmVudFRpbWVTZWxlY3RlZDpib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgc2Nyb2xsYmFyU2VsZWN0ZWQ6Ym9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGxhc3RQb3M6IG51bWJlciA9IDA7XG4gIFxuICBcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZW5kZXJlcjogUmVuZGVyZXIyKSB7ICAgXG4gIH1cblxuICAvKipcbiAgICogQ29weSBkYXRhIGluIGRhdGFab29tLCBhbmQgYnVpbGQgdGl0bGUgXG4gICAqL1xuICBwdWJsaWMgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5kYXRhWm9vbSA9IFsuLi50aGlzLmRhdGFdO1xuICAgIHRoaXMubGFzdERhdGFsZW5ndGg9dGhpcy5kYXRhWm9vbS5sZW5ndGg7XG4gICAgdGhpcy5kYXRhLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgIGlmKGluZGV4PT10aGlzLmRhdGEubGVuZ3RoLTEpIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlK2VsZW1lbnQubGFiZWwrJy4nO1xuICAgICAgZWxzZSB0aGlzLnRpdGxlID0gdGhpcy50aXRsZStlbGVtZW50LmxhYmVsICsgJywgJztcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgbGluZWNoYXJ0XG4gICAqL1xuICBwdWJsaWMgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRpbWVsaW5lICE9IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHcgPSB0aGlzLnRpbWVsaW5lLm5hdGl2ZUVsZW1lbnQud2lkdGguYW5pbVZhbC52YWx1ZTtcbiAgICAgIGxldCBoID0gdGhpcy50aW1lbGluZS5uYXRpdmVFbGVtZW50LmhlaWdodC5hbmltVmFsLnZhbHVlO1xuICAgICAgdGhpcy5zdmdXaWR0aCA9ICh3IC0gdGhpcy5tYXJnaW4ubGVmdCkgLSB0aGlzLm1hcmdpbi5yaWdodDtcbiAgICAgIHRoaXMuc3ZnSGVpZ2h0ID0gKGggLSB0aGlzLm1hcmdpbi50b3ApIC0gdGhpcy5tYXJnaW4uYm90dG9tO1xuICAgIH1cbiAgICB0aGlzLmRhdGEuZm9yRWFjaCgoZWxlbWVudCxpbmRleCkgPT4gdGhpcy5idWlsZFN0eWxlRGF0YShlbGVtZW50LGluZGV4KSk7XG4gICAgdGhpcy5idWlsZFpvb20oKTsgXG4gICAgdGhpcy5idWlsZEV2ZW50KCk7XG4gICAgdGhpcy5kcmF3VG9vbFRpcHMoKTtcbiAgICB0aGlzLmRyYXdBeGlzKCk7XG4gICAgdGhpcy5kcmF3TGluZUFuZFBhdGgoKTtcbiAgICB0aGlzLmRyYXdMaW5lQ3VycmVudFRpbWUoKTtcbiAgICB0aGlzLmRyYXdTY3JvbGxiYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgbGluZWNoYXJ0IG9uIGRhdGEsIHJhbmdlIG9yIGN1cnJlbnQgdGltZSBjaGFuZ2VzXG4gICAqIEBwYXJhbSB7U2ltcGxlQ2hhbmdlc30gY2hhbmdlcyBcbiAgICovXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXMuZGF0YSYmIWNoYW5nZXMuZGF0YS5maXJzdENoYW5nZSkgdGhpcy51cGRhdGVDaGFydCgpO1xuICAgIGlmICgoY2hhbmdlcy5kYXRhJiYhY2hhbmdlcy5kYXRhLmZpcnN0Q2hhbmdlJiZ0aGlzLnJhbmdlWzBdIT0wJiZ0aGlzLnJhbmdlWzFdIT0wKXx8KGNoYW5nZXMucmFuZ2UmJiFjaGFuZ2VzLnJhbmdlLmZpcnN0Q2hhbmdlKSkge1xuICAgICAgdGhpcy5pZFpvb209TWF0aC5yb3VuZChNYXRoLmxvZyh0aGlzLmxlbmd0aFRpbWUvKHRoaXMucmFuZ2VbMV0tdGhpcy5yYW5nZVswXSkpL01hdGgubG9nKDEuNSkpO1xuICAgICAgdGhpcy5yYW5nZT10aGlzLmNvbnRyb2xSYW5nZSh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0tdGhpcy5yYW5nZVswXSk7XG4gICAgICBpZih0aGlzLmRhdGEubGVuZ3RoIT0wKXtcbiAgICAgICAgdGhpcy51cGRhdGVEYXRhWm9vbSh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgICB0aGlzLnVwZGF0ZVN2Zyh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2hhbmdlcy5jdXJyZW50VGltZSYmIWNoYW5nZXMuY3VycmVudFRpbWUuZmlyc3RDaGFuZ2UmJnRoaXMuZGF0YS5sZW5ndGghPTApIHRoaXMudXBkYXRlQ3VycmVudFRpbWUoKTtcbn1cblxuICAvKipcbiAgICogQWRkIGV2ZW50IGxpc3RlbmVycyBvbiB0aGUgc3ZnXG4gICAqL1xuICBwcml2YXRlIGJ1aWxkRXZlbnQoKTogdm9pZHsgLy8gY3JlZXIgdW5lIHRpbWVsaW5lIGF2ZWMgdW5lIHNldWwgZG9ubsOpZVxuICAgIHRoaXMuc3ZnID0gZDMuc2VsZWN0KHRoaXMudGltZWxpbmUubmF0aXZlRWxlbWVudClcbiAgICAuYXBwZW5kKCdnJylcbiAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgdGhpcy5tYXJnaW4ubGVmdCArICcsJyArIHRoaXMubWFyZ2luLnRvcCArICcpJyk7XG4gICAgZDMuc2VsZWN0KHRoaXMudGltZWxpbmUubmF0aXZlRWxlbWVudCkub24oXCJtb3VzZW1vdmVcIiwgKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICBpZih0aGlzLmN1cnJlbnRUaW1lU2VsZWN0ZWQpIHRoaXMubW92ZUN1cnJlbnRUaW1lKGV2ZW50KTtcbiAgICAgIGVsc2UgdGhpcy5zaG93SW5mbyhldmVudCk7XG4gICAgfSlcbiAgICAub24oXCJtb3VzZWxlYXZlXCIsICgpID0+IHsgdGhpcy5jdXJyZW50VGltZVNlbGVjdGVkID0gZmFsc2U7IHRoaXMuaGlkZUluZm8oKSB9KVxuICAgIC5vbihcIndoZWVsXCIsIChldmVudDogV2hlZWxFdmVudCkgPT4ge2lmKHRoaXMuZGF0YS5sZW5ndGghPTApdGhpcy5hY3RpdmVab29tKGV2ZW50KX0pXG4gICAgLm9uKFwibW91c2V1cFwiLCAoKSA9PiB0aGlzLmN1cnJlbnRUaW1lU2VsZWN0ZWQ9ZmFsc2UpXG4gICAgLm9uKFwibW91c2VvdmVyXCIsIChldmVudDogTW91c2VFdmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgdGhlIHN0eWxlIChhcmVhLCBsaW5lIG9yIGJvdGgpIGFuZCB0aGUgaW50ZXJwb2xhdGlvbiAoc3RwZSBvciBsaW5lYXIpIG9mIGxpbmVzXG4gICAqIEBwYXJhbSB7RGF0YX0gZWxlbWVudCBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFxuICAgKi9cbiAgcHJpdmF0ZSBidWlsZFN0eWxlRGF0YShlbGVtZW50OkRhdGEsIGluZGV4Om51bWJlcik6IHZvaWR7XG4gICAgaWYoZWxlbWVudC5zdHlsZT09XCJhcmVhXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgaWYoZWxlbWVudC5pbnRlcnBvbGF0aW9uPT1cInN0ZXBcIil7XG4gICAgICAgIHRoaXMuYXJlYVtpbmRleF09ZDMuYXJlYSgpXG4gICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgIC55MCh0aGlzLnN2Z0hlaWdodClcbiAgICAgICAgLnkxKChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpXG4gICAgICAgIC5jdXJ2ZShkMy5jdXJ2ZVN0ZXBBZnRlcik7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5hcmVhW2luZGV4XT1kMy5hcmVhKClcbiAgICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgICAgLnkwKHRoaXMuc3ZnSGVpZ2h0KVxuICAgICAgICAueTEoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWShkWzFdKSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoZWxlbWVudC5zdHlsZT09XCJsaW5lXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgaWYoZWxlbWVudC5pbnRlcnBvbGF0aW9uPT1cInN0ZXBcIil7XG4gICAgICAgIHRoaXMubGluZVtpbmRleF09ZDMubGluZSgpXG4gICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgIC55KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpXG4gICAgICAgIC5jdXJ2ZShkMy5jdXJ2ZVN0ZXBBZnRlcik7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5saW5lW2luZGV4XT1kMy5saW5lKClcbiAgICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgICAgLnkoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWShkWzFdKSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoIXRoaXMuY29udHJvbENvbG9yKGVsZW1lbnQuY29sb3IpKXtcbiAgICAgIGNvbnNvbGUud2FybihcIkRhdGEgd2l0aCBcIiArIGVsZW1lbnQubGFiZWwgKyBcIiBsYWJlbCwgaGFzIGFuIHVudmFsaWQgY29sb3IgYXR0cmlidXRlIChcIiArIGVsZW1lbnQuY29sb3IgKyBcIikuIFJlcGxhY2Ugd2l0aCB0aGUgZGVmYXVsdCBjb2xvciAoYmxhY2spLlwiKTtcbiAgICAgIGVsZW1lbnQuY29sb3I9XCJibGFja1wiO1xuICAgIH0gXG4gIH1cblxuICAvKipcbiAgICogU2F2ZSBpbmZvcm1hdGlvbiBmb3Igem9vbS5cbiAgICovXG4gIHByaXZhdGUgYnVpbGRab29tKCk6IHZvaWR7XG4gICAgdGhpcy5taW5UaW1lID0gdGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ4TWluXCIpO1xuICAgIHRoaXMubWF4VGltZSA9IHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieE1heFwiKTtcbiAgICB0aGlzLmxlbmd0aFRpbWUgPSB0aGlzLm1heFRpbWUgLSB0aGlzLm1pblRpbWU7XG4gICAgdGhpcy5pZFpvb209MDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3IHRoZSB0b29sdGlwcydzIHN2Z1xuICAgKi9cbiAgcHJpdmF0ZSBkcmF3VG9vbFRpcHMoKTogdm9pZHsgLy9jcmVlciBsZSB0b29sdGlwc1xuICAgIHRoaXMudG9vbHRpcCA9IHRoaXMuc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXBcIilcbiAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgLy8gTGUgY2VyY2xlIGV4dMOpcmlldXIgYmxldSBjbGFpclxuICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwiI0NDRTVGNlwiKVxuICAgICAgICAuYXR0cihcInJcIiwgMTApO1xuICAgIC8vIExlIGNlcmNsZSBpbnTDqXJpZXVyIGJsZXUgZm9uY8OpXG4gICAgdGhpcy50b29sdGlwLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAuYXR0cihcImZpbGxcIiwgXCIjMzQ5OGRiXCIpXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwiI2ZmZlwiKVxuICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjEuNXB4XCIpXG4gICAgICAgIC5hdHRyKFwiclwiLCA0KTtcbiAgICAvLyBMZSB0b29sdGlwIGVuIGx1aS1tw6ptZSBhdmVjIHNhIHBvaW50ZSB2ZXJzIGxlIGJhc1xuICAgIC8vIElsIGZhdXQgbGUgZGltZW5zaW9ubmVyIGVuIGZvbmN0aW9uIGR1IGNvbnRlbnVcbiAgICBpZiAodGhpcy5tb2RlVG9vbFRpcHMgPT0gXCJub3JtYWxcIikge1xuICAgICAgdGhpcy50b29sdGlwLmFwcGVuZChcInBvbHlsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwicG9pbnRzXCIsIFwiMCwwIDAsNDAgNzUsNDAgIDgwLDQ1ICA4NSw0MCAgMTYwLDQwICAxNjAsMCAwLDBcIilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBcIiNmYWZhZmFcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsXCIjMzQ5OGRiXCIpXG4gICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIixcIjAuOVwiKVxuICAgICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIixcIjFcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTgwLC01MClcIik7XG4gICAgICB0aGlzLmRhdGFab29tLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgLy8gQ2V0IMOpbMOpbWVudCBjb250aWVuZHJhIHRvdXQgbm90cmUgdGV4dGVcbiAgICAgICAgbGV0IHRleHQgPSB0aGlzLnRvb2x0aXAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgIC5zdHlsZShcImZvbnQtc2l6ZVwiLCBcIjEzcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJmb250LWZhbWlseVwiLCBcIlNlZ29lIFVJXCIpXG4gICAgICAgICAgLnN0eWxlKFwiY29sb3JcIiwgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTgwLC00MilcIik7XG4gICAgICAgIC8vIEVsZW1lbnQgcG91ciBsYSBkYXRlIGF2ZWMgcG9zaXRpb25uZW1lbnQgc3DDqWNpZmlxdWVcbiAgICAgICAgdGV4dC5hcHBlbmQoXCJ0c3BhblwiKVxuICAgICAgICAgIC5hdHRyKFwiZHhcIiwgXCI3XCIpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjVcIilcbiAgICAgICAgICAuYXR0cihcImlkXCIsIFwidG9vbHRpcC1kYXRlMVwiKTtcbiAgICAgICAgdGV4dC5hcHBlbmQoXCJ0c3BhblwiKVxuICAgICAgICAgIC5hdHRyKFwiZHhcIiwgXCItOTBcIilcbiAgICAgICAgICAuYXR0cihcImR5XCIsIFwiMTVcIilcbiAgICAgICAgICAuYXR0cihcImlkXCIsIFwidG9vbHRpcC1kYXRlMlwiKTtcbiAgICAgIH0pO1xuICAgIH1lbHNlIHtcbiAgICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJwb2x5bGluZVwiKVxuICAgICAgICAuYXR0cihcInBvaW50c1wiLCBcIjAsOTUgLCAwLDU1ICwgNzUsNTUgLCA4MCw1MCAsIDg1LDU1ICwgMTYwLDU1ICwgMTYwLDk1IDAsOTVcIilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBcIiNmYWZhZmFcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsXCIjMzQ5OGRiXCIpXG4gICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIixcIjAuOVwiKVxuICAgICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIixcIjFcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTgwLC01MClcIik7XG4gICAgICB0aGlzLmRhdGFab29tLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgLy8gQ2V0IMOpbMOpbWVudCBjb250aWVuZHJhIHRvdXQgbm90cmUgdGV4dGVcbiAgICAgICAgbGV0IHRleHQgPSB0aGlzLnRvb2x0aXAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgIC5zdHlsZShcImZvbnQtc2l6ZVwiLCBcIjEzcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJmb250LWZhbWlseVwiLCBcIlNlZ29lIFVJXCIpXG4gICAgICAgICAgLnN0eWxlKFwiY29sb3JcIiwgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTgwLC0zMClcIik7XG4gICAgICAgIC8vIEVsZW1lbnQgcG91ciBsYSBkYXRlIGF2ZWMgcG9zaXRpb25uZW1lbnQgc3DDqWNpZmlxdWVcbiAgICAgICAgdGV4dC5hcHBlbmQoXCJ0c3BhblwiKVxuICAgICAgICAgIC5hdHRyKFwiZHhcIiwgXCI3XCIpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCA1MCApXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTFcIik7XG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiLTgwXCIpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjIwXCIpXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTJcIik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHJhdyBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBheGlzIGFuZCBzY2FsZVxuICAgKi9cbiAgcHJpdmF0ZSBkcmF3QXhpcygpOiB2b2lke1xuICAgIHRoaXMuc2NhbGVYLnJhbmdlKFswLCB0aGlzLnN2Z1dpZHRoXSk7XG4gICAgdGhpcy5zY2FsZVguZG9tYWluKFt0aGlzLm1pblRpbWUsdGhpcy5tYXhUaW1lXSk7XG4gICAgdGhpcy5zY2FsZVkgPSBkMy5zY2FsZUxpbmVhcigpO1xuICAgIHRoaXMuc2NhbGVZLnJhbmdlKFt0aGlzLnN2Z0hlaWdodCwgMF0pO1xuICAgIHRoaXMuc2NhbGVZLmRvbWFpbih0aGlzLmNvbnRyb2xEb21haW4oKSk7XG4gICAgLy8gQ29uZmlndXJlIHRoZSBYIEF4aXNcbiAgICB0aGlzLnN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwnICsgdGhpcy5zdmdIZWlnaHQgKyAnKScpXG4gICAgICAuYXR0cignY2xhc3MnLCAneEF4aXMnKVxuICAgICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh0aGlzLnNjYWxlWCkpO1xuICAgIC8vIENvbmZpZ3VyZSB0aGUgWSBBeGlzXG4gICAgaWYodGhpcy5kaXNjcmV0ZVZhbHVlKHRoaXMuZGF0YSkpe1xuICAgICAgdGhpcy5zdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd5QXhpcycpXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh0aGlzLnNjYWxlWSkudGlja3ModGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ5TWF4XCIpKSk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLnN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3lBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHRoaXMuc2NhbGVZKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERyYXcgbGluZXMgb24gdGhlIGxpbmUgY2hhcnRcbiAgICovXG4gIHByaXZhdGUgZHJhd0xpbmVBbmRQYXRoKCk6IHZvaWR7XG4gICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKFxuICAgICAgKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJhcmVhXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgICAgIHRoaXMuc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgLmRhdHVtKHRoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlcylcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnYXJlYScraW5kZXgpXG4gICAgICAgICAgLmF0dHIoJ2QnLCB0aGlzLmFyZWFbaW5kZXhdKVxuICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDAuMSlcbiAgICAgICAgICAuYXR0cignb3BhY2l0eScsIDAuMylcbiAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICcycHgnKVxuICAgICAgICB9XG4gICAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwibGluZVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgICAgICB0aGlzLnN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAgIC5kYXR1bShlbGVtZW50LnZhbHVlcylcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbGluZScraW5kZXgpXG4gICAgICAgICAgLmF0dHIoJ2QnLCB0aGlzLmxpbmVbaW5kZXhdKVxuICAgICAgICAgIC5zdHlsZSgnZmlsbCcsICdub25lJylcbiAgICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnMnB4JylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3IHRoZSB2ZXJ0aWNhbCBsaW5lIHdoaWNoIHJlcHJlc2VudHMgdGhlIGN1cnJlbnQgdGltZVxuICAgKi9cbiAgcHJpdmF0ZSBkcmF3TGluZUN1cnJlbnRUaW1lKCk6IHZvaWR7XG4gICAgaWYodGhpcy5kYXRhLmxlbmd0aCE9MCl7XG4gICAgICBpZih0aGlzLmN1cnJlbnRUaW1lPT0wKXtcbiAgICAgICAgdGhpcy5jdXJyZW50VGltZSA9IHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieE1pblwiKTtcbiAgICAgIH1cbiAgICAgIGxldCB4Om51bWJlcj0wO1xuICAgICAgdGhpcy5zdmcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmRhdHVtKFtbdGhpcy5jdXJyZW50VGltZSx0aGlzLmNvbnRyb2xEb21haW4oKVswXV0sW3RoaXMuY3VycmVudFRpbWUsdGhpcy5zdmdIZWlnaHRdXSlcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2N1cnJlbnRUaW1lTGluZScpXG4gICAgICAgIC5hdHRyKCdkJywgZDMubGluZSgpXG4gICAgICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB4PXRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgICAgIC55KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCAnbm9uZScpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgJ3JlZCcpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzNweCcpO1xuICAgICAgdGhpcy5zdmcuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY3VycmVudFRpbWVTZWxlY3RvcicpXG4gICAgICAgIC5hdHRyKCdjeCcsIHgpXG4gICAgICAgIC5hdHRyKCdjeScsIC0xMylcbiAgICAgICAgLmF0dHIoJ3InLCA3KVxuICAgICAgICAuYXR0cignZmlsbCcsICdyZWQnKVxuICAgICAgICAub24oXCJtb3VzZWRvd25cIiwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudFRpbWVTZWxlY3RlZD10cnVlO1xuICAgICAgICAgIHRoaXMuaGlkZUluZm8oKTtcbiAgICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHJhdyB0aGUgc2Nyb2xsYmFyIGFuZCBldmVudCBsaXN0ZW5lciBvbiBpdCAgXG4gICAqL1xuICBwcml2YXRlIGRyYXdTY3JvbGxiYXIoKTogdm9pZHtcbiAgICB0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS53aWR0aCA9IHRoaXMuc3ZnV2lkdGgrXCJweFwiO1xuICAgIHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLm1hcmdpbkxlZnQgPSB0aGlzLm1hcmdpbi5sZWZ0KyBcInB4XCI7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gXCIyMHB4XCI7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJsaWdodGdyZXlcIjtcbiAgICB0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5ib3JkZXJSYWRpdXMgPSBcIjEwcHhcIjtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLndpZHRoID0gdGhpcy5zdmdXaWR0aCtcInB4XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5oZWlnaHQgPSBcIjIwcHhcIjtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiZ3JleVwiO1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCIxMHB4XCI7XG4gICAgdGhpcy5yZW5kZXJlci5saXN0ZW4odGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudCwgJ21vdXNlZG93bicsIChldmVudDpNb3VzZUV2ZW50KSA9PiB0aGlzLmFjdGl2ZVNjcm9sbGJhcihldmVudCkpO1xuICAgIHRoaXMucmVuZGVyZXIubGlzdGVuKHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LCAnbW91c2VsZWF2ZScsICgpID0+IHRoaXMuZGVzYWN0aXZlU2Nyb2xsYmFyKCkpO1xuICAgIHRoaXMucmVuZGVyZXIubGlzdGVuKHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LCAnbW91c2V1cCcsICgpID0+IHRoaXMuZGVzYWN0aXZlU2Nyb2xsYmFyKCkpO1xuICAgIHRoaXMucmVuZGVyZXIubGlzdGVuKHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LCdtb3VzZW1vdmUnLCAoZXZlbnQ6TW91c2VFdmVudCkgPT4gdGhpcy51cGRhdGVSYW5nZShldmVudCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhbGwgdGhlIGxpbmUgY2hhcnQgKGhvcml6b250YWwgYW5kIHZlcnRpY2FsIGF4aXMgYW5kIHNjYWxlLCBkYXRhLCBsaW5lcyBhbmQgcmFuZ2UpIG9uIGRhdGEgY2hhbmdlcy4gXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZUNoYXJ0KCk6IHZvaWR7XG4gICAgdGhpcy5kYXRhWm9vbSA9IFsuLi50aGlzLmRhdGFdO1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKFxuICAgICAgKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgICAgdGhpcy5idWlsZFN0eWxlRGF0YShlbGVtZW50LGluZGV4KTtcbiAgICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJhcmVhXCIpIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmxpbmUnK2luZGV4KS5yZW1vdmUoKTtcbiAgICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJsaW5lXCIpIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmFyZWEnK2luZGV4KS5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy50aXRsZSA9ICdUaW1lbGluZSA6ICc7XG4gICAgICAgIGlmKGluZGV4PT10aGlzLmRhdGEubGVuZ3RoLTEpIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlK2VsZW1lbnQubGFiZWwrJy4nO1xuICAgICAgICBlbHNlIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlK2VsZW1lbnQubGFiZWwgKyAnLCAnO1xuICAgIH0pXG4gICAgdGhpcy5idWlsZFpvb20oKTtcbiAgICB0aGlzLnNjYWxlWC5kb21haW4oW3RoaXMubWluVGltZSx0aGlzLm1heFRpbWVdKTtcbiAgICB0aGlzLnNjYWxlWS5yYW5nZShbdGhpcy5zdmdIZWlnaHQsIDBdKTtcbiAgICB0aGlzLmNvbnRyb2xEb21haW4oKTtcbiAgICB0aGlzLnNjYWxlWS5kb21haW4odGhpcy5jb250cm9sRG9tYWluKCkpO1xuICAgIGlmKHRoaXMuZGlzY3JldGVWYWx1ZSh0aGlzLmRhdGEpKXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLnlBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHRoaXMuc2NhbGVZKS50aWNrcyh0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInlNYXhcIikpKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLnlBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHRoaXMuc2NhbGVZKSk7XG4gICAgfVxuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLnhBeGlzJykuY2FsbChkMy5heGlzQm90dG9tKHRoaXMuc2NhbGVYKSk7XG4gICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVMaW5lJykucmVtb3ZlKCk7XG4gICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVTZWxlY3RvcicpLnJlbW92ZSgpO1xuICAgIHRoaXMudXBkYXRlTGluZSgpO1xuICAgIHRoaXMuZHJhd0xpbmVDdXJyZW50VGltZSgpO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsYmFyKHRoaXMubWluVGltZSx0aGlzLm1heFRpbWUpO1xuICAgIHRoaXMudXBkYXRlVG9vbFRpcHMoKTtcbiAgICBmb3IobGV0IGluZGV4PXRoaXMuZGF0YVpvb20ubGVuZ3RoOyBpbmRleDx0aGlzLmxhc3REYXRhbGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmxpbmUnK2luZGV4KS5yZW1vdmUoKTtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmFyZWEnK2luZGV4KS5yZW1vdmUoKTtcbiAgICB9XG4gICAgdGhpcy5sYXN0RGF0YWxlbmd0aD10aGlzLmRhdGFab29tLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgaG9yaXpvbnRhbCBheGlzLCBjdXJyZW50IHRpbWUgbGluZSwgbGluZXMgYW5kIHNjcm9sbGJhclxuICAgKiBAcGFyYW0ge251bWJlcn0gbWluIG9mIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heCBvZiB0aGUgbmV3IHJhbmdlXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZVN2ZyhtaW46IG51bWJlciwgbWF4OiBudW1iZXIpe1xuICAgIHRoaXMuc2NhbGVYLmRvbWFpbihbbWluLG1heF0pO1xuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLnhBeGlzJykuY2FsbChkMy5heGlzQm90dG9tKHRoaXMuc2NhbGVYKSk7XG4gICAgdGhpcy51cGRhdGVMaW5lKCk7XG4gICAgdGhpcy51cGRhdGVDdXJyZW50VGltZSgpO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsYmFyKG1pbixtYXgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgZGlzcGxheSBvZiBsaW5lc1xuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVMaW5lKCk6IHZvaWR7XG4gICAgbGV0IGxpbmVVcGRhdGU7XG4gICAgbGV0IGFyZWFVcGRhdGU7XG4gICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICBpZihlbGVtZW50LnN0eWxlPT1cImFyZWFcIiB8fCBlbGVtZW50LnN0eWxlPT1cImJvdGhcIil7XG4gICAgICAgIGFyZWFVcGRhdGU9IHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmFyZWEnK2luZGV4KS5kYXRhKFt0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXNdKTtcbiAgICAgICAgYXJlYVVwZGF0ZVxuICAgICAgICAuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnYXJlYScraW5kZXgpXG4gICAgICAgIC5tZXJnZShhcmVhVXBkYXRlKVxuICAgICAgICAuYXR0cignZCcsIHRoaXMuYXJlYVtpbmRleF0pXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDAuMSlcbiAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwLjMpXG4gICAgICAgIC5zdHlsZSgnZmlsbCcsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnMnB4Jyk7XG4gICAgICB9XG4gICAgICBpZihlbGVtZW50LnN0eWxlPT1cImxpbmVcIiB8fCBlbGVtZW50LnN0eWxlPT1cImJvdGhcIil7XG4gICAgICAgIGxpbmVVcGRhdGU9IHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmxpbmUnK2luZGV4KS5kYXRhKFt0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXNdKTtcbiAgICAgICAgbGluZVVwZGF0ZVxuICAgICAgICAuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGluZScraW5kZXgpXG4gICAgICAgIC5tZXJnZShsaW5lVXBkYXRlKVxuICAgICAgICAuYXR0cignZCcsIHRoaXMubGluZVtpbmRleF0pXG4gICAgICAgIC5zdHlsZSgnZmlsbCcsICdub25lJylcbiAgICAgICAgLnN0eWxlKCdzdHJva2UnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICcycHgnKVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcG9zaXRpb24gb2YgdGhlIGN1cnJlbnQgdGltZSBsaW5lXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZUN1cnJlbnRUaW1lKCk6IHZvaWR7XG4gICAgbGV0IGxpbmVVcGRhdGUgPSB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZUxpbmUnKS5kYXR1bShbW3RoaXMuY3VycmVudFRpbWUsdGhpcy5jb250cm9sRG9tYWluKClbMF1dLFt0aGlzLmN1cnJlbnRUaW1lLHRoaXMuc3ZnSGVpZ2h0XV0pO1xuICAgIGxldCB4Om51bWJlcj0wO1xuICAgIGxpbmVVcGRhdGUuZW50ZXIoKVxuICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2N1cnJlbnRUaW1lTGluZScpXG4gICAgLm1lcmdlKGxpbmVVcGRhdGUpXG4gICAgLmF0dHIoJ2QnLCBkMy5saW5lKClcbiAgICAgIC54KChkOiBudW1iZXJbXSkgPT4geD10aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgIC55KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpKVxuICAgIC5zdHlsZSgnZmlsbCcsICdub25lJylcbiAgICAuc3R5bGUoJ3N0cm9rZScsICdyZWQnKVxuICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzNweCcpO1xuICAgIGlmKHRoaXMuY3VycmVudFRpbWU+PXRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNaW5cIikmJnRoaXMuY3VycmVudFRpbWU8PXRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNYXhcIikpe1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVMaW5lJykuYXR0cignZGlzcGxheScsJ2Jsb2NrJyk7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZVNlbGVjdG9yJykuYXR0cignZGlzcGxheScsJ2Jsb2NrJyk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZUxpbmUnKS5hdHRyKCdkaXNwbGF5Jywnbm9uZScpO1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVTZWxlY3RvcicpLmF0dHIoJ2Rpc3BsYXknLCdub25lJyk7XG4gICAgfVxuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lU2VsZWN0b3InKS5hdHRyKCdjeCcseCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgc2Nyb2xsYmFyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtaW4gb2YgdGhlIG5ldyByYW5nZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4IG9mIHRoZSBuZXcgcmFuZ2VcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlU2Nyb2xsYmFyKG1pbjpudW1iZXIsIG1heDpudW1iZXIpOiB2b2lke1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUubWFyZ2luTGVmdD0gdGhpcy5zdmdXaWR0aCoobWluLXRoaXMubWluVGltZSkvKHRoaXMubGVuZ3RoVGltZSkgKyBcInB4XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS53aWR0aD0gdGhpcy5zdmdXaWR0aCoobWF4LW1pbikvKHRoaXMubGVuZ3RoVGltZSkgKyBcInB4XCI7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIHRoZSByYW5nZSwgY29udHJvbCBpdCwgdXBkYXRlIGRhdGFzLCB1cGRhdGUgdGhlIGxpbmVjaGFydCBhbmQgdGhlbiBlbWl0IHRoZSBuZXcgcmFuZ2UuXG4gICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZVJhbmdlKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZHtcbiAgICBpZih0aGlzLnNjcm9sbGJhclNlbGVjdGVkKXtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBsZXQgbGVuZ3RoTG9jYWxUaW1lID0gdGhpcy5yYW5nZVsxXS10aGlzLnJhbmdlWzBdO1xuICAgICAgbGV0IGxhc3RNaW5Mb2NhbFRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpO1xuICAgICAgbGV0IHBvcyA9IGV2ZW50LmNsaWVudFgtdGhpcy5tYXJnaW4ubGVmdDtcbiAgICAgIGlmKHRoaXMubGFzdFBvcz09MCl7XG4gICAgICAgIHRoaXMubGFzdFBvcz0gcG9zO1xuICAgICAgfVxuICAgICAgbGV0IG1pbkxvY2FsVGltZSA9IChwb3MtdGhpcy5sYXN0UG9zKSp0aGlzLmxlbmd0aFRpbWUvdGhpcy5zdmdXaWR0aCArIGxhc3RNaW5Mb2NhbFRpbWU7XG4gICAgICB0aGlzLnJhbmdlID0gdGhpcy5jb250cm9sUmFuZ2UobWluTG9jYWxUaW1lLGxlbmd0aExvY2FsVGltZSk7XG4gICAgICB0aGlzLnVwZGF0ZURhdGFab29tKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICB0aGlzLnVwZGF0ZVN2Zyh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgdGhpcy5yYW5nZUNoYW5nZS5lbWl0KHRoaXMucmFuZ2UpO1xuICAgICAgdGhpcy5sYXN0UG9zPXBvcztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIHRoaXMuZGF0YVpvb20gYXQgcmFuZ2UgY2hhbmdlc1xuICAgKiBAcGFyYW0ge251bWJlcn0gbWluIG9mIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heCBvZiB0aGUgbmV3IHJhbmdlIFxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVEYXRhWm9vbShtaW46bnVtYmVyLG1heDpudW1iZXIpOiB2b2lke1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICB0aGlzLmRhdGFab29tW2luZGV4XT17XG4gICAgICAgIGxhYmVsOiBlbGVtZW50LmxhYmVsLFxuICAgICAgICB2YWx1ZXM6IGVsZW1lbnQudmFsdWVzLmZpbHRlcigoZWxlbWVudDogbnVtYmVyW10pID0+IG1pbiA8PSBlbGVtZW50WzBdICYmIGVsZW1lbnRbMF0gPD0gIG1heCksXG4gICAgICAgIGNvbG9yOiBlbGVtZW50LmNvbG9yLFxuICAgICAgICBzdHlsZTogZWxlbWVudC5zdHlsZSxcbiAgICAgICAgaW50ZXJwb2xhdGlvbjogZWxlbWVudC5pbnRlcnBvbGF0aW9uXG4gICAgfX0pIFxuICAgIGxldCB0aW1lOiBudW1iZXJbXTtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaCgoZWxlbWVudCxpbmRleCkgPT4ge1xuICAgICAgdGltZT1bXTtcbiAgICAgIGVsZW1lbnQudmFsdWVzLmZvckVhY2goKGVsZW1lbnQgPT4gdGltZS5wdXNoKGVsZW1lbnRbMF0pKSk7XG4gICAgICBsZXQgaSA9IGQzLmJpc2VjdExlZnQodGltZSwgbWluKS0xO1xuICAgICAgaWYoaT49MCYmaTx0aGlzLmRhdGFbaW5kZXhdLnZhbHVlcy5sZW5ndGgpe1xuICAgICAgICB0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXMudW5zaGlmdChbbWluLCh0aGlzLmRhdGFbaW5kZXhdLnZhbHVlc1tpXVsxXSldKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlcy5wdXNoKFttYXgsdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzW3RoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlcy5sZW5ndGgtMV1bMV1dKTtcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbmQgYnVpbGQgYSBuZXcgdG9vbHRpcHNcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlVG9vbFRpcHMoKTogdm9pZHtcbiAgICB0aGlzLnRvb2x0aXAucmVtb3ZlKCk7XG4gICAgdGhpcy5kcmF3VG9vbFRpcHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBY3RpdmUgbW92ZW1lbnQgb2Ygc2Nyb2xsYmFyIG9uIG1vdXNlZG93biBvbiBpdFxuICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFxuICAgKi8gXG4gIHByaXZhdGUgYWN0aXZlU2Nyb2xsYmFyKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZHtcbiAgICB0aGlzLnNjcm9sbGJhclNlbGVjdGVkPXRydWU7XG4gICAgdGhpcy5sYXN0UG9zPWV2ZW50LmNsaWVudFgtdGhpcy5tYXJnaW4ubGVmdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNhY3RpdmUgbW92ZW1lbnQgb2Ygc2Nyb2xsYmFyIG9uIG1vdXNldXAgb3IgbW91c2VsZWF2ZSBvbiBpdFxuICAgKi9cbiAgcHJpdmF0ZSBkZXNhY3RpdmVTY3JvbGxiYXIoKTogdm9pZHtcbiAgICB0aGlzLnNjcm9sbGJhclNlbGVjdGVkPWZhbHNlO1xuICAgIHRoaXMubGFzdFBvcz0wO1xuICB9XG5cbiAgLyoqXG4gICAqIFNob3cgdGhlIHRvb2x0aXBzIG9uIHRoZSBtb3ZlbWVudCBvZiB0aGUgbW91c2VcbiAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBcbiAgICovXG4gIHByaXZhdGUgc2hvd0luZm8oZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lke1xuICAgIGlmICh0aGlzLmRhdGFab29tWzBdICE9IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGFab29tLmxlbmd0aCA8Mikge1xuICAgICAgdmFyIGQ6IG51bWJlcj0wO1xuICAgICAgdmFyIHQ6IG51bWJlcj0wO1xuICAgICAgbGV0IHRpbWU6IG51bWJlcltdID0gW107XG4gICAgICB0aGlzLmRhdGFab29tWzBdLnZhbHVlcy5mb3JFYWNoKChlbGVtZW50KSA9PiB0aW1lLnB1c2goZWxlbWVudFswXSkpO1xuICAgICAgbGV0IHgwID0gdGhpcy5zY2FsZVguaW52ZXJ0KGV2ZW50LmNsaWVudFggLSB0aGlzLm1hcmdpbi5sZWZ0KS5nZXRUaW1lKCk7XG4gICAgICBsZXQgeCA9IGQzLmJpc2VjdFJpZ2h0KHRpbWUsIHgwKTtcbiAgICAgIGlmKHg+dGhpcy5kYXRhWm9vbVswXS52YWx1ZXMubGVuZ3RoLTEpeD10aGlzLmRhdGFab29tWzBdLnZhbHVlcy5sZW5ndGgtMTtcbiAgICAgIGVsc2UgaWYgKHggPCAwKSB4ID0gMDtcbiAgICAgICAgZCAgPSB0aGlzLmRhdGFab29tWzBdLnZhbHVlc1t4XVsxXTtcbiAgICAgICAgdCA9IHRoaXMuZGF0YVpvb21bMF0udmFsdWVzW3hdWzBdO1xuICAgICAgbGV0IGRhdGUgPSBuZXcgRGF0ZSh0KS50b0xvY2FsZURhdGVTdHJpbmcoXCJmclwiLCB7IHllYXI6ICdudW1lcmljJywgbW9udGg6ICdsb25nJywgZGF5OiAnbnVtZXJpYycsIGhvdXI6ICdudW1lcmljJywgbWludXRlOiAnbnVtZXJpYycsIHNlY29uZDogJ251bWVyaWMnIH0pO1xuICAgICAgZDMuc2VsZWN0QWxsKCcjdG9vbHRpcC1kYXRlMScpXG4gICAgICAgIC50ZXh0KGRhdGUpO1xuICAgICAgZDMuc2VsZWN0QWxsKCcjdG9vbHRpcC1kYXRlMicpXG4gICAgICAgIC50ZXh0KHRoaXMucm91bmREZWNpbWFsKGQsIDIpKTtcbiAgICAgIHRoaXMudG9vbHRpcC5zdHlsZShcImRpc3BsYXlcIixcImJsb2NrXCIpO1xuICAgICAgdGhpcy50b29sdGlwLnN0eWxlKFwib3BhY2l0eVwiLCAxMDApO1xuICAgICAgdGhpcy50b29sdGlwLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB0aGlzLnNjYWxlWCh0KSArIFwiLFwiICsgdGhpcy5zY2FsZVkoZCkgKyBcIilcIik7XG4gICAgICBpZiAodGhpcy5zY2FsZVkoZCkgPD0gNDAgKiB0aGlzLmRhdGFab29tLmxlbmd0aCkge1xuICAgICAgICBpZiAodGhpcy5tb2RlVG9vbFRpcHMgIT0gXCJpbnZlcnNlXCIpIHtcbiAgICAgICAgICB0aGlzLm1vZGVUb29sVGlwcyA9IFwiaW52ZXJzZVwiO1xuICAgICAgICAgIHRoaXMudXBkYXRlVG9vbFRpcHMoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMubW9kZVRvb2xUaXBzICE9IFwibm9ybWFsXCIpIHtcbiAgICAgICAgICB0aGlzLm1vZGVUb29sVGlwcyA9IFwibm9ybWFsXCI7XG4gICAgICAgICAgdGhpcy51cGRhdGVUb29sVGlwcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhpZGUgdGhlIHRvb2x0aXBzIHdoZW4gdGhlIG1vdXNlIGxlYXZlIHRoZSBzdmcgXG4gICAqLyAgIFxuICBwcml2YXRlIGhpZGVJbmZvKCk6IHZvaWR7XG4gICAgdGhpcy50b29sdGlwLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSByYW5nZSAocmVkdWNlIG9yIGluY3JlYXNlKSBvZiB0aGUgbGluZWNoYXJ0IG9uIHNjcm9sbCBcbiAgICogQHBhcmFtIHtXaGVlbEV2ZW50fSBldmVudCBcbiAgICovXG4gIHByaXZhdGUgYWN0aXZlWm9vbShldmVudDogV2hlZWxFdmVudCk6IHZvaWR7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBsZXQgbGFzdExlbmd0aExvY2FsVGltZSA9IHRoaXMubGVuZ3RoVGltZSAvIE1hdGgucG93KDEuNSx0aGlzLmlkWm9vbSk7XG4gICAgbGV0IGxhc3RNaW5Mb2NhbFRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpO1xuICAgIGlmKChldmVudC5kZWx0YVk+MCYmdGhpcy5pZFpvb20+MCl8fGV2ZW50LmRlbHRhWTwwKXtcbiAgICAgIGlmKGV2ZW50LmRlbHRhWT4wJiZ0aGlzLmlkWm9vbT4wKXtcbiAgICAgICAgdGhpcy5pZFpvb20tLTtcbiAgICAgIH1lbHNlIGlmKGV2ZW50LmRlbHRhWTwwKXtcbiAgICAgICAgdGhpcy5pZFpvb20rKzsgXG4gICAgICB9XG4gICAgICBsZXQgcG9zID0gdGhpcy5zY2FsZVguaW52ZXJ0KGV2ZW50LmNsaWVudFgtdGhpcy5tYXJnaW4ubGVmdCkuZ2V0VGltZSgpO1xuICAgICAgbGV0IGxlbmd0aExvY2FsVGltZSA9IHRoaXMubGVuZ3RoVGltZSAvIE1hdGgucG93KDEuNSx0aGlzLmlkWm9vbSk7XG4gICAgICBpZihsZW5ndGhMb2NhbFRpbWU+MjAwKXtcbiAgICAgICAgbGV0IG1pbkxvY2FsVGltZSA9IChsYXN0TWluTG9jYWxUaW1lLXBvcykqKGxlbmd0aExvY2FsVGltZS9sYXN0TGVuZ3RoTG9jYWxUaW1lKSArIHBvcztcbiAgICAgICAgdGhpcy5yYW5nZSA9IHRoaXMuY29udHJvbFJhbmdlKG1pbkxvY2FsVGltZSxsZW5ndGhMb2NhbFRpbWUpO1xuICAgICAgICB0aGlzLnVwZGF0ZURhdGFab29tKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICAgIHRoaXMudXBkYXRlU3ZnKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICAgIHRoaXMucmFuZ2VDaGFuZ2UuZW1pdCh0aGlzLnJhbmdlKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmlkWm9vbS0tO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHZhbHVlIG9mIGN1cnJlbnQgdGltZSBvbiB0aGUgbW92ZW1lbnQgb2YgdGhlIG1vdXNlXG4gICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgXG4gICAqL1xuICBwcml2YXRlIG1vdmVDdXJyZW50VGltZShldmVudDogTW91c2VFdmVudCk6IHZvaWR7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBsZXQgcG9zID0gdGhpcy5zY2FsZVguaW52ZXJ0KGV2ZW50LmNsaWVudFgtdGhpcy5tYXJnaW4ubGVmdCkuZ2V0VGltZSgpO1xuICAgIGlmKHBvczx0aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpKXtcbiAgICAgIHRoaXMuY3VycmVudFRpbWU9dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1pblwiKTtcbiAgICB9ZWxzZSBpZihwb3M+dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1heFwiKSl7XG4gICAgICB0aGlzLmN1cnJlbnRUaW1lPXRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNYXhcIik7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLmN1cnJlbnRUaW1lPXBvcztcbiAgICB9XG4gICAgdGhpcy51cGRhdGVDdXJyZW50VGltZSgpO1xuICAgIHRoaXMuY3VycmVudFRpbWVDaGFuZ2UuZW1pdCh0aGlzLmN1cnJlbnRUaW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb250cm9sIHRoZSByYW5nZSBiYXNlZCBvbiBkYXRhJ3MgdGltZXN0YW1wIGFuZCB0aGUgbmV3IHJhbmdlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtaW4gb2YgdGhlIG5ldyByYW5nZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoIG9mIHRoZSBuZXcgcmFuZ2VcbiAgICogQHJldHVybnMgYSBhZGp1c3RlZCByYW5nZSBiYXNlZCBvbiBkYXRhJ3MgdGltZXN0YW1wXG4gICAqL1xuICBwcml2YXRlIGNvbnRyb2xSYW5nZShtaW46bnVtYmVyLCBsZW5ndGg6bnVtYmVyKSA6IFtudW1iZXIsbnVtYmVyXXtcbiAgICBpZih0aGlzLm1pblRpbWU+bWluKSBtaW49dGhpcy5taW5UaW1lO1xuICAgIGxldCBtYXggPSBtaW4gKyBsZW5ndGg7XG4gICAgaWYodGhpcy5tYXhUaW1lPG1heCl7XG4gICAgICBtYXg9dGhpcy5tYXhUaW1lO1xuICAgICAgbWluPW1heCAtIGxlbmd0aDtcbiAgICB9XG4gICAgaWYodGhpcy5taW5UaW1lPm1pbikgbWluPXRoaXMubWluVGltZTtcbiAgICByZXR1cm4gW21pbixtYXhdO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnRyb2wgdGhlIGRvbWFpbiBiYXNlZCBvbiBkYXRhJ3MgdmFsdWUgdHlwZSBhbmQgdGhlIGlucHV0IGRvbWFpblxuICAgKiBAcmV0dXJucyBhIG5ldyBkb21haW4gYXV0by1zY2FsZWQgaWYgdGhlIGlucHV0IGRvbWFpbiBpcyBlcXVhbCB0byBbMCwwXSBvciB0aGUgZGF0YSdzIHZhbHVlIGFyZSBwb3NpdGl2ZSBpbnRlZ2VycywgZWxzZSByZXR1cm4gdGhlIGlucHV0IGRvbWFpbiBcbiAgICovXG4gIHByaXZhdGUgY29udHJvbERvbWFpbigpOltudW1iZXIsbnVtYmVyXXtcbiAgICBpZigodGhpcy5kb21haW5bMF09PTAmJnRoaXMuZG9tYWluWzFdPT0wKXx8dGhpcy5kaXNjcmV0ZVZhbHVlKHRoaXMuZGF0YSkpe1xuICAgICAgcmV0dXJuIFt0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInlNaW5cIiksdGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ5TWF4XCIpXTtcbiAgICB9ZWxzZXtcbiAgICAgIHJldHVybiB0aGlzLmRvbWFpbjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29udHJvbCB0aGUgY29sb3IgYmFzZWQgb24gY3NzLWNvbG9ycy1uYW1lIGFuZCBoZXgtY29sb3ItY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29sb3IgXG4gICAqIEByZXR1cm5zIGZhbHNlIGlmIHRoZSBwYXJhbSBjb2xvciBpc24ndCBhIGNzcy1jb2xvcnMtbmFtZSBvciBhIHZhbGlkIGhleC1jb2xvci1jb2RlXG4gICAqL1xuICBwcml2YXRlIGNvbnRyb2xDb2xvcihjb2xvcjogc3RyaW5nKTpib29sZWFue1xuICAgIGxldCBzID0gbmV3IE9wdGlvbigpLnN0eWxlO1xuICAgIHMuY29sb3IgPSBjb2xvcjtcbiAgICByZXR1cm4gcy5jb2xvciE9XCJcIjtcbiAgfVxuXG4gIC8qKiBcbiAgICogRGV0ZXJtaW5lIHRoZSBtaW5pbXVtIG9yIG1heGltdW0gb2YgdGhlIGhvcml6b250YWwgb3IgdmVydGljYWwgYXhpcyBpbiBkYXRhXG4gICAqIEBwYXJhbSB7RGF0YVtdfSBkYXRhIEFycmF5IG9mIERhdGFcbiAgICogQHBhcmFtIHtcInhNaW5cIiB8IFwieE1heFwiIHwgXCJ5TWluXCIgfCBcInlNYXhcIn0gcyBwcmVjaXNlIHdpaGNoIHNjYWxlIHdlIHdhbnRcbiAgICogQHJldHVybnMgdGhlIHZhbHVlIHRoYXQgbWF0Y2hlcyB3aXRoIHRoZSBwYXJhbWV0ZXIgcyBpbiBkYXRhXG4gICAqL1xuICBwcml2YXRlIHNjYWxlKGRhdGE6IERhdGFbXSwgczogXCJ4TWluXCIgfCBcInhNYXhcIiB8IFwieU1pblwiIHwgXCJ5TWF4XCIpOiBudW1iZXIge1xuICAgIGxldCByZXM6IG51bWJlciA9IDA7XG4gICAgZGF0YS5mb3JFYWNoKFxuICAgICAgKGVsZW1lbnRzLGluZGV4KSA9PiBlbGVtZW50cy52YWx1ZXMuZm9yRWFjaFxuICAgICAgKChlbGVtZW50LGkpID0+IHtcbiAgICAgICAgaWYoKHM9PVwieU1pblwiJiYoKGk9PTAmJmluZGV4PT0wKXx8ZWxlbWVudFsxXTxyZXMpKXx8KHM9PVwieU1heFwiJiYoKGk9PTAmJmluZGV4PT0wKXx8ZWxlbWVudFsxXT5yZXMpKSkgcmVzPWVsZW1lbnRbMV07XG4gICAgICAgIGVsc2UgaWYoKHM9PVwieE1pblwiJiYoKGk9PTAmJmluZGV4PT0wKXx8ZWxlbWVudFswXTxyZXMpKXx8KHM9PVwieE1heFwiJiYoKGk9PTAmJmluZGV4PT0wKXx8ZWxlbWVudFswXT5yZXMpKSkgcmVzPWVsZW1lbnRbMF07XG4gICAgICB9KVxuICAgIClcbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgLyoqIFxuICAqQ2hlY2sgdHlwZSBvZiBkYXRhIChwb3NpdGl2ZSBpbnRlZ2VyIG9yIGZsb2F0KVxuICAqQHBhcmFtIHtEYXRhW119IGRhdGEgQXJyYXkgb2YgRGF0YVxuICAqQHJldHVybnMgZmFsc2UgaWYgdGhlcmUgaXMgYXQgbGVhc3Qgb25lIHZhbHVlIGluIGRhdGEgdGhhdCdzIG5vdCBhIHBvc2l0aXZlIGludGVnZXJcbiAgKi9cbiAgcHJpdmF0ZSBkaXNjcmV0ZVZhbHVlKGRhdGE6IERhdGFbXSk6IGJvb2xlYW57XG4gICAgZm9yKGxldCBpOm51bWJlcj0wO2k8ZGF0YS5sZW5ndGg7aSsrKXtcbiAgICAgIGZvcihsZXQgajpudW1iZXI9MDtqPGRhdGFbaV0udmFsdWVzLmxlbmd0aDtqKyspe1xuICAgICAgICBpZihkYXRhW2ldLnZhbHVlc1tqXVsxXSE9TWF0aC5yb3VuZChkYXRhW2ldLnZhbHVlc1tqXVsxXSkpIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogUm91bmQgYSBudW1iZXIgd2l0aCBhIHByZWNpc2lvblxuICAgKiBAcGFyYW0ge251bWJlcn0gbnVtIFxuICAgKiBAcGFyYW0ge251bWJlcn0gcHJlY2lzaW9uIFxuICAgKiBAcmV0dXJucyBhIG51bSB3aXRoIGEgbnVtYmVyIG9mIGRlY2ltYWwgKHByZWNpc2lvbilcbiAgICovXG4gIHByaXZhdGUgcm91bmREZWNpbWFsKG51bSA6IG51bWJlciwgcHJlY2lzaW9uOm51bWJlcik6IG51bWJlcntcbiAgICBsZXQgdG1wOiBudW1iZXIgPSBNYXRoLnBvdygxMCwgcHJlY2lzaW9uKTtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCggbnVtKnRtcCApL3RtcDtcbiAgfVxufVxuIl19