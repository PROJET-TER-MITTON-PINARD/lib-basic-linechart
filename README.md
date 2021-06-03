# BasicLinechart

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.3.

## Installation

Run `npm install https://github.com/PROJET-TER-MITTON-PINARD/lib-basic-linechart#main` to install.
Run `npm install d3` and `npm install @types/d3` to install pearDependencies.

## How to use 

In your app.module.ts, you must add BasicLinechartModule to imports of @NgModule. 

In your app.compenent.html, you can add the component with it parameters :
```
<lib-basic-linechart [width] = "1200" [height]="200" [data]=data3></lib-basic-linechart>
``` 

## Code scaffolding

Run `ng generate component component-name --project basic-linechart` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project basic-linechart`.
> Note: Don't forget to add `--project basic-linechart` or else it will be added to the default project in your `angular.json` file. 

## Build

Run `ng build basic-linechart` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build basic-linechart`, go to the dist folder `cd dist/basic-linechart` and run `npm publish`.

## Running unit tests

Run `ng test basic-linechart` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
