import { Component, OnInit, ViewChild, TemplateRef, ViewContainerRef, HostListener } from '@angular/core';
import { GeneralService } from "./shared/services/general.service";
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import {debounceTime} from 'rxjs/operators';
import { fromEvent, Subscription } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { take, filter } from 'rxjs/operators';
import { RouterOutlet } from '@angular/router';
import { ShapeDetails, ShapeTemplate } from './shared/interfaces/shape-template-interface';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'ngx-color-picker';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {NgClickOutsideDirective} from 'ng-click-outside2';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule, FormsModule, ColorPickerModule, DragDropModule, NgClickOutsideDirective, OverlayModule, CommonModule],
  providers: [GeneralService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  isFocused: boolean = false;
  public myForm!: FormGroup;
  newShapeColor: string = "#cccccc";
  canvasColor: string = "#ffffff";
  shimmerColor: string = "rgb(102,102,102)";
  canvasBorderRadiusTopLeft: number = 0;
  canvasBorderRadiusTopRight: number = 0;
  canvasBorderRadiusBottomRight: number = 0;
  canvasBorderRadiusBottomLeft: number = 0;
  canvasHeight: number = 170;
  repeatDesign: number = 170;
  shapesZIndex: number = 1;
  showShimmer: boolean = true;
  shimmerType: number = 0;
  selectedTemplate: string = "";
  highlightedItem: number = -1;
  selectedType: string | null = "";
  randomSkeletonName: string = "";
  generatedCss: string = "";
  playShimmerDuration: number = 2;

  shimmerAngle: number = 94;
  shimmerWidth: number = 90;
  
  designCanvasTempBackgroundImage: any;
  tempBackgroundXPos: number = 100;
  tempBackgroundYPos: number = 100;

  designData: ShapeDetails[] = [];

  option1: ShapeTemplate = this.generalService.presetOption1();
  option2: ShapeTemplate = this.generalService.presetOption2();
  option3: ShapeTemplate = this.generalService.presetOption3();
  option4: ShapeTemplate = this.generalService.presetOption4();
  
  sub!: Subscription;
  overlayRef!: OverlayRef | null;
  @ViewChild('userMenu') userMenu!: TemplateRef<any>;

  showModal: boolean = false;

  shimmerGradientStages = [
    {
        "opacity": 0,
        "step": 20
    },
    {
        "opacity": 0.5,
        "step": 50
    },
    {
        "opacity": 0,
        "step": 80
    }
  ]


  constructor(private generalService: GeneralService, private fb: FormBuilder, public overlay: Overlay, public viewContainerRef: ViewContainerRef) { }

  
  ngOnInit() {

      this.randomSkeletonName = this.generateRandomSkeletonName();

      this.myForm = this.fb.group({
          width: [null],
          widthMeasurement: [null],
          widthCalc: [null],
          widthCalcAmount: [null],
          widthCalcUnit: [null],
          height: [null],
          heightMeasurement: [null],
          heightCalc: [null],
          heightCalcAmount: [null],
          heightCalcUnit: [null],
          diameter: [null],
          diameterMeasurement: [null],
          diameterCalc: [null],
          diameterCalcAmount: [null],
          diameterCalcUnit: [null],
          color: [null],
          horizontalPositioningStartingPoint: [null],
          horizontalPositioningAmount: [null],
          horizontalPositioningUnit: [null],
          verticalPositioningStartingPoint: [null],
          verticalPositioningAmount: [null],
          verticalPositioningUnit: [null],
          allowShimmerOverlay: [null],
          antialias: [null]
      });

      this.myForm.valueChanges.pipe(debounceTime(50)).subscribe(value =>
          this.sendValuesBackToArray()
      );

      this.createTemplate('option1');

      

  }


  onFocus() {
    this.isFocused = true;
  }

  onBlur() {
    this.isFocused = false;
  }


  closeModal(){
    this.showModal = false;
  }

  deleteBackgroundImage(){
    this.closeModal();
    this.designCanvasTempBackgroundImage = null;
  }


  /**
 * Browser's default confirmation dialog box.
 */
  @HostListener('window:beforeunload')
  defaultConfirmation(): boolean {
    return false;
  }

  /* If a plot is highlighted and the user hits the delete key, then remove that plot at its relavent index START */
  @HostListener('document:keydown', ['$event'])
  handleDeleteKeyboardEvent(event: KeyboardEvent) {
          
          if ((event.key === 'ArrowLeft'))
          {
              event.preventDefault(); //Prevent the window from scrolling

              if ((this.highlightedItem != -1))
              {
                  this.myForm.controls['horizontalPositioningAmount'].patchValue(this.myForm.controls['horizontalPositioningAmount'].value-1);
              }
              else
              {
                  this.tempBackgroundXPos--;
              }
          }

          if ((event.key === 'ArrowRight'))
          {
              event.preventDefault(); //Prevent the window from scrolling

              if ((this.highlightedItem != -1))
              {
                  this.myForm.controls['horizontalPositioningAmount'].patchValue(this.myForm.controls['horizontalPositioningAmount'].value+1);
              }
              else
              {
                  this.tempBackgroundXPos++;
              }
          }

          if ((event.key === 'ArrowUp'))
          {
              event.preventDefault(); //Prevent the window from scrolling

              if ((this.highlightedItem != -1))
              {
                  this.myForm.controls['verticalPositioningAmount'].patchValue(this.myForm.controls['verticalPositioningAmount'].value-1);
              }
              else
              {
                  this.tempBackgroundYPos--;
              }
          }

          if ((event.key === 'ArrowDown'))
          {
              event.preventDefault(); //Prevent the window from scrolling

              if ((this.highlightedItem != -1))
              {
                  this.myForm.controls['verticalPositioningAmount'].patchValue(this.myForm.controls['verticalPositioningAmount'].value+1);
              }
              else
              {
                  this.tempBackgroundYPos++;
              }
          }
      

      if ((event.key === 'Delete'))
      {
          if ((this.highlightedItem != -1))
          {
              // Only delete if we are NOT editing an item
              if ((this.isFocused === false)){
                this.deleteItem(this.highlightedItem);
              }
          }
          else{
              this.showModal = true;
          }
      }
  }
  /* If a plot is highlighted and the user hits the delete key, then remove that plot at its relavent index END */


  changeCanvasColorBasedOnShimmerType()
  {
      if ((this.shimmerType == 0))
      {
          this.canvasColor = "#ffffff";
          this.shimmerColor = "rgb(102,102,102)";
      }
      if ((this.shimmerType == 1))
      {
          this.canvasColor = "#E1E1E1";
          this.shimmerColor = "rgb(255,255,255)";
      }
      if ((this.shimmerType == 2))
      {
          this.canvasColor = "#ffffff";
          this.shimmerColor = "rgb(102,102,102)";
      }
  }


  onClickedOutside(e: any) {
      console.log(e);

      // Drop the item focus unless they are clicking within the item specific details div
      var element = document.getElementById('itemSpecificDetails');
      if (e.target !== element && !element!.contains(e.target))
      {
          this.highlightedItem = -1;
      }
      
    }



    open({ x, y }: MouseEvent, clickEvent: MouseEvent) {

      console.log(clickEvent);
        
      this.close();
  const positionStrategy = this.overlay.position()
    .flexibleConnectedTo({ x, y })
    .withPositions([
      {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
      }
    ]);

  this.overlayRef = this.overlay.create({
    positionStrategy,
    scrollStrategy: this.overlay.scrollStrategies.close()
  });

  this.overlayRef.attach(new TemplatePortal(this.userMenu, this.viewContainerRef, {
      $implicit: {"x": clickEvent.offsetX, "y": clickEvent.offsetY}
    }));

  this.sub = fromEvent<MouseEvent>(document, 'click')
    .pipe(
      filter(event => {
        const clickTarget = event.target as HTMLElement;
        return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
      }),
      take(1)
    ).subscribe(() => this.close())
  
    }


    close() {
      this.sub && this.sub.unsubscribe();
      if (this.overlayRef) {
        this.overlayRef.dispose();
        this.overlayRef = null;
      }
    }






  createTemplate(option: string)
  {
      this.selectedTemplate = option;

      this.highlightedItem = -1;
      this.selectedType = null;

      this.designData = [];

      if ((option === "option1")){
        this.designData = this['option1'].shapes;
        this.canvasHeight = this['option1'].canvasHeight;
        this.repeatDesign = this['option1'].repeatDesign;
      }

      if ((option === "option2")){
        this.designData = this['option2'].shapes;
        this.canvasHeight = this['option2'].canvasHeight;
        this.repeatDesign = this['option2'].repeatDesign;
      }

      if ((option === "option3")){
        this.designData = this['option3'].shapes;
        this.canvasHeight = this['option3'].canvasHeight;
        this.repeatDesign = this['option3'].repeatDesign;
      }



      this.generate();
  }



  sendValuesBackToArray() {

      this.designData[this.highlightedItem].width = this.myForm.value.width;
      this.designData[this.highlightedItem].widthMeasurement = this.myForm.value.widthMeasurement;
      this.designData[this.highlightedItem].widthCalc = this.myForm.value.widthCalc;
      this.designData[this.highlightedItem].widthCalcAmount = this.myForm.value.widthCalcAmount;
      this.designData[this.highlightedItem].widthCalcUnit = this.myForm.value.widthCalcUnit;

      this.designData[this.highlightedItem].height = this.myForm.value.height;
      this.designData[this.highlightedItem].heightMeasurement = this.myForm.value.heightMeasurement;
      this.designData[this.highlightedItem].heightCalc = this.myForm.value.heightCalc;
      this.designData[this.highlightedItem].heightCalcAmount = this.myForm.value.heightCalcAmount;
      this.designData[this.highlightedItem].heightCalcUnit = this.myForm.value.heightCalcUnit;

      this.designData[this.highlightedItem].diameter = this.myForm.value.diameter;
      this.designData[this.highlightedItem].diameterMeasurement = this.myForm.value.diameterMeasurement;
      this.designData[this.highlightedItem].diameterCalc = this.myForm.value.diameterCalc;
      this.designData[this.highlightedItem].diameterCalcAmount = this.myForm.value.diameterCalcAmount;
      this.designData[this.highlightedItem].diameterCalcUnit = this.myForm.value.diameterCalcUnit;

      this.designData[this.highlightedItem].color = this.myForm.value.color;

      this.designData[this.highlightedItem].horizontalPositioningStartingPoint = this.myForm.value.horizontalPositioningStartingPoint;
      this.designData[this.highlightedItem].horizontalPositioningAmount = this.myForm.value.horizontalPositioningAmount;
      this.designData[this.highlightedItem].horizontalPositioningUnit = this.myForm.value.horizontalPositioningUnit;

      this.designData[this.highlightedItem].verticalPositioningStartingPoint = this.myForm.value.verticalPositioningStartingPoint;
      this.designData[this.highlightedItem].verticalPositioningAmount = this.myForm.value.verticalPositioningAmount;
      this.designData[this.highlightedItem].verticalPositioningUnit = this.myForm.value.verticalPositioningUnit;

      this.designData[this.highlightedItem].allowShimmerOverlay = this.myForm.value.allowShimmerOverlay;
      this.designData[this.highlightedItem].antialias = this.myForm.value.antialias;

      this.generate();
  }

  horizontalPositioningStartingPointChanged(){
      if ((this.myForm.value.horizontalPositioningStartingPoint == "center"))
      {
          this.myForm.controls['horizontalPositioningAmount'].patchValue(null);
          this.myForm.controls['horizontalPositioningUnit'].patchValue(null);
      }
      else{
          this.myForm.controls['horizontalPositioningAmount'].patchValue(10);
          this.myForm.controls['horizontalPositioningUnit'].patchValue("px");
      }
  }

  verticalPositioningStartingPointChanged(){
      if ((this.myForm.value.verticalPositioningStartingPoint == "center"))
      {
          this.myForm.controls['verticalPositioningAmount'].patchValue(null);
          this.myForm.controls['verticalPositioningUnit'].patchValue(null);
      }
      else{
          this.myForm.controls['verticalPositioningAmount'].patchValue(10);
          this.myForm.controls['verticalPositioningUnit'].patchValue("px");
      }
  }

  widthMeasurementChanged() {
      
      if ((this.myForm.value.widthMeasurement == "%"))
      {
          this.myForm.controls['width'].patchValue(50);
      }
  }

  widthCalcChanged() {
      
      if ((this.myForm.value.widthCalc == null))
      {
          this.myForm.controls['widthCalcAmount'].patchValue(null);
          this.myForm.controls['widthCalcUnit'].patchValue(null);
      }
      else if ((this.myForm.value.widthCalc == "-")){
          this.myForm.controls['widthCalcAmount'].patchValue(0);
          this.myForm.controls['widthCalcUnit'].patchValue('px');
      }
      else if ((this.myForm.value.widthCalc == "+")){
          this.myForm.controls['widthCalcAmount'].patchValue(0);
          this.myForm.controls['widthCalcUnit'].patchValue('px');
      }
      else if ((this.myForm.value.widthCalc == "*")){
          this.myForm.controls['widthCalcAmount'].patchValue(1);
          this.myForm.controls['widthCalcUnit'].patchValue(null);
      }
      else if ((this.myForm.value.widthCalc == "/")){
          this.myForm.controls['widthCalcAmount'].patchValue(1);
          this.myForm.controls['widthCalcUnit'].patchValue(null);
      }
  }

  heightMeasurementChanged() {
      
      if ((this.myForm.value.heightMeasurement == "%"))
      {
          this.myForm.controls['height'].patchValue(5);
      }
  }

  heightCalcChanged() {
      
      if ((this.myForm.value.heightCalc == null))
      {
          this.myForm.controls['heightCalcAmount'].patchValue(null);
          this.myForm.controls['heightCalcUnit'].patchValue(null);
      }
      else if ((this.myForm.value.heightCalc == "-")){
          this.myForm.controls['heightCalcAmount'].patchValue(0);
          this.myForm.controls['heightCalcUnit'].patchValue('px');
      }
      else if ((this.myForm.value.heightCalc == "+")){
          this.myForm.controls['heightCalcAmount'].patchValue(0);
          this.myForm.controls['heightCalcUnit'].patchValue('px');
      }
      else if ((this.myForm.value.heightCalc == "*")){
          this.myForm.controls['heightCalcAmount'].patchValue(1);
          this.myForm.controls['heightCalcUnit'].patchValue(null);
      }
      else if ((this.myForm.value.heightCalc == "/")){
          this.myForm.controls['heightCalcAmount'].patchValue(1);
          this.myForm.controls['heightCalcUnit'].patchValue(null);
      }
  }

  diameterCalcChanged() {
      
      if ((this.myForm.value.diameterCalc == null))
      {
          this.myForm.controls['diameterCalcAmount'].patchValue(null);
          this.myForm.controls['diameterCalcUnit'].patchValue(null);
      }
      else if ((this.myForm.value.diameterCalc == "-")){
          this.myForm.controls['diameterCalcAmount'].patchValue(0);
          this.myForm.controls['diameterCalcUnit'].patchValue('px');
      }
      else if ((this.myForm.value.diameterCalc == "+")){
          this.myForm.controls['diameterCalcAmount'].patchValue(0);
          this.myForm.controls['diameterCalcUnit'].patchValue('px');
      }
      else if ((this.myForm.value.diameterCalc == "*")){
          this.myForm.controls['diameterCalcAmount'].patchValue(1);
          this.myForm.controls['diameterCalcUnit'].patchValue(null);
      }
      else if ((this.myForm.value.diameterCalc == "/")){
          this.myForm.controls['diameterCalcAmount'].patchValue(1);
          this.myForm.controls['diameterCalcUnit'].patchValue(null);
      }
  }



  syncHeight()
  {
      this.myForm.controls['height'].patchValue(this.myForm.value.width);
      console.log(this.myForm);
      //this.sendValuesBackToArray();
  }

  changeColor(color: string) {
      this.myForm.controls['color'].patchValue(color);
  }

  generateRandomSkeletonName() {
      var result = '';
      var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for (var i = 0; i < 11; i++) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
  }


  determineRectangleWidth(record: ShapeDetails){

    let result;

      if ((record.widthCalc == null)){
        result = record.width! + record.widthMeasurement!;
      }
      else if ((record.widthCalc == "-")){
        result = `calc(${record.width}${record.widthMeasurement} ${record.widthCalc} ${record.widthCalcAmount}${record.widthCalcUnit})`;
      }
      else if ((record.widthCalc == "+")){
        result = `calc(${record.width}${record.widthMeasurement} ${record.widthCalc} ${record.widthCalcAmount}${record.widthCalcUnit})`;
      }
      else if ((record.widthCalc == "*")){
        result = `calc(${record.width}${record.widthMeasurement} ${record.widthCalc} ${record.widthCalcAmount})`;
      }
      else if ((record.widthCalc == "/")){
        result = `calc(${record.width}${record.widthMeasurement} ${record.widthCalc} ${record.widthCalcAmount})`;
      }

      return result;
  }

  determineRectangleHeightDesignView(record: ShapeDetails){

      let startingNumber;

      if ((record.heightMeasurement === "px")){
          startingNumber = record.height;
      }
      else {
          startingNumber = (record.height! * this.repeatDesign) / 100;
      }


      let toWrite;
      
      if ((record.heightCalc == null)){
          return `${startingNumber}px`;
      }
      else if ((record.heightCalc == "-")){
          toWrite = `calc(${startingNumber}px ${record.heightCalc} ${record.heightCalcAmount}${record.heightCalcUnit})`;
      }
      else if ((record.heightCalc == "+")){
          toWrite = `calc(${startingNumber}px ${record.heightCalc} ${record.heightCalcAmount}${record.heightCalcUnit})`;
      }
      else if ((record.heightCalc == "*")){
          toWrite = `calc(${startingNumber}px ${record.heightCalc} ${record.heightCalcAmount})`;
      }
      else if ((record.heightCalc == "/")){
          toWrite = `calc(${startingNumber}px ${record.heightCalc} ${record.heightCalcAmount})`;
      }

      return toWrite;
      
  }

  determineRectangleHeightResultView(record: ShapeDetails){

    let result;

      if ((record.heightCalc == null)){
        result = record.height! + record.heightMeasurement!;
      }
      else if ((record.heightCalc == "-")){
        result = `calc(${record.height}${record.heightMeasurement} ${record.heightCalc} ${record.heightCalcAmount}${record.heightCalcUnit})`;
      }
      else if ((record.heightCalc == "+")){
        result = `calc(${record.height}${record.heightMeasurement} ${record.heightCalc} ${record.heightCalcAmount}${record.heightCalcUnit})`;
      }
      else if ((record.heightCalc == "*")){
        result = `calc(${record.height}${record.heightMeasurement} ${record.heightCalc} ${record.heightCalcAmount})`;
      }
      else if ((record.heightCalc == "/")){
        result = `calc(${record.height}${record.heightMeasurement} ${record.heightCalc} ${record.heightCalcAmount})`;
      }

      return result;
  }

  determineHorizontalPositioningOfShape(record: ShapeDetails){
      if ((record.horizontalPositioningStartingPoint === "center")){
          return `${record.horizontalPositioningStartingPoint}`;
      }
      else{
          return `${record.horizontalPositioningStartingPoint} ${record.horizontalPositioningAmount}${record.horizontalPositioningUnit}`;
      }
  }

  determineVerticalPositioningOfShape(record: ShapeDetails){
      if ((record.verticalPositioningStartingPoint === "center")){
          return `${record.verticalPositioningStartingPoint}`;
      }
      else{
          return `${record.verticalPositioningStartingPoint} ${record.verticalPositioningAmount}${record.verticalPositioningUnit}`;
      }
  }
  


  generate()
  {
      console.log("Generate!");
      console.log(this.shimmerColor);

      // Throw the array into reverse because css puts the first item at the top of the layer START
      let designDataReversed: ShapeDetails[] = structuredClone(this.designData).reverse();
      // Throw the array into reverse because css puts the first item at the top of the layer END

      var myEle = document.getElementById("andrew");
      if (myEle) {
          document.getElementById("andrew")!.remove();
      }


      this.generatedCss = "";


      if ((this.showShimmer == false))
      {
          /* Begin initial values START */
          /* BLOCK 1 START */
          this.generatedCss = this.generatedCss + ".skeleton-" + this.randomSkeletonName+":empty {";
          this.generatedCss = this.generatedCss + "height: " + this.canvasHeight+"px; background-color: " + this.canvasColor+"; border-radius: "+this.canvasBorderRadiusTopLeft+"px "+this.canvasBorderRadiusTopRight+"px "+this.canvasBorderRadiusBottomRight+"px "+this.canvasBorderRadiusBottomLeft+"px; ";
          this.generatedCss = this.generatedCss + "background-image: "; /* highlight */

          designDataReversed.forEach((x, index) => {
              if ((x.type == "rectangle"))
              {
                  // Since rectangles are only straight angles we can't do an antialias option anyway
                  this.generatedCss = this.generatedCss + "linear-gradient( "+x.color+" "+this.determineRectangleHeightResultView(x)+", transparent 0 )";
              }
              if ((x.type == "circle")) {
                  if ((x.antialias == false))
                  {
                      this.generatedCss = this.generatedCss + "radial-gradient( circle " + x.diameter! / 2 + "px at " + x.diameter! / 2 + "px " + x.diameter! / 2 + "px, " + x.color + " 99%, transparent 0 )";
                  }
                  else
                  {
                      this.generatedCss = this.generatedCss + "radial-gradient( circle " + x.diameter! / 2 + "px at " + x.diameter! / 2 + "px " + x.diameter! / 2 + "px, " + x.color + " " + (x.diameter! / 2 - 1) + "px, transparent " + x.diameter! / 2 + "px )";
                  }
              }

              /* Do a comma for the next one, or a semicolon for the last one START */
              if (index == designDataReversed.length - 1) {
                  this.generatedCss = this.generatedCss + ";";
              }
              else
              {
                  this.generatedCss = this.generatedCss + ",";
              }
              /* Do a comma for the next one, or a semicolon for the last one END */

          });

          this.generatedCss = this.generatedCss + "background-repeat: repeat-y;";
          this.generatedCss = this.generatedCss + "background-size: ";

          designDataReversed.forEach((x, index) => {
              if ((x.type == "rectangle")) {
                  this.generatedCss = this.generatedCss + "" + this.determineRectangleWidth(x) + " " + this.repeatDesign + "px";
              }
              if ((x.type == "circle")) {
                  this.generatedCss = this.generatedCss + "" + x.diameter + "" + x.diameterMeasurement + " " + this.repeatDesign + "px";
              }

              /* Do a comma for the next one, or a semicolon for the last one START */
              if (index == designDataReversed.length - 1) {
                  this.generatedCss = this.generatedCss + ";";
              }
              else {
                  this.generatedCss = this.generatedCss + ",";
              }
              /* Do a comma for the next one, or a semicolon for the last one END */

          });

          this.generatedCss = this.generatedCss + "background-position: ";

          designDataReversed.forEach((x, index) => {
          
                  this.generatedCss = this.generatedCss + "" + this.determineHorizontalPositioningOfShape(x) + " " + this.determineVerticalPositioningOfShape(x) + "";
              

              /* Do a comma for the next one, or a semicolon for the last one START */
                  if (index == designDataReversed.length - 1) {
                  this.generatedCss = this.generatedCss + ";";
              }
              else {
                  this.generatedCss = this.generatedCss + ",";
              }
              /* Do a comma for the next one, or a semicolon for the last one END */

          });

          this.generatedCss = this.generatedCss + "}";

          
          /* BLOCK 1 END */

          
          /* Begin initial values END */
      }
      



      if ((this.showShimmer == true))
      {

          if ((this.shimmerType == 0))
          {

              let amendedShimmerColor1 = this.shimmerColor.replace("rgb", "rgba");
              let amendedShimmerColor2 = amendedShimmerColor1.replace(")", ",1)");
              console.log(amendedShimmerColor2);

              /* Begin initial values START */
                          /* BLOCK 1 START */
                          this.generatedCss = this.generatedCss + ".skeleton-" + this.randomSkeletonName+":empty {";
                          this.generatedCss = this.generatedCss + "position: relative; height: " + this.canvasHeight+"px; background-color: " + this.canvasColor+"; border-radius: "+this.canvasBorderRadiusTopLeft+"px "+this.canvasBorderRadiusTopRight+"px "+this.canvasBorderRadiusBottomRight+"px "+this.canvasBorderRadiusBottomLeft+"px; ";
                          this.generatedCss = this.generatedCss + "background-image: "; /* highlight */

                          designDataReversed.forEach((x, index) => {
                              if ((x.type == "rectangle"))
                              {
                                  // Since rectangles are only straight angles we can't do an antialias option anyway
                                  this.generatedCss = this.generatedCss + "linear-gradient( "+x.color+" "+this.determineRectangleHeightResultView(x)+", transparent 0 )";
                              }
                              if ((x.type == "circle")) {
                                  if ((x.antialias == false))
                                  {
                                      this.generatedCss = this.generatedCss + "radial-gradient( circle " + x.diameter! / 2 + "px at " + x.diameter! / 2 + "px " + x.diameter! / 2 + "px, " + x.color + " 99%, transparent 0 )";
                                  }
                                  else
                                  {
                                      this.generatedCss = this.generatedCss + "radial-gradient( circle " + x.diameter! / 2 + "px at " + x.diameter! / 2 + "px " + x.diameter! / 2 + "px, " + x.color + " " + (x.diameter! / 2 - 1) + "px, transparent " + x.diameter! / 2 + "px )";
                                  }
                              }

                              /* Do a comma for the next one, or a semicolon for the last one START */
                              if (index == designDataReversed.length - 1) {
                                  this.generatedCss = this.generatedCss + ";";
                              }
                              else
                              {
                                  this.generatedCss = this.generatedCss + ",";
                              }
                              /* Do a comma for the next one, or a semicolon for the last one END */

                          });

                          this.generatedCss = this.generatedCss + "background-repeat: repeat-y;";
                          this.generatedCss = this.generatedCss + "background-size: ";

                          designDataReversed.forEach((x, index) => {
                              if ((x.type == "rectangle")) {
                                  this.generatedCss = this.generatedCss + "" + this.determineRectangleWidth(x) + " " + this.repeatDesign + "px";
                              }
                              if ((x.type == "circle")) {
                                  this.generatedCss = this.generatedCss + "" + x.diameter + "" + x.diameterMeasurement + " " + this.repeatDesign + "px";
                              }

                              /* Do a comma for the next one, or a semicolon for the last one START */
                              if (index == designDataReversed.length - 1) {
                                  this.generatedCss = this.generatedCss + ";";
                              }
                              else {
                                  this.generatedCss = this.generatedCss + ",";
                              }
                              /* Do a comma for the next one, or a semicolon for the last one END */

                          });

                          this.generatedCss = this.generatedCss + "background-position: ";

                          designDataReversed.forEach((x, index) => {
                          
                                  this.generatedCss = this.generatedCss + "" + this.determineHorizontalPositioningOfShape(x) + " " + this.determineVerticalPositioningOfShape(x) + "";
                              

                              /* Do a comma for the next one, or a semicolon for the last one START */
                                  if (index == designDataReversed.length - 1) {
                                  this.generatedCss = this.generatedCss + ";";
                              }
                              else {
                                  this.generatedCss = this.generatedCss + ",";
                              }
                              /* Do a comma for the next one, or a semicolon for the last one END */

                          });

                          this.generatedCss = this.generatedCss + "}";

                          
                          /* BLOCK 1 END */

                          /* BLOCK 2 START */
                          this.generatedCss = this.generatedCss + ".skeleton-" + this.randomSkeletonName+":empty:before {";
                          this.generatedCss = this.generatedCss + "content: ' '; position: absolute; z-index: "+this.shapesZIndex+"; width: 100%; height: " + this.canvasHeight+"px;";
                          this.generatedCss = this.generatedCss + "-webkit-mask-image: linear-gradient( "+this.shimmerAngle+"deg, "; /* highlight */
                          
                          this.shimmerGradientStages.forEach((x, index) => {
                
                            // Since rectangles are only straight angles we can't do an antialias option anyway
                            this.generatedCss = this.generatedCss + "rgba(255, 255, 255, "+x.opacity+") "+x.step+"%";
            
                            /* Do a comma for the next one, or a semicolon for the last one START */
                            if (index == this.shimmerGradientStages.length - 1) {
                                this.generatedCss = this.generatedCss + "";
                            }
                            else
                            {
                                this.generatedCss = this.generatedCss + ",";
                            }
                            /* Do a comma for the next one, or a semicolon for the last one END */
            
                            });

                          this.generatedCss = this.generatedCss + " ); -webkit-mask-repeat : repeat-y; -webkit-mask-size : " + this.shimmerWidth+"px " + this.canvasHeight+"px; -webkit-mask-position: -20% 0;"; /* highlight */
                          this.generatedCss = this.generatedCss + "background-image: "; /* highlight */

                          designDataReversed.forEach((x, index) => {
                              if ((x.type == "rectangle"))
                              {
                                  // Since rectangles are only straight angles we can't do an antialias option anyway
                                  this.generatedCss = this.generatedCss + "linear-gradient( "+amendedShimmerColor2+" "+this.determineRectangleHeightResultView(x)+", transparent 0 )";
                              }
                              if ((x.type == "circle")) {
                                  if ((x.antialias == false))
                                  {
                                      this.generatedCss = this.generatedCss + "radial-gradient( circle " + x.diameter! / 2 + "px at " + x.diameter! / 2 + "px " + x.diameter! / 2 + "px, "+amendedShimmerColor2+" 99%, transparent 0 )";
                                  }
                                  else
                                  {
                                      this.generatedCss = this.generatedCss + "radial-gradient( circle " + x.diameter! / 2 + "px at " + x.diameter! / 2 + "px " + x.diameter! / 2 + "px, "+amendedShimmerColor2+" " + (x.diameter! / 2 - 1) + "px, transparent " + x.diameter! / 2 + "px )";
                                  }
                              }

                              /* Do a comma for the next one, or a semicolon for the last one START */
                              if (index == designDataReversed.length - 1) {
                                  this.generatedCss = this.generatedCss + ";";
                              }
                              else
                              {
                                  this.generatedCss = this.generatedCss + ",";
                              }
                              /* Do a comma for the next one, or a semicolon for the last one END */

                          });

                          this.generatedCss = this.generatedCss + "background-repeat: repeat-y;";
                          this.generatedCss = this.generatedCss + "background-size: ";

                          designDataReversed.forEach((x, index) => {
                              if ((x.type == "rectangle")) {
                                  this.generatedCss = this.generatedCss + "" + this.determineRectangleWidth(x) + " " + this.repeatDesign + "px";
                              }
                              if ((x.type == "circle")) {
                                  this.generatedCss = this.generatedCss + "" + x.diameter + "" + x.diameterMeasurement + " " + this.repeatDesign + "px";
                              }

                              /* Do a comma for the next one, or a semicolon for the last one START */
                              if (index == designDataReversed.length - 1) {
                                  this.generatedCss = this.generatedCss + ";";
                              }
                              else {
                                  this.generatedCss = this.generatedCss + ",";
                              }
                              /* Do a comma for the next one, or a semicolon for the last one END */

                          });

                          this.generatedCss = this.generatedCss + "background-position: ";

                          designDataReversed.forEach((x, index) => {
                          
                                  this.generatedCss = this.generatedCss + "" + this.determineHorizontalPositioningOfShape(x) + " " + this.determineVerticalPositioningOfShape(x) + "";
                              

                              /* Do a comma for the next one, or a semicolon for the last one START */
                                  if (index == designDataReversed.length - 1) {
                                  this.generatedCss = this.generatedCss + ";";
                              }
                              else {
                                  this.generatedCss = this.generatedCss + ",";
                              }
                              /* Do a comma for the next one, or a semicolon for the last one END */

                          });
                          /* BLOCK 2 END */
                          /* Begin initial values END */
          }

          if ((this.shimmerType == 1))
          {

              console.log(this.shimmerColor);
              let amendedShimmerColor1 = this.shimmerColor.replace("rgb(", "");
              let amendedShimmerColor2 = amendedShimmerColor1.replace(")", "");
              console.log(amendedShimmerColor2);
              

              /* Begin initial values START */
              this.generatedCss = this.generatedCss + ".skeleton-" + this.randomSkeletonName+":empty {";
              this.generatedCss = this.generatedCss + "height: " + this.canvasHeight+"px; background-color: " + this.canvasColor+"; border-radius: "+this.canvasBorderRadiusTopLeft+"px "+this.canvasBorderRadiusTopRight+"px "+this.canvasBorderRadiusBottomRight+"px "+this.canvasBorderRadiusBottomLeft+"px; ";
              this.generatedCss = this.generatedCss + "background-image: linear-gradient( "+this.shimmerAngle+"deg, "; /* highlight */

              this.shimmerGradientStages.forEach((x, index) => {
                
                // Since rectangles are only straight angles we can't do an antialias option anyway
                this.generatedCss = this.generatedCss + "rgba("+amendedShimmerColor2+", "+x.opacity+") "+x.step+"%";

                /* Do a comma for the next one, or a semicolon for the last one START */
                if (index == this.shimmerGradientStages.length - 1) {
                    this.generatedCss = this.generatedCss + "";
                }
                else
                {
                    this.generatedCss = this.generatedCss + ",";
                }
                /* Do a comma for the next one, or a semicolon for the last one END */

                });

              this.generatedCss = this.generatedCss + " ),"; /* highlight */

              designDataReversed.forEach((x, index) => {
                  if ((x.type == "rectangle"))
                  {
                      // Since rectangles are only straight angles we can't do an antialias option anyway
                      this.generatedCss = this.generatedCss + "linear-gradient( "+x.color+" "+this.determineRectangleHeightResultView(x)+", transparent 0 )";
                  }
                  if ((x.type == "circle")) {
                      if ((x.antialias == false))
                      {
                          this.generatedCss = this.generatedCss + "radial-gradient( circle " + x.diameter! / 2 + "px at " + x.diameter! / 2 + "px " + x.diameter! / 2 + "px, " + x.color + " 99%, transparent 0 )";
                      }
                      else
                      {
                          this.generatedCss = this.generatedCss + "radial-gradient( circle " + x.diameter! / 2 + "px at " + x.diameter! / 2 + "px " + x.diameter! / 2 + "px, " + x.color + " " + (x.diameter! / 2 - 1) + "px, transparent " + x.diameter! / 2 + "px )";
                      }
                  }

                  /* Do a comma for the next one, or a semicolon for the last one START */
                  if (index == designDataReversed.length - 1) {
                      this.generatedCss = this.generatedCss + ";";
                  }
                  else
                  {
                      this.generatedCss = this.generatedCss + ",";
                  }
                  /* Do a comma for the next one, or a semicolon for the last one END */

              });

              this.generatedCss = this.generatedCss + "background-repeat: repeat-y;";
              this.generatedCss = this.generatedCss + "background-size: " + this.shimmerWidth+"px " + this.canvasHeight+"px,";

              designDataReversed.forEach((x, index) => {
                  if ((x.type == "rectangle")) {
                      this.generatedCss = this.generatedCss + "" + this.determineRectangleWidth(x) + " " + this.repeatDesign + "px";
                  }
                  if ((x.type == "circle")) {
                      this.generatedCss = this.generatedCss + "" + x.diameter + "" + x.diameterMeasurement + " " + this.repeatDesign + "px";
                  }

                  /* Do a comma for the next one, or a semicolon for the last one START */
                  if (index == designDataReversed.length - 1) {
                      this.generatedCss = this.generatedCss + ";";
                  }
                  else {
                      this.generatedCss = this.generatedCss + ",";
                  }
                  /* Do a comma for the next one, or a semicolon for the last one END */

              });

              this.generatedCss = this.generatedCss + "background-position: -20% 0,";

              designDataReversed.forEach((x, index) => {
              
                      this.generatedCss = this.generatedCss + "" + this.determineHorizontalPositioningOfShape(x) + " " + this.determineVerticalPositioningOfShape(x) + "";
                  

                  /* Do a comma for the next one, or a semicolon for the last one START */
                      if (index == designDataReversed.length - 1) {
                      this.generatedCss = this.generatedCss + ";";
                  }
                  else {
                      this.generatedCss = this.generatedCss + ",";
                  }
                  /* Do a comma for the next one, or a semicolon for the last one END */

              });

              /* Begin initial values END */
          }

          if ((this.shimmerType == 2))
          {

              /* Begin initial values START */
                          /* BLOCK 1 START */
                          this.generatedCss = this.generatedCss + ".skeleton-" + this.randomSkeletonName+":empty {";
                          this.generatedCss = this.generatedCss + "position: relative; height: " + this.canvasHeight+"px; background-color: " + this.canvasColor+"; border-radius: "+this.canvasBorderRadiusTopLeft+"px "+this.canvasBorderRadiusTopRight+"px "+this.canvasBorderRadiusBottomRight+"px "+this.canvasBorderRadiusBottomLeft+"px; ";
                          this.generatedCss = this.generatedCss + "}";

                          
                          /* BLOCK 1 END */

                          /* BLOCK 2 START */
                          this.generatedCss = this.generatedCss + ".skeleton-" + this.randomSkeletonName+":empty:before {";
                          this.generatedCss = this.generatedCss + "content: ' '; position: absolute; z-index: "+this.shapesZIndex+"; width: 100%; height: " + this.canvasHeight+"px;";
                          this.generatedCss = this.generatedCss + "background-image: "; /* highlight */

                          designDataReversed.forEach((x, index) => {
                              if ((x.type == "rectangle"))
                              {
                                  // Since rectangles are only straight angles we can't do an antialias option anyway
                                  this.generatedCss = this.generatedCss + "linear-gradient( "+x.color+" "+this.determineRectangleHeightResultView(x)+", transparent 0 )";
                              }
                              if ((x.type == "circle")) {
                                  if ((x.antialias == false))
                                  {
                                      this.generatedCss = this.generatedCss + "radial-gradient( circle " + x.diameter! / 2 + "px at " + x.diameter! / 2 + "px " + x.diameter! / 2 + "px, " + x.color + " 99%, transparent 0 )";
                                  }
                                  else
                                  {
                                      this.generatedCss = this.generatedCss + "radial-gradient( circle " + x.diameter! / 2 + "px at " + x.diameter! / 2 + "px " + x.diameter! / 2 + "px, " + x.color + " " + (x.diameter! / 2 - 1) + "px, transparent " + x.diameter! / 2 + "px )";
                                  }
                              }

                              /* Do a comma for the next one, or a semicolon for the last one START */
                              if (index == designDataReversed.length - 1) {
                                  this.generatedCss = this.generatedCss + ";";
                              }
                              else
                              {
                                  this.generatedCss = this.generatedCss + ",";
                              }
                              /* Do a comma for the next one, or a semicolon for the last one END */

                          });

                          this.generatedCss = this.generatedCss + "background-repeat: repeat-y;";
                          this.generatedCss = this.generatedCss + "background-size: ";

                          designDataReversed.forEach((x, index) => {
                              if ((x.type == "rectangle")) {
                                  this.generatedCss = this.generatedCss + "" + this.determineRectangleWidth(x) + " " + this.repeatDesign + "px";
                              }
                              if ((x.type == "circle")) {
                                  this.generatedCss = this.generatedCss + "" + x.diameter + "" + x.diameterMeasurement + " " + this.repeatDesign + "px";
                              }

                              /* Do a comma for the next one, or a semicolon for the last one START */
                              if (index == designDataReversed.length - 1) {
                                  this.generatedCss = this.generatedCss + ";";
                              }
                              else {
                                  this.generatedCss = this.generatedCss + ",";
                              }
                              /* Do a comma for the next one, or a semicolon for the last one END */

                          });

                          this.generatedCss = this.generatedCss + "background-position: ";

                          designDataReversed.forEach((x, index) => {
                          
                                  this.generatedCss = this.generatedCss + "" + this.determineHorizontalPositioningOfShape(x) + " " + this.determineVerticalPositioningOfShape(x) + "";
                              

                              /* Do a comma for the next one, or a semicolon for the last one START */
                                  if (index == designDataReversed.length - 1) {
                                  this.generatedCss = this.generatedCss + ";";
                              }
                              else {
                                  this.generatedCss = this.generatedCss + ",";
                              }
                              /* Do a comma for the next one, or a semicolon for the last one END */

                          });
                          /* BLOCK 2 END */
                          /* Begin initial values END */
          }
          
          this.generatedCss = this.generatedCss + "animation: shineForSkeleton-" + this.randomSkeletonName + " " + this.playShimmerDuration + "s infinite;}";

          /* Animation START */
          if ((this.shimmerType == 0))
          {
              this.generatedCss = this.generatedCss + "@keyframes shineForSkeleton-" + this.randomSkeletonName +" {to {-webkit-mask-position: 120% 0}}";
          }

          if ((this.shimmerType == 1))
          {
              this.generatedCss = this.generatedCss + "@keyframes shineForSkeleton-" + this.randomSkeletonName +" {to {background-position: 120% 0,";

              designDataReversed.forEach((x, index) => {

                  this.generatedCss = this.generatedCss + "" + this.determineHorizontalPositioningOfShape(x) + " " + this.determineVerticalPositioningOfShape(x) + "";
  
  
                  /* Do a comma for the next one, or a semicolon for the last one START */
                  if (index == designDataReversed.length - 1) {
                      this.generatedCss = this.generatedCss + ";";
                  }
                  else {
                      this.generatedCss = this.generatedCss + ",";
                  }
                  /* Do a comma for the next one, or a semicolon for the last one END */
  
              });
  
              this.generatedCss = this.generatedCss + "}}";
          }

          if ((this.shimmerType == 2))
          {
              this.generatedCss = this.generatedCss + "@keyframes shineForSkeleton-" + this.randomSkeletonName +" {0% {opacity: 1;}50% {opacity: 0;}100% {opacity: 1;}}";
          }
          /* Animation END */

      }


      //this.generatedCss = '#designCanvas {background-color: pink}';
      const head = document.getElementsByTagName('head')[0];
      const style = document.createElement('style');
      style.type = 'text/css';
      style.id = 'andrew';
      style.appendChild(document.createTextNode(this.generatedCss));
      head.appendChild(style);
  }


  addCircle(position: any) {
      this.designData.push({
          "type": "circle",
          "width": null,
          "widthMeasurement": null,
          "widthCalc": null,
          "widthCalcAmount": null,
          "widthCalcUnit": null,
          "height": null,
          "heightMeasurement": null,
          "heightCalc": null,
          "heightCalcAmount": null,
          "heightCalcUnit": null,
          "diameter": 28,
          "diameterMeasurement": "px",
          "diameterCalc": null,
          "diameterCalcAmount": null,
          "diameterCalcUnit": null,
          "color": this.newShapeColor,
          "horizontalPositioningStartingPoint": "left",
          "horizontalPositioningAmount": position.x,
          "horizontalPositioningUnit": "px",
          "verticalPositioningStartingPoint": "top",
          "verticalPositioningAmount": position.y,
          "verticalPositioningUnit": "px",
          "allowShimmerOverlay": true,
          "antialias": true
      });

      

      this.generate();
  }


  addRectangle(position: any) {
      this.designData.push({
          "type": "rectangle",
          "width": 300,
          "widthMeasurement": "px",
          "widthCalc": null,
          "widthCalcAmount": null,
          "widthCalcUnit": null,
          "height": 20,
          "heightMeasurement": "px",
          "heightCalc": null,
          "heightCalcAmount": null,
          "heightCalcUnit": null,
          "diameter": null,
          "diameterMeasurement": null,
          "diameterCalc": null,
          "diameterCalcAmount": null,
          "diameterCalcUnit": null,
          "color": this.newShapeColor,
          "horizontalPositioningStartingPoint": "left",
          "horizontalPositioningAmount": position.x,
          "horizontalPositioningUnit": "px",
          "verticalPositioningStartingPoint": "top",
          "verticalPositioningAmount": position.y,
          "verticalPositioningUnit": "px",
          "allowShimmerOverlay": true,
          "antialias": true
      });

      

      this.generate();
  }


  highlightItem(index: number, item: ShapeDetails)
  {

      console.log("qwwww");

      this.selectedType = item.type;

      this.highlightedItem = index;

      this.myForm.controls['width'].patchValue(item.width);
      this.myForm.controls['widthMeasurement'].patchValue(item.widthMeasurement);
      this.myForm.controls['widthCalc'].patchValue(item.widthCalc);
      this.myForm.controls['widthCalcAmount'].patchValue(item.widthCalcAmount);
      this.myForm.controls['widthCalcUnit'].patchValue(item.widthCalcUnit);
      this.myForm.controls['height'].patchValue(item.height);
      this.myForm.controls['heightMeasurement'].patchValue(item.heightMeasurement);
      this.myForm.controls['heightCalc'].patchValue(item.heightCalc);
      this.myForm.controls['heightCalcAmount'].patchValue(item.heightCalcAmount);
      this.myForm.controls['heightCalcUnit'].patchValue(item.heightCalcUnit);
      this.myForm.controls['diameter'].patchValue(item.diameter);
      this.myForm.controls['diameterMeasurement'].patchValue(item.diameterMeasurement);
      this.myForm.controls['diameterCalc'].patchValue(item.diameterCalc);
      this.myForm.controls['diameterCalcAmount'].patchValue(item.diameterCalcAmount);
      this.myForm.controls['diameterCalcUnit'].patchValue(item.diameterCalcUnit);
      this.myForm.controls['color'].patchValue(item.color);
      this.myForm.controls['horizontalPositioningStartingPoint'].patchValue(item.horizontalPositioningStartingPoint);
      this.myForm.controls['horizontalPositioningAmount'].patchValue(item.horizontalPositioningAmount);
      this.myForm.controls['horizontalPositioningUnit'].patchValue(item.horizontalPositioningUnit);
      this.myForm.controls['verticalPositioningStartingPoint'].patchValue(item.verticalPositioningStartingPoint);
      this.myForm.controls['verticalPositioningAmount'].patchValue(item.verticalPositioningAmount);
      this.myForm.controls['verticalPositioningUnit'].patchValue(item.verticalPositioningUnit);
      this.myForm.controls['allowShimmerOverlay'].patchValue(item.allowShimmerOverlay);
      this.myForm.controls['antialias'].patchValue(item.antialias);
  }


  deleteItem(index: number)
  {

      this.highlightedItem = -1;
      this.selectedType = null;

      this.designData.splice(index, 1)
      
      this.generate();
  }





  onPaste(pasteEvent: any) {
      
      // consider the first item (can be easily extended for multiple items)
      var item = pasteEvent.clipboardData.items[0];
     
      if (item.type.indexOf("image") === 0) {
        var blob = item.getAsFile();
     
        var reader = new FileReader();
        reader.onload = (event) => {
          //console.log(event.target.result);
          this.designCanvasTempBackgroundImage = event.target!.result;
          this.tempBackgroundXPos = 0;
          this.tempBackgroundYPos = 0;
        };
     
        reader.readAsDataURL(blob);
      }
    }


  


}
