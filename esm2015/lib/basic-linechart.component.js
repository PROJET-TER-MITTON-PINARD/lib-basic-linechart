import { Component, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import * as i0 from "@angular/core";
export class BasicLinechartComponent {
    constructor(renderer) {
        this.renderer = renderer;
        this.width = 900;
        this.height = 200;
        this.data = [];
        this.domain = [0, 0];
        this.speedZoom = 0.2;
        this.range = [0, 0];
        this.rangeChange = new EventEmitter();
        this.currentTime = 0;
        this.currentTimeChange = new EventEmitter();
        this.title = 'Timeline : ';
        this.margin = { top: 20, right: 20, bottom: 20, left: 20 }; //marge interne au svg 
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
        this.renderer.listen(this.compo.nativeElement, 'mouseleave', () => this.desactiveScrollbar());
        this.renderer.listen(this.compo.nativeElement, 'mouseup', () => this.desactiveScrollbar());
        this.renderer.listen(this.compo.nativeElement, 'mousemove', (event) => this.updateRange(event));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzaWMtbGluZWNoYXJ0LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2Jhc2ljLWxpbmVjaGFydC9zcmMvbGliL2Jhc2ljLWxpbmVjaGFydC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBYyxZQUFZLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBVSxNQUFNLEVBQTRCLFNBQVMsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUc5SSxPQUFPLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQzs7QUFzQnpCLE1BQU0sT0FBTyx1QkFBdUI7SUFtRGxDLFlBQW9CLFFBQW1CO1FBQW5CLGFBQVEsR0FBUixRQUFRLENBQVc7UUFsRDlCLFVBQUssR0FBVyxHQUFHLENBQUM7UUFDcEIsV0FBTSxHQUFXLEdBQUcsQ0FBQztRQUNyQixTQUFJLEdBQVcsRUFBRSxDQUFDO1FBQ2xCLFdBQU0sR0FBcUIsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakMsY0FBUyxHQUFXLEdBQUcsQ0FBQztRQUt4QixVQUFLLEdBQW9CLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlCLGdCQUFXLEdBQUcsSUFBSSxZQUFZLEVBQW1CLENBQUM7UUFDbkQsZ0JBQVcsR0FBVyxDQUFDLENBQUM7UUFDdkIsc0JBQWlCLEdBQUcsSUFBSSxZQUFZLEVBQVUsQ0FBQztRQUlsRCxVQUFLLEdBQVUsYUFBYSxDQUFDO1FBQzVCLFdBQU0sR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QjtRQUM5RSxhQUFRLEdBQVcsRUFBRSxDQUFDO1FBQ3RCLFdBQU0sR0FBVyxDQUFDLENBQUM7UUFDbkIsWUFBTyxHQUFXLENBQUMsQ0FBQztR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SEE5dEJVLHVCQUF1Qjt3R0FBdkIsdUJBQXVCLGl3QkFWeEI7Ozs7OztHQU1UOzJGQUlVLHVCQUF1QjtrQkFabkMsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUscUJBQXFCO29CQUMvQixRQUFRLEVBQUU7Ozs7OztHQU1UO29CQUNELE1BQU0sRUFBRSxFQUNQO2lCQUNGO2dHQUVVLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxNQUFNO3NCQUFkLEtBQUs7Z0JBQ0csSUFBSTtzQkFBWixLQUFLO2dCQUNHLE1BQU07c0JBQWQsS0FBSztnQkFDRyxTQUFTO3NCQUFqQixLQUFLO2dCQUNhLFFBQVE7c0JBQTFCLFNBQVM7dUJBQUMsTUFBTTtnQkFDSSxTQUFTO3NCQUE3QixTQUFTO3VCQUFDLFFBQVE7Z0JBQ0EsYUFBYTtzQkFBL0IsU0FBUzt1QkFBQyxNQUFNO2dCQUNLLEtBQUs7c0JBQTFCLFNBQVM7dUJBQUMsU0FBUztnQkFDWCxLQUFLO3NCQUFiLEtBQUs7Z0JBQ0ksV0FBVztzQkFBcEIsTUFBTTtnQkFDRSxXQUFXO3NCQUFuQixLQUFLO2dCQUNJLGlCQUFpQjtzQkFBMUIsTUFBTTtnQkEyQlAsYUFBYTtzQkFEWixZQUFZO3VCQUFDLGdCQUFnQixFQUFFLENBQUMsUUFBUSxDQUFDO2dCQU8xQyxXQUFXO3NCQURWLFlBQVk7dUJBQUMsY0FBYyxFQUFFLENBQUMsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBFdmVudEVtaXR0ZXIsIEhvc3RMaXN0ZW5lciwgSW5wdXQsIE9uSW5pdCwgT3V0cHV0LCBSZW5kZXJlcjIsIFNpbXBsZUNoYW5nZXMsIFZpZXdDaGlsZCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTY2FsZVRpbWUsIFNjYWxlTGluZWFyfSBmcm9tICdkMy1zY2FsZSc7XG5pbXBvcnQge1NlbGVjdGlvbn0gZnJvbSAnZDMtc2VsZWN0aW9uJztcbmltcG9ydCAqIGFzIGQzIGZyb20gJ2QzJztcblxuZXhwb3J0IGludGVyZmFjZSBEYXRhIHtcbiAgbGFiZWw6IHN0cmluZztcbiAgdmFsdWVzOiBbbnVtYmVyLG51bWJlcl1bXTtcbiAgY29sb3I6IHN0cmluZztcbiAgc3R5bGU6IFwibGluZVwiIHwgXCJhcmVhXCIgfCBcImJvdGhcIjtcbiAgaW50ZXJwb2xhdGlvbjogXCJsaW5lYXJcIiB8IFwic3RlcFwiO1xufVxuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdsaWItYmFzaWMtbGluZWNoYXJ0JyxcbiAgdGVtcGxhdGU6IGBcbiAgPGRpdiAjZWxlbWVudD5cbiAgPGgyPnt7IHRpdGxlIH19PC9oMj5cbiAgPHN2ZyAjcm9vdCBbYXR0ci53aWR0aF09XCJ3aWR0aFwiIFthdHRyLmhlaWdodF09XCJoZWlnaHRcIj48L3N2Zz5cbiAgPGRpdiAjem9uZT48ZGl2ICNzY3JvbGw+PC9kaXY+PC9kaXY+XG4gIDwvZGl2PlxuICBgLFxuICBzdHlsZXM6IFtcbiAgXVxufSlcbmV4cG9ydCBjbGFzcyBCYXNpY0xpbmVjaGFydENvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gIEBJbnB1dCgpIHdpZHRoOiBudW1iZXIgPSA5MDA7XG4gIEBJbnB1dCgpIGhlaWdodDogbnVtYmVyID0gMjAwOyBcbiAgQElucHV0KCkgZGF0YTogRGF0YVtdID0gW107XG4gIEBJbnB1dCgpIGRvbWFpbjogW251bWJlciwgbnVtYmVyXSA9IFswLDBdO1xuICBASW5wdXQoKSBzcGVlZFpvb206IG51bWJlciA9IDAuMjtcbiAgQFZpZXdDaGlsZCgncm9vdCcpIHRpbWVsaW5lITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZCgnc2Nyb2xsJykgc2Nyb2xsYmFyITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZCgnem9uZScpIHpvbmVTY3JvbGxiYXIhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKCdlbGVtZW50JykgY29tcG8hOiBFbGVtZW50UmVmO1xuICBASW5wdXQoKSByYW5nZTogW251bWJlcixudW1iZXJdID0gWzAsMF07XG4gIEBPdXRwdXQoKSByYW5nZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8W251bWJlcixudW1iZXJdPigpO1xuICBASW5wdXQoKSBjdXJyZW50VGltZTogbnVtYmVyID0gMDtcbiAgQE91dHB1dCgpIGN1cnJlbnRUaW1lQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KCk7XG4gIFxuXG5cbiAgcHVibGljIHRpdGxlOnN0cmluZyA9ICdUaW1lbGluZSA6ICc7XG4gIHByaXZhdGUgbWFyZ2luID0geyB0b3A6IDIwLCByaWdodDogMjAsIGJvdHRvbTogMjAsIGxlZnQ6IDIwIH07IC8vbWFyZ2UgaW50ZXJuZSBhdSBzdmcgXG4gIHByaXZhdGUgZGF0YVpvb206IERhdGFbXSA9IFtdO1xuICBwcml2YXRlIGlkWm9vbTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtaW5UaW1lOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1heFRpbWU6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbGVuZ3RoVGltZTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBzdmdXaWR0aDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBzdmdIZWlnaHQ6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgc2NhbGVYOiBTY2FsZVRpbWU8bnVtYmVyLG51bWJlcj4gPSBkMy5zY2FsZVRpbWUoKTtcbiAgcHJpdmF0ZSBzY2FsZVk6IFNjYWxlTGluZWFyPG51bWJlcixudW1iZXI+ID0gZDMuc2NhbGVMaW5lYXIoKTtcbiAgcHJpdmF0ZSBzdmc6IGFueTtcbiAgcHJpdmF0ZSBhcmVhOiBkMy5BcmVhPFtudW1iZXIsIG51bWJlcl0+W10gPSBbXTtcbiAgcHJpdmF0ZSBsaW5lOiBkMy5MaW5lPFtudW1iZXIsIG51bWJlcl0+W10gPSBbXTtcbiAgcHJpdmF0ZSB0b29sdGlwITogU2VsZWN0aW9uPFNWR0dFbGVtZW50LHVua25vd24sbnVsbCx1bmRlZmluZWQ+O1xuICBwcml2YXRlIGxhc3REYXRhbGVuZ3RoOm51bWJlciA9IDA7XG4gIHByaXZhdGUgbW9kZVRvb2xUaXBzOiBcIm5vcm1hbFwiIHwgXCJpbnZlcnNlXCIgPSBcIm5vcm1hbFwiO1xuICBwcml2YXRlIGN1cnJlbnRUaW1lU2VsZWN0ZWQ6Ym9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIHNjcm9sbGJhclNlbGVjdGVkOmJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBsYXN0UG9zOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHpvb21TZWxlY3RlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIEBIb3N0TGlzdGVuZXIoJ3dpbmRvdzprZXlkb3duJywgWyckZXZlbnQnXSlcbiAgaGFuZGxlS2V5RG93bihldmVudDogS2V5Ym9hcmRFdmVudCl7XG4gICAgaWYoZXZlbnQuY3RybEtleSYmIXRoaXMuem9vbVNlbGVjdGVkKXtcbiAgICAgIHRoaXMuem9vbVNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9IFxuICB9XG4gIEBIb3N0TGlzdGVuZXIoJ3dpbmRvdzprZXl1cCcsIFsnJGV2ZW50J10pXG4gIGhhbmRsZUtleVVwKCl7XG4gICAgdGhpcy56b29tU2VsZWN0ZWQgPSBmYWxzZTtcbiAgfVxuICBcbiAgXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyMikgeyAgIFxuICB9XG5cbiAgLyoqXG4gICAqIENvcHkgZGF0YSBpbiBkYXRhWm9vbSwgYW5kIGJ1aWxkIHRpdGxlIFxuICAgKi9cbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuZGF0YVpvb20gPSBbLi4udGhpcy5kYXRhXTtcbiAgICB0aGlzLmxhc3REYXRhbGVuZ3RoPXRoaXMuZGF0YVpvb20ubGVuZ3RoO1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICBpZihpbmRleD09dGhpcy5kYXRhLmxlbmd0aC0xKSB0aGlzLnRpdGxlID0gdGhpcy50aXRsZStlbGVtZW50LmxhYmVsKycuJztcbiAgICAgIGVsc2UgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUrZWxlbWVudC5sYWJlbCArICcsICc7XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGxpbmVjaGFydFxuICAgKi9cbiAgcHVibGljIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50aW1lbGluZSAhPSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCB3ID0gdGhpcy50aW1lbGluZS5uYXRpdmVFbGVtZW50LndpZHRoLmFuaW1WYWwudmFsdWU7XG4gICAgICBsZXQgaCA9IHRoaXMudGltZWxpbmUubmF0aXZlRWxlbWVudC5oZWlnaHQuYW5pbVZhbC52YWx1ZTtcbiAgICAgIHRoaXMuc3ZnV2lkdGggPSAodyAtIHRoaXMubWFyZ2luLmxlZnQpIC0gdGhpcy5tYXJnaW4ucmlnaHQ7XG4gICAgICB0aGlzLnN2Z0hlaWdodCA9IChoIC0gdGhpcy5tYXJnaW4udG9wKSAtIHRoaXMubWFyZ2luLmJvdHRvbTtcbiAgICB9XG4gICAgdGhpcy5kYXRhLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHRoaXMuYnVpbGRTdHlsZURhdGEoZWxlbWVudCxpbmRleCkpO1xuICAgIHRoaXMuY29udHJvbFNwZWVkWm9vbSgpO1xuICAgIHRoaXMuYnVpbGRab29tKCk7IFxuICAgIHRoaXMuYnVpbGRFdmVudCgpO1xuICAgIHRoaXMuZHJhd1Rvb2xUaXBzKCk7XG4gICAgdGhpcy5kcmF3QXhpcygpO1xuICAgIHRoaXMuZHJhd0xpbmVBbmRQYXRoKCk7XG4gICAgdGhpcy5kcmF3TGluZUN1cnJlbnRUaW1lKCk7XG4gICAgdGhpcy5kcmF3U2Nyb2xsYmFyKCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGxpbmVjaGFydCBvbiBkYXRhLCByYW5nZSBvciBjdXJyZW50IHRpbWUgY2hhbmdlc1xuICAgKiBAcGFyYW0ge1NpbXBsZUNoYW5nZXN9IGNoYW5nZXMgXG4gICAqL1xuICBwdWJsaWMgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzLmRhdGEmJiFjaGFuZ2VzLmRhdGEuZmlyc3RDaGFuZ2UpIHRoaXMudXBkYXRlQ2hhcnQoKTtcbiAgICBpZiAoKGNoYW5nZXMuZGF0YSYmIWNoYW5nZXMuZGF0YS5maXJzdENoYW5nZSYmdGhpcy5yYW5nZVswXSE9MCYmdGhpcy5yYW5nZVsxXSE9MCl8fChjaGFuZ2VzLnJhbmdlJiYhY2hhbmdlcy5yYW5nZS5maXJzdENoYW5nZSkpIHtcbiAgICAgIHRoaXMuaWRab29tPU1hdGgucm91bmQoTWF0aC5sb2codGhpcy5sZW5ndGhUaW1lLyh0aGlzLnJhbmdlWzFdLXRoaXMucmFuZ2VbMF0pKS9NYXRoLmxvZygxK3RoaXMuc3BlZWRab29tKSk7XG4gICAgICB0aGlzLnJhbmdlPXRoaXMuY29udHJvbFJhbmdlKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXS10aGlzLnJhbmdlWzBdKTtcbiAgICAgIGlmKHRoaXMuZGF0YS5sZW5ndGghPTApe1xuICAgICAgICB0aGlzLnVwZGF0ZURhdGFab29tKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICAgIHRoaXMudXBkYXRlU3ZnKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjaGFuZ2VzLmN1cnJlbnRUaW1lJiYhY2hhbmdlcy5jdXJyZW50VGltZS5maXJzdENoYW5nZSYmdGhpcy5kYXRhLmxlbmd0aCE9MCkgdGhpcy51cGRhdGVDdXJyZW50VGltZSgpO1xufVxuXG4gIC8qKlxuICAgKiBBZGQgZXZlbnQgbGlzdGVuZXJzIG9uIHRoZSBzdmdcbiAgICovXG4gIHByaXZhdGUgYnVpbGRFdmVudCgpOiB2b2lkeyAvLyBjcmVlciB1bmUgdGltZWxpbmUgYXZlYyB1bmUgc2V1bCBkb25uw6llXG4gICAgdGhpcy5zdmcgPSBkMy5zZWxlY3QodGhpcy50aW1lbGluZS5uYXRpdmVFbGVtZW50KVxuICAgIC5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB0aGlzLm1hcmdpbi5sZWZ0ICsgJywnICsgdGhpcy5tYXJnaW4udG9wICsgJyknKTtcbiAgICBkMy5zZWxlY3QodGhpcy50aW1lbGluZS5uYXRpdmVFbGVtZW50KS5vbihcIm1vdXNlbW92ZVwiLCAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgIGlmKHRoaXMuY3VycmVudFRpbWVTZWxlY3RlZCkgdGhpcy5tb3ZlQ3VycmVudFRpbWUoZXZlbnQpO1xuICAgICAgZWxzZSB0aGlzLnNob3dJbmZvKGV2ZW50KTtcbiAgICB9KVxuICAgIC5vbihcIm1vdXNlbGVhdmVcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnRUaW1lU2VsZWN0ZWQgPSBmYWxzZTsgdGhpcy5oaWRlSW5mbygpIH0pXG4gICAgLm9uKFwid2hlZWxcIiwgKGV2ZW50OiBXaGVlbEV2ZW50KSA9PiB7aWYodGhpcy5kYXRhLmxlbmd0aCE9MClpZih0aGlzLnpvb21TZWxlY3RlZCl7dGhpcy5hY3RpdmVab29tKGV2ZW50KX19KVxuICAgIC5vbihcIm1vdXNldXBcIiwgKCkgPT4gdGhpcy5jdXJyZW50VGltZVNlbGVjdGVkPWZhbHNlKVxuICAgIC5vbihcIm1vdXNlb3ZlclwiLCAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IGV2ZW50LnByZXZlbnREZWZhdWx0KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIHRoZSBzdHlsZSAoYXJlYSwgbGluZSBvciBib3RoKSBhbmQgdGhlIGludGVycG9sYXRpb24gKHN0cGUgb3IgbGluZWFyKSBvZiBsaW5lc1xuICAgKiBAcGFyYW0ge0RhdGF9IGVsZW1lbnQgXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBcbiAgICovXG4gIHByaXZhdGUgYnVpbGRTdHlsZURhdGEoZWxlbWVudDpEYXRhLCBpbmRleDpudW1iZXIpOiB2b2lke1xuICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwiYXJlYVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgIGlmKGVsZW1lbnQuaW50ZXJwb2xhdGlvbj09XCJzdGVwXCIpe1xuICAgICAgICB0aGlzLmFyZWFbaW5kZXhdPWQzLmFyZWEoKVxuICAgICAgICAueCgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgICAueTAodGhpcy5zdmdIZWlnaHQpXG4gICAgICAgIC55MSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKVxuICAgICAgICAuY3VydmUoZDMuY3VydmVTdGVwQWZ0ZXIpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuYXJlYVtpbmRleF09ZDMuYXJlYSgpXG4gICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgIC55MCh0aGlzLnN2Z0hlaWdodClcbiAgICAgICAgLnkxKChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpXG4gICAgICB9XG4gICAgfVxuICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwibGluZVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgIGlmKGVsZW1lbnQuaW50ZXJwb2xhdGlvbj09XCJzdGVwXCIpe1xuICAgICAgICB0aGlzLmxpbmVbaW5kZXhdPWQzLmxpbmUoKVxuICAgICAgICAueCgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgICAueSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKVxuICAgICAgICAuY3VydmUoZDMuY3VydmVTdGVwQWZ0ZXIpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMubGluZVtpbmRleF09ZDMubGluZSgpXG4gICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgIC55KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpXG4gICAgICB9XG4gICAgfVxuICAgIGlmKCF0aGlzLmNvbnRyb2xDb2xvcihlbGVtZW50LmNvbG9yKSl7XG4gICAgICBjb25zb2xlLndhcm4oXCJEYXRhIHdpdGggXCIgKyBlbGVtZW50LmxhYmVsICsgXCIgbGFiZWwsIGhhcyBhbiB1bnZhbGlkIGNvbG9yIGF0dHJpYnV0ZSAoXCIgKyBlbGVtZW50LmNvbG9yICsgXCIpLiBSZXBsYWNlIHdpdGggdGhlIGRlZmF1bHQgY29sb3IgKGJsYWNrKS5cIik7XG4gICAgICBlbGVtZW50LmNvbG9yPVwiYmxhY2tcIjtcbiAgICB9IFxuICB9XG5cbiAgLyoqXG4gICAqIFNhdmUgaW5mb3JtYXRpb24gZm9yIHpvb20uXG4gICAqL1xuICBwcml2YXRlIGJ1aWxkWm9vbSgpOiB2b2lke1xuICAgIHRoaXMubWluVGltZSA9IHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieE1pblwiKTtcbiAgICB0aGlzLm1heFRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInhNYXhcIik7XG4gICAgdGhpcy5sZW5ndGhUaW1lID0gdGhpcy5tYXhUaW1lIC0gdGhpcy5taW5UaW1lO1xuICAgIHRoaXMuaWRab29tPTA7XG4gIH1cblxuICAvKipcbiAgICogRHJhdyB0aGUgdG9vbHRpcHMncyBzdmdcbiAgICovXG4gIHByaXZhdGUgZHJhd1Rvb2xUaXBzKCk6IHZvaWR7IC8vY3JlZXIgbGUgdG9vbHRpcHNcbiAgICB0aGlzLnRvb2x0aXAgPSB0aGlzLnN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0b29sdGlwXCIpXG4gICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgIC8vIExlIGNlcmNsZSBleHTDqXJpZXVyIGJsZXUgY2xhaXJcbiAgICB0aGlzLnRvb2x0aXAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIiNDQ0U1RjZcIilcbiAgICAgICAgLmF0dHIoXCJyXCIsIDEwKTtcbiAgICAvLyBMZSBjZXJjbGUgaW50w6lyaWV1ciBibGV1IGZvbmPDqVxuICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwiIzM0OThkYlwiKVxuICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcIiNmZmZcIilcbiAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgXCIxLjVweFwiKVxuICAgICAgICAuYXR0cihcInJcIiwgNCk7XG4gICAgLy8gTGUgdG9vbHRpcCBlbiBsdWktbcOqbWUgYXZlYyBzYSBwb2ludGUgdmVycyBsZSBiYXNcbiAgICAvLyBJbCBmYXV0IGxlIGRpbWVuc2lvbm5lciBlbiBmb25jdGlvbiBkdSBjb250ZW51XG4gICAgaWYgKHRoaXMubW9kZVRvb2xUaXBzID09IFwibm9ybWFsXCIpIHtcbiAgICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJwb2x5bGluZVwiKVxuICAgICAgICAuYXR0cihcInBvaW50c1wiLCBcIjAsMCAwLDQwIDc1LDQwICA4MCw0NSAgODUsNDAgIDE2MCw0MCAgMTYwLDAgMCwwXCIpXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgXCIjZmFmYWZhXCIpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZVwiLFwiIzM0OThkYlwiKVxuICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsXCIwLjlcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsXCIxXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwtNTApXCIpO1xuICAgICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgIC8vIENldCDDqWzDqW1lbnQgY29udGllbmRyYSB0b3V0IG5vdHJlIHRleHRlXG4gICAgICAgIGxldCB0ZXh0ID0gdGhpcy50b29sdGlwLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAuc3R5bGUoXCJmb250LXNpemVcIiwgXCIxM3B4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiZm9udC1mYW1pbHlcIiwgXCJTZWdvZSBVSVwiKVxuICAgICAgICAgIC5zdHlsZShcImNvbG9yXCIsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwtNDIpXCIpO1xuICAgICAgICAvLyBFbGVtZW50IHBvdXIgbGEgZGF0ZSBhdmVjIHBvc2l0aW9ubmVtZW50IHNww6ljaWZpcXVlXG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiN1wiKVxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCI1XCIpXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTFcIik7XG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiLTkwXCIpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjE1XCIpXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTJcIik7XG4gICAgICB9KTtcbiAgICB9ZWxzZSB7XG4gICAgICB0aGlzLnRvb2x0aXAuYXBwZW5kKFwicG9seWxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJwb2ludHNcIiwgXCIwLDk1ICwgMCw1NSAsIDc1LDU1ICwgODAsNTAgLCA4NSw1NSAsIDE2MCw1NSAsIDE2MCw5NSAwLDk1XCIpXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgXCIjZmFmYWZhXCIpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZVwiLFwiIzM0OThkYlwiKVxuICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsXCIwLjlcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsXCIxXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwtNTApXCIpO1xuICAgICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgIC8vIENldCDDqWzDqW1lbnQgY29udGllbmRyYSB0b3V0IG5vdHJlIHRleHRlXG4gICAgICAgIGxldCB0ZXh0ID0gdGhpcy50b29sdGlwLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAuc3R5bGUoXCJmb250LXNpemVcIiwgXCIxM3B4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiZm9udC1mYW1pbHlcIiwgXCJTZWdvZSBVSVwiKVxuICAgICAgICAgIC5zdHlsZShcImNvbG9yXCIsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwtMzApXCIpO1xuICAgICAgICAvLyBFbGVtZW50IHBvdXIgbGEgZGF0ZSBhdmVjIHBvc2l0aW9ubmVtZW50IHNww6ljaWZpcXVlXG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiN1wiKVxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgNTAgKVxuICAgICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0b29sdGlwLWRhdGUxXCIpO1xuICAgICAgICB0ZXh0LmFwcGVuZChcInRzcGFuXCIpXG4gICAgICAgICAgLmF0dHIoXCJkeFwiLCBcIi04MFwiKVxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCIyMFwiKVxuICAgICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0b29sdGlwLWRhdGUyXCIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERyYXcgaG9yaXpvbnRhbCBhbmQgdmVydGljYWwgYXhpcyBhbmQgc2NhbGVcbiAgICovXG4gIHByaXZhdGUgZHJhd0F4aXMoKTogdm9pZHtcbiAgICB0aGlzLnNjYWxlWC5yYW5nZShbMCwgdGhpcy5zdmdXaWR0aF0pO1xuICAgIHRoaXMuc2NhbGVYLmRvbWFpbihbdGhpcy5taW5UaW1lLHRoaXMubWF4VGltZV0pO1xuICAgIHRoaXMuc2NhbGVZID0gZDMuc2NhbGVMaW5lYXIoKTtcbiAgICB0aGlzLnNjYWxlWS5yYW5nZShbdGhpcy5zdmdIZWlnaHQsIDBdKTtcbiAgICB0aGlzLnNjYWxlWS5kb21haW4odGhpcy5jb250cm9sRG9tYWluKCkpO1xuICAgIC8vIENvbmZpZ3VyZSB0aGUgWCBBeGlzXG4gICAgdGhpcy5zdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsJyArIHRoaXMuc3ZnSGVpZ2h0ICsgJyknKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3hBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNCb3R0b20odGhpcy5zY2FsZVgpKTtcbiAgICAvLyBDb25maWd1cmUgdGhlIFkgQXhpc1xuICAgIGlmKHRoaXMuZGlzY3JldGVWYWx1ZSh0aGlzLmRhdGEpKXtcbiAgICAgIHRoaXMuc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAneUF4aXMnKVxuICAgICAgLmNhbGwoZDMuYXhpc0xlZnQodGhpcy5zY2FsZVkpLnRpY2tzKHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieU1heFwiKSkpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5zdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd5QXhpcycpXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh0aGlzLnNjYWxlWSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3IGxpbmVzIG9uIHRoZSBsaW5lIGNoYXJ0XG4gICAqL1xuICBwcml2YXRlIGRyYXdMaW5lQW5kUGF0aCgpOiB2b2lke1xuICAgIHRoaXMuZGF0YVpvb20uZm9yRWFjaChcbiAgICAgIChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwiYXJlYVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgICAgICB0aGlzLnN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAgIC5kYXR1bSh0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXMpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2FyZWEnK2luZGV4KVxuICAgICAgICAgIC5hdHRyKCdkJywgdGhpcy5hcmVhW2luZGV4XSlcbiAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAwLjEpXG4gICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwLjMpXG4gICAgICAgICAgLnN0eWxlKCdmaWxsJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnMnB4JylcbiAgICAgICAgfVxuICAgICAgICBpZihlbGVtZW50LnN0eWxlPT1cImxpbmVcIiB8fCBlbGVtZW50LnN0eWxlPT1cImJvdGhcIil7XG4gICAgICAgICAgdGhpcy5zdmcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgICAuZGF0dW0oZWxlbWVudC52YWx1ZXMpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmUnK2luZGV4KVxuICAgICAgICAgIC5hdHRyKCdkJywgdGhpcy5saW5lW2luZGV4XSlcbiAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCAnbm9uZScpXG4gICAgICAgICAgLnN0eWxlKCdzdHJva2UnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzJweCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gIH1cblxuICAvKipcbiAgICogRHJhdyB0aGUgdmVydGljYWwgbGluZSB3aGljaCByZXByZXNlbnRzIHRoZSBjdXJyZW50IHRpbWVcbiAgICovXG4gIHByaXZhdGUgZHJhd0xpbmVDdXJyZW50VGltZSgpOiB2b2lke1xuICAgIGlmKHRoaXMuZGF0YS5sZW5ndGghPTApe1xuICAgICAgaWYodGhpcy5jdXJyZW50VGltZT09MCl7XG4gICAgICAgIHRoaXMuY3VycmVudFRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInhNaW5cIik7XG4gICAgICB9XG4gICAgICBsZXQgeDpudW1iZXI9MDtcbiAgICAgIHRoaXMuc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5kYXR1bShbW3RoaXMuY3VycmVudFRpbWUsdGhpcy5jb250cm9sRG9tYWluKClbMF1dLFt0aGlzLmN1cnJlbnRUaW1lLHRoaXMuc3ZnSGVpZ2h0XV0pXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjdXJyZW50VGltZUxpbmUnKVxuICAgICAgICAuYXR0cignZCcsIGQzLmxpbmUoKVxuICAgICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4geD10aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgICAgICAueSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKSlcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgJ25vbmUnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsICdyZWQnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICczcHgnKTtcbiAgICAgIHRoaXMuc3ZnLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2N1cnJlbnRUaW1lU2VsZWN0b3InKVxuICAgICAgICAuYXR0cignY3gnLCB4KVxuICAgICAgICAuYXR0cignY3knLCAtMTMpXG4gICAgICAgIC5hdHRyKCdyJywgNylcbiAgICAgICAgLmF0dHIoJ2ZpbGwnLCAncmVkJylcbiAgICAgICAgLm9uKFwibW91c2Vkb3duXCIsICgpID0+IHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRUaW1lU2VsZWN0ZWQ9dHJ1ZTtcbiAgICAgICAgICB0aGlzLmhpZGVJbmZvKCk7XG4gICAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERyYXcgdGhlIHNjcm9sbGJhciBhbmQgZXZlbnQgbGlzdGVuZXIgb24gaXQgIFxuICAgKi9cbiAgcHJpdmF0ZSBkcmF3U2Nyb2xsYmFyKCk6IHZvaWR7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUud2lkdGggPSB0aGlzLnN2Z1dpZHRoK1wicHhcIjtcbiAgICB0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5tYXJnaW5MZWZ0ID0gdGhpcy5tYXJnaW4ubGVmdCsgXCJweFwiO1xuICAgIHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmhlaWdodCA9IFwiMjBweFwiO1xuICAgIHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwibGlnaHRncmV5XCI7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCIxMHB4XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS53aWR0aCA9IHRoaXMuc3ZnV2lkdGgrXCJweFwiO1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gXCIyMHB4XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcImdyZXlcIjtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmJvcmRlclJhZGl1cyA9IFwiMTBweFwiO1xuICAgIHRoaXMuY29tcG8ubmF0aXZlRWxlbWVudC5zdHlsZS53aWR0aCA9IHRoaXMuc3ZnV2lkdGgrdGhpcy5tYXJnaW4ubGVmdCtcInB4XCI7XG4gICAgdGhpcy5jb21wby5uYXRpdmVFbGVtZW50LnN0eWxlLnBhZGRpbmcgPSBcIjEwcHggMTBweCAxMHB4IDEwcHhcIjtcbiAgICB0aGlzLnJlbmRlcmVyLmxpc3Rlbih0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LCAnbW91c2Vkb3duJywgKGV2ZW50Ok1vdXNlRXZlbnQpID0+IHRoaXMuYWN0aXZlU2Nyb2xsYmFyKGV2ZW50KSk7XG4gICAgdGhpcy5yZW5kZXJlci5saXN0ZW4odGhpcy5jb21wby5uYXRpdmVFbGVtZW50LCAnbW91c2VsZWF2ZScsICgpID0+IHRoaXMuZGVzYWN0aXZlU2Nyb2xsYmFyKCkpO1xuICAgIHRoaXMucmVuZGVyZXIubGlzdGVuKHRoaXMuY29tcG8ubmF0aXZlRWxlbWVudCwgJ21vdXNldXAnLCAoKSA9PiB0aGlzLmRlc2FjdGl2ZVNjcm9sbGJhcigpKTtcbiAgICB0aGlzLnJlbmRlcmVyLmxpc3Rlbih0aGlzLmNvbXBvLm5hdGl2ZUVsZW1lbnQsJ21vdXNlbW92ZScsIChldmVudDpNb3VzZUV2ZW50KSA9PiB0aGlzLnVwZGF0ZVJhbmdlKGV2ZW50KSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGFsbCB0aGUgbGluZSBjaGFydCAoaG9yaXpvbnRhbCBhbmQgdmVydGljYWwgYXhpcyBhbmQgc2NhbGUsIGRhdGEsIGxpbmVzIGFuZCByYW5nZSkgb24gZGF0YSBjaGFuZ2VzLiBcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlQ2hhcnQoKTogdm9pZHtcbiAgICB0aGlzLmRhdGFab29tID0gWy4uLnRoaXMuZGF0YV07XG4gICAgdGhpcy5kYXRhLmZvckVhY2goXG4gICAgICAoZWxlbWVudCxpbmRleCkgPT4ge1xuICAgICAgICB0aGlzLmJ1aWxkU3R5bGVEYXRhKGVsZW1lbnQsaW5kZXgpO1xuICAgICAgICBpZihlbGVtZW50LnN0eWxlPT1cImFyZWFcIikgdGhpcy5zdmcuc2VsZWN0QWxsKCcubGluZScraW5kZXgpLnJlbW92ZSgpO1xuICAgICAgICBpZihlbGVtZW50LnN0eWxlPT1cImxpbmVcIikgdGhpcy5zdmcuc2VsZWN0QWxsKCcuYXJlYScraW5kZXgpLnJlbW92ZSgpO1xuICAgICAgICB0aGlzLnRpdGxlID0gJ1RpbWVsaW5lIDogJztcbiAgICAgICAgaWYoaW5kZXg9PXRoaXMuZGF0YS5sZW5ndGgtMSkgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUrZWxlbWVudC5sYWJlbCsnLic7XG4gICAgICAgIGVsc2UgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUrZWxlbWVudC5sYWJlbCArICcsICc7XG4gICAgfSlcbiAgICB0aGlzLmJ1aWxkWm9vbSgpO1xuICAgIHRoaXMuc2NhbGVYLmRvbWFpbihbdGhpcy5taW5UaW1lLHRoaXMubWF4VGltZV0pO1xuICAgIHRoaXMuc2NhbGVZLnJhbmdlKFt0aGlzLnN2Z0hlaWdodCwgMF0pO1xuICAgIHRoaXMuY29udHJvbERvbWFpbigpO1xuICAgIHRoaXMuc2NhbGVZLmRvbWFpbih0aGlzLmNvbnRyb2xEb21haW4oKSk7XG4gICAgaWYodGhpcy5kaXNjcmV0ZVZhbHVlKHRoaXMuZGF0YSkpe1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcueUF4aXMnKVxuICAgICAgLmNhbGwoZDMuYXhpc0xlZnQodGhpcy5zY2FsZVkpLnRpY2tzKHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieU1heFwiKSkpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcueUF4aXMnKVxuICAgICAgLmNhbGwoZDMuYXhpc0xlZnQodGhpcy5zY2FsZVkpKTtcbiAgICB9XG4gICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcueEF4aXMnKS5jYWxsKGQzLmF4aXNCb3R0b20odGhpcy5zY2FsZVgpKTtcbiAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZUxpbmUnKS5yZW1vdmUoKTtcbiAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZVNlbGVjdG9yJykucmVtb3ZlKCk7XG4gICAgdGhpcy51cGRhdGVMaW5lKCk7XG4gICAgdGhpcy5kcmF3TGluZUN1cnJlbnRUaW1lKCk7XG4gICAgdGhpcy51cGRhdGVTY3JvbGxiYXIodGhpcy5taW5UaW1lLHRoaXMubWF4VGltZSk7XG4gICAgdGhpcy51cGRhdGVUb29sVGlwcygpO1xuICAgIGZvcihsZXQgaW5kZXg9dGhpcy5kYXRhWm9vbS5sZW5ndGg7IGluZGV4PHRoaXMubGFzdERhdGFsZW5ndGg7IGluZGV4Kyspe1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcubGluZScraW5kZXgpLnJlbW92ZSgpO1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuYXJlYScraW5kZXgpLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLmxhc3REYXRhbGVuZ3RoPXRoaXMuZGF0YVpvb20ubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBob3Jpem9udGFsIGF4aXMsIGN1cnJlbnQgdGltZSBsaW5lLCBsaW5lcyBhbmQgc2Nyb2xsYmFyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtaW4gb2YgdGhlIG5ldyByYW5nZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4IG9mIHRoZSBuZXcgcmFuZ2VcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlU3ZnKG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gICAgdGhpcy5zY2FsZVguZG9tYWluKFttaW4sbWF4XSk7XG4gICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcueEF4aXMnKS5jYWxsKGQzLmF4aXNCb3R0b20odGhpcy5zY2FsZVgpKTtcbiAgICB0aGlzLnVwZGF0ZUxpbmUoKTtcbiAgICB0aGlzLnVwZGF0ZUN1cnJlbnRUaW1lKCk7XG4gICAgdGhpcy51cGRhdGVTY3JvbGxiYXIobWluLG1heCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBkaXNwbGF5IG9mIGxpbmVzXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZUxpbmUoKTogdm9pZHtcbiAgICBsZXQgbGluZVVwZGF0ZTtcbiAgICBsZXQgYXJlYVVwZGF0ZTtcbiAgICB0aGlzLmRhdGFab29tLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwiYXJlYVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgICAgYXJlYVVwZGF0ZT0gdGhpcy5zdmcuc2VsZWN0QWxsKCcuYXJlYScraW5kZXgpLmRhdGEoW3RoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlc10pO1xuICAgICAgICBhcmVhVXBkYXRlXG4gICAgICAgIC5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdhcmVhJytpbmRleClcbiAgICAgICAgLm1lcmdlKGFyZWFVcGRhdGUpXG4gICAgICAgIC5hdHRyKCdkJywgdGhpcy5hcmVhW2luZGV4XSlcbiAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMC4xKVxuICAgICAgICAuYXR0cignb3BhY2l0eScsIDAuMylcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgLnN0eWxlKCdzdHJva2UnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICcycHgnKTtcbiAgICAgIH1cbiAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwibGluZVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgICAgbGluZVVwZGF0ZT0gdGhpcy5zdmcuc2VsZWN0QWxsKCcubGluZScraW5kZXgpLmRhdGEoW3RoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlc10pO1xuICAgICAgICBsaW5lVXBkYXRlXG4gICAgICAgIC5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdsaW5lJytpbmRleClcbiAgICAgICAgLm1lcmdlKGxpbmVVcGRhdGUpXG4gICAgICAgIC5hdHRyKCdkJywgdGhpcy5saW5lW2luZGV4XSlcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgJ25vbmUnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzJweCcpXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgY3VycmVudCB0aW1lIGxpbmVcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlQ3VycmVudFRpbWUoKTogdm9pZHtcbiAgICBsZXQgbGluZVVwZGF0ZSA9IHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lTGluZScpLmRhdHVtKFtbdGhpcy5jdXJyZW50VGltZSx0aGlzLmNvbnRyb2xEb21haW4oKVswXV0sW3RoaXMuY3VycmVudFRpbWUsdGhpcy5zdmdIZWlnaHRdXSk7XG4gICAgbGV0IHg6bnVtYmVyPTA7XG4gICAgbGluZVVwZGF0ZS5lbnRlcigpXG4gICAgLmFwcGVuZChcInBhdGhcIilcbiAgICAuYXR0cignY2xhc3MnLCAnY3VycmVudFRpbWVMaW5lJylcbiAgICAubWVyZ2UobGluZVVwZGF0ZSlcbiAgICAuYXR0cignZCcsIGQzLmxpbmUoKVxuICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB4PXRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgLnkoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWShkWzFdKSkpXG4gICAgLnN0eWxlKCdmaWxsJywgJ25vbmUnKVxuICAgIC5zdHlsZSgnc3Ryb2tlJywgJ3JlZCcpXG4gICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnM3B4Jyk7XG4gICAgaWYodGhpcy5jdXJyZW50VGltZT49dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1pblwiKSYmdGhpcy5jdXJyZW50VGltZTw9dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1heFwiKSl7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZUxpbmUnKS5hdHRyKCdkaXNwbGF5JywnYmxvY2snKTtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lU2VsZWN0b3InKS5hdHRyKCdkaXNwbGF5JywnYmxvY2snKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lTGluZScpLmF0dHIoJ2Rpc3BsYXknLCdub25lJyk7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZVNlbGVjdG9yJykuYXR0cignZGlzcGxheScsJ25vbmUnKTtcbiAgICB9XG4gICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVTZWxlY3RvcicpLmF0dHIoJ2N4Jyx4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZSBzY3JvbGxiYXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbiBvZiB0aGUgbmV3IHJhbmdlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtYXggb2YgdGhlIG5ldyByYW5nZVxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVTY3JvbGxiYXIobWluOm51bWJlciwgbWF4Om51bWJlcik6IHZvaWR7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5tYXJnaW5MZWZ0PSB0aGlzLnN2Z1dpZHRoKihtaW4tdGhpcy5taW5UaW1lKS8odGhpcy5sZW5ndGhUaW1lKSArIFwicHhcIjtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLndpZHRoPSB0aGlzLnN2Z1dpZHRoKihtYXgtbWluKS8odGhpcy5sZW5ndGhUaW1lKSArIFwicHhcIjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2UgdGhlIHJhbmdlLCBjb250cm9sIGl0LCB1cGRhdGUgZGF0YXMsIHVwZGF0ZSB0aGUgbGluZWNoYXJ0IGFuZCB0aGVuIGVtaXQgdGhlIG5ldyByYW5nZS5cbiAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlUmFuZ2UoZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lke1xuICAgIGlmKHRoaXMuc2Nyb2xsYmFyU2VsZWN0ZWQpe1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGxldCBsZW5ndGhMb2NhbFRpbWUgPSB0aGlzLnJhbmdlWzFdLXRoaXMucmFuZ2VbMF07XG4gICAgICBsZXQgbGFzdE1pbkxvY2FsVGltZSA9IHRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNaW5cIik7XG4gICAgICBsZXQgcG9zID0gZXZlbnQuY2xpZW50WC10aGlzLm1hcmdpbi5sZWZ0O1xuICAgICAgaWYodGhpcy5sYXN0UG9zPT0wKXtcbiAgICAgICAgdGhpcy5sYXN0UG9zPSBwb3M7XG4gICAgICB9XG4gICAgICBsZXQgbWluTG9jYWxUaW1lID0gKHBvcy10aGlzLmxhc3RQb3MpKnRoaXMubGVuZ3RoVGltZS90aGlzLnN2Z1dpZHRoICsgbGFzdE1pbkxvY2FsVGltZTtcbiAgICAgIHRoaXMucmFuZ2UgPSB0aGlzLmNvbnRyb2xSYW5nZShtaW5Mb2NhbFRpbWUsbGVuZ3RoTG9jYWxUaW1lKTtcbiAgICAgIHRoaXMudXBkYXRlRGF0YVpvb20odGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgIHRoaXMudXBkYXRlU3ZnKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICB0aGlzLnJhbmdlQ2hhbmdlLmVtaXQodGhpcy5yYW5nZSk7XG4gICAgICB0aGlzLmxhc3RQb3M9cG9zO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2UgdGhpcy5kYXRhWm9vbSBhdCByYW5nZSBjaGFuZ2VzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtaW4gb2YgdGhlIG5ldyByYW5nZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4IG9mIHRoZSBuZXcgcmFuZ2UgXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZURhdGFab29tKG1pbjpudW1iZXIsbWF4Om51bWJlcik6IHZvaWR7XG4gICAgdGhpcy5kYXRhLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgIHRoaXMuZGF0YVpvb21baW5kZXhdPXtcbiAgICAgICAgbGFiZWw6IGVsZW1lbnQubGFiZWwsXG4gICAgICAgIHZhbHVlczogZWxlbWVudC52YWx1ZXMuZmlsdGVyKChlbGVtZW50OiBudW1iZXJbXSkgPT4gbWluIDw9IGVsZW1lbnRbMF0gJiYgZWxlbWVudFswXSA8PSAgbWF4KSxcbiAgICAgICAgY29sb3I6IGVsZW1lbnQuY29sb3IsXG4gICAgICAgIHN0eWxlOiBlbGVtZW50LnN0eWxlLFxuICAgICAgICBpbnRlcnBvbGF0aW9uOiBlbGVtZW50LmludGVycG9sYXRpb25cbiAgICB9fSkgXG4gICAgbGV0IHRpbWU6IG51bWJlcltdO1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICB0aW1lPVtdO1xuICAgICAgZWxlbWVudC52YWx1ZXMuZm9yRWFjaCgoZWxlbWVudCA9PiB0aW1lLnB1c2goZWxlbWVudFswXSkpKTtcbiAgICAgIGxldCBpID0gZDMuYmlzZWN0TGVmdCh0aW1lLCBtaW4pLTE7XG4gICAgICBpZihpPj0wJiZpPHRoaXMuZGF0YVtpbmRleF0udmFsdWVzLmxlbmd0aCl7XG4gICAgICAgIHRoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlcy51bnNoaWZ0KFttaW4sKHRoaXMuZGF0YVtpbmRleF0udmFsdWVzW2ldWzFdKV0pO1xuICAgICAgfVxuICAgICAgdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzLnB1c2goW21heCx0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXNbdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzLmxlbmd0aC0xXVsxXV0pO1xuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuZCBidWlsZCBhIG5ldyB0b29sdGlwc1xuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVUb29sVGlwcygpOiB2b2lke1xuICAgIHRoaXMudG9vbHRpcC5yZW1vdmUoKTtcbiAgICB0aGlzLmRyYXdUb29sVGlwcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFjdGl2ZSBtb3ZlbWVudCBvZiBzY3JvbGxiYXIgb24gbW91c2Vkb3duIG9uIGl0XG4gICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgXG4gICAqLyBcbiAgcHJpdmF0ZSBhY3RpdmVTY3JvbGxiYXIoZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lke1xuICAgIGlmKHRoaXMuaWRab29tIT0wKXtcbiAgICAgIHRoaXMuc2Nyb2xsYmFyU2VsZWN0ZWQ9dHJ1ZTtcbiAgICAgIHRoaXMubGFzdFBvcz1ldmVudC5jbGllbnRYLXRoaXMubWFyZ2luLmxlZnQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc2FjdGl2ZSBtb3ZlbWVudCBvZiBzY3JvbGxiYXIgb24gbW91c2V1cCBvciBtb3VzZWxlYXZlIG9uIGl0XG4gICAqL1xuICBwcml2YXRlIGRlc2FjdGl2ZVNjcm9sbGJhcigpOiB2b2lke1xuICAgIHRoaXMuc2Nyb2xsYmFyU2VsZWN0ZWQ9ZmFsc2U7XG4gICAgdGhpcy5sYXN0UG9zPTA7XG4gIH1cblxuICAvKipcbiAgICogU2hvdyB0aGUgdG9vbHRpcHMgb24gdGhlIG1vdmVtZW50IG9mIHRoZSBtb3VzZVxuICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFxuICAgKi9cbiAgcHJpdmF0ZSBzaG93SW5mbyhldmVudDogTW91c2VFdmVudCk6IHZvaWR7XG4gICAgaWYgKHRoaXMuZGF0YVpvb21bMF0gIT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YVpvb20ubGVuZ3RoIDwyKSB7XG4gICAgICB2YXIgZDogbnVtYmVyPTA7XG4gICAgICB2YXIgdDogbnVtYmVyPTA7XG4gICAgICBsZXQgdGltZTogbnVtYmVyW10gPSBbXTtcbiAgICAgIHRoaXMuZGF0YVpvb21bMF0udmFsdWVzLmZvckVhY2goKGVsZW1lbnQpID0+IHRpbWUucHVzaChlbGVtZW50WzBdKSk7XG4gICAgICBsZXQgeDAgPSB0aGlzLnNjYWxlWC5pbnZlcnQoZXZlbnQuY2xpZW50WCAtIHRoaXMubWFyZ2luLmxlZnQpLmdldFRpbWUoKTtcbiAgICAgIGxldCB4ID0gZDMuYmlzZWN0UmlnaHQodGltZSwgeDApO1xuICAgICAgaWYoeD50aGlzLmRhdGFab29tWzBdLnZhbHVlcy5sZW5ndGgtMSl4PXRoaXMuZGF0YVpvb21bMF0udmFsdWVzLmxlbmd0aC0xO1xuICAgICAgZWxzZSBpZiAoeCA8IDApIHggPSAwO1xuICAgICAgICBkICA9IHRoaXMuZGF0YVpvb21bMF0udmFsdWVzW3hdWzFdO1xuICAgICAgICB0ID0gdGhpcy5kYXRhWm9vbVswXS52YWx1ZXNbeF1bMF07XG4gICAgICBsZXQgZGF0ZSA9IG5ldyBEYXRlKHQpLnRvTG9jYWxlRGF0ZVN0cmluZyhcImZyXCIsIHsgeWVhcjogJ251bWVyaWMnLCBtb250aDogJ2xvbmcnLCBkYXk6ICdudW1lcmljJywgaG91cjogJ251bWVyaWMnLCBtaW51dGU6ICdudW1lcmljJywgc2Vjb25kOiAnbnVtZXJpYycgfSk7XG4gICAgICBkMy5zZWxlY3RBbGwoJyN0b29sdGlwLWRhdGUxJylcbiAgICAgICAgLnRleHQoZGF0ZSk7XG4gICAgICBkMy5zZWxlY3RBbGwoJyN0b29sdGlwLWRhdGUyJylcbiAgICAgICAgLnRleHQodGhpcy5yb3VuZERlY2ltYWwoZCwgMikpO1xuICAgICAgdGhpcy50b29sdGlwLnN0eWxlKFwiZGlzcGxheVwiLFwiYmxvY2tcIik7XG4gICAgICB0aGlzLnRvb2x0aXAuc3R5bGUoXCJvcGFjaXR5XCIsIDEwMCk7XG4gICAgICB0aGlzLnRvb2x0aXAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHRoaXMuc2NhbGVYKHQpICsgXCIsXCIgKyB0aGlzLnNjYWxlWShkKSArIFwiKVwiKTtcbiAgICAgIGlmICh0aGlzLnNjYWxlWShkKSA8PSA0MCAqIHRoaXMuZGF0YVpvb20ubGVuZ3RoKSB7XG4gICAgICAgIGlmICh0aGlzLm1vZGVUb29sVGlwcyAhPSBcImludmVyc2VcIikge1xuICAgICAgICAgIHRoaXMubW9kZVRvb2xUaXBzID0gXCJpbnZlcnNlXCI7XG4gICAgICAgICAgdGhpcy51cGRhdGVUb29sVGlwcygpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5tb2RlVG9vbFRpcHMgIT0gXCJub3JtYWxcIikge1xuICAgICAgICAgIHRoaXMubW9kZVRvb2xUaXBzID0gXCJub3JtYWxcIjtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVRvb2xUaXBzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSGlkZSB0aGUgdG9vbHRpcHMgd2hlbiB0aGUgbW91c2UgbGVhdmUgdGhlIHN2ZyBcbiAgICovICAgXG4gIHByaXZhdGUgaGlkZUluZm8oKTogdm9pZHtcbiAgICB0aGlzLnRvb2x0aXAuc3R5bGUoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHJhbmdlIChyZWR1Y2Ugb3IgaW5jcmVhc2UpIG9mIHRoZSBsaW5lY2hhcnQgb24gc2Nyb2xsIFxuICAgKiBAcGFyYW0ge1doZWVsRXZlbnR9IGV2ZW50IFxuICAgKi9cbiAgcHJpdmF0ZSBhY3RpdmVab29tKGV2ZW50OiBXaGVlbEV2ZW50KTogdm9pZHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGxldCBsYXN0TGVuZ3RoTG9jYWxUaW1lID0gdGhpcy5sZW5ndGhUaW1lIC8gTWF0aC5wb3coMSt0aGlzLnNwZWVkWm9vbSx0aGlzLmlkWm9vbSk7XG4gICAgbGV0IGxhc3RNaW5Mb2NhbFRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpO1xuICAgIGlmKChldmVudC5kZWx0YVk+MCYmdGhpcy5pZFpvb20+MCl8fGV2ZW50LmRlbHRhWTwwKXtcbiAgICAgIGlmKGV2ZW50LmRlbHRhWT4wJiZ0aGlzLmlkWm9vbT4wKXtcbiAgICAgICAgdGhpcy5pZFpvb20tLTtcbiAgICAgIH1lbHNlIGlmKGV2ZW50LmRlbHRhWTwwKXtcbiAgICAgICAgdGhpcy5pZFpvb20rKzsgXG4gICAgICB9XG4gICAgICBsZXQgcG9zID0gdGhpcy5zY2FsZVguaW52ZXJ0KGV2ZW50LmNsaWVudFgtdGhpcy5tYXJnaW4ubGVmdCkuZ2V0VGltZSgpO1xuICAgICAgbGV0IGxlbmd0aExvY2FsVGltZSA9IHRoaXMubGVuZ3RoVGltZSAvIE1hdGgucG93KDErdGhpcy5zcGVlZFpvb20sdGhpcy5pZFpvb20pO1xuICAgICAgaWYobGVuZ3RoTG9jYWxUaW1lPjIwMCl7XG4gICAgICAgIGxldCBtaW5Mb2NhbFRpbWUgPSAobGFzdE1pbkxvY2FsVGltZS1wb3MpKihsZW5ndGhMb2NhbFRpbWUvbGFzdExlbmd0aExvY2FsVGltZSkgKyBwb3M7XG4gICAgICAgIHRoaXMucmFuZ2UgPSB0aGlzLmNvbnRyb2xSYW5nZShtaW5Mb2NhbFRpbWUsbGVuZ3RoTG9jYWxUaW1lKTtcbiAgICAgICAgdGhpcy51cGRhdGVEYXRhWm9vbSh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgICB0aGlzLnVwZGF0ZVN2Zyh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgICB0aGlzLnJhbmdlQ2hhbmdlLmVtaXQodGhpcy5yYW5nZSk7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5pZFpvb20tLTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSB2YWx1ZSBvZiBjdXJyZW50IHRpbWUgb24gdGhlIG1vdmVtZW50IG9mIHRoZSBtb3VzZVxuICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFxuICAgKi9cbiAgcHJpdmF0ZSBtb3ZlQ3VycmVudFRpbWUoZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lke1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgbGV0IHBvcyA9IHRoaXMuc2NhbGVYLmludmVydChldmVudC5jbGllbnRYLXRoaXMubWFyZ2luLmxlZnQpLmdldFRpbWUoKTtcbiAgICBpZihwb3M8dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1pblwiKSl7XG4gICAgICB0aGlzLmN1cnJlbnRUaW1lPXRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNaW5cIik7XG4gICAgfWVsc2UgaWYocG9zPnRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNYXhcIikpe1xuICAgICAgdGhpcy5jdXJyZW50VGltZT10aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWF4XCIpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5jdXJyZW50VGltZT1wb3M7XG4gICAgfVxuICAgIHRoaXMudXBkYXRlQ3VycmVudFRpbWUoKTtcbiAgICB0aGlzLmN1cnJlbnRUaW1lQ2hhbmdlLmVtaXQodGhpcy5jdXJyZW50VGltZSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udHJvbCB0aGUgcmFuZ2UgYmFzZWQgb24gZGF0YSdzIHRpbWVzdGFtcCBhbmQgdGhlIG5ldyByYW5nZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWluIG9mIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aCBvZiB0aGUgbmV3IHJhbmdlXG4gICAqIEByZXR1cm5zIGEgYWRqdXN0ZWQgcmFuZ2UgYmFzZWQgb24gZGF0YSdzIHRpbWVzdGFtcFxuICAgKi9cbiAgcHJpdmF0ZSBjb250cm9sUmFuZ2UobWluOm51bWJlciwgbGVuZ3RoOm51bWJlcikgOiBbbnVtYmVyLG51bWJlcl17XG4gICAgaWYodGhpcy5taW5UaW1lPm1pbikgbWluPXRoaXMubWluVGltZTtcbiAgICBsZXQgbWF4ID0gbWluICsgbGVuZ3RoO1xuICAgIGlmKHRoaXMubWF4VGltZTxtYXgpe1xuICAgICAgbWF4PXRoaXMubWF4VGltZTtcbiAgICAgIG1pbj1tYXggLSBsZW5ndGg7XG4gICAgfVxuICAgIGlmKHRoaXMubWluVGltZT5taW4pIG1pbj10aGlzLm1pblRpbWU7XG4gICAgcmV0dXJuIFttaW4sbWF4XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb250cm9sIHRoZSBkb21haW4gYmFzZWQgb24gZGF0YSdzIHZhbHVlIHR5cGUgYW5kIHRoZSBpbnB1dCBkb21haW5cbiAgICogQHJldHVybnMgYSBuZXcgZG9tYWluIGF1dG8tc2NhbGVkIGlmIHRoZSBpbnB1dCBkb21haW4gaXMgZXF1YWwgdG8gWzAsMF0gb3IgdGhlIGRhdGEncyB2YWx1ZSBhcmUgcG9zaXRpdmUgaW50ZWdlcnMsIGVsc2UgcmV0dXJuIHRoZSBpbnB1dCBkb21haW4gXG4gICAqL1xuICBwcml2YXRlIGNvbnRyb2xEb21haW4oKTpbbnVtYmVyLG51bWJlcl17XG4gICAgaWYoKHRoaXMuZG9tYWluWzBdPT0wJiZ0aGlzLmRvbWFpblsxXT09MCl8fHRoaXMuZGlzY3JldGVWYWx1ZSh0aGlzLmRhdGEpKXtcbiAgICAgIHJldHVybiBbdGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ5TWluXCIpLHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieU1heFwiKV07XG4gICAgfWVsc2V7XG4gICAgICByZXR1cm4gdGhpcy5kb21haW47XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnRyb2wgdGhlIGNvbG9yIGJhc2VkIG9uIGNzcy1jb2xvcnMtbmFtZSBhbmQgaGV4LWNvbG9yLWNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbG9yIFxuICAgKiBAcmV0dXJucyBmYWxzZSBpZiB0aGUgcGFyYW0gY29sb3IgaXNuJ3QgYSBjc3MtY29sb3JzLW5hbWUgb3IgYSB2YWxpZCBoZXgtY29sb3ItY29kZVxuICAgKi9cbiAgcHJpdmF0ZSBjb250cm9sQ29sb3IoY29sb3I6IHN0cmluZyk6Ym9vbGVhbntcbiAgICBsZXQgcyA9IG5ldyBPcHRpb24oKS5zdHlsZTtcbiAgICBzLmNvbG9yID0gY29sb3I7XG4gICAgcmV0dXJuIHMuY29sb3IhPVwiXCI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb250cm9sIHRoZSBzcGVlZFpvb20gaWYgaXQgaXNuJ3QgYmV0d2VlbiAwIGFuZCAxLlxuICAgKi9cbiAgcHJpdmF0ZSBjb250cm9sU3BlZWRab29tKCk6IHZvaWR7XG4gICAgaWYodGhpcy5zcGVlZFpvb208PTApe1xuICAgICAgdGhpcy5zcGVlZFpvb209MC4xO1xuICAgIH1lbHNlIGlmKHRoaXMuc3BlZWRab29tPjEpe1xuICAgICAgdGhpcy5zcGVlZFpvb209MTtcbiAgICB9XG4gIH1cblxuICAvKiogXG4gICAqIERldGVybWluZSB0aGUgbWluaW11bSBvciBtYXhpbXVtIG9mIHRoZSBob3Jpem9udGFsIG9yIHZlcnRpY2FsIGF4aXMgaW4gZGF0YVxuICAgKiBAcGFyYW0ge0RhdGFbXX0gZGF0YSBBcnJheSBvZiBEYXRhXG4gICAqIEBwYXJhbSB7XCJ4TWluXCIgfCBcInhNYXhcIiB8IFwieU1pblwiIHwgXCJ5TWF4XCJ9IHMgcHJlY2lzZSB3aWhjaCBzY2FsZSB3ZSB3YW50XG4gICAqIEByZXR1cm5zIHRoZSB2YWx1ZSB0aGF0IG1hdGNoZXMgd2l0aCB0aGUgcGFyYW1ldGVyIHMgaW4gZGF0YVxuICAgKi9cbiAgcHJpdmF0ZSBzY2FsZShkYXRhOiBEYXRhW10sIHM6IFwieE1pblwiIHwgXCJ4TWF4XCIgfCBcInlNaW5cIiB8IFwieU1heFwiKTogbnVtYmVyIHtcbiAgICBsZXQgcmVzOiBudW1iZXIgPSAwO1xuICAgIGRhdGEuZm9yRWFjaChcbiAgICAgIChlbGVtZW50cyxpbmRleCkgPT4gZWxlbWVudHMudmFsdWVzLmZvckVhY2hcbiAgICAgICgoZWxlbWVudCxpKSA9PiB7XG4gICAgICAgIGlmKChzPT1cInlNaW5cIiYmKChpPT0wJiZpbmRleD09MCl8fGVsZW1lbnRbMV08cmVzKSl8fChzPT1cInlNYXhcIiYmKChpPT0wJiZpbmRleD09MCl8fGVsZW1lbnRbMV0+cmVzKSkpIHJlcz1lbGVtZW50WzFdO1xuICAgICAgICBlbHNlIGlmKChzPT1cInhNaW5cIiYmKChpPT0wJiZpbmRleD09MCl8fGVsZW1lbnRbMF08cmVzKSl8fChzPT1cInhNYXhcIiYmKChpPT0wJiZpbmRleD09MCl8fGVsZW1lbnRbMF0+cmVzKSkpIHJlcz1lbGVtZW50WzBdO1xuICAgICAgfSlcbiAgICApXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8qKiBcbiAgKkNoZWNrIHR5cGUgb2YgZGF0YSAocG9zaXRpdmUgaW50ZWdlciBvciBmbG9hdClcbiAgKkBwYXJhbSB7RGF0YVtdfSBkYXRhIEFycmF5IG9mIERhdGFcbiAgKkByZXR1cm5zIGZhbHNlIGlmIHRoZXJlIGlzIGF0IGxlYXN0IG9uZSB2YWx1ZSBpbiBkYXRhIHRoYXQncyBub3QgYSBwb3NpdGl2ZSBpbnRlZ2VyXG4gICovXG4gIHByaXZhdGUgZGlzY3JldGVWYWx1ZShkYXRhOiBEYXRhW10pOiBib29sZWFue1xuICAgIGZvcihsZXQgaTpudW1iZXI9MDtpPGRhdGEubGVuZ3RoO2krKyl7XG4gICAgICBmb3IobGV0IGo6bnVtYmVyPTA7ajxkYXRhW2ldLnZhbHVlcy5sZW5ndGg7aisrKXtcbiAgICAgICAgaWYoZGF0YVtpXS52YWx1ZXNbal1bMV0hPU1hdGgucm91bmQoZGF0YVtpXS52YWx1ZXNbal1bMV0pKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJvdW5kIGEgbnVtYmVyIHdpdGggYSBwcmVjaXNpb25cbiAgICogQHBhcmFtIHtudW1iZXJ9IG51bSBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHByZWNpc2lvbiBcbiAgICogQHJldHVybnMgYSBudW0gd2l0aCBhIG51bWJlciBvZiBkZWNpbWFsIChwcmVjaXNpb24pXG4gICAqL1xuICBwcml2YXRlIHJvdW5kRGVjaW1hbChudW0gOiBudW1iZXIsIHByZWNpc2lvbjpudW1iZXIpOiBudW1iZXJ7XG4gICAgbGV0IHRtcDogbnVtYmVyID0gTWF0aC5wb3coMTAsIHByZWNpc2lvbik7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoIG51bSp0bXAgKS90bXA7XG4gIH1cbn1cbiJdfQ==