import { Component, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import * as i0 from "@angular/core";
export class BasicLinechartComponent {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzaWMtbGluZWNoYXJ0LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2Jhc2ljLWxpbmVjaGFydC9zcmMvbGliL2Jhc2ljLWxpbmVjaGFydC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBYyxZQUFZLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBVSxNQUFNLEVBQTRCLFNBQVMsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUc5SSxPQUFPLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQzs7QUEwQ3pCLE1BQU0sT0FBTyx1QkFBdUI7SUFrTWxDOzs7T0FHRztJQUNILFlBQW9CLFFBQW1CO1FBQW5CLGFBQVEsR0FBUixRQUFRLENBQVc7UUFyTXZDOzs7V0FHRztRQUNNLFVBQUssR0FBVyxHQUFHLENBQUM7UUFFN0I7OztXQUdHO1FBQ00sV0FBTSxHQUFXLEdBQUcsQ0FBQztRQUU5Qjs7O1dBR0c7UUFDTSxTQUFJLEdBQVcsRUFBRSxDQUFDO1FBRTNCOzs7O1dBSUc7UUFDTSxXQUFNLEdBQXFCLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTFDOzs7V0FHRztRQUNNLGNBQVMsR0FBVyxHQUFHLENBQUM7UUEwQmpDOzs7V0FHRztRQUNNLFVBQUssR0FBb0IsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7UUFFeEM7O1dBRUc7UUFDTyxnQkFBVyxHQUFHLElBQUksWUFBWSxFQUFtQixDQUFDO1FBRTVEOzs7V0FHRztRQUNNLGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1FBRWpDOztXQUVHO1FBQ08sc0JBQWlCLEdBQUcsSUFBSSxZQUFZLEVBQVUsQ0FBQztRQUV6RDs7V0FFRztRQUNJLFVBQUssR0FBVSxhQUFhLENBQUM7UUFFcEM7O1dBRUc7UUFDSyxXQUFNLEdBQXVELEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFB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WSxDQUFDLEdBQVksRUFBRSxTQUFnQjtRQUNqRCxJQUFJLEdBQUcsR0FBVyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUMxQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUUsR0FBRyxHQUFDLEdBQUcsQ0FBRSxHQUFDLEdBQUcsQ0FBQztJQUNuQyxDQUFDOztvSEFoM0JVLHVCQUF1Qjt3R0FBdkIsdUJBQXVCLGl3QkFWeEI7Ozs7OztHQU1UOzJGQUlVLHVCQUF1QjtrQkFabkMsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUscUJBQXFCO29CQUMvQixRQUFRLEVBQUU7Ozs7OztHQU1UO29CQUNELE1BQU0sRUFBRSxFQUNQO2lCQUNGO2dHQU1VLEtBQUs7c0JBQWIsS0FBSztnQkFNRyxNQUFNO3NCQUFkLEtBQUs7Z0JBTUcsSUFBSTtzQkFBWixLQUFLO2dCQU9HLE1BQU07c0JBQWQsS0FBSztnQkFNRyxTQUFTO3NCQUFqQixLQUFLO2dCQU1hLFFBQVE7c0JBQTFCLFNBQVM7dUJBQUMsTUFBTTtnQkFNSSxTQUFTO3NCQUE3QixTQUFTO3VCQUFDLFFBQVE7Z0JBTUEsYUFBYTtzQkFBL0IsU0FBUzt1QkFBQyxNQUFNO2dCQU1LLEtBQUs7c0JBQTFCLFNBQVM7dUJBQUMsU0FBUztnQkFNWCxLQUFLO3NCQUFiLEtBQUs7Z0JBS0ksV0FBVztzQkFBcEIsTUFBTTtnQkFNRSxXQUFXO3NCQUFuQixLQUFLO2dCQUtJLGlCQUFpQjtzQkFBMUIsTUFBTTtnQkE0R1AsYUFBYTtzQkFEWixZQUFZO3VCQUFDLGdCQUFnQixFQUFFLENBQUMsUUFBUSxDQUFDO2dCQU8xQyxXQUFXO3NCQURWLFlBQVk7dUJBQUMsY0FBYyxFQUFFLENBQUMsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBFdmVudEVtaXR0ZXIsIEhvc3RMaXN0ZW5lciwgSW5wdXQsIE9uSW5pdCwgT3V0cHV0LCBSZW5kZXJlcjIsIFNpbXBsZUNoYW5nZXMsIFZpZXdDaGlsZCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTY2FsZVRpbWUsIFNjYWxlTGluZWFyfSBmcm9tICdkMy1zY2FsZSc7XG5pbXBvcnQge1NlbGVjdGlvbn0gZnJvbSAnZDMtc2VsZWN0aW9uJztcbmltcG9ydCAqIGFzIGQzIGZyb20gJ2QzJztcblxuLyoqXG4gKiBEYXRhJ3MgZm9ybWF0IGZvciB0aGUgY29tcG9uZW50XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YSB7XG4gIC8qKlxuICAgKiBEYXRhJ3MgbmFtZVxuICAgKi9cbiAgbGFiZWw6IHN0cmluZztcblxuICAvKipcbiAgICogRGF0YSdzIHZhbHVlcyBbdGltZXN0YW1wLHZhbHVlXVtdXG4gICAqL1xuICB2YWx1ZXM6IFtudW1iZXIsbnVtYmVyXVtdO1xuICAvKipcbiAgICogTGluZSBvciBhcmVhIGNvbG9yIHlvdSBjYW4gZmlsbCB3aXRoIG5hbWUsIGhleGFjb2RlIG9yIHJnYiBjb2RlLlxuICAgKi9cbiAgY29sb3I6IHN0cmluZztcbiAgLyoqXG4gICAqIFN0eWxlIG9mIGxpbmVcbiAgICovXG4gIHN0eWxlOiBcImxpbmVcIiB8IFwiYXJlYVwiIHwgXCJib3RoXCI7XG4gIC8qKlxuICAgKiBJbnRlcnBvbGF0aW9uIG9mIGxpbmUgXG4gICAqIFJlY29tbWFuZGVkIDogc3RlcCBmb3IgZGlzY3JldGUgdmFsdWVzIGFuZCBsaW5lYXIgZm9yIGNvbnRpbnVvdXMgdmFsdWVzXG4gICAqL1xuICBpbnRlcnBvbGF0aW9uOiBcImxpbmVhclwiIHwgXCJzdGVwXCI7XG59XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2xpYi1iYXNpYy1saW5lY2hhcnQnLFxuICB0ZW1wbGF0ZTogYFxuICA8ZGl2ICNlbGVtZW50PlxuICA8aDI+e3sgdGl0bGUgfX08L2gyPlxuICA8c3ZnICNyb290IFthdHRyLndpZHRoXT1cIndpZHRoXCIgW2F0dHIuaGVpZ2h0XT1cImhlaWdodFwiPjwvc3ZnPlxuICA8ZGl2ICN6b25lPjxkaXYgI3Njcm9sbD48L2Rpdj48L2Rpdj5cbiAgPC9kaXY+XG4gIGAsXG4gIHN0eWxlczogW1xuICBdXG59KVxuZXhwb3J0IGNsYXNzIEJhc2ljTGluZWNoYXJ0Q29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcbiAgLyoqXG4gICAqIElucHV0IHdpZHRoIG9mIHRoZSBjb21wb25lbnRcbiAgICogRGVmYXVsdCB2YWx1ZSA6IDkwMFxuICAgKi9cbiAgQElucHV0KCkgd2lkdGg6IG51bWJlciA9IDkwMDtcbiAgXG4gIC8qKlxuICAgKiBJbnB1dCBoZWlnaHQgb2YgdGhlIGNvbXBlbmVudFxuICAgKiBEZWZhdWx0IHZhbHVlIDogMjAwXG4gICAqL1xuICBASW5wdXQoKSBoZWlnaHQ6IG51bWJlciA9IDIwMDtcbiAgXG4gIC8qKlxuICAgKiBJbnB1dCBkYXRhIGFycmF5IHRoYXQgdGhlIGNvbXBvbmVudCBkaXNwbGF5XG4gICAqIERlZmF1bHQgdmFsdWUgOiBbXVxuICAgKi9cbiAgQElucHV0KCkgZGF0YTogRGF0YVtdID0gW107XG5cbiAgLyoqXG4gICAqIElucHV0IGRvbWFpbiBvZiB0aGUgQXhpcyBZXG4gICAqIFdvcmtzIG9ubHkgZm9yIGNvbnRpbnVvdXMgdmFsdWVzXG4gICAqIERlZmF1bHQgdmFsdWUgOiBbMCwwXVxuICAgKi9cbiAgQElucHV0KCkgZG9tYWluOiBbbnVtYmVyLCBudW1iZXJdID0gWzAsMF07XG4gIFxuICAvKipcbiAgICogSW5wdXQgc3BlZWQgb2Ygem9vbSBiZXR3ZWVuIDAgYW5kIDFcbiAgICogRGVmYXVsdCB2YWx1ZSA6IDAuMlxuICAgKi9cbiAgQElucHV0KCkgc3BlZWRab29tOiBudW1iZXIgPSAwLjI7XG4gIFxuICAvKipcbiAgICogRWxlbWVudFJlZiBvZiBET00gRWxlbWVudCByb290XG4gICAqIEl0J3MgYSBzdmcgd2l0aCB0aGUgbGluZWNoYXJ0XG4gICAqL1xuICBAVmlld0NoaWxkKCdyb290JykgdGltZWxpbmUhOiBFbGVtZW50UmVmO1xuXG4gIC8qKlxuICAgKiBFbGVtZW50UmVmIG9mIERPTSBFbGVtZW50IHNjcm9sbFxuICAgKiBJdCdzIGEgZGl2IHRoYXQgd2lsbCBiZSB0aGUgc2Nyb2xsYmFyXG4gICAqL1xuICBAVmlld0NoaWxkKCdzY3JvbGwnKSBzY3JvbGxiYXIhOiBFbGVtZW50UmVmO1xuXG4gIC8qKlxuICAgKiBFbGVtZW50UmVmIG9mIERPTSBFbGVtZW50IHpvbmVcbiAgICogSXQncyBhIGRpdiB0aGF0IHdpbGwgYmUgdGhlIHpvbmUgb2Ygc2Nyb2xsYmFyXG4gICAqL1xuICBAVmlld0NoaWxkKCd6b25lJykgem9uZVNjcm9sbGJhciE6IEVsZW1lbnRSZWY7XG5cbiAgLyoqXG4gICAqIEVsZW1lbnRSZWYgb2YgRE9NIEVsZW1lbnQgZWxlbWVudFxuICAgKiBJdCdzIGEgZGl2IHRoYXQgY29udGFpbnMgYWxsIHRoZSBvdGhlcnMgRG9tIEVsZW1lbnRcbiAgICovXG4gIEBWaWV3Q2hpbGQoJ2VsZW1lbnQnKSBjb21wbyE6IEVsZW1lbnRSZWY7XG5cbiAgLyoqXG4gICAqIElucHV0IHJhbmdlIG9mIHRpbWVzdGFtcFxuICAgKiBEZWZhdWx0IHZhbHVlIDogWzAsMF1cbiAgICovXG4gIEBJbnB1dCgpIHJhbmdlOiBbbnVtYmVyLG51bWJlcl0gPSBbMCwwXTtcbiAgXG4gIC8qKlxuICAgKiBPdXRwdXQgcmFuZ2VDaGFuZ2UgdGhhdCBlbWl0IHJhbmdlIFxuICAgKi9cbiAgQE91dHB1dCgpIHJhbmdlQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxbbnVtYmVyLG51bWJlcl0+KCk7XG4gIFxuICAvKipcbiAgICogSW5wdXQgY3VycmVudFRpbWVcbiAgICogRGVmYXVsdCB2YWx1ZSA6IDBcbiAgICovXG4gIEBJbnB1dCgpIGN1cnJlbnRUaW1lOiBudW1iZXIgPSAwO1xuICBcbiAgLyoqXG4gICAqIE91dHB1dCBjdXJyZW50VGltZUNoYW5nZSB0aGF0IGVtaXQgY3VycmVudFRpbWVcbiAgICovXG4gIEBPdXRwdXQoKSBjdXJyZW50VGltZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPigpO1xuICBcbiAgLyoqXG4gICAqIFRpdGxlIG9mIHRoZSBjb21wb25lbnRcbiAgICovXG4gIHB1YmxpYyB0aXRsZTpzdHJpbmcgPSAnVGltZWxpbmUgOiAnO1xuICBcbiAgLyoqXG4gICAqIE1hcmdpbiBvZiB0aGUgY29tcG9uZW50XG4gICAqL1xuICBwcml2YXRlIG1hcmdpbjp7dG9wOm51bWJlcixyaWdodDpudW1iZXIsYm90dG9tOm51bWJlcixsZWZ0Om51bWJlcn0gPSB7IHRvcDogMjAsIHJpZ2h0OiAyMCwgYm90dG9tOiAyMCwgbGVmdDogNTAgfTsgLy9tYXJnZSBpbnRlcm5lIGF1IHN2ZyBcbiAgXG4gIC8qKlxuICAgKiBkYXRhWm9vbSBpcyBhIGNvcHkgb2YgZGF0YSB3aXRoIHRoZSByYW5nZSBzcGVjaWZ5XG4gICAqL1xuICBwcml2YXRlIGRhdGFab29tOiBEYXRhW10gPSBbXTtcbiAgXG4gIC8qKlxuICAgKiBpZFpvb20gaXMgdGhlIG51bWJlciBvZiB3aGVlbCBub3RjaFxuICAgKi9cbiAgcHJpdmF0ZSBpZFpvb206IG51bWJlciA9IDA7XG4gIFxuICAvKipcbiAgICogSXQncyB0aGUgc21hbGxlc3QgdGltZXN0YW1wIG9mIGRhdGFcbiAgICovXG4gIHByaXZhdGUgbWluVGltZTogbnVtYmVyID0gMDtcbiAgXG4gIC8qKlxuICAgKiBJdCdzIHRoZSBiaWdnZXN0IHRpbWVzdGFtcCBvZiBkYXRhXG4gICAqL1xuICBwcml2YXRlIG1heFRpbWU6IG51bWJlciA9IDA7XG4gIFxuICAvKipcbiAgICogSXQncyB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBzbWFsbGVzdCBhbmQgdGhlIGJpZ2dlc3RcbiAgICovXG4gIHByaXZhdGUgbGVuZ3RoVGltZTogbnVtYmVyID0gMDtcbiAgXG4gIC8qKlxuICAgKiBXaWR0aCBvZiB0aGUgc3ZnXG4gICAqL1xuICBwcml2YXRlIHN2Z1dpZHRoOiBudW1iZXIgPSAwO1xuICBcbiAgLyoqXG4gICAqIEhlaWdodCBvZiB0aGUgc3ZnXG4gICAqL1xuICBwcml2YXRlIHN2Z0hlaWdodDogbnVtYmVyID0gMDtcbiAgXG4gIC8qKlxuICAgKiBTY2FsZSBvZiB0aGUgWCBheGlzXG4gICAqL1xuICBwcml2YXRlIHNjYWxlWDogU2NhbGVUaW1lPG51bWJlcixudW1iZXI+ID0gZDMuc2NhbGVUaW1lKCk7XG4gIFxuICAvKipcbiAgICogU2NhbGUgb2YgdGhlIFkgYXhpc1xuICAgKi9cbiAgcHJpdmF0ZSBzY2FsZVk6IFNjYWxlTGluZWFyPG51bWJlcixudW1iZXI+ID0gZDMuc2NhbGVMaW5lYXIoKTtcblxuICAvKipcbiAgICogc3ZnIHRoYXQgY29udGFpbiB0aGUgbGluZWNoYXJ0IGFuZCB0aGUgYXhpc1xuICAgKi9cbiAgcHJpdmF0ZSBzdmc6IGFueTtcblxuICAvKipcbiAgICogQXJyYXkgb2YgYXJlYSBkZWZpbml0aW9uXG4gICAqL1xuICBwcml2YXRlIGFyZWE6IGQzLkFyZWE8W251bWJlciwgbnVtYmVyXT5bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBsaW5lIGRlZmluaXRpb25cbiAgICovXG4gIHByaXZhdGUgbGluZTogZDMuTGluZTxbbnVtYmVyLCBudW1iZXJdPltdID0gW107XG5cbiAgLyoqXG4gICAqIFN2ZyBkZWZpbml0aW9uIG9mIHRoZSB0b29sdGlwXG4gICAqL1xuICBwcml2YXRlIHRvb2x0aXAhOiBTZWxlY3Rpb248U1ZHR0VsZW1lbnQsdW5rbm93bixudWxsLHVuZGVmaW5lZD47XG5cbiAgLyoqXG4gICAqIGRhdGEgbGVuZ3RoIGJlZm9yZSB0aGUgbmV3IGNoYW5nZVxuICAgKi9cbiAgcHJpdmF0ZSBsYXN0RGF0YWxlbmd0aDpudW1iZXIgPSAwO1xuXG4gIC8qKlxuICAgKiBNb2RlIG9mIHRoZSB0b29sdGlwXG4gICAqL1xuICBwcml2YXRlIG1vZGVUb29sVGlwczogXCJub3JtYWxcIiB8IFwiaW52ZXJzZVwiID0gXCJub3JtYWxcIjtcblxuICAvKipcbiAgICogdHJ1ZSBpZiB0aGUgY3VycmVudFRpbWVsaW5lIGlzIHNlbGVjdGVkXG4gICAqL1xuICBwcml2YXRlIGN1cnJlbnRUaW1lU2VsZWN0ZWQ6Ym9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiB0cnVlIGlmIHRoZSBzY3JvbGxiYXIgaXMgc2VsZWN0ZWRcbiAgICovXG4gIHByaXZhdGUgc2Nyb2xsYmFyU2VsZWN0ZWQ6Ym9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBMYXN0IHBvc2l0aW9uIG9mIHRoZSBtb3VzZVxuICAgKi9cbiAgcHJpdmF0ZSBsYXN0UG9zOiBudW1iZXIgPSAwO1xuXG4gIC8qKlxuICAgKiB0cnVlIGlmIHRoZSBDVFJMIEtleSBvZiBrZXlCb2FyZCBpcyBwdXNoIFxuICAgKi9cbiAgcHJpdmF0ZSB6b29tU2VsZWN0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBASG9zdExpc3RlbmVyKCd3aW5kb3c6a2V5ZG93bicsIFsnJGV2ZW50J10pXG4gIGhhbmRsZUtleURvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpe1xuICAgIGlmKGV2ZW50LmN0cmxLZXkmJiF0aGlzLnpvb21TZWxlY3RlZCl7XG4gICAgICB0aGlzLnpvb21TZWxlY3RlZCA9IHRydWU7XG4gICAgfSBcbiAgfVxuICBASG9zdExpc3RlbmVyKCd3aW5kb3c6a2V5dXAnLCBbJyRldmVudCddKVxuICBoYW5kbGVLZXlVcCgpe1xuICAgIHRoaXMuem9vbVNlbGVjdGVkID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IgOiBJbml0IHJlbmRlcmVyXG4gICAqIEBwYXJhbSByZW5kZXJlciBcbiAgICovXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyMikgeyAgIFxuICB9XG5cbiAgLyoqXG4gICAqIENvcHkgZGF0YSBpbiBkYXRhWm9vbSwgYW5kIGJ1aWxkIHRpdGxlIFxuICAgKi9cbiAgcHVibGljIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuZGF0YVpvb20gPSBbLi4udGhpcy5kYXRhXTtcbiAgICB0aGlzLmxhc3REYXRhbGVuZ3RoPXRoaXMuZGF0YVpvb20ubGVuZ3RoO1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICBpZihpbmRleD09dGhpcy5kYXRhLmxlbmd0aC0xKSB0aGlzLnRpdGxlID0gdGhpcy50aXRsZStlbGVtZW50LmxhYmVsKycuJztcbiAgICAgIGVsc2UgdGhpcy50aXRsZSA9IHRoaXMudGl0bGUrZWxlbWVudC5sYWJlbCArICcsICc7XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGxpbmVjaGFydFxuICAgKi9cbiAgcHVibGljIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50aW1lbGluZSAhPSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCB3ID0gdGhpcy50aW1lbGluZS5uYXRpdmVFbGVtZW50LndpZHRoLmFuaW1WYWwudmFsdWU7XG4gICAgICBsZXQgaCA9IHRoaXMudGltZWxpbmUubmF0aXZlRWxlbWVudC5oZWlnaHQuYW5pbVZhbC52YWx1ZTtcbiAgICAgIHRoaXMuc3ZnV2lkdGggPSAodyAtIHRoaXMubWFyZ2luLmxlZnQpIC0gdGhpcy5tYXJnaW4ucmlnaHQ7XG4gICAgICB0aGlzLnN2Z0hlaWdodCA9IChoIC0gdGhpcy5tYXJnaW4udG9wKSAtIHRoaXMubWFyZ2luLmJvdHRvbTtcbiAgICB9XG4gICAgdGhpcy5kYXRhLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHRoaXMuYnVpbGRTdHlsZURhdGEoZWxlbWVudCxpbmRleCkpO1xuICAgIHRoaXMuY29udHJvbFNwZWVkWm9vbSgpO1xuICAgIHRoaXMuYnVpbGRab29tKCk7IFxuICAgIHRoaXMuYnVpbGRFdmVudCgpO1xuICAgIHRoaXMuZHJhd1Rvb2xUaXBzKCk7XG4gICAgdGhpcy5kcmF3QXhpcygpO1xuICAgIHRoaXMuZHJhd0xpbmVBbmRQYXRoKCk7XG4gICAgdGhpcy5kcmF3TGluZUN1cnJlbnRUaW1lKCk7XG4gICAgdGhpcy5kcmF3U2Nyb2xsYmFyKCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGxpbmVjaGFydCBvbiBkYXRhLCByYW5nZSBvciBjdXJyZW50IHRpbWUgY2hhbmdlc1xuICAgKiBAcGFyYW0ge1NpbXBsZUNoYW5nZXN9IGNoYW5nZXMgXG4gICAqL1xuICBwdWJsaWMgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzLmRhdGEmJiFjaGFuZ2VzLmRhdGEuZmlyc3RDaGFuZ2UpIHRoaXMudXBkYXRlQ2hhcnQoKTtcbiAgICBpZiAoKGNoYW5nZXMuZGF0YSYmIWNoYW5nZXMuZGF0YS5maXJzdENoYW5nZSYmdGhpcy5yYW5nZVswXSE9MCYmdGhpcy5yYW5nZVsxXSE9MCl8fChjaGFuZ2VzLnJhbmdlJiYhY2hhbmdlcy5yYW5nZS5maXJzdENoYW5nZSkpIHtcbiAgICAgIHRoaXMuaWRab29tPU1hdGgucm91bmQoTWF0aC5sb2codGhpcy5sZW5ndGhUaW1lLyh0aGlzLnJhbmdlWzFdLXRoaXMucmFuZ2VbMF0pKS9NYXRoLmxvZygxK3RoaXMuc3BlZWRab29tKSk7XG4gICAgICB0aGlzLnJhbmdlPXRoaXMuY29udHJvbFJhbmdlKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXS10aGlzLnJhbmdlWzBdKTtcbiAgICAgIGlmKHRoaXMuZGF0YS5sZW5ndGghPTApe1xuICAgICAgICB0aGlzLnVwZGF0ZURhdGFab29tKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICAgIHRoaXMudXBkYXRlU3ZnKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjaGFuZ2VzLmN1cnJlbnRUaW1lJiYhY2hhbmdlcy5jdXJyZW50VGltZS5maXJzdENoYW5nZSYmdGhpcy5kYXRhLmxlbmd0aCE9MCkgdGhpcy51cGRhdGVDdXJyZW50VGltZSgpO1xufVxuXG4gIC8qKlxuICAgKiBBZGQgZXZlbnQgbGlzdGVuZXJzIG9uIHRoZSBzdmdcbiAgICovXG4gIHByaXZhdGUgYnVpbGRFdmVudCgpOiB2b2lkeyAvLyBjcmVlciB1bmUgdGltZWxpbmUgYXZlYyB1bmUgc2V1bCBkb25uw6llXG4gICAgdGhpcy5zdmcgPSBkMy5zZWxlY3QodGhpcy50aW1lbGluZS5uYXRpdmVFbGVtZW50KVxuICAgIC5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB0aGlzLm1hcmdpbi5sZWZ0ICsgJywnICsgdGhpcy5tYXJnaW4udG9wICsgJyknKTtcbiAgICBkMy5zZWxlY3QodGhpcy50aW1lbGluZS5uYXRpdmVFbGVtZW50KS5vbihcIm1vdXNlbW92ZVwiLCAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgIGlmKHRoaXMuY3VycmVudFRpbWVTZWxlY3RlZCkgdGhpcy5tb3ZlQ3VycmVudFRpbWUoZXZlbnQpO1xuICAgICAgZWxzZSB0aGlzLnNob3dJbmZvKGV2ZW50KTtcbiAgICB9KVxuICAgIC5vbihcIm1vdXNlbGVhdmVcIiwgKCkgPT4geyB0aGlzLmN1cnJlbnRUaW1lU2VsZWN0ZWQgPSBmYWxzZTsgdGhpcy5oaWRlSW5mbygpIH0pXG4gICAgLm9uKFwid2hlZWxcIiwgKGV2ZW50OiBXaGVlbEV2ZW50KSA9PiB7aWYodGhpcy5kYXRhLmxlbmd0aCE9MClpZih0aGlzLnpvb21TZWxlY3RlZCl7dGhpcy5hY3RpdmVab29tKGV2ZW50KX19KVxuICAgIC5vbihcIm1vdXNldXBcIiwgKCkgPT4gdGhpcy5jdXJyZW50VGltZVNlbGVjdGVkPWZhbHNlKVxuICAgIC5vbihcIm1vdXNlb3ZlclwiLCAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IGV2ZW50LnByZXZlbnREZWZhdWx0KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIHRoZSBzdHlsZSAoYXJlYSwgbGluZSBvciBib3RoKSBhbmQgdGhlIGludGVycG9sYXRpb24gKHN0cGUgb3IgbGluZWFyKSBvZiBsaW5lc1xuICAgKiBAcGFyYW0ge0RhdGF9IGVsZW1lbnQgXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCBcbiAgICovXG4gIHByaXZhdGUgYnVpbGRTdHlsZURhdGEoZWxlbWVudDpEYXRhLCBpbmRleDpudW1iZXIpOiB2b2lke1xuICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwiYXJlYVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgIGlmKGVsZW1lbnQuaW50ZXJwb2xhdGlvbj09XCJzdGVwXCIpe1xuICAgICAgICB0aGlzLmFyZWFbaW5kZXhdPWQzLmFyZWEoKVxuICAgICAgICAueCgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgICAueTAodGhpcy5zdmdIZWlnaHQpXG4gICAgICAgIC55MSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKVxuICAgICAgICAuY3VydmUoZDMuY3VydmVTdGVwQWZ0ZXIpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuYXJlYVtpbmRleF09ZDMuYXJlYSgpXG4gICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgIC55MCh0aGlzLnN2Z0hlaWdodClcbiAgICAgICAgLnkxKChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpXG4gICAgICB9XG4gICAgfVxuICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwibGluZVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgIGlmKGVsZW1lbnQuaW50ZXJwb2xhdGlvbj09XCJzdGVwXCIpe1xuICAgICAgICB0aGlzLmxpbmVbaW5kZXhdPWQzLmxpbmUoKVxuICAgICAgICAueCgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgICAueSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKVxuICAgICAgICAuY3VydmUoZDMuY3VydmVTdGVwQWZ0ZXIpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMubGluZVtpbmRleF09ZDMubGluZSgpXG4gICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgIC55KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpXG4gICAgICB9XG4gICAgfVxuICAgIGlmKCF0aGlzLmNvbnRyb2xDb2xvcihlbGVtZW50LmNvbG9yKSl7XG4gICAgICBjb25zb2xlLndhcm4oXCJEYXRhIHdpdGggXCIgKyBlbGVtZW50LmxhYmVsICsgXCIgbGFiZWwsIGhhcyBhbiB1bnZhbGlkIGNvbG9yIGF0dHJpYnV0ZSAoXCIgKyBlbGVtZW50LmNvbG9yICsgXCIpLiBSZXBsYWNlIHdpdGggdGhlIGRlZmF1bHQgY29sb3IgKGJsYWNrKS5cIik7XG4gICAgICBlbGVtZW50LmNvbG9yPVwiYmxhY2tcIjtcbiAgICB9IFxuICB9XG5cbiAgLyoqXG4gICAqIFNhdmUgaW5mb3JtYXRpb24gZm9yIHpvb20uXG4gICAqL1xuICBwcml2YXRlIGJ1aWxkWm9vbSgpOiB2b2lke1xuICAgIHRoaXMubWluVGltZSA9IHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieE1pblwiKTtcbiAgICB0aGlzLm1heFRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInhNYXhcIik7XG4gICAgdGhpcy5sZW5ndGhUaW1lID0gdGhpcy5tYXhUaW1lIC0gdGhpcy5taW5UaW1lO1xuICAgIHRoaXMuaWRab29tPTA7XG4gIH1cblxuICAvKipcbiAgICogRHJhdyB0aGUgdG9vbHRpcHMncyBzdmdcbiAgICovXG4gIHByaXZhdGUgZHJhd1Rvb2xUaXBzKCk6IHZvaWR7IC8vY3JlZXIgbGUgdG9vbHRpcHNcbiAgICB0aGlzLnRvb2x0aXAgPSB0aGlzLnN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0b29sdGlwXCIpXG4gICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgIC8vIExlIGNlcmNsZSBleHTDqXJpZXVyIGJsZXUgY2xhaXJcbiAgICB0aGlzLnRvb2x0aXAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIiNDQ0U1RjZcIilcbiAgICAgICAgLmF0dHIoXCJyXCIsIDEwKTtcbiAgICAvLyBMZSBjZXJjbGUgaW50w6lyaWV1ciBibGV1IGZvbmPDqVxuICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwiIzM0OThkYlwiKVxuICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcIiNmZmZcIilcbiAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgXCIxLjVweFwiKVxuICAgICAgICAuYXR0cihcInJcIiwgNCk7XG4gICAgLy8gTGUgdG9vbHRpcCBlbiBsdWktbcOqbWUgYXZlYyBzYSBwb2ludGUgdmVycyBsZSBiYXNcbiAgICAvLyBJbCBmYXV0IGxlIGRpbWVuc2lvbm5lciBlbiBmb25jdGlvbiBkdSBjb250ZW51XG4gICAgaWYgKHRoaXMubW9kZVRvb2xUaXBzID09IFwibm9ybWFsXCIpIHtcbiAgICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJwb2x5bGluZVwiKVxuICAgICAgICAuYXR0cihcInBvaW50c1wiLCBcIjAsMCAwLDQwIDc1LDQwICA4MCw0NSAgODUsNDAgIDE2MCw0MCAgMTYwLDAgMCwwXCIpXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgXCIjZmFmYWZhXCIpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZVwiLFwiIzM0OThkYlwiKVxuICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsXCIwLjlcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsXCIxXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwtNTApXCIpO1xuICAgICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgIC8vIENldCDDqWzDqW1lbnQgY29udGllbmRyYSB0b3V0IG5vdHJlIHRleHRlXG4gICAgICAgIGxldCB0ZXh0ID0gdGhpcy50b29sdGlwLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAuc3R5bGUoXCJmb250LXNpemVcIiwgXCIxM3B4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiZm9udC1mYW1pbHlcIiwgXCJTZWdvZSBVSVwiKVxuICAgICAgICAgIC5zdHlsZShcImNvbG9yXCIsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwtNDIpXCIpO1xuICAgICAgICAvLyBFbGVtZW50IHBvdXIgbGEgZGF0ZSBhdmVjIHBvc2l0aW9ubmVtZW50IHNww6ljaWZpcXVlXG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiN1wiKVxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCI1XCIpXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTFcIik7XG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiLTkwXCIpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjE1XCIpXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTJcIik7XG4gICAgICB9KTtcbiAgICB9ZWxzZSB7XG4gICAgICB0aGlzLnRvb2x0aXAuYXBwZW5kKFwicG9seWxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJwb2ludHNcIiwgXCIwLDk1ICwgMCw1NSAsIDc1LDU1ICwgODAsNTAgLCA4NSw1NSAsIDE2MCw1NSAsIDE2MCw5NSAwLDk1XCIpXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgXCIjZmFmYWZhXCIpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZVwiLFwiIzM0OThkYlwiKVxuICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsXCIwLjlcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsXCIxXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwtNTApXCIpO1xuICAgICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgIC8vIENldCDDqWzDqW1lbnQgY29udGllbmRyYSB0b3V0IG5vdHJlIHRleHRlXG4gICAgICAgIGxldCB0ZXh0ID0gdGhpcy50b29sdGlwLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAuc3R5bGUoXCJmb250LXNpemVcIiwgXCIxM3B4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiZm9udC1mYW1pbHlcIiwgXCJTZWdvZSBVSVwiKVxuICAgICAgICAgIC5zdHlsZShcImNvbG9yXCIsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC04MCwtMzApXCIpO1xuICAgICAgICAvLyBFbGVtZW50IHBvdXIgbGEgZGF0ZSBhdmVjIHBvc2l0aW9ubmVtZW50IHNww6ljaWZpcXVlXG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiN1wiKVxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgNTAgKVxuICAgICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0b29sdGlwLWRhdGUxXCIpO1xuICAgICAgICB0ZXh0LmFwcGVuZChcInRzcGFuXCIpXG4gICAgICAgICAgLmF0dHIoXCJkeFwiLCBcIi04MFwiKVxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCIyMFwiKVxuICAgICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0b29sdGlwLWRhdGUyXCIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERyYXcgaG9yaXpvbnRhbCBhbmQgdmVydGljYWwgYXhpcyBhbmQgc2NhbGVcbiAgICovXG4gIHByaXZhdGUgZHJhd0F4aXMoKTogdm9pZHtcbiAgICB0aGlzLnNjYWxlWC5yYW5nZShbMCwgdGhpcy5zdmdXaWR0aF0pO1xuICAgIHRoaXMuc2NhbGVYLmRvbWFpbihbdGhpcy5taW5UaW1lLHRoaXMubWF4VGltZV0pO1xuICAgIHRoaXMuc2NhbGVZID0gZDMuc2NhbGVMaW5lYXIoKTtcbiAgICB0aGlzLnNjYWxlWS5yYW5nZShbdGhpcy5zdmdIZWlnaHQsIDBdKTtcbiAgICB0aGlzLnNjYWxlWS5kb21haW4odGhpcy5jb250cm9sRG9tYWluKCkpO1xuICAgIC8vIENvbmZpZ3VyZSB0aGUgWCBBeGlzXG4gICAgdGhpcy5zdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsJyArIHRoaXMuc3ZnSGVpZ2h0ICsgJyknKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3hBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNCb3R0b20odGhpcy5zY2FsZVgpKTtcbiAgICAvLyBDb25maWd1cmUgdGhlIFkgQXhpc1xuICAgIGlmKHRoaXMuZGlzY3JldGVWYWx1ZSh0aGlzLmRhdGEpKXtcbiAgICAgIHRoaXMuc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAneUF4aXMnKVxuICAgICAgLmNhbGwoZDMuYXhpc0xlZnQodGhpcy5zY2FsZVkpLnRpY2tzKHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieU1heFwiKSkpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5zdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd5QXhpcycpXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh0aGlzLnNjYWxlWSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3IGxpbmVzIG9uIHRoZSBsaW5lIGNoYXJ0XG4gICAqL1xuICBwcml2YXRlIGRyYXdMaW5lQW5kUGF0aCgpOiB2b2lke1xuICAgIHRoaXMuZGF0YVpvb20uZm9yRWFjaChcbiAgICAgIChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwiYXJlYVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgICAgICB0aGlzLnN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAgIC5kYXR1bSh0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXMpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2FyZWEnK2luZGV4KVxuICAgICAgICAgIC5hdHRyKCdkJywgdGhpcy5hcmVhW2luZGV4XSlcbiAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAwLjEpXG4gICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwLjMpXG4gICAgICAgICAgLnN0eWxlKCdmaWxsJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnMnB4JylcbiAgICAgICAgfVxuICAgICAgICBpZihlbGVtZW50LnN0eWxlPT1cImxpbmVcIiB8fCBlbGVtZW50LnN0eWxlPT1cImJvdGhcIil7XG4gICAgICAgICAgdGhpcy5zdmcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgICAuZGF0dW0oZWxlbWVudC52YWx1ZXMpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmUnK2luZGV4KVxuICAgICAgICAgIC5hdHRyKCdkJywgdGhpcy5saW5lW2luZGV4XSlcbiAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCAnbm9uZScpXG4gICAgICAgICAgLnN0eWxlKCdzdHJva2UnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzJweCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gIH1cblxuICAvKipcbiAgICogRHJhdyB0aGUgdmVydGljYWwgbGluZSB3aGljaCByZXByZXNlbnRzIHRoZSBjdXJyZW50IHRpbWVcbiAgICovXG4gIHByaXZhdGUgZHJhd0xpbmVDdXJyZW50VGltZSgpOiB2b2lke1xuICAgIGlmKHRoaXMuZGF0YS5sZW5ndGghPTApe1xuICAgICAgaWYodGhpcy5jdXJyZW50VGltZT09MCl7XG4gICAgICAgIHRoaXMuY3VycmVudFRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInhNaW5cIik7XG4gICAgICB9XG4gICAgICBsZXQgeDpudW1iZXI9MDtcbiAgICAgIHRoaXMuc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5kYXR1bShbW3RoaXMuY3VycmVudFRpbWUsdGhpcy5jb250cm9sRG9tYWluKClbMF1dLFt0aGlzLmN1cnJlbnRUaW1lLHRoaXMuc3ZnSGVpZ2h0XV0pXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjdXJyZW50VGltZUxpbmUnKVxuICAgICAgICAuYXR0cignZCcsIGQzLmxpbmUoKVxuICAgICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4geD10aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgICAgICAueSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKSlcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgJ25vbmUnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsICdyZWQnKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICczcHgnKTtcbiAgICAgIHRoaXMuc3ZnLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2N1cnJlbnRUaW1lU2VsZWN0b3InKVxuICAgICAgICAuYXR0cignY3gnLCB4KVxuICAgICAgICAuYXR0cignY3knLCAtMTMpXG4gICAgICAgIC5hdHRyKCdyJywgNylcbiAgICAgICAgLmF0dHIoJ2ZpbGwnLCAncmVkJylcbiAgICAgICAgLm9uKFwibW91c2Vkb3duXCIsICgpID0+IHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRUaW1lU2VsZWN0ZWQ9dHJ1ZTtcbiAgICAgICAgICB0aGlzLmhpZGVJbmZvKCk7XG4gICAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERyYXcgdGhlIHNjcm9sbGJhciBhbmQgZXZlbnQgbGlzdGVuZXIgb24gaXQgIFxuICAgKi9cbiAgcHJpdmF0ZSBkcmF3U2Nyb2xsYmFyKCk6IHZvaWR7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUud2lkdGggPSB0aGlzLnN2Z1dpZHRoK1wicHhcIjtcbiAgICB0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5tYXJnaW5MZWZ0ID0gdGhpcy5tYXJnaW4ubGVmdCsgXCJweFwiO1xuICAgIHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmhlaWdodCA9IFwiMjBweFwiO1xuICAgIHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwibGlnaHRncmV5XCI7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCIxMHB4XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS53aWR0aCA9IHRoaXMuc3ZnV2lkdGgrXCJweFwiO1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gXCIyMHB4XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcImdyZXlcIjtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmJvcmRlclJhZGl1cyA9IFwiMTBweFwiO1xuICAgIHRoaXMuY29tcG8ubmF0aXZlRWxlbWVudC5zdHlsZS53aWR0aCA9IHRoaXMuc3ZnV2lkdGgrdGhpcy5tYXJnaW4ubGVmdCtcInB4XCI7XG4gICAgdGhpcy5jb21wby5uYXRpdmVFbGVtZW50LnN0eWxlLnBhZGRpbmcgPSBcIjEwcHggMTBweCAxMHB4IDEwcHhcIjtcbiAgICB0aGlzLnJlbmRlcmVyLmxpc3Rlbih0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LCAnbW91c2Vkb3duJywgKGV2ZW50Ok1vdXNlRXZlbnQpID0+IHRoaXMuYWN0aXZlU2Nyb2xsYmFyKGV2ZW50KSk7XG4gICAgdGhpcy5yZW5kZXJlci5saXN0ZW4od2luZG93LCAnbW91c2V1cCcsICgpID0+IHRoaXMuZGVzYWN0aXZlU2Nyb2xsYmFyKCkpO1xuICAgIHRoaXMucmVuZGVyZXIubGlzdGVuKHdpbmRvdywnbW91c2Vtb3ZlJywgKGV2ZW50Ok1vdXNlRXZlbnQpID0+IHRoaXMudXBkYXRlUmFuZ2UoZXZlbnQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgYWxsIHRoZSBsaW5lIGNoYXJ0IChob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBheGlzIGFuZCBzY2FsZSwgZGF0YSwgbGluZXMgYW5kIHJhbmdlKSBvbiBkYXRhIGNoYW5nZXMuIFxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVDaGFydCgpOiB2b2lke1xuICAgIHRoaXMuZGF0YVpvb20gPSBbLi4udGhpcy5kYXRhXTtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaChcbiAgICAgIChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICAgIHRoaXMuYnVpbGRTdHlsZURhdGEoZWxlbWVudCxpbmRleCk7XG4gICAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwiYXJlYVwiKSB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5saW5lJytpbmRleCkucmVtb3ZlKCk7XG4gICAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwibGluZVwiKSB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5hcmVhJytpbmRleCkucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMudGl0bGUgPSAnVGltZWxpbmUgOiAnO1xuICAgICAgICBpZihpbmRleD09dGhpcy5kYXRhLmxlbmd0aC0xKSB0aGlzLnRpdGxlID0gdGhpcy50aXRsZStlbGVtZW50LmxhYmVsKycuJztcbiAgICAgICAgZWxzZSB0aGlzLnRpdGxlID0gdGhpcy50aXRsZStlbGVtZW50LmxhYmVsICsgJywgJztcbiAgICB9KVxuICAgIHRoaXMuYnVpbGRab29tKCk7XG4gICAgdGhpcy5zY2FsZVguZG9tYWluKFt0aGlzLm1pblRpbWUsdGhpcy5tYXhUaW1lXSk7XG4gICAgdGhpcy5zY2FsZVkucmFuZ2UoW3RoaXMuc3ZnSGVpZ2h0LCAwXSk7XG4gICAgdGhpcy5jb250cm9sRG9tYWluKCk7XG4gICAgdGhpcy5zY2FsZVkuZG9tYWluKHRoaXMuY29udHJvbERvbWFpbigpKTtcbiAgICBpZih0aGlzLmRpc2NyZXRlVmFsdWUodGhpcy5kYXRhKSl7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy55QXhpcycpXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh0aGlzLnNjYWxlWSkudGlja3ModGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ5TWF4XCIpKSk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy55QXhpcycpXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh0aGlzLnNjYWxlWSkpO1xuICAgIH1cbiAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy54QXhpcycpLmNhbGwoZDMuYXhpc0JvdHRvbSh0aGlzLnNjYWxlWCkpO1xuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lTGluZScpLnJlbW92ZSgpO1xuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lU2VsZWN0b3InKS5yZW1vdmUoKTtcbiAgICB0aGlzLnVwZGF0ZUxpbmUoKTtcbiAgICB0aGlzLmRyYXdMaW5lQ3VycmVudFRpbWUoKTtcbiAgICB0aGlzLnVwZGF0ZVNjcm9sbGJhcih0aGlzLm1pblRpbWUsdGhpcy5tYXhUaW1lKTtcbiAgICB0aGlzLnVwZGF0ZVRvb2xUaXBzKCk7XG4gICAgZm9yKGxldCBpbmRleD10aGlzLmRhdGFab29tLmxlbmd0aDsgaW5kZXg8dGhpcy5sYXN0RGF0YWxlbmd0aDsgaW5kZXgrKyl7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5saW5lJytpbmRleCkucmVtb3ZlKCk7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5hcmVhJytpbmRleCkucmVtb3ZlKCk7XG4gICAgfVxuICAgIHRoaXMubGFzdERhdGFsZW5ndGg9dGhpcy5kYXRhWm9vbS5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGhvcml6b250YWwgYXhpcywgY3VycmVudCB0aW1lIGxpbmUsIGxpbmVzIGFuZCBzY3JvbGxiYXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbiBvZiB0aGUgbmV3IHJhbmdlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtYXggb2YgdGhlIG5ldyByYW5nZVxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVTdmcobWluOiBudW1iZXIsIG1heDogbnVtYmVyKXtcbiAgICB0aGlzLnNjYWxlWC5kb21haW4oW21pbixtYXhdKTtcbiAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy54QXhpcycpLmNhbGwoZDMuYXhpc0JvdHRvbSh0aGlzLnNjYWxlWCkpO1xuICAgIHRoaXMudXBkYXRlTGluZSgpO1xuICAgIHRoaXMudXBkYXRlQ3VycmVudFRpbWUoKTtcbiAgICB0aGlzLnVwZGF0ZVNjcm9sbGJhcihtaW4sbWF4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGRpc3BsYXkgb2YgbGluZXNcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlTGluZSgpOiB2b2lke1xuICAgIGxldCBsaW5lVXBkYXRlO1xuICAgIGxldCBhcmVhVXBkYXRlO1xuICAgIHRoaXMuZGF0YVpvb20uZm9yRWFjaCgoZWxlbWVudCxpbmRleCkgPT4ge1xuICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJhcmVhXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgICBhcmVhVXBkYXRlPSB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5hcmVhJytpbmRleCkuZGF0YShbdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzXSk7XG4gICAgICAgIGFyZWFVcGRhdGVcbiAgICAgICAgLmVudGVyKClcbiAgICAgICAgLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2FyZWEnK2luZGV4KVxuICAgICAgICAubWVyZ2UoYXJlYVVwZGF0ZSlcbiAgICAgICAgLmF0dHIoJ2QnLCB0aGlzLmFyZWFbaW5kZXhdKVxuICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAwLjEpXG4gICAgICAgIC5hdHRyKCdvcGFjaXR5JywgMC4zKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzJweCcpO1xuICAgICAgfVxuICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJsaW5lXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgICBsaW5lVXBkYXRlPSB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5saW5lJytpbmRleCkuZGF0YShbdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzXSk7XG4gICAgICAgIGxpbmVVcGRhdGVcbiAgICAgICAgLmVudGVyKClcbiAgICAgICAgLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmUnK2luZGV4KVxuICAgICAgICAubWVyZ2UobGluZVVwZGF0ZSlcbiAgICAgICAgLmF0dHIoJ2QnLCB0aGlzLmxpbmVbaW5kZXhdKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCAnbm9uZScpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnMnB4JylcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZSBjdXJyZW50IHRpbWUgbGluZVxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVDdXJyZW50VGltZSgpOiB2b2lke1xuICAgIGxldCBsaW5lVXBkYXRlID0gdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVMaW5lJykuZGF0dW0oW1t0aGlzLmN1cnJlbnRUaW1lLHRoaXMuY29udHJvbERvbWFpbigpWzBdXSxbdGhpcy5jdXJyZW50VGltZSx0aGlzLnN2Z0hlaWdodF1dKTtcbiAgICBsZXQgeDpudW1iZXI9MDtcbiAgICBsaW5lVXBkYXRlLmVudGVyKClcbiAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgIC5hdHRyKCdjbGFzcycsICdjdXJyZW50VGltZUxpbmUnKVxuICAgIC5tZXJnZShsaW5lVXBkYXRlKVxuICAgIC5hdHRyKCdkJywgZDMubGluZSgpXG4gICAgICAueCgoZDogbnVtYmVyW10pID0+IHg9dGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAueSgoZDogbnVtYmVyW10pID0+IHRoaXMuc2NhbGVZKGRbMV0pKSlcbiAgICAuc3R5bGUoJ2ZpbGwnLCAnbm9uZScpXG4gICAgLnN0eWxlKCdzdHJva2UnLCAncmVkJylcbiAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICczcHgnKTtcbiAgICBpZih0aGlzLmN1cnJlbnRUaW1lPj10aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpJiZ0aGlzLmN1cnJlbnRUaW1lPD10aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWF4XCIpKXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lTGluZScpLmF0dHIoJ2Rpc3BsYXknLCdibG9jaycpO1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVTZWxlY3RvcicpLmF0dHIoJ2Rpc3BsYXknLCdibG9jaycpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVMaW5lJykuYXR0cignZGlzcGxheScsJ25vbmUnKTtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lU2VsZWN0b3InKS5hdHRyKCdkaXNwbGF5Jywnbm9uZScpO1xuICAgIH1cbiAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZVNlbGVjdG9yJykuYXR0cignY3gnLHgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcG9zaXRpb24gb2YgdGhlIHNjcm9sbGJhclxuICAgKiBAcGFyYW0ge251bWJlcn0gbWluIG9mIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heCBvZiB0aGUgbmV3IHJhbmdlXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZVNjcm9sbGJhcihtaW46bnVtYmVyLCBtYXg6bnVtYmVyKTogdm9pZHtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLm1hcmdpbkxlZnQ9IHRoaXMuc3ZnV2lkdGgqKG1pbi10aGlzLm1pblRpbWUpLyh0aGlzLmxlbmd0aFRpbWUpICsgXCJweFwiO1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUud2lkdGg9IHRoaXMuc3ZnV2lkdGgqKG1heC1taW4pLyh0aGlzLmxlbmd0aFRpbWUpICsgXCJweFwiO1xuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZSB0aGUgcmFuZ2UsIGNvbnRyb2wgaXQsIHVwZGF0ZSBkYXRhcywgdXBkYXRlIHRoZSBsaW5lY2hhcnQgYW5kIHRoZW4gZW1pdCB0aGUgbmV3IHJhbmdlLlxuICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVSYW5nZShldmVudDogTW91c2VFdmVudCk6IHZvaWR7XG4gICAgaWYodGhpcy5zY3JvbGxiYXJTZWxlY3RlZCl7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgbGV0IGxlbmd0aExvY2FsVGltZSA9IHRoaXMucmFuZ2VbMV0tdGhpcy5yYW5nZVswXTtcbiAgICAgIGxldCBsYXN0TWluTG9jYWxUaW1lID0gdGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1pblwiKTtcbiAgICAgIGxldCBwb3MgPSBldmVudC5jbGllbnRYLXRoaXMubWFyZ2luLmxlZnQ7XG4gICAgICBpZih0aGlzLmxhc3RQb3M9PTApe1xuICAgICAgICB0aGlzLmxhc3RQb3M9IHBvcztcbiAgICAgIH1cbiAgICAgIGxldCBtaW5Mb2NhbFRpbWUgPSAocG9zLXRoaXMubGFzdFBvcykqdGhpcy5sZW5ndGhUaW1lL3RoaXMuc3ZnV2lkdGggKyBsYXN0TWluTG9jYWxUaW1lO1xuICAgICAgdGhpcy5yYW5nZSA9IHRoaXMuY29udHJvbFJhbmdlKG1pbkxvY2FsVGltZSxsZW5ndGhMb2NhbFRpbWUpO1xuICAgICAgdGhpcy51cGRhdGVEYXRhWm9vbSh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgdGhpcy51cGRhdGVTdmcodGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgIHRoaXMucmFuZ2VDaGFuZ2UuZW1pdCh0aGlzLnJhbmdlKTtcbiAgICAgIHRoaXMubGFzdFBvcz1wb3M7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZSB0aGlzLmRhdGFab29tIGF0IHJhbmdlIGNoYW5nZXNcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbiBvZiB0aGUgbmV3IHJhbmdlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtYXggb2YgdGhlIG5ldyByYW5nZSBcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlRGF0YVpvb20obWluOm51bWJlcixtYXg6bnVtYmVyKTogdm9pZHtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaCgoZWxlbWVudCxpbmRleCkgPT4ge1xuICAgICAgdGhpcy5kYXRhWm9vbVtpbmRleF09e1xuICAgICAgICBsYWJlbDogZWxlbWVudC5sYWJlbCxcbiAgICAgICAgdmFsdWVzOiBlbGVtZW50LnZhbHVlcy5maWx0ZXIoKGVsZW1lbnQ6IG51bWJlcltdKSA9PiBtaW4gPD0gZWxlbWVudFswXSAmJiBlbGVtZW50WzBdIDw9ICBtYXgpLFxuICAgICAgICBjb2xvcjogZWxlbWVudC5jb2xvcixcbiAgICAgICAgc3R5bGU6IGVsZW1lbnQuc3R5bGUsXG4gICAgICAgIGludGVycG9sYXRpb246IGVsZW1lbnQuaW50ZXJwb2xhdGlvblxuICAgIH19KSBcbiAgICBsZXQgdGltZTogbnVtYmVyW107XG4gICAgdGhpcy5kYXRhLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgIHRpbWU9W107XG4gICAgICBlbGVtZW50LnZhbHVlcy5mb3JFYWNoKChlbGVtZW50ID0+IHRpbWUucHVzaChlbGVtZW50WzBdKSkpO1xuICAgICAgbGV0IGkgPSBkMy5iaXNlY3RMZWZ0KHRpbWUsIG1pbiktMTtcbiAgICAgIGlmKGk+PTAmJmk8dGhpcy5kYXRhW2luZGV4XS52YWx1ZXMubGVuZ3RoKXtcbiAgICAgICAgdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzLnVuc2hpZnQoW21pbiwodGhpcy5kYXRhW2luZGV4XS52YWx1ZXNbaV1bMV0pXSk7XG4gICAgICB9XG4gICAgICB0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXMucHVzaChbbWF4LHRoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlc1t0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXMubGVuZ3RoLTFdWzFdXSk7XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW5kIGJ1aWxkIGEgbmV3IHRvb2x0aXBzXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZVRvb2xUaXBzKCk6IHZvaWR7XG4gICAgdGhpcy50b29sdGlwLnJlbW92ZSgpO1xuICAgIHRoaXMuZHJhd1Rvb2xUaXBzKCk7XG4gIH1cblxuICAvKipcbiAgICogQWN0aXZlIG1vdmVtZW50IG9mIHNjcm9sbGJhciBvbiBtb3VzZWRvd24gb24gaXRcbiAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBcbiAgICovIFxuICBwcml2YXRlIGFjdGl2ZVNjcm9sbGJhcihldmVudDogTW91c2VFdmVudCk6IHZvaWR7XG4gICAgaWYodGhpcy5pZFpvb20hPTApe1xuICAgICAgdGhpcy5zY3JvbGxiYXJTZWxlY3RlZD10cnVlO1xuICAgICAgdGhpcy5sYXN0UG9zPWV2ZW50LmNsaWVudFgtdGhpcy5tYXJnaW4ubGVmdDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzYWN0aXZlIG1vdmVtZW50IG9mIHNjcm9sbGJhciBvbiBtb3VzZXVwIG9yIG1vdXNlbGVhdmUgb24gaXRcbiAgICovXG4gIHByaXZhdGUgZGVzYWN0aXZlU2Nyb2xsYmFyKCk6IHZvaWR7XG4gICAgdGhpcy5zY3JvbGxiYXJTZWxlY3RlZD1mYWxzZTtcbiAgICB0aGlzLmxhc3RQb3M9MDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaG93IHRoZSB0b29sdGlwcyBvbiB0aGUgbW92ZW1lbnQgb2YgdGhlIG1vdXNlXG4gICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgXG4gICAqL1xuICBwcml2YXRlIHNob3dJbmZvKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZHtcbiAgICBpZiAodGhpcy5kYXRhWm9vbVswXSAhPSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhWm9vbS5sZW5ndGggPDIpIHtcbiAgICAgIHZhciBkOiBudW1iZXI9MDtcbiAgICAgIHZhciB0OiBudW1iZXI9MDtcbiAgICAgIGxldCB0aW1lOiBudW1iZXJbXSA9IFtdO1xuICAgICAgdGhpcy5kYXRhWm9vbVswXS52YWx1ZXMuZm9yRWFjaCgoZWxlbWVudCkgPT4gdGltZS5wdXNoKGVsZW1lbnRbMF0pKTtcbiAgICAgIGxldCB4MCA9IHRoaXMuc2NhbGVYLmludmVydChldmVudC5jbGllbnRYIC0gdGhpcy5tYXJnaW4ubGVmdCkuZ2V0VGltZSgpO1xuICAgICAgbGV0IHggPSBkMy5iaXNlY3RSaWdodCh0aW1lLCB4MCk7XG4gICAgICBpZih4PnRoaXMuZGF0YVpvb21bMF0udmFsdWVzLmxlbmd0aC0xKXg9dGhpcy5kYXRhWm9vbVswXS52YWx1ZXMubGVuZ3RoLTE7XG4gICAgICBlbHNlIGlmICh4IDwgMCkgeCA9IDA7XG4gICAgICAgIGQgID0gdGhpcy5kYXRhWm9vbVswXS52YWx1ZXNbeF1bMV07XG4gICAgICAgIHQgPSB0aGlzLmRhdGFab29tWzBdLnZhbHVlc1t4XVswXTtcbiAgICAgIGxldCBkYXRlID0gbmV3IERhdGUodCkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZnJcIiwgeyB5ZWFyOiAnbnVtZXJpYycsIG1vbnRoOiAnbG9uZycsIGRheTogJ251bWVyaWMnLCBob3VyOiAnbnVtZXJpYycsIG1pbnV0ZTogJ251bWVyaWMnLCBzZWNvbmQ6ICdudW1lcmljJyB9KTtcbiAgICAgIGQzLnNlbGVjdEFsbCgnI3Rvb2x0aXAtZGF0ZTEnKVxuICAgICAgICAudGV4dChkYXRlKTtcbiAgICAgIGQzLnNlbGVjdEFsbCgnI3Rvb2x0aXAtZGF0ZTInKVxuICAgICAgICAudGV4dCh0aGlzLnJvdW5kRGVjaW1hbChkLCAyKSk7XG4gICAgICB0aGlzLnRvb2x0aXAuc3R5bGUoXCJkaXNwbGF5XCIsXCJibG9ja1wiKTtcbiAgICAgIHRoaXMudG9vbHRpcC5zdHlsZShcIm9wYWNpdHlcIiwgMTAwKTtcbiAgICAgIHRoaXMudG9vbHRpcC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgdGhpcy5zY2FsZVgodCkgKyBcIixcIiArIHRoaXMuc2NhbGVZKGQpICsgXCIpXCIpO1xuICAgICAgaWYgKHRoaXMuc2NhbGVZKGQpIDw9IDQwICogdGhpcy5kYXRhWm9vbS5sZW5ndGgpIHtcbiAgICAgICAgaWYgKHRoaXMubW9kZVRvb2xUaXBzICE9IFwiaW52ZXJzZVwiKSB7XG4gICAgICAgICAgdGhpcy5tb2RlVG9vbFRpcHMgPSBcImludmVyc2VcIjtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVRvb2xUaXBzKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLm1vZGVUb29sVGlwcyAhPSBcIm5vcm1hbFwiKSB7XG4gICAgICAgICAgdGhpcy5tb2RlVG9vbFRpcHMgPSBcIm5vcm1hbFwiO1xuICAgICAgICAgIHRoaXMudXBkYXRlVG9vbFRpcHMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIaWRlIHRoZSB0b29sdGlwcyB3aGVuIHRoZSBtb3VzZSBsZWF2ZSB0aGUgc3ZnIFxuICAgKi8gICBcbiAgcHJpdmF0ZSBoaWRlSW5mbygpOiB2b2lke1xuICAgIHRoaXMudG9vbHRpcC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcmFuZ2UgKHJlZHVjZSBvciBpbmNyZWFzZSkgb2YgdGhlIGxpbmVjaGFydCBvbiBzY3JvbGwgXG4gICAqIEBwYXJhbSB7V2hlZWxFdmVudH0gZXZlbnQgXG4gICAqL1xuICBwcml2YXRlIGFjdGl2ZVpvb20oZXZlbnQ6IFdoZWVsRXZlbnQpOiB2b2lke1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgbGV0IGxhc3RMZW5ndGhMb2NhbFRpbWUgPSB0aGlzLmxlbmd0aFRpbWUgLyBNYXRoLnBvdygxK3RoaXMuc3BlZWRab29tLHRoaXMuaWRab29tKTtcbiAgICBsZXQgbGFzdE1pbkxvY2FsVGltZSA9IHRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNaW5cIik7XG4gICAgaWYoKGV2ZW50LmRlbHRhWT4wJiZ0aGlzLmlkWm9vbT4wKXx8ZXZlbnQuZGVsdGFZPDApe1xuICAgICAgaWYoZXZlbnQuZGVsdGFZPjAmJnRoaXMuaWRab29tPjApe1xuICAgICAgICB0aGlzLmlkWm9vbS0tO1xuICAgICAgfWVsc2UgaWYoZXZlbnQuZGVsdGFZPDApe1xuICAgICAgICB0aGlzLmlkWm9vbSsrOyBcbiAgICAgIH1cbiAgICAgIGxldCBwb3MgPSB0aGlzLnNjYWxlWC5pbnZlcnQoZXZlbnQuY2xpZW50WC10aGlzLm1hcmdpbi5sZWZ0KS5nZXRUaW1lKCk7XG4gICAgICBsZXQgbGVuZ3RoTG9jYWxUaW1lID0gdGhpcy5sZW5ndGhUaW1lIC8gTWF0aC5wb3coMSt0aGlzLnNwZWVkWm9vbSx0aGlzLmlkWm9vbSk7XG4gICAgICBpZihsZW5ndGhMb2NhbFRpbWU+MjAwKXtcbiAgICAgICAgbGV0IG1pbkxvY2FsVGltZSA9IChsYXN0TWluTG9jYWxUaW1lLXBvcykqKGxlbmd0aExvY2FsVGltZS9sYXN0TGVuZ3RoTG9jYWxUaW1lKSArIHBvcztcbiAgICAgICAgdGhpcy5yYW5nZSA9IHRoaXMuY29udHJvbFJhbmdlKG1pbkxvY2FsVGltZSxsZW5ndGhMb2NhbFRpbWUpO1xuICAgICAgICB0aGlzLnVwZGF0ZURhdGFab29tKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICAgIHRoaXMudXBkYXRlU3ZnKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICAgIHRoaXMucmFuZ2VDaGFuZ2UuZW1pdCh0aGlzLnJhbmdlKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmlkWm9vbS0tO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHZhbHVlIG9mIGN1cnJlbnQgdGltZSBvbiB0aGUgbW92ZW1lbnQgb2YgdGhlIG1vdXNlXG4gICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgXG4gICAqL1xuICBwcml2YXRlIG1vdmVDdXJyZW50VGltZShldmVudDogTW91c2VFdmVudCk6IHZvaWR7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBsZXQgcG9zID0gdGhpcy5zY2FsZVguaW52ZXJ0KGV2ZW50LmNsaWVudFgtdGhpcy5tYXJnaW4ubGVmdCkuZ2V0VGltZSgpO1xuICAgIGlmKHBvczx0aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpKXtcbiAgICAgIHRoaXMuY3VycmVudFRpbWU9dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1pblwiKTtcbiAgICB9ZWxzZSBpZihwb3M+dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1heFwiKSl7XG4gICAgICB0aGlzLmN1cnJlbnRUaW1lPXRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNYXhcIik7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLmN1cnJlbnRUaW1lPXBvcztcbiAgICB9XG4gICAgdGhpcy51cGRhdGVDdXJyZW50VGltZSgpO1xuICAgIHRoaXMuY3VycmVudFRpbWVDaGFuZ2UuZW1pdCh0aGlzLmN1cnJlbnRUaW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb250cm9sIHRoZSByYW5nZSBiYXNlZCBvbiBkYXRhJ3MgdGltZXN0YW1wIGFuZCB0aGUgbmV3IHJhbmdlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtaW4gb2YgdGhlIG5ldyByYW5nZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoIG9mIHRoZSBuZXcgcmFuZ2VcbiAgICogQHJldHVybnMgYSBhZGp1c3RlZCByYW5nZSBiYXNlZCBvbiBkYXRhJ3MgdGltZXN0YW1wXG4gICAqL1xuICBwcml2YXRlIGNvbnRyb2xSYW5nZShtaW46bnVtYmVyLCBsZW5ndGg6bnVtYmVyKSA6IFtudW1iZXIsbnVtYmVyXXtcbiAgICBpZih0aGlzLm1pblRpbWU+bWluKSBtaW49dGhpcy5taW5UaW1lO1xuICAgIGxldCBtYXggPSBtaW4gKyBsZW5ndGg7XG4gICAgaWYodGhpcy5tYXhUaW1lPG1heCl7XG4gICAgICBtYXg9dGhpcy5tYXhUaW1lO1xuICAgICAgbWluPW1heCAtIGxlbmd0aDtcbiAgICB9XG4gICAgaWYodGhpcy5taW5UaW1lPm1pbikgbWluPXRoaXMubWluVGltZTtcbiAgICByZXR1cm4gW21pbixtYXhdO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnRyb2wgdGhlIGRvbWFpbiBiYXNlZCBvbiBkYXRhJ3MgdmFsdWUgdHlwZSBhbmQgdGhlIGlucHV0IGRvbWFpblxuICAgKiBAcmV0dXJucyBhIG5ldyBkb21haW4gYXV0by1zY2FsZWQgaWYgdGhlIGlucHV0IGRvbWFpbiBpcyBlcXVhbCB0byBbMCwwXSBvciB0aGUgZGF0YSdzIHZhbHVlIGFyZSBwb3NpdGl2ZSBpbnRlZ2VycywgZWxzZSByZXR1cm4gdGhlIGlucHV0IGRvbWFpbiBcbiAgICovXG4gIHByaXZhdGUgY29udHJvbERvbWFpbigpOltudW1iZXIsbnVtYmVyXXtcbiAgICBpZigodGhpcy5kb21haW5bMF09PTAmJnRoaXMuZG9tYWluWzFdPT0wKXx8dGhpcy5kaXNjcmV0ZVZhbHVlKHRoaXMuZGF0YSkpe1xuICAgICAgcmV0dXJuIFt0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInlNaW5cIiksdGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ5TWF4XCIpXTtcbiAgICB9ZWxzZXtcbiAgICAgIHJldHVybiB0aGlzLmRvbWFpbjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29udHJvbCB0aGUgY29sb3IgYmFzZWQgb24gY3NzLWNvbG9ycy1uYW1lIGFuZCBoZXgtY29sb3ItY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29sb3IgXG4gICAqIEByZXR1cm5zIGZhbHNlIGlmIHRoZSBwYXJhbSBjb2xvciBpc24ndCBhIGNzcy1jb2xvcnMtbmFtZSBvciBhIHZhbGlkIGhleC1jb2xvci1jb2RlXG4gICAqL1xuICBwcml2YXRlIGNvbnRyb2xDb2xvcihjb2xvcjogc3RyaW5nKTpib29sZWFue1xuICAgIGxldCBzID0gbmV3IE9wdGlvbigpLnN0eWxlO1xuICAgIHMuY29sb3IgPSBjb2xvcjtcbiAgICByZXR1cm4gcy5jb2xvciE9XCJcIjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnRyb2wgdGhlIHNwZWVkWm9vbSBpZiBpdCBpc24ndCBiZXR3ZWVuIDAgYW5kIDEuXG4gICAqL1xuICBwcml2YXRlIGNvbnRyb2xTcGVlZFpvb20oKTogdm9pZHtcbiAgICBpZih0aGlzLnNwZWVkWm9vbTw9MCl7XG4gICAgICB0aGlzLnNwZWVkWm9vbT0wLjE7XG4gICAgfWVsc2UgaWYodGhpcy5zcGVlZFpvb20+MSl7XG4gICAgICB0aGlzLnNwZWVkWm9vbT0xO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBcbiAgICogRGV0ZXJtaW5lIHRoZSBtaW5pbXVtIG9yIG1heGltdW0gb2YgdGhlIGhvcml6b250YWwgb3IgdmVydGljYWwgYXhpcyBpbiBkYXRhXG4gICAqIEBwYXJhbSB7RGF0YVtdfSBkYXRhIEFycmF5IG9mIERhdGFcbiAgICogQHBhcmFtIHtcInhNaW5cIiB8IFwieE1heFwiIHwgXCJ5TWluXCIgfCBcInlNYXhcIn0gcyBwcmVjaXNlIHdpaGNoIHNjYWxlIHdlIHdhbnRcbiAgICogQHJldHVybnMgdGhlIHZhbHVlIHRoYXQgbWF0Y2hlcyB3aXRoIHRoZSBwYXJhbWV0ZXIgcyBpbiBkYXRhXG4gICAqL1xuICBwcml2YXRlIHNjYWxlKGRhdGE6IERhdGFbXSwgczogXCJ4TWluXCIgfCBcInhNYXhcIiB8IFwieU1pblwiIHwgXCJ5TWF4XCIpOiBudW1iZXIge1xuICAgIGxldCByZXM6IG51bWJlciA9IDA7XG4gICAgZGF0YS5mb3JFYWNoKFxuICAgICAgKGVsZW1lbnRzLGluZGV4KSA9PiBlbGVtZW50cy52YWx1ZXMuZm9yRWFjaFxuICAgICAgKChlbGVtZW50LGkpID0+IHtcbiAgICAgICAgaWYoKHM9PVwieU1pblwiJiYoKGk9PTAmJmluZGV4PT0wKXx8ZWxlbWVudFsxXTxyZXMpKXx8KHM9PVwieU1heFwiJiYoKGk9PTAmJmluZGV4PT0wKXx8ZWxlbWVudFsxXT5yZXMpKSkgcmVzPWVsZW1lbnRbMV07XG4gICAgICAgIGVsc2UgaWYoKHM9PVwieE1pblwiJiYoKGk9PTAmJmluZGV4PT0wKXx8ZWxlbWVudFswXTxyZXMpKXx8KHM9PVwieE1heFwiJiYoKGk9PTAmJmluZGV4PT0wKXx8ZWxlbWVudFswXT5yZXMpKSkgcmVzPWVsZW1lbnRbMF07XG4gICAgICB9KVxuICAgIClcbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgLyoqIFxuICAqQ2hlY2sgdHlwZSBvZiBkYXRhIChwb3NpdGl2ZSBpbnRlZ2VyIG9yIGZsb2F0KVxuICAqQHBhcmFtIHtEYXRhW119IGRhdGEgQXJyYXkgb2YgRGF0YVxuICAqQHJldHVybnMgZmFsc2UgaWYgdGhlcmUgaXMgYXQgbGVhc3Qgb25lIHZhbHVlIGluIGRhdGEgdGhhdCdzIG5vdCBhIHBvc2l0aXZlIGludGVnZXJcbiAgKi9cbiAgcHJpdmF0ZSBkaXNjcmV0ZVZhbHVlKGRhdGE6IERhdGFbXSk6IGJvb2xlYW57XG4gICAgZm9yKGxldCBpOm51bWJlcj0wO2k8ZGF0YS5sZW5ndGg7aSsrKXtcbiAgICAgIGZvcihsZXQgajpudW1iZXI9MDtqPGRhdGFbaV0udmFsdWVzLmxlbmd0aDtqKyspe1xuICAgICAgICBpZihkYXRhW2ldLnZhbHVlc1tqXVsxXSE9TWF0aC5yb3VuZChkYXRhW2ldLnZhbHVlc1tqXVsxXSkpIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogUm91bmQgYSBudW1iZXIgd2l0aCBhIHByZWNpc2lvblxuICAgKiBAcGFyYW0ge251bWJlcn0gbnVtIFxuICAgKiBAcGFyYW0ge251bWJlcn0gcHJlY2lzaW9uIFxuICAgKiBAcmV0dXJucyBhIG51bSB3aXRoIGEgbnVtYmVyIG9mIGRlY2ltYWwgKHByZWNpc2lvbilcbiAgICovXG4gIHByaXZhdGUgcm91bmREZWNpbWFsKG51bSA6IG51bWJlciwgcHJlY2lzaW9uOm51bWJlcik6IG51bWJlcntcbiAgICBsZXQgdG1wOiBudW1iZXIgPSBNYXRoLnBvdygxMCwgcHJlY2lzaW9uKTtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCggbnVtKnRtcCApL3RtcDtcbiAgfVxufVxuIl19