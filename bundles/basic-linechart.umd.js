(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('d3')) :
    typeof define === 'function' && define.amd ? define('basic-linechart', ['exports', '@angular/core', 'd3'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global['basic-linechart'] = {}, global.ng.core, global.d3));
}(this, (function (exports, i0, d3) { 'use strict';

    function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () {
                            return e[k];
                        }
                    });
                }
            });
        }
        n['default'] = e;
        return Object.freeze(n);
    }

    var i0__namespace = /*#__PURE__*/_interopNamespace(i0);
    var d3__namespace = /*#__PURE__*/_interopNamespace(d3);

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b)
                if (Object.prototype.hasOwnProperty.call(b, p))
                    d[p] = b[p]; };
        return extendStatics(d, b);
    };
    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function () {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p))
                        t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    function __rest(s, e) {
        var t = {};
        for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
                t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if (d = decorators[i])
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); };
    }
    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
            return Reflect.metadata(metadataKey, metadataValue);
    }
    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            } }
            function rejected(value) { try {
                step(generator["throw"](value));
            }
            catch (e) {
                reject(e);
            } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }
    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function () { if (t[0] & 1)
                throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f)
                throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                        return t;
                    if (y = 0, t)
                        op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2])
                                _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                }
                catch (e) {
                    op = [6, e];
                    y = 0;
                }
                finally {
                    f = t = 0;
                }
            if (op[0] & 5)
                throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    }
    var __createBinding = Object.create ? (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function () { return m[k]; } });
    }) : (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        o[k2] = m[k];
    });
    function __exportStar(m, o) {
        for (var p in m)
            if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p))
                __createBinding(o, m, p);
    }
    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m)
            return m.call(o);
        if (o && typeof o.length === "number")
            return {
                next: function () {
                    if (o && i >= o.length)
                        o = void 0;
                    return { value: o && o[i++], done: !o };
                }
            };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }
    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m)
            return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
                ar.push(r.value);
        }
        catch (error) {
            e = { error: error };
        }
        finally {
            try {
                if (r && !r.done && (m = i["return"]))
                    m.call(i);
            }
            finally {
                if (e)
                    throw e.error;
            }
        }
        return ar;
    }
    /** @deprecated */
    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }
    /** @deprecated */
    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++)
            s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }
    function __spreadArray(to, from) {
        for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
            to[j] = from[i];
        return to;
    }
    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }
    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n])
            i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try {
            step(g[n](v));
        }
        catch (e) {
            settle(q[0][3], e);
        } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length)
            resume(q[0][0], q[0][1]); }
    }
    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }
    function __asyncValues(o) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function (v) { resolve({ value: v, done: d }); }, reject); }
    }
    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) {
            Object.defineProperty(cooked, "raw", { value: raw });
        }
        else {
            cooked.raw = raw;
        }
        return cooked;
    }
    ;
    var __setModuleDefault = Object.create ? (function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function (o, v) {
        o["default"] = v;
    };
    function __importStar(mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                    __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    }
    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }
    function __classPrivateFieldGet(receiver, state, kind, f) {
        if (kind === "a" && !f)
            throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }
    function __classPrivateFieldSet(receiver, state, value, kind, f) {
        if (kind === "m")
            throw new TypeError("Private method is not writable");
        if (kind === "a" && !f)
            throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    }

    /**
     * Service that give 6 example of dataset and function to parse DATA and Data from string.
     */
    var DataService = /** @class */ (function () {
        /**
         * Constructor
         * Launch generateExample with parameters this.str to fill all Dataset
         */
        function DataService() {
            /**
             * str is an example of data's string
             */
            this.str = "  \n  \"2016-07-25 15:47:24,459\";\"PC6\";\"OFF\"\n  \"2016-07-25 19:47:24,459\";\"PC6\";\"ON\"\n  \"2016-07-26 05:47:24,459\";\"PC6\";\"OFF\"\n  \"2016-07-26 06:47:24,459\";\"PC6\";\"ON\"\n  \"2016-07-26 06:59:24,459\";\"PC6\";\"OFF\"\n  \"2016-07-26 18:21:24,459\";\"PC6\";\"ON\"\n  \"2016-07-27 11:00:24,459\";\"PC6\";\"OFF\"\n  \"2016-07-28 08:32:24,459\";\"PC6\";\"ON\"\n  \"2016-07-28 18:15:24,459\";\"PC6\";\"OFF\"\n  \"2016-07-29 09:06:24,459\";\"PC6\";\"ON\"\n  \"2016-07-29 19:36:24,459\";\"PC6\";\"OFF\"\n  \"2016-07-25 15:47:24,459\";\"PC5\";\"OFF\"\n  \"2016-07-25 22:47:24,459\";\"PC5\";\"ON\"\n  \"2016-07-25 22:55:24,459\";\"PC5\";\"OFF\"\n  \"2016-07-26 07:29:24,459\";\"PC5\";\"ON\"\n  \"2016-07-26 20:59:24,459\";\"PC5\";\"OFF\"\n  \"2016-07-27 06:21:24,459\";\"PC5\";\"ON\"\n  \"2016-07-27 13:00:24,459\";\"PC5\";\"OFF\"\n  \"2016-07-28 06:32:24,459\";\"PC5\";\"ON\"\n  \"2016-07-28 14:15:24,459\";\"PC5\";\"OFF\"\n  \"2016-07-29 06:06:24,459\";\"PC5\";\"ON\"\n  \"2016-07-29 19:36:24,459\";\"PC5\";\"OFF\"\n  \"2016-07-25 15:47:19,423\";\"Temperature_Cuisine\";\"26.7\"\n  \"2016-07-25 15:48:20,279\";\"Temperature_Cuisine\";\"26.740000000000002\"\n  \"2016-07-25 15:50:00,776\";\"Temperature_Cuisine\";\"26.76\"\n  \"2016-07-25 15:55:00,275\";\"Temperature_Cuisine\";\"26.72\"\n  \"2016-07-25 16:10:00,202\";\"Temperature_Cuisine\";\"26.68\"\n  \"2016-07-25 16:15:00,197\";\"Temperature_Cuisine\";\"26.64\"\n  \"2016-07-25 16:24:50,493\";\"Temperature_Cuisine\";\"26.560000000000002\"\n  \"2016-07-25 16:29:50,204\";\"Temperature_Cuisine\";\"26.5\"\n  \"2016-07-25 16:34:50,177\";\"Temperature_Cuisine\";\"26.46\"\n  \"2016-07-25 16:39:50,128\";\"Temperature_Cuisine\";\"26.5\"\n  \"2016-07-25 16:44:50,065\";\"Temperature_Cuisine\";\"26.52\"\n  \"2016-07-25 15:47:19,423\";\"Temperature_Salon\";\"26.34\"\n  \"2016-07-25 15:48:05,264\";\"Temperature_Salon\";\"26.38\"\n  \"2016-07-25 15:53:05,275\";\"Temperature_Salon\";\"26.36\"\n  \"2016-07-25 15:58:05,252\";\"Temperature_Salon\";\"26.34\"\n  \"2016-07-25 16:08:05,234\";\"Temperature_Salon\";\"26.32\"\n  \"2016-07-25 16:13:05,237\";\"Temperature_Salon\";\"26.28\"\n  \"2016-07-25 16:23:05,172\";\"Temperature_Salon\";\"26.22\"\n  \"2016-07-25 16:28:05,244\";\"Temperature_Salon\";\"26.16\"\n  \"2016-07-25 16:29:55,490\";\"Temperature_Salon\";\"26.14\"\n  \"2016-07-25 15:47:19,423\";\"PC3\";\"ON\"\n  \"2016-07-25 15:48:20,279\";\"PC3\";\"OFF\"\n  \"2016-07-25 15:50:00,776\";\"PC3\";\"ON\"\n  \"2016-07-25 15:55:00,275\";\"PC3\";\"OFF\"\n  \"2016-07-25 16:10:00,202\";\"PC3\";\"ON\"\n  \"2016-07-25 16:15:00,197\";\"PC3\";\"OFF\"\n  \"2016-07-25 16:24:50,493\";\"PC3\";\"ON\"\n  \"2016-07-25 16:29:50,204\";\"PC3\";\"OFF\"\n  \"2016-07-25 16:34:50,177\";\"PC3\";\"ON\"\n  \"2016-07-25 16:39:50,128\";\"PC3\";\"OFF\"\n  \"2016-07-25 16:44:50,065\";\"PC3\";\"ON\"\n  ";
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
        DataService.prototype.parse = function (str, sensorId, f) {
            /**
             * Const to parse DATA
             */
            var L = str.trim().split("\n").map(function (s) { return s.trim(); }).filter(function (s) { return s !== ""; })
                .map(function (s) { return s.split(";").map(function (s) { return s.slice(1, -1); }); })
                .filter(function (tab) { return tab[1] === sensorId; })
                .map(function (_a) {
                var _b = __read(_a, 3), t = _b[0], id = _b[1], v = _b[2];
                return ({
                    timestamp: (new Date((t.replace(",", "."))).getTime()),
                    value: f(v),
                    sensorId: id
                });
            });
            return L;
        };
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
        DataService.prototype.generateData = function (str, label, color, style, interpolation, f) {
            var d = this.parse(str, label, f);
            var v = [];
            d.forEach(function (element) { return v.push([element.timestamp, element.value]); });
            var da = {
                label: label,
                values: v,
                color: color,
                style: style,
                interpolation: interpolation
            };
            return da;
        };
        /**
         * Transform string in number
         * @param s
         * @returns 1 if s=='ON', 0 if s=='OFF' else -1
         */
        DataService.prototype.parseBool = function (s) {
            if (s == 'ON')
                return 1;
            else if (s == 'OFF')
                return 0;
            else
                return -1;
        };
        /**
         * Generate all dataset
         * @param str
         */
        DataService.prototype.generateExample = function (str) {
            var _this = this;
            var d2 = this.parse(str, "PC5", this.parseBool);
            var v2 = [];
            d2.forEach(function (element) { return v2.push([element.timestamp, element.value]); });
            var x = 0;
            v2.forEach(function (element) {
                element[1] = x;
                x = _this.getRandomInt(x);
            });
            var da2 = {
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
        };
        /**
         * Get +1 or -1 on the param x
         * @param x
         * @returns x+1 or x-1 (random)
         */
        DataService.prototype.getRandomInt = function (x) {
            var alea;
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
        };
        return DataService;
    }());
    DataService.ɵfac = i0__namespace.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0__namespace, type: DataService, deps: [], target: i0__namespace.ɵɵFactoryTarget.Injectable });
    DataService.ɵprov = i0__namespace.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0__namespace, type: DataService, providedIn: 'root' });
    i0__namespace.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0__namespace, type: DataService, decorators: [{
                type: i0.Injectable,
                args: [{
                        providedIn: 'root'
                    }]
            }], ctorParameters: function () { return []; } });

    var BasicLinechartComponent = /** @class */ (function () {
        /**
         * Constructor : Init renderer
         * @param renderer
         */
        function BasicLinechartComponent(renderer) {
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
            this.rangeChange = new i0.EventEmitter();
            /**
             * Input currentTime
             * Default value : 0
             */
            this.currentTime = 0;
            /**
             * Output currentTimeChange that emit currentTime
             */
            this.currentTimeChange = new i0.EventEmitter();
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
            this.scaleX = d3__namespace.scaleTime();
            /**
             * Scale of the Y axis
             */
            this.scaleY = d3__namespace.scaleLinear();
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
        BasicLinechartComponent.prototype.handleKeyDown = function (event) {
            if (event.ctrlKey && !this.zoomSelected) {
                this.zoomSelected = true;
            }
        };
        BasicLinechartComponent.prototype.handleKeyUp = function () {
            this.zoomSelected = false;
        };
        /**
         * Copy data in dataZoom, and build title
         */
        BasicLinechartComponent.prototype.ngOnInit = function () {
            var _this = this;
            this.dataZoom = __spreadArray([], __read(this.data));
            this.lastDatalength = this.dataZoom.length;
            this.data.forEach(function (element, index) {
                if (index == _this.data.length - 1)
                    _this.title = _this.title + element.label + '.';
                else
                    _this.title = _this.title + element.label + ', ';
            });
        };
        /**
         * Initialize linechart
         */
        BasicLinechartComponent.prototype.ngAfterViewInit = function () {
            var _this = this;
            if (this.timeline != undefined) {
                var w = this.timeline.nativeElement.width.animVal.value;
                var h = this.timeline.nativeElement.height.animVal.value;
                this.svgWidth = (w - this.margin.left) - this.margin.right;
                this.svgHeight = (h - this.margin.top) - this.margin.bottom;
            }
            this.data.forEach(function (element, index) { return _this.buildStyleData(element, index); });
            this.controlSpeedZoom();
            this.buildZoom();
            this.buildEvent();
            this.drawToolTips();
            this.drawAxis();
            this.drawLineAndPath();
            this.drawLineCurrentTime();
            this.drawScrollbar();
        };
        /**
         * Update linechart on data, range or current time changes
         * @param {SimpleChanges} changes
         */
        BasicLinechartComponent.prototype.ngOnChanges = function (changes) {
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
        };
        /**
         * Add event listeners on the svg
         */
        BasicLinechartComponent.prototype.buildEvent = function () {
            var _this = this;
            this.svg = d3__namespace.select(this.timeline.nativeElement)
                .append('g')
                .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
            d3__namespace.select(this.timeline.nativeElement).on("mousemove", function (event) {
                if (_this.currentTimeSelected)
                    _this.moveCurrentTime(event);
                else
                    _this.showInfo(event);
            })
                .on("mouseleave", function () { _this.currentTimeSelected = false; _this.hideInfo(); })
                .on("wheel", function (event) {
                if (_this.data.length != 0)
                    if (_this.zoomSelected) {
                        _this.activeZoom(event);
                    }
            })
                .on("mouseup", function () { return _this.currentTimeSelected = false; })
                .on("mouseover", function (event) { return event.preventDefault(); });
        };
        /**
         * Build the style (area, line or both) and the interpolation (stpe or linear) of lines
         * @param {Data} element
         * @param {number} index
         */
        BasicLinechartComponent.prototype.buildStyleData = function (element, index) {
            var _this = this;
            if (element.style == "area" || element.style == "both") {
                if (element.interpolation == "step") {
                    this.area[index] = d3__namespace.area()
                        .x(function (d) { return _this.scaleX(d[0]); })
                        .y0(this.svgHeight)
                        .y1(function (d) { return _this.scaleY(d[1]); })
                        .curve(d3__namespace.curveStepAfter);
                }
                else {
                    this.area[index] = d3__namespace.area()
                        .x(function (d) { return _this.scaleX(d[0]); })
                        .y0(this.svgHeight)
                        .y1(function (d) { return _this.scaleY(d[1]); });
                }
            }
            if (element.style == "line" || element.style == "both") {
                if (element.interpolation == "step") {
                    this.line[index] = d3__namespace.line()
                        .x(function (d) { return _this.scaleX(d[0]); })
                        .y(function (d) { return _this.scaleY(d[1]); })
                        .curve(d3__namespace.curveStepAfter);
                }
                else {
                    this.line[index] = d3__namespace.line()
                        .x(function (d) { return _this.scaleX(d[0]); })
                        .y(function (d) { return _this.scaleY(d[1]); });
                }
            }
            if (!this.controlColor(element.color)) {
                console.warn("Data with " + element.label + " label, has an unvalid color attribute (" + element.color + "). Replace with the default color (black).");
                element.color = "black";
            }
        };
        /**
         * Save information for zoom.
         */
        BasicLinechartComponent.prototype.buildZoom = function () {
            this.minTime = this.scale(this.data, "xMin");
            this.maxTime = this.scale(this.data, "xMax");
            this.lengthTime = this.maxTime - this.minTime;
            this.idZoom = 0;
        };
        /**
         * Draw the tooltips's svg
         */
        BasicLinechartComponent.prototype.drawToolTips = function () {
            var _this = this;
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
                this.dataZoom.forEach(function (element) {
                    // Cet élément contiendra tout notre texte
                    var text = _this.tooltip.append("text")
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
                this.dataZoom.forEach(function (element) {
                    // Cet élément contiendra tout notre texte
                    var text = _this.tooltip.append("text")
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
        };
        /**
         * Draw horizontal and vertical axis and scale
         */
        BasicLinechartComponent.prototype.drawAxis = function () {
            this.scaleX.range([0, this.svgWidth]);
            this.scaleX.domain([this.minTime, this.maxTime]);
            this.scaleY = d3__namespace.scaleLinear();
            this.scaleY.range([this.svgHeight, 0]);
            this.scaleY.domain(this.controlDomain());
            // Configure the X Axis
            this.svg.append('g')
                .attr('transform', 'translate(0,' + this.svgHeight + ')')
                .attr('class', 'xAxis')
                .call(d3__namespace.axisBottom(this.scaleX));
            // Configure the Y Axis
            if (this.discreteValue(this.data)) {
                this.svg.append('g')
                    .attr('class', 'yAxis')
                    .call(d3__namespace.axisLeft(this.scaleY).ticks(this.scale(this.data, "yMax")));
            }
            else {
                this.svg.append('g')
                    .attr('class', 'yAxis')
                    .call(d3__namespace.axisLeft(this.scaleY));
            }
        };
        /**
         * Draw lines on the line chart
         */
        BasicLinechartComponent.prototype.drawLineAndPath = function () {
            var _this = this;
            this.dataZoom.forEach(function (element, index) {
                if (element.style == "area" || element.style == "both") {
                    _this.svg.append('path')
                        .datum(_this.dataZoom[index].values)
                        .attr('class', 'area' + index)
                        .attr('d', _this.area[index])
                        .attr("stroke-width", 0.1)
                        .attr('opacity', 0.3)
                        .style('fill', element.color)
                        .style('stroke', element.color)
                        .style('stroke-width', '2px');
                }
                if (element.style == "line" || element.style == "both") {
                    _this.svg.append('path')
                        .datum(element.values)
                        .attr('class', 'line' + index)
                        .attr('d', _this.line[index])
                        .style('fill', 'none')
                        .style('stroke', element.color)
                        .style('stroke-width', '2px');
                }
            });
        };
        /**
         * Draw the vertical line which represents the current time
         */
        BasicLinechartComponent.prototype.drawLineCurrentTime = function () {
            var _this = this;
            if (this.data.length != 0) {
                if (this.currentTime == 0) {
                    this.currentTime = this.scale(this.data, "xMin");
                }
                var x_1 = 0;
                this.svg.append('path')
                    .datum([[this.currentTime, this.controlDomain()[0]], [this.currentTime, this.svgHeight]])
                    .attr('class', 'currentTimeLine')
                    .attr('d', d3__namespace.line()
                    .x(function (d) { return x_1 = _this.scaleX(d[0]); })
                    .y(function (d) { return _this.scaleY(d[1]); }))
                    .style('fill', 'none')
                    .style('stroke', 'red')
                    .style('stroke-width', '3px');
                this.svg.append('circle')
                    .attr('class', 'currentTimeSelector')
                    .attr('cx', x_1)
                    .attr('cy', -13)
                    .attr('r', 7)
                    .attr('fill', 'red')
                    .on("mousedown", function () {
                    _this.currentTimeSelected = true;
                    _this.hideInfo();
                });
            }
        };
        /**
         * Draw the scrollbar and event listener on it
         */
        BasicLinechartComponent.prototype.drawScrollbar = function () {
            var _this = this;
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
            this.renderer.listen(this.scrollbar.nativeElement, 'mousedown', function (event) { return _this.activeScrollbar(event); });
            this.renderer.listen(window, 'mouseup', function () { return _this.desactiveScrollbar(); });
            this.renderer.listen(window, 'mousemove', function (event) { return _this.updateRange(event); });
        };
        /**
         * Update all the line chart (horizontal and vertical axis and scale, data, lines and range) on data changes.
         */
        BasicLinechartComponent.prototype.updateChart = function () {
            var _this = this;
            this.dataZoom = __spreadArray([], __read(this.data));
            this.data.forEach(function (element, index) {
                _this.buildStyleData(element, index);
                if (element.style == "area")
                    _this.svg.selectAll('.line' + index).remove();
                if (element.style == "line")
                    _this.svg.selectAll('.area' + index).remove();
                _this.title = 'Timeline : ';
                if (index == _this.data.length - 1)
                    _this.title = _this.title + element.label + '.';
                else
                    _this.title = _this.title + element.label + ', ';
            });
            this.buildZoom();
            this.scaleX.domain([this.minTime, this.maxTime]);
            this.scaleY.range([this.svgHeight, 0]);
            this.controlDomain();
            this.scaleY.domain(this.controlDomain());
            if (this.discreteValue(this.data)) {
                this.svg.selectAll('.yAxis')
                    .call(d3__namespace.axisLeft(this.scaleY).ticks(this.scale(this.data, "yMax")));
            }
            else {
                this.svg.selectAll('.yAxis')
                    .call(d3__namespace.axisLeft(this.scaleY));
            }
            this.svg.selectAll('.xAxis').call(d3__namespace.axisBottom(this.scaleX));
            this.svg.selectAll('.currentTimeLine').remove();
            this.svg.selectAll('.currentTimeSelector').remove();
            this.updateLine();
            this.drawLineCurrentTime();
            this.updateScrollbar(this.minTime, this.maxTime);
            this.updateToolTips();
            for (var index = this.dataZoom.length; index < this.lastDatalength; index++) {
                this.svg.selectAll('.line' + index).remove();
                this.svg.selectAll('.area' + index).remove();
            }
            this.lastDatalength = this.dataZoom.length;
        };
        /**
         * Update horizontal axis, current time line, lines and scrollbar
         * @param {number} min of the new range
         * @param {number} max of the new range
         */
        BasicLinechartComponent.prototype.updateSvg = function (min, max) {
            this.scaleX.domain([min, max]);
            this.svg.selectAll('.xAxis').call(d3__namespace.axisBottom(this.scaleX));
            this.updateLine();
            this.updateCurrentTime();
            this.updateScrollbar(min, max);
        };
        /**
         * Update the display of lines
         */
        BasicLinechartComponent.prototype.updateLine = function () {
            var _this = this;
            var lineUpdate;
            var areaUpdate;
            this.dataZoom.forEach(function (element, index) {
                if (element.style == "area" || element.style == "both") {
                    areaUpdate = _this.svg.selectAll('.area' + index).data([_this.dataZoom[index].values]);
                    areaUpdate
                        .enter()
                        .append("path")
                        .attr('class', 'area' + index)
                        .merge(areaUpdate)
                        .attr('d', _this.area[index])
                        .attr("stroke-width", 0.1)
                        .attr('opacity', 0.3)
                        .style('fill', element.color)
                        .style('stroke', element.color)
                        .style('stroke-width', '2px');
                }
                if (element.style == "line" || element.style == "both") {
                    lineUpdate = _this.svg.selectAll('.line' + index).data([_this.dataZoom[index].values]);
                    lineUpdate
                        .enter()
                        .append("path")
                        .attr('class', 'line' + index)
                        .merge(lineUpdate)
                        .attr('d', _this.line[index])
                        .style('fill', 'none')
                        .style('stroke', element.color)
                        .style('stroke-width', '2px');
                }
            });
        };
        /**
         * Update the position of the current time line
         */
        BasicLinechartComponent.prototype.updateCurrentTime = function () {
            var _this = this;
            var lineUpdate = this.svg.selectAll('.currentTimeLine').datum([[this.currentTime, this.controlDomain()[0]], [this.currentTime, this.svgHeight]]);
            var x = 0;
            lineUpdate.enter()
                .append("path")
                .attr('class', 'currentTimeLine')
                .merge(lineUpdate)
                .attr('d', d3__namespace.line()
                .x(function (d) { return x = _this.scaleX(d[0]); })
                .y(function (d) { return _this.scaleY(d[1]); }))
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
        };
        /**
         * Update the position of the scrollbar
         * @param {number} min of the new range
         * @param {number} max of the new range
         */
        BasicLinechartComponent.prototype.updateScrollbar = function (min, max) {
            this.scrollbar.nativeElement.style.marginLeft = this.svgWidth * (min - this.minTime) / (this.lengthTime) + "px";
            this.scrollbar.nativeElement.style.width = this.svgWidth * (max - min) / (this.lengthTime) + "px";
        };
        /**
         * Change the range, control it, update datas, update the linechart and then emit the new range.
         * @param {MouseEvent} event
         */
        BasicLinechartComponent.prototype.updateRange = function (event) {
            if (this.scrollbarSelected) {
                event.preventDefault();
                var lengthLocalTime = this.range[1] - this.range[0];
                var lastMinLocalTime = this.scale(this.dataZoom, "xMin");
                var pos = event.clientX - this.margin.left;
                if (this.lastPos == 0) {
                    this.lastPos = pos;
                }
                var minLocalTime = (pos - this.lastPos) * this.lengthTime / this.svgWidth + lastMinLocalTime;
                this.range = this.controlRange(minLocalTime, lengthLocalTime);
                this.updateDataZoom(this.range[0], this.range[1]);
                this.updateSvg(this.range[0], this.range[1]);
                this.rangeChange.emit(this.range);
                this.lastPos = pos;
            }
        };
        /**
         * Change this.dataZoom at range changes
         * @param {number} min of the new range
         * @param {number} max of the new range
         */
        BasicLinechartComponent.prototype.updateDataZoom = function (min, max) {
            var _this = this;
            this.data.forEach(function (element, index) {
                _this.dataZoom[index] = {
                    label: element.label,
                    values: element.values.filter(function (element) { return min <= element[0] && element[0] <= max; }),
                    color: element.color,
                    style: element.style,
                    interpolation: element.interpolation
                };
            });
            var time;
            this.data.forEach(function (element, index) {
                time = [];
                element.values.forEach((function (element) { return time.push(element[0]); }));
                var i = d3__namespace.bisectLeft(time, min) - 1;
                if (i >= 0 && i < _this.data[index].values.length) {
                    _this.dataZoom[index].values.unshift([min, (_this.data[index].values[i][1])]);
                }
                _this.dataZoom[index].values.push([max, _this.dataZoom[index].values[_this.dataZoom[index].values.length - 1][1]]);
            });
        };
        /**
         * Remove and build a new tooltips
         */
        BasicLinechartComponent.prototype.updateToolTips = function () {
            this.tooltip.remove();
            this.drawToolTips();
        };
        /**
         * Active movement of scrollbar on mousedown on it
         * @param {MouseEvent} event
         */
        BasicLinechartComponent.prototype.activeScrollbar = function (event) {
            if (this.idZoom != 0) {
                this.scrollbarSelected = true;
                this.lastPos = event.clientX - this.margin.left;
            }
        };
        /**
         * Desactive movement of scrollbar on mouseup or mouseleave on it
         */
        BasicLinechartComponent.prototype.desactiveScrollbar = function () {
            this.scrollbarSelected = false;
            this.lastPos = 0;
        };
        /**
         * Show the tooltips on the movement of the mouse
         * @param {MouseEvent} event
         */
        BasicLinechartComponent.prototype.showInfo = function (event) {
            if (this.dataZoom[0] != undefined && this.dataZoom.length < 2) {
                var d = 0;
                var t = 0;
                var time_1 = [];
                this.dataZoom[0].values.forEach(function (element) { return time_1.push(element[0]); });
                var x0 = this.scaleX.invert(event.clientX - this.margin.left).getTime();
                var x = d3__namespace.bisectRight(time_1, x0);
                if (x > this.dataZoom[0].values.length - 1)
                    x = this.dataZoom[0].values.length - 1;
                else if (x < 0)
                    x = 0;
                d = this.dataZoom[0].values[x][1];
                t = this.dataZoom[0].values[x][0];
                var date = new Date(t).toLocaleDateString("fr", { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
                d3__namespace.selectAll('#tooltip-date1')
                    .text(date);
                d3__namespace.selectAll('#tooltip-date2')
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
        };
        /**
         * Hide the tooltips when the mouse leave the svg
         */
        BasicLinechartComponent.prototype.hideInfo = function () {
            this.tooltip.style("display", "none");
        };
        /**
         * Update the range (reduce or increase) of the linechart on scroll
         * @param {WheelEvent} event
         */
        BasicLinechartComponent.prototype.activeZoom = function (event) {
            event.preventDefault();
            var lastLengthLocalTime = this.lengthTime / Math.pow(1 + this.speedZoom, this.idZoom);
            var lastMinLocalTime = this.scale(this.dataZoom, "xMin");
            if ((event.deltaY > 0 && this.idZoom > 0) || event.deltaY < 0) {
                if (event.deltaY > 0 && this.idZoom > 0) {
                    this.idZoom--;
                }
                else if (event.deltaY < 0) {
                    this.idZoom++;
                }
                var pos = this.scaleX.invert(event.clientX - this.margin.left).getTime();
                var lengthLocalTime = this.lengthTime / Math.pow(1 + this.speedZoom, this.idZoom);
                if (lengthLocalTime > 200) {
                    var minLocalTime = (lastMinLocalTime - pos) * (lengthLocalTime / lastLengthLocalTime) + pos;
                    this.range = this.controlRange(minLocalTime, lengthLocalTime);
                    this.updateDataZoom(this.range[0], this.range[1]);
                    this.updateSvg(this.range[0], this.range[1]);
                    this.rangeChange.emit(this.range);
                }
                else {
                    this.idZoom--;
                }
            }
        };
        /**
         * Update the value of current time on the movement of the mouse
         * @param {MouseEvent} event
         */
        BasicLinechartComponent.prototype.moveCurrentTime = function (event) {
            event.preventDefault();
            var pos = this.scaleX.invert(event.clientX - this.margin.left).getTime();
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
        };
        /**
         * Control the range based on data's timestamp and the new range
         * @param {number} min of the new range
         * @param {number} length of the new range
         * @returns a adjusted range based on data's timestamp
         */
        BasicLinechartComponent.prototype.controlRange = function (min, length) {
            if (this.minTime > min)
                min = this.minTime;
            var max = min + length;
            if (this.maxTime < max) {
                max = this.maxTime;
                min = max - length;
            }
            if (this.minTime > min)
                min = this.minTime;
            return [min, max];
        };
        /**
         * Control the domain based on data's value type and the input domain
         * @returns a new domain auto-scaled if the input domain is equal to [0,0] or the data's value are positive integers, else return the input domain
         */
        BasicLinechartComponent.prototype.controlDomain = function () {
            if ((this.domain[0] == 0 && this.domain[1] == 0) || this.discreteValue(this.data)) {
                return [this.scale(this.data, "yMin"), this.scale(this.data, "yMax")];
            }
            else {
                return this.domain;
            }
        };
        /**
         * Control the color based on css-colors-name and hex-color-code
         * @param {string} color
         * @returns false if the param color isn't a css-colors-name or a valid hex-color-code
         */
        BasicLinechartComponent.prototype.controlColor = function (color) {
            var s = new Option().style;
            s.color = color;
            return s.color != "";
        };
        /**
         * Control the speedZoom if it isn't between 0 and 1.
         */
        BasicLinechartComponent.prototype.controlSpeedZoom = function () {
            if (this.speedZoom <= 0) {
                this.speedZoom = 0.1;
            }
            else if (this.speedZoom > 1) {
                this.speedZoom = 1;
            }
        };
        /**
         * Determine the minimum or maximum of the horizontal or vertical axis in data
         * @param {Data[]} data Array of Data
         * @param {"xMin" | "xMax" | "yMin" | "yMax"} s precise wihch scale we want
         * @returns the value that matches with the parameter s in data
         */
        BasicLinechartComponent.prototype.scale = function (data, s) {
            var res = 0;
            data.forEach(function (elements, index) { return elements.values.forEach(function (element, i) {
                if ((s == "yMin" && ((i == 0 && index == 0) || element[1] < res)) || (s == "yMax" && ((i == 0 && index == 0) || element[1] > res)))
                    res = element[1];
                else if ((s == "xMin" && ((i == 0 && index == 0) || element[0] < res)) || (s == "xMax" && ((i == 0 && index == 0) || element[0] > res)))
                    res = element[0];
            }); });
            return res;
        };
        /**
        *Check type of data (positive integer or float)
        *@param {Data[]} data Array of Data
        *@returns false if there is at least one value in data that's not a positive integer
        */
        BasicLinechartComponent.prototype.discreteValue = function (data) {
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].values.length; j++) {
                    if (data[i].values[j][1] != Math.round(data[i].values[j][1]))
                        return false;
                }
            }
            return true;
        };
        /**
         * Round a number with a precision
         * @param {number} num
         * @param {number} precision
         * @returns a num with a number of decimal (precision)
         */
        BasicLinechartComponent.prototype.roundDecimal = function (num, precision) {
            var tmp = Math.pow(10, precision);
            return Math.round(num * tmp) / tmp;
        };
        return BasicLinechartComponent;
    }());
    BasicLinechartComponent.ɵfac = i0__namespace.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0__namespace, type: BasicLinechartComponent, deps: [{ token: i0__namespace.Renderer2 }], target: i0__namespace.ɵɵFactoryTarget.Component });
    BasicLinechartComponent.ɵcmp = i0__namespace.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "12.0.3", type: BasicLinechartComponent, selector: "lib-basic-linechart", inputs: { width: "width", height: "height", data: "data", domain: "domain", speedZoom: "speedZoom", range: "range", currentTime: "currentTime" }, outputs: { rangeChange: "rangeChange", currentTimeChange: "currentTimeChange" }, host: { listeners: { "window:keydown": "handleKeyDown($event)", "window:keyup": "handleKeyUp($event)" } }, viewQueries: [{ propertyName: "timeline", first: true, predicate: ["root"], descendants: true }, { propertyName: "scrollbar", first: true, predicate: ["scroll"], descendants: true }, { propertyName: "zoneScrollbar", first: true, predicate: ["zone"], descendants: true }, { propertyName: "compo", first: true, predicate: ["element"], descendants: true }], usesOnChanges: true, ngImport: i0__namespace, template: "\n  <div #element>\n  <h2>{{ title }}</h2>\n  <svg #root [attr.width]=\"width\" [attr.height]=\"height\"></svg>\n  <div #zone><div #scroll></div></div>\n  </div>\n  ", isInline: true });
    i0__namespace.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0__namespace, type: BasicLinechartComponent, decorators: [{
                type: i0.Component,
                args: [{
                        selector: 'lib-basic-linechart',
                        template: "\n  <div #element>\n  <h2>{{ title }}</h2>\n  <svg #root [attr.width]=\"width\" [attr.height]=\"height\"></svg>\n  <div #zone><div #scroll></div></div>\n  </div>\n  ",
                        styles: []
                    }]
            }], ctorParameters: function () { return [{ type: i0__namespace.Renderer2 }]; }, propDecorators: { width: [{
                    type: i0.Input
                }], height: [{
                    type: i0.Input
                }], data: [{
                    type: i0.Input
                }], domain: [{
                    type: i0.Input
                }], speedZoom: [{
                    type: i0.Input
                }], timeline: [{
                    type: i0.ViewChild,
                    args: ['root']
                }], scrollbar: [{
                    type: i0.ViewChild,
                    args: ['scroll']
                }], zoneScrollbar: [{
                    type: i0.ViewChild,
                    args: ['zone']
                }], compo: [{
                    type: i0.ViewChild,
                    args: ['element']
                }], range: [{
                    type: i0.Input
                }], rangeChange: [{
                    type: i0.Output
                }], currentTime: [{
                    type: i0.Input
                }], currentTimeChange: [{
                    type: i0.Output
                }], handleKeyDown: [{
                    type: i0.HostListener,
                    args: ['window:keydown', ['$event']]
                }], handleKeyUp: [{
                    type: i0.HostListener,
                    args: ['window:keyup', ['$event']]
                }] } });

    var BasicLinechartModule = /** @class */ (function () {
        function BasicLinechartModule() {
        }
        return BasicLinechartModule;
    }());
    BasicLinechartModule.ɵfac = i0__namespace.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0__namespace, type: BasicLinechartModule, deps: [], target: i0__namespace.ɵɵFactoryTarget.NgModule });
    BasicLinechartModule.ɵmod = i0__namespace.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0__namespace, type: BasicLinechartModule, declarations: [BasicLinechartComponent], exports: [BasicLinechartComponent] });
    BasicLinechartModule.ɵinj = i0__namespace.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0__namespace, type: BasicLinechartModule, imports: [[]] });
    i0__namespace.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.3", ngImport: i0__namespace, type: BasicLinechartModule, decorators: [{
                type: i0.NgModule,
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

    exports.BasicLinechartComponent = BasicLinechartComponent;
    exports.BasicLinechartModule = BasicLinechartModule;
    exports.DataService = DataService;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=basic-linechart.umd.js.map
