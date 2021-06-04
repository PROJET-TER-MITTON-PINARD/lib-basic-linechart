import { Injectable } from '@angular/core';
import { str } from '../data';
import * as i0 from "@angular/core";
export class DataService {
    constructor() {
        this.str = str;
        this.dataExample1 = [];
        this.dataExample2 = [];
        this.dataExample3 = [];
        this.dataExample4 = [];
        this.dataExample5 = [];
        this.dataExample6 = [];
        this.dataExample7 = [];
        this.generateExample();
    }
    parse(str, sensorId, f) {
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
    parseBool(s) {
        if (s == 'ON')
            return 1;
        else if (s == 'OFF')
            return 0;
        else
            return -1;
    }
    generateData(label, color, style, interpolation, f) {
        let d = this.parse(this.str, label, f);
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
    generateExample() {
        let d2 = this.parse(this.str, "PC5", this.parseBool);
        let v2 = [];
        d2.forEach(element => v2.push([element.timestamp, element.value]));
        let x = 0;
        v2.forEach(element => {
            element[1] = x;
            x = this.getRandomInt(x);
        });
        let da2 = {
            label: "PC5",
            values: v2,
            color: "purple",
            style: "line",
            interpolation: "linear"
        };
        this.dataExample2.push(this.generateData("PC6", "#124568", "both", "step", this.parseBool));
        this.dataExample1.push(da2);
        this.dataExample4.push(this.generateData("Temperature_Salon", "purple", "line", "linear", parseFloat));
        this.dataExample3.push(this.generateData("Presence_Salon", "pink", "line", "step", this.parseBool));
        this.dataExample3.push(this.generateData("PC6", "#124568", "both", "step", this.parseBool));
        this.dataExample5.push(this.generateData("Temperature_Cuisine", "gold", "line", "step", parseFloat));
        this.dataExample6.push(this.generateData("Presence_Cuisine", "purple", "both", "step", this.parseBool));
        this.dataExample7.push(this.generateData("Presence_SDB", "black", "area", "step", this.parseBool));
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzaWMtbGluZWNoYXJ0LnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9iYXNpYy1saW5lY2hhcnQvc3JjL2xpYi9iYXNpYy1saW5lY2hhcnQuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTNDLE9BQU8sRUFBQyxHQUFHLEVBQUMsTUFBTSxTQUFTLENBQUM7O0FBYTVCLE1BQU0sT0FBTyxXQUFXO0lBWXRCO1FBVlEsUUFBRyxHQUFXLEdBQUcsQ0FBQztRQUVuQixpQkFBWSxHQUFXLEVBQUUsQ0FBQztRQUMxQixpQkFBWSxHQUFXLEVBQUUsQ0FBQztRQUMxQixpQkFBWSxHQUFXLEVBQUUsQ0FBQztRQUMxQixpQkFBWSxHQUFXLEVBQUUsQ0FBQztRQUMxQixpQkFBWSxHQUFXLEVBQUUsQ0FBQztRQUMxQixpQkFBWSxHQUFXLEVBQUUsQ0FBQztRQUMxQixpQkFBWSxHQUFXLEVBQUUsQ0FBQztRQUcvQixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVPLEtBQUssQ0FBSSxHQUFXLEVBQUUsUUFBZ0IsRUFBRSxDQUFtQjtRQUVqRSxNQUFNLENBQUMsR0FBa0IsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUcsRUFBRSxDQUFDO2FBRXhFLEdBQUcsQ0FBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxD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QUUsQ0FBQyxFQUFDO2dCQUNULE9BQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQzthQUNaO2lCQUFJO2dCQUNILE9BQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQzthQUNaO1NBQ0Y7SUFDSCxDQUFDOzt3R0FqR1UsV0FBVzs0R0FBWCxXQUFXLGNBSFYsTUFBTTsyRkFHUCxXQUFXO2tCQUp2QixVQUFVO21CQUFDO29CQUNWLFVBQVUsRUFBRSxNQUFNO2lCQUNuQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IERhdGEgfSBmcm9tICcuL2Jhc2ljLWxpbmVjaGFydC5jb21wb25lbnQnO1xuaW1wb3J0IHtzdHJ9IGZyb20gJy4uL2RhdGEnO1xuXG5cbmludGVyZmFjZSBEQVRBPFQ+e1xuICB0aW1lc3RhbXA6IG51bWJlcjtcbiAgdmFsdWU6IFQ7XG4gIHNlbnNvcklkOiBzdHJpbmc7XG59XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuXG5leHBvcnQgY2xhc3MgRGF0YVNlcnZpY2Uge1xuXG4gIHByaXZhdGUgc3RyOiBzdHJpbmcgPSBzdHI7XG5cbiAgcHVibGljIGRhdGFFeGFtcGxlMTogRGF0YVtdID0gW107IFxuICBwdWJsaWMgZGF0YUV4YW1wbGUyOiBEYXRhW10gPSBbXTtcbiAgcHVibGljIGRhdGFFeGFtcGxlMzogRGF0YVtdID0gW107XG4gIHB1YmxpYyBkYXRhRXhhbXBsZTQ6IERhdGFbXSA9IFtdO1xuICBwdWJsaWMgZGF0YUV4YW1wbGU1OiBEYXRhW10gPSBbXTtcbiAgcHVibGljIGRhdGFFeGFtcGxlNjogRGF0YVtdID0gW107XG4gIHB1YmxpYyBkYXRhRXhhbXBsZTc6IERhdGFbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZ2VuZXJhdGVFeGFtcGxlKCk7XG4gIH1cblxuICBwcml2YXRlIHBhcnNlPFQ+KHN0cjogc3RyaW5nLCBzZW5zb3JJZDogc3RyaW5nLCBmOiAoczogc3RyaW5nKSA9PiBUKTogREFUQTxUPltdIHtcblxuICAgIGNvbnN0IEw6IERBVEEgPCBUID4gW10gPSBzdHIudHJpbSgpLnNwbGl0KFwiXFxuXCIpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIocyA9PiBzIT09XCJcIilcblxuICAgICAgICAgICAgICAgICAubWFwKCBzID0+IHMuc3BsaXQoXCI7XCIpLm1hcCggcyA9PiBzLnNsaWNlKDEsIC0xKSApIClcblxuICAgICAgICAgICAgICAgICAuZmlsdGVyKCB0YWIgPT4gdGFiWzFdID09PSBzZW5zb3JJZCApXG5cbiAgICAgICAgICAgICAgICAgLm1hcCggKFt0LCBpZCwgdl0pID0+ICh7XG5cbiAgICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogKG5ldyBEYXRlKCh0LnJlcGxhY2UoXCIsXCIsIFwiLlwiKSkpLmdldFRpbWUoKSksXG5cbiAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmKHYpLFxuXG4gICAgICAgICAgICAgICAgICAgICBzZW5zb3JJZDogaWRcblxuICAgICAgICAgICAgICAgICB9KSk7XG4gICAgcmV0dXJuIEw7XG5cbiAgfVxuICBcbiAgcHVibGljIHBhcnNlQm9vbChzOiBzdHJpbmcpOm51bWJlciB7XG4gICAgaWYocz09J09OJykgcmV0dXJuIDE7XG4gICAgZWxzZSBpZiAocz09J09GRicpIHJldHVybiAwO1xuICAgIGVsc2UgcmV0dXJuIC0xO1xuICB9XG5cbiAgcHVibGljIGdlbmVyYXRlRGF0YShsYWJlbDpzdHJpbmcsIGNvbG9yOnN0cmluZywgc3R5bGU6IFwiYm90aFwifFwibGluZVwifFwiYXJlYVwiLGludGVycG9sYXRpb246IFwic3RlcFwifFwibGluZWFyXCIsIGY6IChzOnN0cmluZyk9Pm51bWJlcik6RGF0YXtcbiAgICBsZXQgZDogREFUQTxudW1iZXI+W10gPSB0aGlzLnBhcnNlPG51bWJlcj4odGhpcy5zdHIsbGFiZWwsIGYpO1xuICAgIGxldCB2OiBbbnVtYmVyLG51bWJlcl1bXSA9IFtdO1xuICAgIGQuZm9yRWFjaChlbGVtZW50ID0+di5wdXNoKFtlbGVtZW50LnRpbWVzdGFtcCxlbGVtZW50LnZhbHVlXSkpO1xuICAgIGxldCBkYTogRGF0YSA9IHtcbiAgICAgIGxhYmVsOiBsYWJlbCxcbiAgICAgIHZhbHVlczogdixcbiAgICAgIGNvbG9yOiBjb2xvcixcbiAgICAgIHN0eWxlOiBzdHlsZSxcbiAgICAgIGludGVycG9sYXRpb246IGludGVycG9sYXRpb25cbiAgICB9XG4gICAgcmV0dXJuIGRhO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUV4YW1wbGUoKXtcbiAgICBsZXQgZDI6IERBVEE8bnVtYmVyPltdID0gdGhpcy5wYXJzZTxudW1iZXI+KHRoaXMuc3RyLFwiUEM1XCIsIHRoaXMucGFyc2VCb29sKTtcbiAgICBsZXQgdjI6IFtudW1iZXIsbnVtYmVyXVtdID0gW107XG4gICAgZDIuZm9yRWFjaChlbGVtZW50ID0+djIucHVzaChbZWxlbWVudC50aW1lc3RhbXAsZWxlbWVudC52YWx1ZV0pKTtcbiAgICBsZXQgeDpudW1iZXIgPSAwO1xuICAgIHYyLmZvckVhY2goZWxlbWVudD0+IHtcbiAgICAgIGVsZW1lbnRbMV09eDtcbiAgICAgIHg9dGhpcy5nZXRSYW5kb21JbnQoeCk7XG4gICAgfVxuICAgICAgKTtcbiAgICBsZXQgZGEyOiBEYXRhID0ge1xuICAgICAgbGFiZWw6IFwiUEM1XCIsXG4gICAgICB2YWx1ZXM6IHYyLFxuICAgICAgY29sb3I6IFwicHVycGxlXCIsXG4gICAgICBzdHlsZTogXCJsaW5lXCIsXG4gICAgICBpbnRlcnBvbGF0aW9uOiBcImxpbmVhclwiXG4gICAgfVxuICAgIFxuICAgIHRoaXMuZGF0YUV4YW1wbGUyLnB1c2godGhpcy5nZW5lcmF0ZURhdGEoXCJQQzZcIixcIiMxMjQ1NjhcIixcImJvdGhcIiwgXCJzdGVwXCIsdGhpcy5wYXJzZUJvb2wpKTtcbiAgICB0aGlzLmRhdGFFeGFtcGxlMS5wdXNoKGRhMik7XG4gICAgdGhpcy5kYXRhRXhhbXBsZTQucHVzaCh0aGlzLmdlbmVyYXRlRGF0YShcIlRlbXBlcmF0dXJlX1NhbG9uXCIsIFwicHVycGxlXCIsIFwibGluZVwiLCBcImxpbmVhclwiLCBwYXJzZUZsb2F0KSk7XG4gICAgdGhpcy5kYXRhRXhhbXBsZTMucHVzaCh0aGlzLmdlbmVyYXRlRGF0YShcIlByZXNlbmNlX1NhbG9uXCIsIFwicGlua1wiLCBcImxpbmVcIiwgXCJzdGVwXCIsIHRoaXMucGFyc2VCb29sKSk7XG4gICAgdGhpcy5kYXRhRXhhbXBsZTMucHVzaCh0aGlzLmdlbmVyYXRlRGF0YShcIlBDNlwiLFwiIzEyNDU2OFwiLFwiYm90aFwiLCBcInN0ZXBcIix0aGlzLnBhcnNlQm9vbCkpO1xuICAgIHRoaXMuZGF0YUV4YW1wbGU1LnB1c2godGhpcy5nZW5lcmF0ZURhdGEoXCJUZW1wZXJhdHVyZV9DdWlzaW5lXCIsIFwiZ29sZFwiLCBcImxpbmVcIiwgXCJzdGVwXCIsIHBhcnNlRmxvYXQpKTtcbiAgICB0aGlzLmRhdGFFeGFtcGxlNi5wdXNoKHRoaXMuZ2VuZXJhdGVEYXRhKFwiUHJlc2VuY2VfQ3Vpc2luZVwiLCBcInB1cnBsZVwiLCBcImJvdGhcIiwgXCJzdGVwXCIsIHRoaXMucGFyc2VCb29sKSk7XG4gICAgdGhpcy5kYXRhRXhhbXBsZTcucHVzaCh0aGlzLmdlbmVyYXRlRGF0YShcIlByZXNlbmNlX1NEQlwiLCBcImJsYWNrXCIsIFwiYXJlYVwiLCBcInN0ZXBcIiwgdGhpcy5wYXJzZUJvb2wpKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UmFuZG9tSW50KHg6bnVtYmVyKXtcbiAgICBsZXQgYWxlYTogbnVtYmVyO1xuICAgIGlmKHg9PTApe1xuICAgICAgcmV0dXJuIDE7XG4gICAgfWVsc2V7XG4gICAgICBhbGVhPU1hdGgucm91bmQoTWF0aC5yYW5kb20oKSk7XG4gICAgICBpZihhbGVhPT0wKXtcbiAgICAgICAgcmV0dXJuIHgtMTtcbiAgICAgIH1lbHNle1xuICAgICAgICByZXR1cm4geCsxO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19