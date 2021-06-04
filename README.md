# BasicLinechart

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.3.

## Installation

- Run `npm install https://github.com/PROJET-TER-MITTON-PINARD/lib-basic-linechart#main` to install.

- Run `npm install d3` and `npm install @types/d3` to install pearDependencies.

## Summary 

This package contains, a line-chart component and some data's examples to try it.

## How to use 

- In your app.module.ts, you must add ```BasicLinechartModule``` to imports of ```@NgModule```. 

- In your app.compenent.html, you can add the component : ```<lib-basic-linechart></lib-basic-linechart>```

### Parameters of the component

No parameters are required.

- Input ```[data]: Data[]``` default value : [], data displayed in the component (specified Data in the section below)
- Input ```[width]: number``` default value : 900, width of the component
- Input ```[height]: number``` default value : 200, height of the component
- Input ```[domain]: [number,number]``` default value : [0,0], domain of value (only for continuous values)
- Input ```[range]: [number,number]``` default value : [0,0], range of timestamp that we display in component 
- Input ```[currenTime]: number``` default value : 0, timestamp for the current time line
- Output ```(rangeChange): [number,number]``` to bind with a function in your app, to synchronize components ranges 
- Output ```(currenTimeChange): number``` to bind with a function in your app, to synchronize components currentTime 

/!\ Don't mix dataset with different value's type (continuous, positive integer) in one component.

/!\ Don't mix dataset with different range of timestamp in one component.

/!\ Don't bind range on components that have dataset with diferrent ranges of timestamp

### Interface Data

Represents one dataset. You can add an array of dataset in the component.

```
export interface Data {
  label: string;
  values: [number,number][]; //[timestamp,value]
  color: string;
  style: "line" | "area" | "both";
  interpolation: "linear" | "step";
}
```

### DataService

Contains dataExamples. You can import them to test the component (show in the example below).

## Example 

### app.component.ts

Write in the main class :
```
  public data1:Data[]=[];
  public data2:Data[]=[];
  public data3:Data[]=[];
  public data4:Data[]=[];
  public data5:Data[]=[];
  public data6:Data[]=[];
  public data7:Data[]=[];
  public datatest:Data[]=[];
  public range: [number, number] = [0,0];
  public currentTime : number =0;

  constructor(data : DataService){
    this.data1=data.dataExample1;
    this.data2=data.dataExample2;
    this.data3=data.dataExample3;
    this.data4=data.dataExample4;
    this.data5=data.dataExample5;
    this.data6=data.dataExample6;
    this.data7=data.dataExample7;
  }
  public updateRange(rangeChange: [number,number]){
    this.range=rangeChange;
  }

  public updateCurrentTime(currentTimeChange: number ){
    this.currentTime=currentTimeChange;
  }
  
  public change(i: number){
    if(i==1) this.datatest = this.data5;
    if(i==2) this.datatest = this.data6;
    if(i==3) this.datatest = this.data7;
  }
```

### app.component.html

Write :
```
<lib-basic-linechart [data]=data2 [range]=range (rangeChange)="updateRange($event)" [currentTime]=currentTime (currentTimeChange)="updateCurrentTime($event)"></lib-basic-linechart>
<lib-basic-linechart [data]=data1 [domain]=[0,30] [range]=range (rangeChange)="updateRange($event)" [currentTime]=currentTime (currentTimeChange)="updateCurrentTime($event)"></lib-basic-linechart>
<lib-basic-linechart [data]=data4 [range]=range (rangeChange)="updateRange($event)" [currentTime]=currentTime (currentTimeChange)="updateCurrentTime($event)"></lib-basic-linechart>
<lib-basic-linechart [width] = "1200" [height]="200" [data]=data3 [range]=range (rangeChange)="updateRange($event)" [currentTime]=currentTime (currentTimeChange)="updateCurrentTime($event)"></lib-basic-linechart>
<lib-basic-linechart [data]=datatest [domain]=[0,30] [range]=range [currentTime]=currentTime> </lib-basic-linechart>
<button (click)='change(1)'>Données 1</button>
<button (click)='change(2)'>Données 2</button>
<button (click)='change(3)' >Données 3</button>
```
