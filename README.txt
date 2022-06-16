If you haven't run the project before:

install node.js
npm install -g @angular/cli
npm install
ng serve

==========================================================

To create project navigate to the folder in cmd and then:
ng new tims-app --style=scss

If hot reload isnt working do this:
npm install @ngtools/webpack@1.2.4

To update typescript:
npm install -g typescript

To serve the project http://localhost:4200/:
ng serve

To build:
ng build
ng build --prod --aot=false --build-optimizer=false

To enable prod mode = https://github.com/angular/angular/issues/6189
And to optimise final build = https://angular.io/guide/deployment#!#enable-prod-mode




To make a new directory section = ng generate component other

To make files inside existing folder, navigation cmd to that folder then = ng g c another --flat

To create new service = ng g s http




Upgrading ZXscanner
npm i @zxing/library
npm i @zxing/browser
npm install @zxing/ngx-scanner@3.1.1
https://github.com/zxing-js/ngx-scanner/issues/359




Resources:
Image Gallery = http://4dev.tech/2016/11/creating-an-angular2-image-gallery/


Get more errors: ng build --prod

npm i npm-check -g
npm-check -u



If you have any problems running Angular try:

npm uninstall -g angular-cli @angular/cli
npm cache clean
npm install -g @angular/cli