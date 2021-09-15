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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzaWMtbGluZWNoYXJ0LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2Jhc2ljLWxpbmVjaGFydC9zcmMvbGliL2Jhc2ljLWxpbmVjaGFydC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBYyxZQUFZLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBVSxNQUFNLEVBQTRCLFNBQVMsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUc5SSxPQUFPLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQzs7QUEyQ3pCLE1BQU0sT0FBTyx1QkFBdUI7SUFrTWxDOzs7T0FHRztJQUNILFlBQW9CLFFBQW1CO1FBQW5CLGFBQVEsR0FBUixRQUFRLENBQVc7UUFyTXZDOzs7V0FHRztRQUNNLFVBQUssR0FBVyxHQUFHLENBQUM7UUFFN0I7OztXQUdHO1FBQ00sV0FBTSxHQUFXLEdBQUcsQ0FBQztRQUU5Qjs7O1dBR0c7UUFDTSxTQUFJLEdBQVcsRUFBRSxDQUFDO1FBRTNCOzs7O1dBSUc7UUFDTSxXQUFNLEdBQXFCLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTFDOzs7V0FHRztRQUNNLGNBQVMsR0FBVyxHQUFHLENBQUM7UUEwQmpDOzs7V0FHRztRQUNNLFVBQUssR0FBb0IsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7UUFFeEM7O1dBRUc7UUFDTyxnQkFBVyxHQUFHLElBQUksWUFBWSxFQUFtQixDQUFDO1FBRTVEOzs7V0FHRztRQUNNLGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1FBRWpDOztXQUVHO1FBQ08sc0JBQWlCLEdBQUcsSUFBSSxZQUFZLEVBQVUsQ0FBQztRQUV6RDs7V0FFRztRQUNJLFVBQUssR0FBVSxhQUFhLENBQUM7UUFFcEM7O1dBRUc7UUFDSyxXQUFNLEdBQXVELEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFB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WSxDQUFDLEdBQVksRUFBRSxTQUFnQjtRQUNqRCxJQUFJLEdBQUcsR0FBVyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUMxQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUUsR0FBRyxHQUFDLEdBQUcsQ0FBRSxHQUFDLEdBQUcsQ0FBQztJQUNuQyxDQUFDOztvSEFoM0JVLHVCQUF1Qjt3R0FBdkIsdUJBQXVCLGl3QkFWeEI7Ozs7OztHQU1UOzJGQUlVLHVCQUF1QjtrQkFabkMsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUscUJBQXFCO29CQUMvQixRQUFRLEVBQUU7Ozs7OztHQU1UO29CQUNELE1BQU0sRUFBRSxFQUNQO2lCQUNGO2dHQU1VLEtBQUs7c0JBQWIsS0FBSztnQkFNRyxNQUFNO3NCQUFkLEtBQUs7Z0JBTUcsSUFBSTtzQkFBWixLQUFLO2dCQU9HLE1BQU07c0JBQWQsS0FBSztnQkFNRyxTQUFTO3NCQUFqQixLQUFLO2dCQU1hLFFBQVE7c0JBQTFCLFNBQVM7dUJBQUMsTUFBTTtnQkFNSSxTQUFTO3NCQUE3QixTQUFTO3VCQUFDLFFBQVE7Z0JBTUEsYUFBYTtzQkFBL0IsU0FBUzt1QkFBQyxNQUFNO2dCQU1LLEtBQUs7c0JBQTFCLFNBQVM7dUJBQUMsU0FBUztnQkFNWCxLQUFLO3NCQUFiLEtBQUs7Z0JBS0ksV0FBVztzQkFBcEIsTUFBTTtnQkFNRSxXQUFXO3NCQUFuQixLQUFLO2dCQUtJLGlCQUFpQjtzQkFBMUIsTUFBTTtnQkE0R1AsYUFBYTtzQkFEWixZQUFZO3VCQUFDLGdCQUFnQixFQUFFLENBQUMsUUFBUSxDQUFDO2dCQU8xQyxXQUFXO3NCQURWLFlBQVk7dUJBQUMsY0FBYyxFQUFFLENBQUMsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBFdmVudEVtaXR0ZXIsIEhvc3RMaXN0ZW5lciwgSW5wdXQsIE9uSW5pdCwgT3V0cHV0LCBSZW5kZXJlcjIsIFNpbXBsZUNoYW5nZXMsIFZpZXdDaGlsZCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTY2FsZVRpbWUsIFNjYWxlTGluZWFyfSBmcm9tICdkMy1zY2FsZSc7XG5pbXBvcnQge1NlbGVjdGlvbn0gZnJvbSAnZDMtc2VsZWN0aW9uJztcbmltcG9ydCAqIGFzIGQzIGZyb20gJ2QzJztcbmltcG9ydCB7IGZyb21FdmVudCB9IGZyb20gJ3J4anMnO1xuXG4vKipcbiAqIERhdGEncyBmb3JtYXQgZm9yIHRoZSBjb21wb25lbnRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEYXRhIHtcbiAgLyoqXG4gICAqIERhdGEncyBuYW1lXG4gICAqL1xuICBsYWJlbDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBEYXRhJ3MgdmFsdWVzIFt0aW1lc3RhbXAsdmFsdWVdW11cbiAgICovXG4gIHZhbHVlczogW251bWJlcixudW1iZXJdW107XG4gIC8qKlxuICAgKiBMaW5lIG9yIGFyZWEgY29sb3IgeW91IGNhbiBmaWxsIHdpdGggbmFtZSwgaGV4YWNvZGUgb3IgcmdiIGNvZGUuXG4gICAqL1xuICBjb2xvcjogc3RyaW5nO1xuICAvKipcbiAgICogU3R5bGUgb2YgbGluZVxuICAgKi9cbiAgc3R5bGU6IFwibGluZVwiIHwgXCJhcmVhXCIgfCBcImJvdGhcIjtcbiAgLyoqXG4gICAqIEludGVycG9sYXRpb24gb2YgbGluZSBcbiAgICogUmVjb21tYW5kZWQgOiBzdGVwIGZvciBkaXNjcmV0ZSB2YWx1ZXMgYW5kIGxpbmVhciBmb3IgY29udGludW91cyB2YWx1ZXNcbiAgICovXG4gIGludGVycG9sYXRpb246IFwibGluZWFyXCIgfCBcInN0ZXBcIjtcbn1cblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnbGliLWJhc2ljLWxpbmVjaGFydCcsXG4gIHRlbXBsYXRlOiBgXG4gIDxkaXYgI2VsZW1lbnQ+XG4gIDxoMj57eyB0aXRsZSB9fTwvaDI+XG4gIDxzdmcgI3Jvb3QgW2F0dHIud2lkdGhdPVwid2lkdGhcIiBbYXR0ci5oZWlnaHRdPVwiaGVpZ2h0XCI+PC9zdmc+XG4gIDxkaXYgI3pvbmU+PGRpdiAjc2Nyb2xsPjwvZGl2PjwvZGl2PlxuICA8L2Rpdj5cbiAgYCxcbiAgc3R5bGVzOiBbXG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgQmFzaWNMaW5lY2hhcnRDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICAvKipcbiAgICogSW5wdXQgd2lkdGggb2YgdGhlIGNvbXBvbmVudFxuICAgKiBEZWZhdWx0IHZhbHVlIDogOTAwXG4gICAqL1xuICBASW5wdXQoKSB3aWR0aDogbnVtYmVyID0gOTAwO1xuICBcbiAgLyoqXG4gICAqIElucHV0IGhlaWdodCBvZiB0aGUgY29tcGVuZW50XG4gICAqIERlZmF1bHQgdmFsdWUgOiAyMDBcbiAgICovXG4gIEBJbnB1dCgpIGhlaWdodDogbnVtYmVyID0gMjAwO1xuICBcbiAgLyoqXG4gICAqIElucHV0IGRhdGEgYXJyYXkgdGhhdCB0aGUgY29tcG9uZW50IGRpc3BsYXlcbiAgICogRGVmYXVsdCB2YWx1ZSA6IFtdXG4gICAqL1xuICBASW5wdXQoKSBkYXRhOiBEYXRhW10gPSBbXTtcblxuICAvKipcbiAgICogSW5wdXQgZG9tYWluIG9mIHRoZSBBeGlzIFlcbiAgICogV29ya3Mgb25seSBmb3IgY29udGludW91cyB2YWx1ZXNcbiAgICogRGVmYXVsdCB2YWx1ZSA6IFswLDBdXG4gICAqL1xuICBASW5wdXQoKSBkb21haW46IFtudW1iZXIsIG51bWJlcl0gPSBbMCwwXTtcbiAgXG4gIC8qKlxuICAgKiBJbnB1dCBzcGVlZCBvZiB6b29tIGJldHdlZW4gMCBhbmQgMVxuICAgKiBEZWZhdWx0IHZhbHVlIDogMC4yXG4gICAqL1xuICBASW5wdXQoKSBzcGVlZFpvb206IG51bWJlciA9IDAuMjtcbiAgXG4gIC8qKlxuICAgKiBFbGVtZW50UmVmIG9mIERPTSBFbGVtZW50IHJvb3RcbiAgICogSXQncyBhIHN2ZyB3aXRoIHRoZSBsaW5lY2hhcnRcbiAgICovXG4gIEBWaWV3Q2hpbGQoJ3Jvb3QnKSB0aW1lbGluZSE6IEVsZW1lbnRSZWY7XG5cbiAgLyoqXG4gICAqIEVsZW1lbnRSZWYgb2YgRE9NIEVsZW1lbnQgc2Nyb2xsXG4gICAqIEl0J3MgYSBkaXYgdGhhdCB3aWxsIGJlIHRoZSBzY3JvbGxiYXJcbiAgICovXG4gIEBWaWV3Q2hpbGQoJ3Njcm9sbCcpIHNjcm9sbGJhciE6IEVsZW1lbnRSZWY7XG5cbiAgLyoqXG4gICAqIEVsZW1lbnRSZWYgb2YgRE9NIEVsZW1lbnQgem9uZVxuICAgKiBJdCdzIGEgZGl2IHRoYXQgd2lsbCBiZSB0aGUgem9uZSBvZiBzY3JvbGxiYXJcbiAgICovXG4gIEBWaWV3Q2hpbGQoJ3pvbmUnKSB6b25lU2Nyb2xsYmFyITogRWxlbWVudFJlZjtcblxuICAvKipcbiAgICogRWxlbWVudFJlZiBvZiBET00gRWxlbWVudCBlbGVtZW50XG4gICAqIEl0J3MgYSBkaXYgdGhhdCBjb250YWlucyBhbGwgdGhlIG90aGVycyBEb20gRWxlbWVudFxuICAgKi9cbiAgQFZpZXdDaGlsZCgnZWxlbWVudCcpIGNvbXBvITogRWxlbWVudFJlZjtcblxuICAvKipcbiAgICogSW5wdXQgcmFuZ2Ugb2YgdGltZXN0YW1wXG4gICAqIERlZmF1bHQgdmFsdWUgOiBbMCwwXVxuICAgKi9cbiAgQElucHV0KCkgcmFuZ2U6IFtudW1iZXIsbnVtYmVyXSA9IFswLDBdO1xuICBcbiAgLyoqXG4gICAqIE91dHB1dCByYW5nZUNoYW5nZSB0aGF0IGVtaXQgcmFuZ2UgXG4gICAqL1xuICBAT3V0cHV0KCkgcmFuZ2VDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPFtudW1iZXIsbnVtYmVyXT4oKTtcbiAgXG4gIC8qKlxuICAgKiBJbnB1dCBjdXJyZW50VGltZVxuICAgKiBEZWZhdWx0IHZhbHVlIDogMFxuICAgKi9cbiAgQElucHV0KCkgY3VycmVudFRpbWU6IG51bWJlciA9IDA7XG4gIFxuICAvKipcbiAgICogT3V0cHV0IGN1cnJlbnRUaW1lQ2hhbmdlIHRoYXQgZW1pdCBjdXJyZW50VGltZVxuICAgKi9cbiAgQE91dHB1dCgpIGN1cnJlbnRUaW1lQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KCk7XG4gIFxuICAvKipcbiAgICogVGl0bGUgb2YgdGhlIGNvbXBvbmVudFxuICAgKi9cbiAgcHVibGljIHRpdGxlOnN0cmluZyA9ICdUaW1lbGluZSA6ICc7XG4gIFxuICAvKipcbiAgICogTWFyZ2luIG9mIHRoZSBjb21wb25lbnRcbiAgICovXG4gIHByaXZhdGUgbWFyZ2luOnt0b3A6bnVtYmVyLHJpZ2h0Om51bWJlcixib3R0b206bnVtYmVyLGxlZnQ6bnVtYmVyfSA9IHsgdG9wOiAyMCwgcmlnaHQ6IDIwLCBib3R0b206IDIwLCBsZWZ0OiA1MCB9OyAvL21hcmdlIGludGVybmUgYXUgc3ZnIFxuICBcbiAgLyoqXG4gICAqIGRhdGFab29tIGlzIGEgY29weSBvZiBkYXRhIHdpdGggdGhlIHJhbmdlIHNwZWNpZnlcbiAgICovXG4gIHByaXZhdGUgZGF0YVpvb206IERhdGFbXSA9IFtdO1xuICBcbiAgLyoqXG4gICAqIGlkWm9vbSBpcyB0aGUgbnVtYmVyIG9mIHdoZWVsIG5vdGNoXG4gICAqL1xuICBwcml2YXRlIGlkWm9vbTogbnVtYmVyID0gMDtcbiAgXG4gIC8qKlxuICAgKiBJdCdzIHRoZSBzbWFsbGVzdCB0aW1lc3RhbXAgb2YgZGF0YVxuICAgKi9cbiAgcHJpdmF0ZSBtaW5UaW1lOiBudW1iZXIgPSAwO1xuICBcbiAgLyoqXG4gICAqIEl0J3MgdGhlIGJpZ2dlc3QgdGltZXN0YW1wIG9mIGRhdGFcbiAgICovXG4gIHByaXZhdGUgbWF4VGltZTogbnVtYmVyID0gMDtcbiAgXG4gIC8qKlxuICAgKiBJdCdzIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHNtYWxsZXN0IGFuZCB0aGUgYmlnZ2VzdFxuICAgKi9cbiAgcHJpdmF0ZSBsZW5ndGhUaW1lOiBudW1iZXIgPSAwO1xuICBcbiAgLyoqXG4gICAqIFdpZHRoIG9mIHRoZSBzdmdcbiAgICovXG4gIHByaXZhdGUgc3ZnV2lkdGg6IG51bWJlciA9IDA7XG4gIFxuICAvKipcbiAgICogSGVpZ2h0IG9mIHRoZSBzdmdcbiAgICovXG4gIHByaXZhdGUgc3ZnSGVpZ2h0OiBudW1iZXIgPSAwO1xuICBcbiAgLyoqXG4gICAqIFNjYWxlIG9mIHRoZSBYIGF4aXNcbiAgICovXG4gIHByaXZhdGUgc2NhbGVYOiBTY2FsZVRpbWU8bnVtYmVyLG51bWJlcj4gPSBkMy5zY2FsZVRpbWUoKTtcbiAgXG4gIC8qKlxuICAgKiBTY2FsZSBvZiB0aGUgWSBheGlzXG4gICAqL1xuICBwcml2YXRlIHNjYWxlWTogU2NhbGVMaW5lYXI8bnVtYmVyLG51bWJlcj4gPSBkMy5zY2FsZUxpbmVhcigpO1xuXG4gIC8qKlxuICAgKiBzdmcgdGhhdCBjb250YWluIHRoZSBsaW5lY2hhcnQgYW5kIHRoZSBheGlzXG4gICAqL1xuICBwcml2YXRlIHN2ZzogYW55O1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBhcmVhIGRlZmluaXRpb25cbiAgICovXG4gIHByaXZhdGUgYXJlYTogZDMuQXJlYTxbbnVtYmVyLCBudW1iZXJdPltdID0gW107XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIGxpbmUgZGVmaW5pdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBsaW5lOiBkMy5MaW5lPFtudW1iZXIsIG51bWJlcl0+W10gPSBbXTtcblxuICAvKipcbiAgICogU3ZnIGRlZmluaXRpb24gb2YgdGhlIHRvb2x0aXBcbiAgICovXG4gIHByaXZhdGUgdG9vbHRpcCE6IFNlbGVjdGlvbjxTVkdHRWxlbWVudCx1bmtub3duLG51bGwsdW5kZWZpbmVkPjtcblxuICAvKipcbiAgICogZGF0YSBsZW5ndGggYmVmb3JlIHRoZSBuZXcgY2hhbmdlXG4gICAqL1xuICBwcml2YXRlIGxhc3REYXRhbGVuZ3RoOm51bWJlciA9IDA7XG5cbiAgLyoqXG4gICAqIE1vZGUgb2YgdGhlIHRvb2x0aXBcbiAgICovXG4gIHByaXZhdGUgbW9kZVRvb2xUaXBzOiBcIm5vcm1hbFwiIHwgXCJpbnZlcnNlXCIgPSBcIm5vcm1hbFwiO1xuXG4gIC8qKlxuICAgKiB0cnVlIGlmIHRoZSBjdXJyZW50VGltZWxpbmUgaXMgc2VsZWN0ZWRcbiAgICovXG4gIHByaXZhdGUgY3VycmVudFRpbWVTZWxlY3RlZDpib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIHRydWUgaWYgdGhlIHNjcm9sbGJhciBpcyBzZWxlY3RlZFxuICAgKi9cbiAgcHJpdmF0ZSBzY3JvbGxiYXJTZWxlY3RlZDpib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIExhc3QgcG9zaXRpb24gb2YgdGhlIG1vdXNlXG4gICAqL1xuICBwcml2YXRlIGxhc3RQb3M6IG51bWJlciA9IDA7XG5cbiAgLyoqXG4gICAqIHRydWUgaWYgdGhlIENUUkwgS2V5IG9mIGtleUJvYXJkIGlzIHB1c2ggXG4gICAqL1xuICBwcml2YXRlIHpvb21TZWxlY3RlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIEBIb3N0TGlzdGVuZXIoJ3dpbmRvdzprZXlkb3duJywgWyckZXZlbnQnXSlcbiAgaGFuZGxlS2V5RG93bihldmVudDogS2V5Ym9hcmRFdmVudCl7XG4gICAgaWYoZXZlbnQuY3RybEtleSYmIXRoaXMuem9vbVNlbGVjdGVkKXtcbiAgICAgIHRoaXMuem9vbVNlbGVjdGVkID0gdHJ1ZTtcbiAgICB9IFxuICB9XG4gIEBIb3N0TGlzdGVuZXIoJ3dpbmRvdzprZXl1cCcsIFsnJGV2ZW50J10pXG4gIGhhbmRsZUtleVVwKCl7XG4gICAgdGhpcy56b29tU2VsZWN0ZWQgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciA6IEluaXQgcmVuZGVyZXJcbiAgICogQHBhcmFtIHJlbmRlcmVyIFxuICAgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZW5kZXJlcjogUmVuZGVyZXIyKSB7ICAgXG4gIH1cblxuICAvKipcbiAgICogQ29weSBkYXRhIGluIGRhdGFab29tLCBhbmQgYnVpbGQgdGl0bGUgXG4gICAqL1xuICBwdWJsaWMgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5kYXRhWm9vbSA9IFsuLi50aGlzLmRhdGFdO1xuICAgIHRoaXMubGFzdERhdGFsZW5ndGg9dGhpcy5kYXRhWm9vbS5sZW5ndGg7XG4gICAgdGhpcy5kYXRhLmZvckVhY2goKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgIGlmKGluZGV4PT10aGlzLmRhdGEubGVuZ3RoLTEpIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlK2VsZW1lbnQubGFiZWwrJy4nO1xuICAgICAgZWxzZSB0aGlzLnRpdGxlID0gdGhpcy50aXRsZStlbGVtZW50LmxhYmVsICsgJywgJztcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgbGluZWNoYXJ0XG4gICAqL1xuICBwdWJsaWMgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRpbWVsaW5lICE9IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHcgPSB0aGlzLnRpbWVsaW5lLm5hdGl2ZUVsZW1lbnQud2lkdGguYW5pbVZhbC52YWx1ZTtcbiAgICAgIGxldCBoID0gdGhpcy50aW1lbGluZS5uYXRpdmVFbGVtZW50LmhlaWdodC5hbmltVmFsLnZhbHVlO1xuICAgICAgdGhpcy5zdmdXaWR0aCA9ICh3IC0gdGhpcy5tYXJnaW4ubGVmdCkgLSB0aGlzLm1hcmdpbi5yaWdodDtcbiAgICAgIHRoaXMuc3ZnSGVpZ2h0ID0gKGggLSB0aGlzLm1hcmdpbi50b3ApIC0gdGhpcy5tYXJnaW4uYm90dG9tO1xuICAgIH1cbiAgICB0aGlzLmRhdGEuZm9yRWFjaCgoZWxlbWVudCxpbmRleCkgPT4gdGhpcy5idWlsZFN0eWxlRGF0YShlbGVtZW50LGluZGV4KSk7XG4gICAgdGhpcy5jb250cm9sU3BlZWRab29tKCk7XG4gICAgdGhpcy5idWlsZFpvb20oKTsgXG4gICAgdGhpcy5idWlsZEV2ZW50KCk7XG4gICAgdGhpcy5kcmF3VG9vbFRpcHMoKTtcbiAgICB0aGlzLmRyYXdBeGlzKCk7XG4gICAgdGhpcy5kcmF3TGluZUFuZFBhdGgoKTtcbiAgICB0aGlzLmRyYXdMaW5lQ3VycmVudFRpbWUoKTtcbiAgICB0aGlzLmRyYXdTY3JvbGxiYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgbGluZWNoYXJ0IG9uIGRhdGEsIHJhbmdlIG9yIGN1cnJlbnQgdGltZSBjaGFuZ2VzXG4gICAqIEBwYXJhbSB7U2ltcGxlQ2hhbmdlc30gY2hhbmdlcyBcbiAgICovXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXMuZGF0YSYmIWNoYW5nZXMuZGF0YS5maXJzdENoYW5nZSkgdGhpcy51cGRhdGVDaGFydCgpO1xuICAgIGlmICgoY2hhbmdlcy5kYXRhJiYhY2hhbmdlcy5kYXRhLmZpcnN0Q2hhbmdlJiZ0aGlzLnJhbmdlWzBdIT0wJiZ0aGlzLnJhbmdlWzFdIT0wKXx8KGNoYW5nZXMucmFuZ2UmJiFjaGFuZ2VzLnJhbmdlLmZpcnN0Q2hhbmdlKSkge1xuICAgICAgdGhpcy5pZFpvb209TWF0aC5yb3VuZChNYXRoLmxvZyh0aGlzLmxlbmd0aFRpbWUvKHRoaXMucmFuZ2VbMV0tdGhpcy5yYW5nZVswXSkpL01hdGgubG9nKDErdGhpcy5zcGVlZFpvb20pKTtcbiAgICAgIHRoaXMucmFuZ2U9dGhpcy5jb250cm9sUmFuZ2UodGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdLXRoaXMucmFuZ2VbMF0pO1xuICAgICAgaWYodGhpcy5kYXRhLmxlbmd0aCE9MCl7XG4gICAgICAgIHRoaXMudXBkYXRlRGF0YVpvb20odGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdmcodGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNoYW5nZXMuY3VycmVudFRpbWUmJiFjaGFuZ2VzLmN1cnJlbnRUaW1lLmZpcnN0Q2hhbmdlJiZ0aGlzLmRhdGEubGVuZ3RoIT0wKSB0aGlzLnVwZGF0ZUN1cnJlbnRUaW1lKCk7XG59XG5cbiAgLyoqXG4gICAqIEFkZCBldmVudCBsaXN0ZW5lcnMgb24gdGhlIHN2Z1xuICAgKi9cbiAgcHJpdmF0ZSBidWlsZEV2ZW50KCk6IHZvaWR7IC8vIGNyZWVyIHVuZSB0aW1lbGluZSBhdmVjIHVuZSBzZXVsIGRvbm7DqWVcbiAgICB0aGlzLnN2ZyA9IGQzLnNlbGVjdCh0aGlzLnRpbWVsaW5lLm5hdGl2ZUVsZW1lbnQpXG4gICAgLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHRoaXMubWFyZ2luLmxlZnQgKyAnLCcgKyB0aGlzLm1hcmdpbi50b3AgKyAnKScpO1xuICAgIGQzLnNlbGVjdCh0aGlzLnRpbWVsaW5lLm5hdGl2ZUVsZW1lbnQpLm9uKFwibW91c2Vtb3ZlXCIsIChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgaWYodGhpcy5jdXJyZW50VGltZVNlbGVjdGVkKSB0aGlzLm1vdmVDdXJyZW50VGltZShldmVudCk7XG4gICAgICBlbHNlIHRoaXMuc2hvd0luZm8oZXZlbnQpO1xuICAgIH0pXG4gICAgLm9uKFwibW91c2VsZWF2ZVwiLCAoKSA9PiB7IHRoaXMuY3VycmVudFRpbWVTZWxlY3RlZCA9IGZhbHNlOyB0aGlzLmhpZGVJbmZvKCkgfSlcbiAgICAub24oXCJ3aGVlbFwiLCAoZXZlbnQ6IFdoZWVsRXZlbnQpID0+IHtpZih0aGlzLmRhdGEubGVuZ3RoIT0wKWlmKHRoaXMuem9vbVNlbGVjdGVkKXt0aGlzLmFjdGl2ZVpvb20oZXZlbnQpfX0pXG4gICAgLm9uKFwibW91c2V1cFwiLCAoKSA9PiB0aGlzLmN1cnJlbnRUaW1lU2VsZWN0ZWQ9ZmFsc2UpXG4gICAgLm9uKFwibW91c2VvdmVyXCIsIChldmVudDogTW91c2VFdmVudCkgPT4gZXZlbnQucHJldmVudERlZmF1bHQoKSk7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgdGhlIHN0eWxlIChhcmVhLCBsaW5lIG9yIGJvdGgpIGFuZCB0aGUgaW50ZXJwb2xhdGlvbiAoc3RwZSBvciBsaW5lYXIpIG9mIGxpbmVzXG4gICAqIEBwYXJhbSB7RGF0YX0gZWxlbWVudCBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFxuICAgKi9cbiAgcHJpdmF0ZSBidWlsZFN0eWxlRGF0YShlbGVtZW50OkRhdGEsIGluZGV4Om51bWJlcik6IHZvaWR7XG4gICAgaWYoZWxlbWVudC5zdHlsZT09XCJhcmVhXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgaWYoZWxlbWVudC5pbnRlcnBvbGF0aW9uPT1cInN0ZXBcIil7XG4gICAgICAgIHRoaXMuYXJlYVtpbmRleF09ZDMuYXJlYSgpXG4gICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgIC55MCh0aGlzLnN2Z0hlaWdodClcbiAgICAgICAgLnkxKChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpXG4gICAgICAgIC5jdXJ2ZShkMy5jdXJ2ZVN0ZXBBZnRlcik7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5hcmVhW2luZGV4XT1kMy5hcmVhKClcbiAgICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgICAgLnkwKHRoaXMuc3ZnSGVpZ2h0KVxuICAgICAgICAueTEoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWShkWzFdKSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoZWxlbWVudC5zdHlsZT09XCJsaW5lXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgaWYoZWxlbWVudC5pbnRlcnBvbGF0aW9uPT1cInN0ZXBcIil7XG4gICAgICAgIHRoaXMubGluZVtpbmRleF09ZDMubGluZSgpXG4gICAgICAgIC54KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVgoZFswXSkpXG4gICAgICAgIC55KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpXG4gICAgICAgIC5jdXJ2ZShkMy5jdXJ2ZVN0ZXBBZnRlcik7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5saW5lW2luZGV4XT1kMy5saW5lKClcbiAgICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgICAgLnkoKGQ6IG51bWJlcltdKSA9PiB0aGlzLnNjYWxlWShkWzFdKSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoIXRoaXMuY29udHJvbENvbG9yKGVsZW1lbnQuY29sb3IpKXtcbiAgICAgIGNvbnNvbGUud2FybihcIkRhdGEgd2l0aCBcIiArIGVsZW1lbnQubGFiZWwgKyBcIiBsYWJlbCwgaGFzIGFuIHVudmFsaWQgY29sb3IgYXR0cmlidXRlIChcIiArIGVsZW1lbnQuY29sb3IgKyBcIikuIFJlcGxhY2Ugd2l0aCB0aGUgZGVmYXVsdCBjb2xvciAoYmxhY2spLlwiKTtcbiAgICAgIGVsZW1lbnQuY29sb3I9XCJibGFja1wiO1xuICAgIH0gXG4gIH1cblxuICAvKipcbiAgICogU2F2ZSBpbmZvcm1hdGlvbiBmb3Igem9vbS5cbiAgICovXG4gIHByaXZhdGUgYnVpbGRab29tKCk6IHZvaWR7XG4gICAgdGhpcy5taW5UaW1lID0gdGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ4TWluXCIpO1xuICAgIHRoaXMubWF4VGltZSA9IHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieE1heFwiKTtcbiAgICB0aGlzLmxlbmd0aFRpbWUgPSB0aGlzLm1heFRpbWUgLSB0aGlzLm1pblRpbWU7XG4gICAgdGhpcy5pZFpvb209MDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3IHRoZSB0b29sdGlwcydzIHN2Z1xuICAgKi9cbiAgcHJpdmF0ZSBkcmF3VG9vbFRpcHMoKTogdm9pZHsgLy9jcmVlciBsZSB0b29sdGlwc1xuICAgIHRoaXMudG9vbHRpcCA9IHRoaXMuc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXBcIilcbiAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgLy8gTGUgY2VyY2xlIGV4dMOpcmlldXIgYmxldSBjbGFpclxuICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwiI0NDRTVGNlwiKVxuICAgICAgICAuYXR0cihcInJcIiwgMTApO1xuICAgIC8vIExlIGNlcmNsZSBpbnTDqXJpZXVyIGJsZXUgZm9uY8OpXG4gICAgdGhpcy50b29sdGlwLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAuYXR0cihcImZpbGxcIiwgXCIjMzQ5OGRiXCIpXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwiI2ZmZlwiKVxuICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjEuNXB4XCIpXG4gICAgICAgIC5hdHRyKFwiclwiLCA0KTtcbiAgICAvLyBMZSB0b29sdGlwIGVuIGx1aS1tw6ptZSBhdmVjIHNhIHBvaW50ZSB2ZXJzIGxlIGJhc1xuICAgIC8vIElsIGZhdXQgbGUgZGltZW5zaW9ubmVyIGVuIGZvbmN0aW9uIGR1IGNvbnRlbnVcbiAgICBpZiAodGhpcy5tb2RlVG9vbFRpcHMgPT0gXCJub3JtYWxcIikge1xuICAgICAgdGhpcy50b29sdGlwLmFwcGVuZChcInBvbHlsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwicG9pbnRzXCIsIFwiMCwwIDAsNDAgNzUsNDAgIDgwLDQ1ICA4NSw0MCAgMTYwLDQwICAxNjAsMCAwLDBcIilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBcIiNmYWZhZmFcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsXCIjMzQ5OGRiXCIpXG4gICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIixcIjAuOVwiKVxuICAgICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIixcIjFcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTgwLC01MClcIik7XG4gICAgICB0aGlzLmRhdGFab29tLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgLy8gQ2V0IMOpbMOpbWVudCBjb250aWVuZHJhIHRvdXQgbm90cmUgdGV4dGVcbiAgICAgICAgbGV0IHRleHQgPSB0aGlzLnRvb2x0aXAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgIC5zdHlsZShcImZvbnQtc2l6ZVwiLCBcIjEzcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJmb250LWZhbWlseVwiLCBcIlNlZ29lIFVJXCIpXG4gICAgICAgICAgLnN0eWxlKFwiY29sb3JcIiwgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTgwLC00MilcIik7XG4gICAgICAgIC8vIEVsZW1lbnQgcG91ciBsYSBkYXRlIGF2ZWMgcG9zaXRpb25uZW1lbnQgc3DDqWNpZmlxdWVcbiAgICAgICAgdGV4dC5hcHBlbmQoXCJ0c3BhblwiKVxuICAgICAgICAgIC5hdHRyKFwiZHhcIiwgXCI3XCIpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjVcIilcbiAgICAgICAgICAuYXR0cihcImlkXCIsIFwidG9vbHRpcC1kYXRlMVwiKTtcbiAgICAgICAgdGV4dC5hcHBlbmQoXCJ0c3BhblwiKVxuICAgICAgICAgIC5hdHRyKFwiZHhcIiwgXCItOTBcIilcbiAgICAgICAgICAuYXR0cihcImR5XCIsIFwiMTVcIilcbiAgICAgICAgICAuYXR0cihcImlkXCIsIFwidG9vbHRpcC1kYXRlMlwiKTtcbiAgICAgIH0pO1xuICAgIH1lbHNlIHtcbiAgICAgIHRoaXMudG9vbHRpcC5hcHBlbmQoXCJwb2x5bGluZVwiKVxuICAgICAgICAuYXR0cihcInBvaW50c1wiLCBcIjAsOTUgLCAwLDU1ICwgNzUsNTUgLCA4MCw1MCAsIDg1LDU1ICwgMTYwLDU1ICwgMTYwLDk1IDAsOTVcIilcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBcIiNmYWZhZmFcIilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsXCIjMzQ5OGRiXCIpXG4gICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIixcIjAuOVwiKVxuICAgICAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIixcIjFcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTgwLC01MClcIik7XG4gICAgICB0aGlzLmRhdGFab29tLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgLy8gQ2V0IMOpbMOpbWVudCBjb250aWVuZHJhIHRvdXQgbm90cmUgdGV4dGVcbiAgICAgICAgbGV0IHRleHQgPSB0aGlzLnRvb2x0aXAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgIC5zdHlsZShcImZvbnQtc2l6ZVwiLCBcIjEzcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJmb250LWZhbWlseVwiLCBcIlNlZ29lIFVJXCIpXG4gICAgICAgICAgLnN0eWxlKFwiY29sb3JcIiwgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTgwLC0zMClcIik7XG4gICAgICAgIC8vIEVsZW1lbnQgcG91ciBsYSBkYXRlIGF2ZWMgcG9zaXRpb25uZW1lbnQgc3DDqWNpZmlxdWVcbiAgICAgICAgdGV4dC5hcHBlbmQoXCJ0c3BhblwiKVxuICAgICAgICAgIC5hdHRyKFwiZHhcIiwgXCI3XCIpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCA1MCApXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTFcIik7XG4gICAgICAgIHRleHQuYXBwZW5kKFwidHNwYW5cIilcbiAgICAgICAgICAuYXR0cihcImR4XCIsIFwiLTgwXCIpXG4gICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjIwXCIpXG4gICAgICAgICAgLmF0dHIoXCJpZFwiLCBcInRvb2x0aXAtZGF0ZTJcIik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHJhdyBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCBheGlzIGFuZCBzY2FsZVxuICAgKi9cbiAgcHJpdmF0ZSBkcmF3QXhpcygpOiB2b2lke1xuICAgIHRoaXMuc2NhbGVYLnJhbmdlKFswLCB0aGlzLnN2Z1dpZHRoXSk7XG4gICAgdGhpcy5zY2FsZVguZG9tYWluKFt0aGlzLm1pblRpbWUsdGhpcy5tYXhUaW1lXSk7XG4gICAgdGhpcy5zY2FsZVkgPSBkMy5zY2FsZUxpbmVhcigpO1xuICAgIHRoaXMuc2NhbGVZLnJhbmdlKFt0aGlzLnN2Z0hlaWdodCwgMF0pO1xuICAgIHRoaXMuc2NhbGVZLmRvbWFpbih0aGlzLmNvbnRyb2xEb21haW4oKSk7XG4gICAgLy8gQ29uZmlndXJlIHRoZSBYIEF4aXNcbiAgICB0aGlzLnN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwnICsgdGhpcy5zdmdIZWlnaHQgKyAnKScpXG4gICAgICAuYXR0cignY2xhc3MnLCAneEF4aXMnKVxuICAgICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh0aGlzLnNjYWxlWCkpO1xuICAgIC8vIENvbmZpZ3VyZSB0aGUgWSBBeGlzXG4gICAgaWYodGhpcy5kaXNjcmV0ZVZhbHVlKHRoaXMuZGF0YSkpe1xuICAgICAgdGhpcy5zdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd5QXhpcycpXG4gICAgICAuY2FsbChkMy5heGlzTGVmdCh0aGlzLnNjYWxlWSkudGlja3ModGhpcy5zY2FsZSh0aGlzLmRhdGEsXCJ5TWF4XCIpKSk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLnN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3lBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHRoaXMuc2NhbGVZKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERyYXcgbGluZXMgb24gdGhlIGxpbmUgY2hhcnRcbiAgICovXG4gIHByaXZhdGUgZHJhd0xpbmVBbmRQYXRoKCk6IHZvaWR7XG4gICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKFxuICAgICAgKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJhcmVhXCIgfHwgZWxlbWVudC5zdHlsZT09XCJib3RoXCIpe1xuICAgICAgICAgIHRoaXMuc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgLmRhdHVtKHRoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlcylcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnYXJlYScraW5kZXgpXG4gICAgICAgICAgLmF0dHIoJ2QnLCB0aGlzLmFyZWFbaW5kZXhdKVxuICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDAuMSlcbiAgICAgICAgICAuYXR0cignb3BhY2l0eScsIDAuMylcbiAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICcycHgnKVxuICAgICAgICB9XG4gICAgICAgIGlmKGVsZW1lbnQuc3R5bGU9PVwibGluZVwiIHx8IGVsZW1lbnQuc3R5bGU9PVwiYm90aFwiKXtcbiAgICAgICAgICB0aGlzLnN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAgIC5kYXR1bShlbGVtZW50LnZhbHVlcylcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbGluZScraW5kZXgpXG4gICAgICAgICAgLmF0dHIoJ2QnLCB0aGlzLmxpbmVbaW5kZXhdKVxuICAgICAgICAgIC5zdHlsZSgnZmlsbCcsICdub25lJylcbiAgICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnMnB4JylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBEcmF3IHRoZSB2ZXJ0aWNhbCBsaW5lIHdoaWNoIHJlcHJlc2VudHMgdGhlIGN1cnJlbnQgdGltZVxuICAgKi9cbiAgcHJpdmF0ZSBkcmF3TGluZUN1cnJlbnRUaW1lKCk6IHZvaWR7XG4gICAgaWYodGhpcy5kYXRhLmxlbmd0aCE9MCl7XG4gICAgICBpZih0aGlzLmN1cnJlbnRUaW1lPT0wKXtcbiAgICAgICAgdGhpcy5jdXJyZW50VGltZSA9IHRoaXMuc2NhbGUodGhpcy5kYXRhLFwieE1pblwiKTtcbiAgICAgIH1cbiAgICAgIGxldCB4Om51bWJlcj0wO1xuICAgICAgdGhpcy5zdmcuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmRhdHVtKFtbdGhpcy5jdXJyZW50VGltZSx0aGlzLmNvbnRyb2xEb21haW4oKVswXV0sW3RoaXMuY3VycmVudFRpbWUsdGhpcy5zdmdIZWlnaHRdXSlcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2N1cnJlbnRUaW1lTGluZScpXG4gICAgICAgIC5hdHRyKCdkJywgZDMubGluZSgpXG4gICAgICAgICAgLngoKGQ6IG51bWJlcltdKSA9PiB4PXRoaXMuc2NhbGVYKGRbMF0pKVxuICAgICAgICAgIC55KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpKVxuICAgICAgICAuc3R5bGUoJ2ZpbGwnLCAnbm9uZScpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgJ3JlZCcpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzNweCcpO1xuICAgICAgdGhpcy5zdmcuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnY3VycmVudFRpbWVTZWxlY3RvcicpXG4gICAgICAgIC5hdHRyKCdjeCcsIHgpXG4gICAgICAgIC5hdHRyKCdjeScsIC0xMylcbiAgICAgICAgLmF0dHIoJ3InLCA3KVxuICAgICAgICAuYXR0cignZmlsbCcsICdyZWQnKVxuICAgICAgICAub24oXCJtb3VzZWRvd25cIiwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudFRpbWVTZWxlY3RlZD10cnVlO1xuICAgICAgICAgIHRoaXMuaGlkZUluZm8oKTtcbiAgICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRHJhdyB0aGUgc2Nyb2xsYmFyIGFuZCBldmVudCBsaXN0ZW5lciBvbiBpdCAgXG4gICAqL1xuICBwcml2YXRlIGRyYXdTY3JvbGxiYXIoKTogdm9pZHtcbiAgICB0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS53aWR0aCA9IHRoaXMuc3ZnV2lkdGgrXCJweFwiO1xuICAgIHRoaXMuem9uZVNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLm1hcmdpbkxlZnQgPSB0aGlzLm1hcmdpbi5sZWZ0KyBcInB4XCI7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gXCIyMHB4XCI7XG4gICAgdGhpcy56b25lU2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJsaWdodGdyZXlcIjtcbiAgICB0aGlzLnpvbmVTY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5ib3JkZXJSYWRpdXMgPSBcIjEwcHhcIjtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLndpZHRoID0gdGhpcy5zdmdXaWR0aCtcInB4XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS5oZWlnaHQgPSBcIjIwcHhcIjtcbiAgICB0aGlzLnNjcm9sbGJhci5uYXRpdmVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiZ3JleVwiO1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCIxMHB4XCI7XG4gICAgdGhpcy5jb21wby5uYXRpdmVFbGVtZW50LnN0eWxlLndpZHRoID0gdGhpcy5zdmdXaWR0aCt0aGlzLm1hcmdpbi5sZWZ0K1wicHhcIjtcbiAgICB0aGlzLmNvbXBvLm5hdGl2ZUVsZW1lbnQuc3R5bGUucGFkZGluZyA9IFwiMTBweCAxMHB4IDEwcHggMTBweFwiO1xuICAgIHRoaXMucmVuZGVyZXIubGlzdGVuKHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQsICdtb3VzZWRvd24nLCAoZXZlbnQ6TW91c2VFdmVudCkgPT4gdGhpcy5hY3RpdmVTY3JvbGxiYXIoZXZlbnQpKTtcbiAgICB0aGlzLnJlbmRlcmVyLmxpc3Rlbih3aW5kb3csICdtb3VzZXVwJywgKCkgPT4gdGhpcy5kZXNhY3RpdmVTY3JvbGxiYXIoKSk7XG4gICAgdGhpcy5yZW5kZXJlci5saXN0ZW4od2luZG93LCdtb3VzZW1vdmUnLCAoZXZlbnQ6TW91c2VFdmVudCkgPT4gdGhpcy51cGRhdGVSYW5nZShldmVudCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhbGwgdGhlIGxpbmUgY2hhcnQgKGhvcml6b250YWwgYW5kIHZlcnRpY2FsIGF4aXMgYW5kIHNjYWxlLCBkYXRhLCBsaW5lcyBhbmQgcmFuZ2UpIG9uIGRhdGEgY2hhbmdlcy4gXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZUNoYXJ0KCk6IHZvaWR7XG4gICAgdGhpcy5kYXRhWm9vbSA9IFsuLi50aGlzLmRhdGFdO1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKFxuICAgICAgKGVsZW1lbnQsaW5kZXgpID0+IHtcbiAgICAgICAgdGhpcy5idWlsZFN0eWxlRGF0YShlbGVtZW50LGluZGV4KTtcbiAgICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJhcmVhXCIpIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmxpbmUnK2luZGV4KS5yZW1vdmUoKTtcbiAgICAgICAgaWYoZWxlbWVudC5zdHlsZT09XCJsaW5lXCIpIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmFyZWEnK2luZGV4KS5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy50aXRsZSA9ICdUaW1lbGluZSA6ICc7XG4gICAgICAgIGlmKGluZGV4PT10aGlzLmRhdGEubGVuZ3RoLTEpIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlK2VsZW1lbnQubGFiZWwrJy4nO1xuICAgICAgICBlbHNlIHRoaXMudGl0bGUgPSB0aGlzLnRpdGxlK2VsZW1lbnQubGFiZWwgKyAnLCAnO1xuICAgIH0pXG4gICAgdGhpcy5idWlsZFpvb20oKTtcbiAgICB0aGlzLnNjYWxlWC5kb21haW4oW3RoaXMubWluVGltZSx0aGlzLm1heFRpbWVdKTtcbiAgICB0aGlzLnNjYWxlWS5yYW5nZShbdGhpcy5zdmdIZWlnaHQsIDBdKTtcbiAgICB0aGlzLmNvbnRyb2xEb21haW4oKTtcbiAgICB0aGlzLnNjYWxlWS5kb21haW4odGhpcy5jb250cm9sRG9tYWluKCkpO1xuICAgIGlmKHRoaXMuZGlzY3JldGVWYWx1ZSh0aGlzLmRhdGEpKXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLnlBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHRoaXMuc2NhbGVZKS50aWNrcyh0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInlNYXhcIikpKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLnlBeGlzJylcbiAgICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHRoaXMuc2NhbGVZKSk7XG4gICAgfVxuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLnhBeGlzJykuY2FsbChkMy5heGlzQm90dG9tKHRoaXMuc2NhbGVYKSk7XG4gICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVMaW5lJykucmVtb3ZlKCk7XG4gICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVTZWxlY3RvcicpLnJlbW92ZSgpO1xuICAgIHRoaXMudXBkYXRlTGluZSgpO1xuICAgIHRoaXMuZHJhd0xpbmVDdXJyZW50VGltZSgpO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsYmFyKHRoaXMubWluVGltZSx0aGlzLm1heFRpbWUpO1xuICAgIHRoaXMudXBkYXRlVG9vbFRpcHMoKTtcbiAgICBmb3IobGV0IGluZGV4PXRoaXMuZGF0YVpvb20ubGVuZ3RoOyBpbmRleDx0aGlzLmxhc3REYXRhbGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmxpbmUnK2luZGV4KS5yZW1vdmUoKTtcbiAgICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmFyZWEnK2luZGV4KS5yZW1vdmUoKTtcbiAgICB9XG4gICAgdGhpcy5sYXN0RGF0YWxlbmd0aD10aGlzLmRhdGFab29tLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgaG9yaXpvbnRhbCBheGlzLCBjdXJyZW50IHRpbWUgbGluZSwgbGluZXMgYW5kIHNjcm9sbGJhclxuICAgKiBAcGFyYW0ge251bWJlcn0gbWluIG9mIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heCBvZiB0aGUgbmV3IHJhbmdlXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZVN2ZyhtaW46IG51bWJlciwgbWF4OiBudW1iZXIpe1xuICAgIHRoaXMuc2NhbGVYLmRvbWFpbihbbWluLG1heF0pO1xuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLnhBeGlzJykuY2FsbChkMy5heGlzQm90dG9tKHRoaXMuc2NhbGVYKSk7XG4gICAgdGhpcy51cGRhdGVMaW5lKCk7XG4gICAgdGhpcy51cGRhdGVDdXJyZW50VGltZSgpO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsYmFyKG1pbixtYXgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgZGlzcGxheSBvZiBsaW5lc1xuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVMaW5lKCk6IHZvaWR7XG4gICAgbGV0IGxpbmVVcGRhdGU7XG4gICAgbGV0IGFyZWFVcGRhdGU7XG4gICAgdGhpcy5kYXRhWm9vbS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICBpZihlbGVtZW50LnN0eWxlPT1cImFyZWFcIiB8fCBlbGVtZW50LnN0eWxlPT1cImJvdGhcIil7XG4gICAgICAgIGFyZWFVcGRhdGU9IHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmFyZWEnK2luZGV4KS5kYXRhKFt0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXNdKTtcbiAgICAgICAgYXJlYVVwZGF0ZVxuICAgICAgICAuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnYXJlYScraW5kZXgpXG4gICAgICAgIC5tZXJnZShhcmVhVXBkYXRlKVxuICAgICAgICAuYXR0cignZCcsIHRoaXMuYXJlYVtpbmRleF0pXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDAuMSlcbiAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwLjMpXG4gICAgICAgIC5zdHlsZSgnZmlsbCcsIGVsZW1lbnQuY29sb3IpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgZWxlbWVudC5jb2xvcilcbiAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAnMnB4Jyk7XG4gICAgICB9XG4gICAgICBpZihlbGVtZW50LnN0eWxlPT1cImxpbmVcIiB8fCBlbGVtZW50LnN0eWxlPT1cImJvdGhcIil7XG4gICAgICAgIGxpbmVVcGRhdGU9IHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmxpbmUnK2luZGV4KS5kYXRhKFt0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXNdKTtcbiAgICAgICAgbGluZVVwZGF0ZVxuICAgICAgICAuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGluZScraW5kZXgpXG4gICAgICAgIC5tZXJnZShsaW5lVXBkYXRlKVxuICAgICAgICAuYXR0cignZCcsIHRoaXMubGluZVtpbmRleF0pXG4gICAgICAgIC5zdHlsZSgnZmlsbCcsICdub25lJylcbiAgICAgICAgLnN0eWxlKCdzdHJva2UnLCBlbGVtZW50LmNvbG9yKVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsICcycHgnKVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcG9zaXRpb24gb2YgdGhlIGN1cnJlbnQgdGltZSBsaW5lXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZUN1cnJlbnRUaW1lKCk6IHZvaWR7XG4gICAgbGV0IGxpbmVVcGRhdGUgPSB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZUxpbmUnKS5kYXR1bShbW3RoaXMuY3VycmVudFRpbWUsdGhpcy5jb250cm9sRG9tYWluKClbMF1dLFt0aGlzLmN1cnJlbnRUaW1lLHRoaXMuc3ZnSGVpZ2h0XV0pO1xuICAgIGxldCB4Om51bWJlcj0wO1xuICAgIGxpbmVVcGRhdGUuZW50ZXIoKVxuICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2N1cnJlbnRUaW1lTGluZScpXG4gICAgLm1lcmdlKGxpbmVVcGRhdGUpXG4gICAgLmF0dHIoJ2QnLCBkMy5saW5lKClcbiAgICAgIC54KChkOiBudW1iZXJbXSkgPT4geD10aGlzLnNjYWxlWChkWzBdKSlcbiAgICAgIC55KChkOiBudW1iZXJbXSkgPT4gdGhpcy5zY2FsZVkoZFsxXSkpKVxuICAgIC5zdHlsZSgnZmlsbCcsICdub25lJylcbiAgICAuc3R5bGUoJ3N0cm9rZScsICdyZWQnKVxuICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgJzNweCcpO1xuICAgIGlmKHRoaXMuY3VycmVudFRpbWU+PXRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNaW5cIikmJnRoaXMuY3VycmVudFRpbWU8PXRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNYXhcIikpe1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVMaW5lJykuYXR0cignZGlzcGxheScsJ2Jsb2NrJyk7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZVNlbGVjdG9yJykuYXR0cignZGlzcGxheScsJ2Jsb2NrJyk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLnN2Zy5zZWxlY3RBbGwoJy5jdXJyZW50VGltZUxpbmUnKS5hdHRyKCdkaXNwbGF5Jywnbm9uZScpO1xuICAgICAgdGhpcy5zdmcuc2VsZWN0QWxsKCcuY3VycmVudFRpbWVTZWxlY3RvcicpLmF0dHIoJ2Rpc3BsYXknLCdub25lJyk7XG4gICAgfVxuICAgIHRoaXMuc3ZnLnNlbGVjdEFsbCgnLmN1cnJlbnRUaW1lU2VsZWN0b3InKS5hdHRyKCdjeCcseCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgc2Nyb2xsYmFyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtaW4gb2YgdGhlIG5ldyByYW5nZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4IG9mIHRoZSBuZXcgcmFuZ2VcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlU2Nyb2xsYmFyKG1pbjpudW1iZXIsIG1heDpudW1iZXIpOiB2b2lke1xuICAgIHRoaXMuc2Nyb2xsYmFyLm5hdGl2ZUVsZW1lbnQuc3R5bGUubWFyZ2luTGVmdD0gdGhpcy5zdmdXaWR0aCoobWluLXRoaXMubWluVGltZSkvKHRoaXMubGVuZ3RoVGltZSkgKyBcInB4XCI7XG4gICAgdGhpcy5zY3JvbGxiYXIubmF0aXZlRWxlbWVudC5zdHlsZS53aWR0aD0gdGhpcy5zdmdXaWR0aCoobWF4LW1pbikvKHRoaXMubGVuZ3RoVGltZSkgKyBcInB4XCI7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIHRoZSByYW5nZSwgY29udHJvbCBpdCwgdXBkYXRlIGRhdGFzLCB1cGRhdGUgdGhlIGxpbmVjaGFydCBhbmQgdGhlbiBlbWl0IHRoZSBuZXcgcmFuZ2UuXG4gICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgXG4gICAqL1xuICBwcml2YXRlIHVwZGF0ZVJhbmdlKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZHtcbiAgICBpZih0aGlzLnNjcm9sbGJhclNlbGVjdGVkKXtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBsZXQgbGVuZ3RoTG9jYWxUaW1lID0gdGhpcy5yYW5nZVsxXS10aGlzLnJhbmdlWzBdO1xuICAgICAgbGV0IGxhc3RNaW5Mb2NhbFRpbWUgPSB0aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpO1xuICAgICAgbGV0IHBvcyA9IGV2ZW50LmNsaWVudFgtdGhpcy5tYXJnaW4ubGVmdDtcbiAgICAgIGlmKHRoaXMubGFzdFBvcz09MCl7XG4gICAgICAgIHRoaXMubGFzdFBvcz0gcG9zO1xuICAgICAgfVxuICAgICAgbGV0IG1pbkxvY2FsVGltZSA9IChwb3MtdGhpcy5sYXN0UG9zKSp0aGlzLmxlbmd0aFRpbWUvdGhpcy5zdmdXaWR0aCArIGxhc3RNaW5Mb2NhbFRpbWU7XG4gICAgICB0aGlzLnJhbmdlID0gdGhpcy5jb250cm9sUmFuZ2UobWluTG9jYWxUaW1lLGxlbmd0aExvY2FsVGltZSk7XG4gICAgICB0aGlzLnVwZGF0ZURhdGFab29tKHRoaXMucmFuZ2VbMF0sdGhpcy5yYW5nZVsxXSk7XG4gICAgICB0aGlzLnVwZGF0ZVN2Zyh0aGlzLnJhbmdlWzBdLHRoaXMucmFuZ2VbMV0pO1xuICAgICAgdGhpcy5yYW5nZUNoYW5nZS5lbWl0KHRoaXMucmFuZ2UpO1xuICAgICAgdGhpcy5sYXN0UG9zPXBvcztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIHRoaXMuZGF0YVpvb20gYXQgcmFuZ2UgY2hhbmdlc1xuICAgKiBAcGFyYW0ge251bWJlcn0gbWluIG9mIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heCBvZiB0aGUgbmV3IHJhbmdlIFxuICAgKi9cbiAgcHJpdmF0ZSB1cGRhdGVEYXRhWm9vbShtaW46bnVtYmVyLG1heDpudW1iZXIpOiB2b2lke1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKChlbGVtZW50LGluZGV4KSA9PiB7XG4gICAgICB0aGlzLmRhdGFab29tW2luZGV4XT17XG4gICAgICAgIGxhYmVsOiBlbGVtZW50LmxhYmVsLFxuICAgICAgICB2YWx1ZXM6IGVsZW1lbnQudmFsdWVzLmZpbHRlcigoZWxlbWVudDogbnVtYmVyW10pID0+IG1pbiA8PSBlbGVtZW50WzBdICYmIGVsZW1lbnRbMF0gPD0gIG1heCksXG4gICAgICAgIGNvbG9yOiBlbGVtZW50LmNvbG9yLFxuICAgICAgICBzdHlsZTogZWxlbWVudC5zdHlsZSxcbiAgICAgICAgaW50ZXJwb2xhdGlvbjogZWxlbWVudC5pbnRlcnBvbGF0aW9uXG4gICAgfX0pIFxuICAgIGxldCB0aW1lOiBudW1iZXJbXTtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaCgoZWxlbWVudCxpbmRleCkgPT4ge1xuICAgICAgdGltZT1bXTtcbiAgICAgIGVsZW1lbnQudmFsdWVzLmZvckVhY2goKGVsZW1lbnQgPT4gdGltZS5wdXNoKGVsZW1lbnRbMF0pKSk7XG4gICAgICBsZXQgaSA9IGQzLmJpc2VjdExlZnQodGltZSwgbWluKS0xO1xuICAgICAgaWYoaT49MCYmaTx0aGlzLmRhdGFbaW5kZXhdLnZhbHVlcy5sZW5ndGgpe1xuICAgICAgICB0aGlzLmRhdGFab29tW2luZGV4XS52YWx1ZXMudW5zaGlmdChbbWluLCh0aGlzLmRhdGFbaW5kZXhdLnZhbHVlc1tpXVsxXSldKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlcy5wdXNoKFttYXgsdGhpcy5kYXRhWm9vbVtpbmRleF0udmFsdWVzW3RoaXMuZGF0YVpvb21baW5kZXhdLnZhbHVlcy5sZW5ndGgtMV1bMV1dKTtcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbmQgYnVpbGQgYSBuZXcgdG9vbHRpcHNcbiAgICovXG4gIHByaXZhdGUgdXBkYXRlVG9vbFRpcHMoKTogdm9pZHtcbiAgICB0aGlzLnRvb2x0aXAucmVtb3ZlKCk7XG4gICAgdGhpcy5kcmF3VG9vbFRpcHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBY3RpdmUgbW92ZW1lbnQgb2Ygc2Nyb2xsYmFyIG9uIG1vdXNlZG93biBvbiBpdFxuICAgKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFxuICAgKi8gXG4gIHByaXZhdGUgYWN0aXZlU2Nyb2xsYmFyKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZHtcbiAgICBpZih0aGlzLmlkWm9vbSE9MCl7XG4gICAgICB0aGlzLnNjcm9sbGJhclNlbGVjdGVkPXRydWU7XG4gICAgICB0aGlzLmxhc3RQb3M9ZXZlbnQuY2xpZW50WC10aGlzLm1hcmdpbi5sZWZ0O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXNhY3RpdmUgbW92ZW1lbnQgb2Ygc2Nyb2xsYmFyIG9uIG1vdXNldXAgb3IgbW91c2VsZWF2ZSBvbiBpdFxuICAgKi9cbiAgcHJpdmF0ZSBkZXNhY3RpdmVTY3JvbGxiYXIoKTogdm9pZHtcbiAgICB0aGlzLnNjcm9sbGJhclNlbGVjdGVkPWZhbHNlO1xuICAgIHRoaXMubGFzdFBvcz0wO1xuICB9XG5cbiAgLyoqXG4gICAqIFNob3cgdGhlIHRvb2x0aXBzIG9uIHRoZSBtb3ZlbWVudCBvZiB0aGUgbW91c2VcbiAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBcbiAgICovXG4gIHByaXZhdGUgc2hvd0luZm8oZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lke1xuICAgIGlmICh0aGlzLmRhdGFab29tWzBdICE9IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGFab29tLmxlbmd0aCA8Mikge1xuICAgICAgdmFyIGQ6IG51bWJlcj0wO1xuICAgICAgdmFyIHQ6IG51bWJlcj0wO1xuICAgICAgbGV0IHRpbWU6IG51bWJlcltdID0gW107XG4gICAgICB0aGlzLmRhdGFab29tWzBdLnZhbHVlcy5mb3JFYWNoKChlbGVtZW50KSA9PiB0aW1lLnB1c2goZWxlbWVudFswXSkpO1xuICAgICAgbGV0IHgwID0gdGhpcy5zY2FsZVguaW52ZXJ0KGV2ZW50LmNsaWVudFggLSB0aGlzLm1hcmdpbi5sZWZ0KS5nZXRUaW1lKCk7XG4gICAgICBsZXQgeCA9IGQzLmJpc2VjdFJpZ2h0KHRpbWUsIHgwKTtcbiAgICAgIGlmKHg+dGhpcy5kYXRhWm9vbVswXS52YWx1ZXMubGVuZ3RoLTEpeD10aGlzLmRhdGFab29tWzBdLnZhbHVlcy5sZW5ndGgtMTtcbiAgICAgIGVsc2UgaWYgKHggPCAwKSB4ID0gMDtcbiAgICAgICAgZCAgPSB0aGlzLmRhdGFab29tWzBdLnZhbHVlc1t4XVsxXTtcbiAgICAgICAgdCA9IHRoaXMuZGF0YVpvb21bMF0udmFsdWVzW3hdWzBdO1xuICAgICAgbGV0IGRhdGUgPSBuZXcgRGF0ZSh0KS50b0xvY2FsZURhdGVTdHJpbmcoXCJmclwiLCB7IHllYXI6ICdudW1lcmljJywgbW9udGg6ICdsb25nJywgZGF5OiAnbnVtZXJpYycsIGhvdXI6ICdudW1lcmljJywgbWludXRlOiAnbnVtZXJpYycsIHNlY29uZDogJ251bWVyaWMnIH0pO1xuICAgICAgZDMuc2VsZWN0QWxsKCcjdG9vbHRpcC1kYXRlMScpXG4gICAgICAgIC50ZXh0KGRhdGUpO1xuICAgICAgZDMuc2VsZWN0QWxsKCcjdG9vbHRpcC1kYXRlMicpXG4gICAgICAgIC50ZXh0KHRoaXMucm91bmREZWNpbWFsKGQsIDIpKTtcbiAgICAgIHRoaXMudG9vbHRpcC5zdHlsZShcImRpc3BsYXlcIixcImJsb2NrXCIpO1xuICAgICAgdGhpcy50b29sdGlwLnN0eWxlKFwib3BhY2l0eVwiLCAxMDApO1xuICAgICAgdGhpcy50b29sdGlwLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB0aGlzLnNjYWxlWCh0KSArIFwiLFwiICsgdGhpcy5zY2FsZVkoZCkgKyBcIilcIik7XG4gICAgICBpZiAodGhpcy5zY2FsZVkoZCkgPD0gNDAgKiB0aGlzLmRhdGFab29tLmxlbmd0aCkge1xuICAgICAgICBpZiAodGhpcy5tb2RlVG9vbFRpcHMgIT0gXCJpbnZlcnNlXCIpIHtcbiAgICAgICAgICB0aGlzLm1vZGVUb29sVGlwcyA9IFwiaW52ZXJzZVwiO1xuICAgICAgICAgIHRoaXMudXBkYXRlVG9vbFRpcHMoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMubW9kZVRvb2xUaXBzICE9IFwibm9ybWFsXCIpIHtcbiAgICAgICAgICB0aGlzLm1vZGVUb29sVGlwcyA9IFwibm9ybWFsXCI7XG4gICAgICAgICAgdGhpcy51cGRhdGVUb29sVGlwcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhpZGUgdGhlIHRvb2x0aXBzIHdoZW4gdGhlIG1vdXNlIGxlYXZlIHRoZSBzdmcgXG4gICAqLyAgIFxuICBwcml2YXRlIGhpZGVJbmZvKCk6IHZvaWR7XG4gICAgdGhpcy50b29sdGlwLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSByYW5nZSAocmVkdWNlIG9yIGluY3JlYXNlKSBvZiB0aGUgbGluZWNoYXJ0IG9uIHNjcm9sbCBcbiAgICogQHBhcmFtIHtXaGVlbEV2ZW50fSBldmVudCBcbiAgICovXG4gIHByaXZhdGUgYWN0aXZlWm9vbShldmVudDogV2hlZWxFdmVudCk6IHZvaWR7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBsZXQgbGFzdExlbmd0aExvY2FsVGltZSA9IHRoaXMubGVuZ3RoVGltZSAvIE1hdGgucG93KDErdGhpcy5zcGVlZFpvb20sdGhpcy5pZFpvb20pO1xuICAgIGxldCBsYXN0TWluTG9jYWxUaW1lID0gdGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1pblwiKTtcbiAgICBpZigoZXZlbnQuZGVsdGFZPjAmJnRoaXMuaWRab29tPjApfHxldmVudC5kZWx0YVk8MCl7XG4gICAgICBpZihldmVudC5kZWx0YVk+MCYmdGhpcy5pZFpvb20+MCl7XG4gICAgICAgIHRoaXMuaWRab29tLS07XG4gICAgICB9ZWxzZSBpZihldmVudC5kZWx0YVk8MCl7XG4gICAgICAgIHRoaXMuaWRab29tKys7IFxuICAgICAgfVxuICAgICAgbGV0IHBvcyA9IHRoaXMuc2NhbGVYLmludmVydChldmVudC5jbGllbnRYLXRoaXMubWFyZ2luLmxlZnQpLmdldFRpbWUoKTtcbiAgICAgIGxldCBsZW5ndGhMb2NhbFRpbWUgPSB0aGlzLmxlbmd0aFRpbWUgLyBNYXRoLnBvdygxK3RoaXMuc3BlZWRab29tLHRoaXMuaWRab29tKTtcbiAgICAgIGlmKGxlbmd0aExvY2FsVGltZT4yMDApe1xuICAgICAgICBsZXQgbWluTG9jYWxUaW1lID0gKGxhc3RNaW5Mb2NhbFRpbWUtcG9zKSoobGVuZ3RoTG9jYWxUaW1lL2xhc3RMZW5ndGhMb2NhbFRpbWUpICsgcG9zO1xuICAgICAgICB0aGlzLnJhbmdlID0gdGhpcy5jb250cm9sUmFuZ2UobWluTG9jYWxUaW1lLGxlbmd0aExvY2FsVGltZSk7XG4gICAgICAgIHRoaXMudXBkYXRlRGF0YVpvb20odGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdmcodGhpcy5yYW5nZVswXSx0aGlzLnJhbmdlWzFdKTtcbiAgICAgICAgdGhpcy5yYW5nZUNoYW5nZS5lbWl0KHRoaXMucmFuZ2UpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuaWRab29tLS07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgdmFsdWUgb2YgY3VycmVudCB0aW1lIG9uIHRoZSBtb3ZlbWVudCBvZiB0aGUgbW91c2VcbiAgICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBcbiAgICovXG4gIHByaXZhdGUgbW92ZUN1cnJlbnRUaW1lKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGxldCBwb3MgPSB0aGlzLnNjYWxlWC5pbnZlcnQoZXZlbnQuY2xpZW50WC10aGlzLm1hcmdpbi5sZWZ0KS5nZXRUaW1lKCk7XG4gICAgaWYocG9zPHRoaXMuc2NhbGUodGhpcy5kYXRhWm9vbSxcInhNaW5cIikpe1xuICAgICAgdGhpcy5jdXJyZW50VGltZT10aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWluXCIpO1xuICAgIH1lbHNlIGlmKHBvcz50aGlzLnNjYWxlKHRoaXMuZGF0YVpvb20sXCJ4TWF4XCIpKXtcbiAgICAgIHRoaXMuY3VycmVudFRpbWU9dGhpcy5zY2FsZSh0aGlzLmRhdGFab29tLFwieE1heFwiKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuY3VycmVudFRpbWU9cG9zO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUN1cnJlbnRUaW1lKCk7XG4gICAgdGhpcy5jdXJyZW50VGltZUNoYW5nZS5lbWl0KHRoaXMuY3VycmVudFRpbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnRyb2wgdGhlIHJhbmdlIGJhc2VkIG9uIGRhdGEncyB0aW1lc3RhbXAgYW5kIHRoZSBuZXcgcmFuZ2VcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1pbiBvZiB0aGUgbmV3IHJhbmdlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGggb2YgdGhlIG5ldyByYW5nZVxuICAgKiBAcmV0dXJucyBhIGFkanVzdGVkIHJhbmdlIGJhc2VkIG9uIGRhdGEncyB0aW1lc3RhbXBcbiAgICovXG4gIHByaXZhdGUgY29udHJvbFJhbmdlKG1pbjpudW1iZXIsIGxlbmd0aDpudW1iZXIpIDogW251bWJlcixudW1iZXJde1xuICAgIGlmKHRoaXMubWluVGltZT5taW4pIG1pbj10aGlzLm1pblRpbWU7XG4gICAgbGV0IG1heCA9IG1pbiArIGxlbmd0aDtcbiAgICBpZih0aGlzLm1heFRpbWU8bWF4KXtcbiAgICAgIG1heD10aGlzLm1heFRpbWU7XG4gICAgICBtaW49bWF4IC0gbGVuZ3RoO1xuICAgIH1cbiAgICBpZih0aGlzLm1pblRpbWU+bWluKSBtaW49dGhpcy5taW5UaW1lO1xuICAgIHJldHVybiBbbWluLG1heF07XG4gIH1cblxuICAvKipcbiAgICogQ29udHJvbCB0aGUgZG9tYWluIGJhc2VkIG9uIGRhdGEncyB2YWx1ZSB0eXBlIGFuZCB0aGUgaW5wdXQgZG9tYWluXG4gICAqIEByZXR1cm5zIGEgbmV3IGRvbWFpbiBhdXRvLXNjYWxlZCBpZiB0aGUgaW5wdXQgZG9tYWluIGlzIGVxdWFsIHRvIFswLDBdIG9yIHRoZSBkYXRhJ3MgdmFsdWUgYXJlIHBvc2l0aXZlIGludGVnZXJzLCBlbHNlIHJldHVybiB0aGUgaW5wdXQgZG9tYWluIFxuICAgKi9cbiAgcHJpdmF0ZSBjb250cm9sRG9tYWluKCk6W251bWJlcixudW1iZXJde1xuICAgIGlmKCh0aGlzLmRvbWFpblswXT09MCYmdGhpcy5kb21haW5bMV09PTApfHx0aGlzLmRpc2NyZXRlVmFsdWUodGhpcy5kYXRhKSl7XG4gICAgICByZXR1cm4gW3RoaXMuc2NhbGUodGhpcy5kYXRhLFwieU1pblwiKSx0aGlzLnNjYWxlKHRoaXMuZGF0YSxcInlNYXhcIildO1xuICAgIH1lbHNle1xuICAgICAgcmV0dXJuIHRoaXMuZG9tYWluO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb250cm9sIHRoZSBjb2xvciBiYXNlZCBvbiBjc3MtY29sb3JzLW5hbWUgYW5kIGhleC1jb2xvci1jb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciBcbiAgICogQHJldHVybnMgZmFsc2UgaWYgdGhlIHBhcmFtIGNvbG9yIGlzbid0IGEgY3NzLWNvbG9ycy1uYW1lIG9yIGEgdmFsaWQgaGV4LWNvbG9yLWNvZGVcbiAgICovXG4gIHByaXZhdGUgY29udHJvbENvbG9yKGNvbG9yOiBzdHJpbmcpOmJvb2xlYW57XG4gICAgbGV0IHMgPSBuZXcgT3B0aW9uKCkuc3R5bGU7XG4gICAgcy5jb2xvciA9IGNvbG9yO1xuICAgIHJldHVybiBzLmNvbG9yIT1cIlwiO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udHJvbCB0aGUgc3BlZWRab29tIGlmIGl0IGlzbid0IGJldHdlZW4gMCBhbmQgMS5cbiAgICovXG4gIHByaXZhdGUgY29udHJvbFNwZWVkWm9vbSgpOiB2b2lke1xuICAgIGlmKHRoaXMuc3BlZWRab29tPD0wKXtcbiAgICAgIHRoaXMuc3BlZWRab29tPTAuMTtcbiAgICB9ZWxzZSBpZih0aGlzLnNwZWVkWm9vbT4xKXtcbiAgICAgIHRoaXMuc3BlZWRab29tPTE7XG4gICAgfVxuICB9XG5cbiAgLyoqIFxuICAgKiBEZXRlcm1pbmUgdGhlIG1pbmltdW0gb3IgbWF4aW11bSBvZiB0aGUgaG9yaXpvbnRhbCBvciB2ZXJ0aWNhbCBheGlzIGluIGRhdGFcbiAgICogQHBhcmFtIHtEYXRhW119IGRhdGEgQXJyYXkgb2YgRGF0YVxuICAgKiBAcGFyYW0ge1wieE1pblwiIHwgXCJ4TWF4XCIgfCBcInlNaW5cIiB8IFwieU1heFwifSBzIHByZWNpc2Ugd2loY2ggc2NhbGUgd2Ugd2FudFxuICAgKiBAcmV0dXJucyB0aGUgdmFsdWUgdGhhdCBtYXRjaGVzIHdpdGggdGhlIHBhcmFtZXRlciBzIGluIGRhdGFcbiAgICovXG4gIHByaXZhdGUgc2NhbGUoZGF0YTogRGF0YVtdLCBzOiBcInhNaW5cIiB8IFwieE1heFwiIHwgXCJ5TWluXCIgfCBcInlNYXhcIik6IG51bWJlciB7XG4gICAgbGV0IHJlczogbnVtYmVyID0gMDtcbiAgICBkYXRhLmZvckVhY2goXG4gICAgICAoZWxlbWVudHMsaW5kZXgpID0+IGVsZW1lbnRzLnZhbHVlcy5mb3JFYWNoXG4gICAgICAoKGVsZW1lbnQsaSkgPT4ge1xuICAgICAgICBpZigocz09XCJ5TWluXCImJigoaT09MCYmaW5kZXg9PTApfHxlbGVtZW50WzFdPHJlcykpfHwocz09XCJ5TWF4XCImJigoaT09MCYmaW5kZXg9PTApfHxlbGVtZW50WzFdPnJlcykpKSByZXM9ZWxlbWVudFsxXTtcbiAgICAgICAgZWxzZSBpZigocz09XCJ4TWluXCImJigoaT09MCYmaW5kZXg9PTApfHxlbGVtZW50WzBdPHJlcykpfHwocz09XCJ4TWF4XCImJigoaT09MCYmaW5kZXg9PTApfHxlbGVtZW50WzBdPnJlcykpKSByZXM9ZWxlbWVudFswXTtcbiAgICAgIH0pXG4gICAgKVxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICAvKiogXG4gICpDaGVjayB0eXBlIG9mIGRhdGEgKHBvc2l0aXZlIGludGVnZXIgb3IgZmxvYXQpXG4gICpAcGFyYW0ge0RhdGFbXX0gZGF0YSBBcnJheSBvZiBEYXRhXG4gICpAcmV0dXJucyBmYWxzZSBpZiB0aGVyZSBpcyBhdCBsZWFzdCBvbmUgdmFsdWUgaW4gZGF0YSB0aGF0J3Mgbm90IGEgcG9zaXRpdmUgaW50ZWdlclxuICAqL1xuICBwcml2YXRlIGRpc2NyZXRlVmFsdWUoZGF0YTogRGF0YVtdKTogYm9vbGVhbntcbiAgICBmb3IobGV0IGk6bnVtYmVyPTA7aTxkYXRhLmxlbmd0aDtpKyspe1xuICAgICAgZm9yKGxldCBqOm51bWJlcj0wO2o8ZGF0YVtpXS52YWx1ZXMubGVuZ3RoO2orKyl7XG4gICAgICAgIGlmKGRhdGFbaV0udmFsdWVzW2pdWzFdIT1NYXRoLnJvdW5kKGRhdGFbaV0udmFsdWVzW2pdWzFdKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSb3VuZCBhIG51bWJlciB3aXRoIGEgcHJlY2lzaW9uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBudW0gXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gXG4gICAqIEByZXR1cm5zIGEgbnVtIHdpdGggYSBudW1iZXIgb2YgZGVjaW1hbCAocHJlY2lzaW9uKVxuICAgKi9cbiAgcHJpdmF0ZSByb3VuZERlY2ltYWwobnVtIDogbnVtYmVyLCBwcmVjaXNpb246bnVtYmVyKTogbnVtYmVye1xuICAgIGxldCB0bXA6IG51bWJlciA9IE1hdGgucG93KDEwLCBwcmVjaXNpb24pO1xuICAgIHJldHVybiBNYXRoLnJvdW5kKCBudW0qdG1wICkvdG1wO1xuICB9XG59XG4iXX0=