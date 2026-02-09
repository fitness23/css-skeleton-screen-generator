import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, TemplateRef, ViewChild, ViewContainerRef, computed, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { filter, take, debounceTime } from 'rxjs/operators';
import { fromEvent, Subscription } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DesignViewComponent } from './components/design-view/design-view.component';
import { ResultCodeComponent } from './components/result-code/result-code.component';
import { ResultViewComponent } from './components/result-view/result-view.component';
import { ToolsPanelComponent } from './components/tools-panel/tools-panel.component';
import { ShapeDetails, ShapeTemplate } from './shared/interfaces/shape-template-interface';
import { GeneralService } from './shared/services/general.service';
import { UserPreset } from './shared/interfaces/user-preset-interface';
import { CdkDragEnd } from '@angular/cdk/drag-drop';

interface HistoryState {
  selectedTemplate: string;
  newShapeColor: string;
  designData: ShapeDetails[];
  canvas: Record<string, any>;
  designCanvasTempBackgroundImage: string | null;
  tempBackgroundXPos: number;
  tempBackgroundYPos: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DesignViewComponent, ToolsPanelComponent, ResultViewComponent, ResultCodeComponent],
  providers: [GeneralService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  isFocused = signal(false);
  public myForm!: FormGroup;
  public canvasPropertiesForm!: FormGroup;
  newShapeColor = signal("#F5F7F9");
  selectedTemplate = signal("");
  highlightedItem = signal(-1);
  randomSkeletonName = "";
  generatedCss = signal("");

  designCanvasTempBackgroundImage = signal<string | null>(null);
  tempBackgroundXPos = signal(100);
  tempBackgroundYPos = signal(100);

  designData = signal<ShapeDetails[]>([]);
  selectedType = computed<'rectangle' | 'circle' | null>(() => {
    const index = this.highlightedItem();
    const data = this.designData();
    if (index < 0 || index >= data.length) {
      return null;
    }
    return data[index].type;
  });

  option1: ShapeTemplate = this.generalService.presetOption1();
  option2: ShapeTemplate = this.generalService.presetOption2();
  option3: ShapeTemplate = this.generalService.presetOption3();
  option4: ShapeTemplate = this.generalService.presetOption4();

  sub?: Subscription;
  overlayRef: OverlayRef | null = null;
  @ViewChild('userMenu') userMenu!: TemplateRef<any>;

  showModal = signal(false);
  showTips = signal(true);
  userPresets = signal<UserPreset[]>([]);
  presetName = signal("");
  showAdvancedControls = signal(false);
  showGuide = signal(false);
  history = signal<HistoryState[]>([]);
  historyIndex = signal(-1);
  private isApplyingHistory = false;
  private lastHistorySnapshot = "";


  constructor(private generalService: GeneralService, private fb: FormBuilder, public overlay: Overlay, public viewContainerRef: ViewContainerRef) { }

  get opacitySteps() {
    return this.canvasPropertiesForm.get('opacitySteps') as FormArray;
  }

  addOpacityStep() {
    this.opacitySteps.push(this.fb.group({
      opacity: [0.5, Validators.required],
      step: [50, Validators.required]
    }));
    this.generate();
  }

  removeOpacityStep(index: number) {
    this.opacitySteps.removeAt(index);
    this.generate();
  }
  
  ngOnInit() {

    this.canvasPropertiesForm = this.fb.group({
        canvasColor: ["#ffffff"],
        canvasHeight: [170],
        repeatDesign: [170],
        shapesZIndex: [1],
        canvasBorderRadiusTopLeft: [0],
        canvasBorderRadiusTopRight: [0],
        canvasBorderRadiusBottomRight: [0],
        canvasBorderRadiusBottomLeft: [0],
        showShimmer: [true],
        shimmerType: 0,
        playShimmerDuration: [2],
        shimmerAngle: [94],
        shimmerColor: ["rgb(226,227,233)"],
        shimmerWidth: [90],
        shimmerStartPosition: [-20],
        shimmerEndPosition: [120],
        opacitySteps: this.fb.array([])
      });

      this.opacitySteps.push(this.fb.group({
        opacity: [0, Validators.required],
        step: [20, Validators.required]
      }));

      this.opacitySteps.push(this.fb.group({
        opacity: [1, Validators.required],
        step: [50, Validators.required]
      }));

      this.opacitySteps.push(this.fb.group({
        opacity: [0, Validators.required],
        step: [80, Validators.required]
      }));

      /* */

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
          borderRadiusTopLeft: [0],
          borderRadiusTopRight: [0],
          borderRadiusBottomRight: [0],
          borderRadiusBottomLeft: [0],
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

      this.loadPresetsFromStorage();
      this.loadGuideStateFromStorage();
      this.createTemplate('option1');

      




      

  }


  onFocus() {
    this.isFocused.set(true);
  }

  onBlur() {
    this.isFocused.set(false);
  }


  closeModal(){
    this.showModal.set(false);
  }

  deleteBackgroundImage(){
    this.closeModal();
    this.designCanvasTempBackgroundImage.set(null);
  }

  onShapeDragEnd(index: number, event: CdkDragEnd): void {
    const canvas = document.getElementById('designCanvas');
    const element = event.source.getRootElement();
    if (!canvas || !element) {
      return;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const left = Math.round(elementRect.left - canvasRect.left);
    const top = Math.round(elementRect.top - canvasRect.top);
    const right = Math.round(canvasRect.right - elementRect.right);
    const bottom = Math.round(canvasRect.bottom - elementRect.bottom);
    const centerXOffset = Math.round(
      (elementRect.left + elementRect.width / 2) - (canvasRect.left + canvasRect.width / 2)
    );
    const centerYOffset = Math.round(
      (elementRect.top + elementRect.height / 2) - (canvasRect.top + canvasRect.height / 2)
    );

    const data = [...this.designData()];
    const target = data[index];
    if (!target) {
      return;
    }

    const resolveUnitAmount = (unit: string | null, pxValue: number, axisSize: number) => {
      if (unit === '%' && axisSize > 0) {
        return parseFloat(((pxValue / axisSize) * 100).toFixed(2));
      }
      return pxValue;
    };

    switch (target.horizontalPositioningStartingPoint) {
      case 'right': {
        const amount = resolveUnitAmount(target.horizontalPositioningUnit, right, canvasRect.width);
        target.horizontalPositioningAmount = amount;
        target.horizontalPositioningUnit = target.horizontalPositioningUnit ?? 'px';
        break;
      }
      case 'center': {
        target.horizontalPositioningStartingPoint = 'left';
        target.horizontalPositioningAmount = left;
        target.horizontalPositioningUnit = 'px';
        break;
      }
      default: {
        const amount = resolveUnitAmount(target.horizontalPositioningUnit, left, canvasRect.width);
        target.horizontalPositioningAmount = amount;
        target.horizontalPositioningUnit = target.horizontalPositioningUnit ?? 'px';
        target.horizontalPositioningStartingPoint = 'left';
        break;
      }
    }

    switch (target.verticalPositioningStartingPoint) {
      case 'bottom': {
        const amount = resolveUnitAmount(target.verticalPositioningUnit, bottom, canvasRect.height);
        target.verticalPositioningAmount = amount;
        target.verticalPositioningUnit = target.verticalPositioningUnit ?? 'px';
        break;
      }
      case 'center': {
        target.verticalPositioningStartingPoint = 'top';
        target.verticalPositioningAmount = top;
        target.verticalPositioningUnit = 'px';
        break;
      }
      default: {
        const amount = resolveUnitAmount(target.verticalPositioningUnit, top, canvasRect.height);
        target.verticalPositioningAmount = amount;
        target.verticalPositioningUnit = target.verticalPositioningUnit ?? 'px';
        target.verticalPositioningStartingPoint = 'top';
        break;
      }
    }

    this.designData.set(data);
    event.source.reset();

    if (this.highlightedItem() === index) {
      this.myForm.controls['horizontalPositioningStartingPoint'].patchValue(target.horizontalPositioningStartingPoint);
      this.myForm.controls['horizontalPositioningAmount'].patchValue(target.horizontalPositioningAmount);
      this.myForm.controls['horizontalPositioningUnit'].patchValue(target.horizontalPositioningUnit);
      this.myForm.controls['verticalPositioningStartingPoint'].patchValue(target.verticalPositioningStartingPoint);
      this.myForm.controls['verticalPositioningAmount'].patchValue(target.verticalPositioningAmount);
      this.myForm.controls['verticalPositioningUnit'].patchValue(target.verticalPositioningUnit);
    }

    this.generate();
  }

  undo(): void {
    const index = this.historyIndex();
    if (index <= 0) {
      return;
    }
    this.applyHistoryState(this.history()[index - 1]);
    this.historyIndex.set(index - 1);
  }

  redo(): void {
    const index = this.historyIndex();
    const items = this.history();
    if (index >= items.length - 1) {
      return;
    }
    this.applyHistoryState(items[index + 1]);
    this.historyIndex.set(index + 1);
  }

  canUndo(): boolean {
    return this.historyIndex() > 0;
  }

  canRedo(): boolean {
    return this.historyIndex() >= 0 && this.historyIndex() < this.history().length - 1;
  }

  private loadPresetsFromStorage(): void {
    try {
      const raw = window.localStorage.getItem('css-skeleton-presets');
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as UserPreset[];
      if (Array.isArray(parsed)) {
        this.userPresets.set(parsed);
      }
    } catch {
      this.userPresets.set([]);
    }
  }

  private loadGuideStateFromStorage(): void {
    try {
      const dismissed = window.localStorage.getItem('css-skeleton-guide-dismissed');
      this.showGuide.set(dismissed !== 'true');
    } catch {
      this.showGuide.set(true);
    }
  }

  dismissGuide(): void {
    this.showGuide.set(false);
    try {
      window.localStorage.setItem('css-skeleton-guide-dismissed', 'true');
    } catch {
      // Ignore storage failures.
    }
  }

  private persistPresets(presets: UserPreset[]): void {
    try {
      window.localStorage.setItem('css-skeleton-presets', JSON.stringify(presets));
    } catch {
      // Ignore storage failures.
    }
  }

  private createPresetId(): string {
    if (window.crypto && 'randomUUID' in window.crypto) {
      return window.crypto.randomUUID();
    }
    return `preset_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  private normalizePreset(raw: any): UserPreset | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const name = typeof raw.name === 'string' ? raw.name : '';
    const template = typeof raw.template === 'string' ? raw.template : 'custom';
    const newShapeColor = typeof raw.newShapeColor === 'string' ? raw.newShapeColor : '#F5F7F9';
    const shapes = Array.isArray(raw.shapes) ? raw.shapes : [];
    const canvas = typeof raw.canvas === 'object' && raw.canvas ? raw.canvas : {};

    return {
      id: typeof raw.id === 'string' ? raw.id : this.createPresetId(),
      name: name || `Preset ${new Date().toLocaleDateString()}`,
      createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
      template,
      newShapeColor,
      canvas,
      shapes
    };
  }

  private setOpacitySteps(steps: { opacity: number; step: number }[]): void {
    const array = this.opacitySteps;
    while (array.length > 0) {
      array.removeAt(0);
    }
    steps.forEach((step) => {
      array.push(this.fb.group({
        opacity: [step.opacity, Validators.required],
        step: [step.step, Validators.required]
      }));
    });
  }

  private recordHistory(): void {
    if (this.isApplyingHistory) {
      return;
    }
    const snapshot = this.buildHistorySnapshot();
    if (snapshot.serialized === this.lastHistorySnapshot) {
      return;
    }
    this.lastHistorySnapshot = snapshot.serialized;

    const items = this.history();
    const index = this.historyIndex();
    const next = index < items.length - 1 ? items.slice(0, index + 1) : items;
    next.push(snapshot.state);
    const capped = next.length > 50 ? next.slice(next.length - 50) : next;
    this.history.set(capped);
    this.historyIndex.set(capped.length - 1);
  }

  private buildHistorySnapshot(): { serialized: string; state: HistoryState } {
    const state: HistoryState = {
      selectedTemplate: this.selectedTemplate(),
      newShapeColor: this.newShapeColor(),
      designData: structuredClone(this.designData()),
      canvas: this.canvasPropertiesForm.getRawValue(),
      designCanvasTempBackgroundImage: this.designCanvasTempBackgroundImage(),
      tempBackgroundXPos: this.tempBackgroundXPos(),
      tempBackgroundYPos: this.tempBackgroundYPos()
    };
    return { serialized: JSON.stringify(state), state };
  }

  private applyHistoryState(state: HistoryState): void {
    this.isApplyingHistory = true;
    this.selectedTemplate.set(state.selectedTemplate);
    this.newShapeColor.set(state.newShapeColor);
    this.designData.set(structuredClone(state.designData));
    this.designCanvasTempBackgroundImage.set(state.designCanvasTempBackgroundImage);
    this.tempBackgroundXPos.set(state.tempBackgroundXPos);
    this.tempBackgroundYPos.set(state.tempBackgroundYPos);
    this.canvasPropertiesForm.patchValue(state.canvas);
    this.setOpacitySteps(state.canvas['opacitySteps'] ?? []);
    this.highlightedItem.set(-1);
    this.generate();
    this.isApplyingHistory = false;
  }

  updatePresetName(name: string): void {
    this.presetName.set(name);
  }

  savePreset(): void {
    const name = this.presetName().trim();
    if (!name) {
      return;
    }

    const preset: UserPreset = {
      id: this.createPresetId(),
      name,
      createdAt: Date.now(),
      template: this.selectedTemplate(),
      newShapeColor: this.newShapeColor(),
      canvas: this.canvasPropertiesForm.getRawValue(),
      shapes: structuredClone(this.designData())
    };

    const updated = [preset, ...this.userPresets()];
    this.userPresets.set(updated);
    this.persistPresets(updated);
    this.presetName.set("");
  }

  loadPreset(id: string): void {
    const preset = this.userPresets().find((item) => item.id === id);
    if (!preset) {
      return;
    }

    this.selectedTemplate.set(preset.template || 'custom');
    this.newShapeColor.set(preset.newShapeColor);
    this.designData.set(structuredClone(preset.shapes));
    this.highlightedItem.set(-1);

    this.canvasPropertiesForm.patchValue(preset.canvas);
    this.setOpacitySteps(preset.canvas['opacitySteps'] ?? []);

    this.generate();
  }

  deletePreset(id: string): void {
    const updated = this.userPresets().filter((preset) => preset.id !== id);
    this.userPresets.set(updated);
    this.persistPresets(updated);
  }

  exportPresets(): void {
    const data = JSON.stringify(this.userPresets(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `css-skeleton-presets-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  importPresets(file?: File): void {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = reader.result;
        if (typeof raw !== 'string') {
          return;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return;
        }
        const normalized = parsed
          .map((item) => this.normalizePreset(item))
          .filter((item): item is UserPreset => item != null);

        if (normalized.length === 0) {
          return;
        }

        const existing = this.userPresets();
        const existingIds = new Set(existing.map((preset) => preset.id));
        const merged = [...existing];
        normalized.forEach((preset) => {
          if (existingIds.has(preset.id)) {
            merged.push({
              ...preset,
              id: this.createPresetId()
            });
          } else {
            merged.push(preset);
          }
        });
        this.userPresets.set(merged);
        this.persistPresets(merged);
      } catch {
        // ignore malformed import
      }
    };
    reader.readAsText(file);
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

              if ((this.highlightedItem() != -1))
              {
                  this.myForm.controls['horizontalPositioningAmount'].patchValue(this.myForm.controls['horizontalPositioningAmount'].value-1);
              }
              else
              {
                  this.tempBackgroundXPos.update((value) => value - 1);
              }
          }

          if ((event.key === 'ArrowRight'))
          {
              event.preventDefault(); //Prevent the window from scrolling

              if ((this.highlightedItem() != -1))
              {
                  this.myForm.controls['horizontalPositioningAmount'].patchValue(this.myForm.controls['horizontalPositioningAmount'].value+1);
              }
              else
              {
                  this.tempBackgroundXPos.update((value) => value + 1);
              }
          }

          if ((event.key === 'ArrowUp'))
          {
              event.preventDefault(); //Prevent the window from scrolling

              if ((this.highlightedItem() != -1))
              {
                  this.myForm.controls['verticalPositioningAmount'].patchValue(this.myForm.controls['verticalPositioningAmount'].value-1);
              }
              else
              {
                  this.tempBackgroundYPos.update((value) => value - 1);
              }
          }

          if ((event.key === 'ArrowDown'))
          {
              event.preventDefault(); //Prevent the window from scrolling

              if ((this.highlightedItem() != -1))
              {
                  this.myForm.controls['verticalPositioningAmount'].patchValue(this.myForm.controls['verticalPositioningAmount'].value+1);
              }
              else
              {
                  this.tempBackgroundYPos.update((value) => value + 1);
              }
          }
      

      if ((event.key === 'Delete'))
      {
          if ((this.highlightedItem() != -1))
          {
              // Only delete if we are NOT editing an item
              if ((this.isFocused() === false)){
                this.deleteItem(this.highlightedItem());
              }
          }
          else{
            // Only show the modal if there is a background image to start with
            if ((this.designCanvasTempBackgroundImage() != null)){
                this.showModal.set(true);
            }
          }
      }
  }
  /* If a plot is highlighted and the user hits the delete key, then remove that plot at its relavent index END */


  changeCanvasColorBasedOnShimmerType()
  {
      if ((this.canvasPropertiesForm['controls']['shimmerType'].value == 0))
      {
          this.canvasPropertiesForm.controls['canvasColor'].patchValue("#ffffff");
          this.canvasPropertiesForm.controls['shimmerColor'].patchValue("rgb(102,102,102)");
      }
      if ((this.canvasPropertiesForm['controls']['shimmerType'].value == 1))
      {
          this.canvasPropertiesForm.controls['canvasColor'].patchValue("#E1E1E1");
          this.canvasPropertiesForm.controls['shimmerColor'].patchValue("rgb(255,255,255)");
      }
      if ((this.canvasPropertiesForm['controls']['shimmerType'].value == 2))
      {
          this.canvasPropertiesForm.controls['canvasColor'].patchValue("#ffffff");
          this.canvasPropertiesForm.controls['shimmerColor'].patchValue("rgb(102,102,102)");
      }
  }


  onClickedOutside(e: any) {
      // Drop the item focus unless they are clicking within the item specific details div
      var element = document.getElementById('itemSpecificDetails');
      if (element && e.target !== element && !element.contains(e.target))
      {
          this.highlightedItem.set(-1);
      }
      
    }



    open({ x, y }: MouseEvent, clickEvent: MouseEvent) {
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
      this.selectedTemplate.set(option);

      this.highlightedItem.set(-1);

      this.designData.set([]);

      if ((option === "option1")){
        this.designData.set(this['option1'].shapes);
        this.canvasPropertiesForm.controls['canvasHeight'].patchValue(this['option1'].canvasHeight);
        this.canvasPropertiesForm.controls['repeatDesign'].patchValue(this['option1'].repeatDesign);
      }

      if ((option === "option2")){
        this.designData.set(this['option2'].shapes);
        this.canvasPropertiesForm.controls['canvasHeight'].patchValue(this['option2'].canvasHeight);
        this.canvasPropertiesForm.controls['repeatDesign'].patchValue(this['option2'].repeatDesign);
      }

      if ((option === "option3")){
        this.designData.set(this['option3'].shapes);
        this.canvasPropertiesForm.controls['canvasHeight'].patchValue(this['option3'].canvasHeight);
        this.canvasPropertiesForm.controls['repeatDesign'].patchValue(this['option3'].repeatDesign);
      }

      this.generate();
  }



  sendValuesBackToArray() {

      const currentIndex = this.highlightedItem();
      if (currentIndex < 0) {
          return;
      }

      const data = [...this.designData()];

      data[currentIndex].width = this.myForm.value.width;
      data[currentIndex].widthMeasurement = this.myForm.value.widthMeasurement;
      data[currentIndex].widthCalc = this.myForm.value.widthCalc;
      data[currentIndex].widthCalcAmount = this.myForm.value.widthCalcAmount;
      data[currentIndex].widthCalcUnit = this.myForm.value.widthCalcUnit;

      data[currentIndex].height = this.myForm.value.height;
      data[currentIndex].heightMeasurement = this.myForm.value.heightMeasurement;
      data[currentIndex].heightCalc = this.myForm.value.heightCalc;
      data[currentIndex].heightCalcAmount = this.myForm.value.heightCalcAmount;
      data[currentIndex].heightCalcUnit = this.myForm.value.heightCalcUnit;

      data[currentIndex].diameter = this.myForm.value.diameter;
      data[currentIndex].diameterMeasurement = this.myForm.value.diameterMeasurement;
      data[currentIndex].diameterCalc = this.myForm.value.diameterCalc;
      data[currentIndex].diameterCalcAmount = this.myForm.value.diameterCalcAmount;
      data[currentIndex].diameterCalcUnit = this.myForm.value.diameterCalcUnit;
      data[currentIndex].borderRadiusTopLeft = this.myForm.value.borderRadiusTopLeft ?? 0;
      data[currentIndex].borderRadiusTopRight = this.myForm.value.borderRadiusTopRight ?? 0;
      data[currentIndex].borderRadiusBottomRight = this.myForm.value.borderRadiusBottomRight ?? 0;
      data[currentIndex].borderRadiusBottomLeft = this.myForm.value.borderRadiusBottomLeft ?? 0;

      data[currentIndex].color = this.myForm.value.color;

      data[currentIndex].horizontalPositioningStartingPoint = this.myForm.value.horizontalPositioningStartingPoint;
      data[currentIndex].horizontalPositioningAmount = this.myForm.value.horizontalPositioningAmount;
      data[currentIndex].horizontalPositioningUnit = this.myForm.value.horizontalPositioningUnit;

      data[currentIndex].verticalPositioningStartingPoint = this.myForm.value.verticalPositioningStartingPoint;
      data[currentIndex].verticalPositioningAmount = this.myForm.value.verticalPositioningAmount;
      data[currentIndex].verticalPositioningUnit = this.myForm.value.verticalPositioningUnit;

      data[currentIndex].allowShimmerOverlay = this.myForm.value.allowShimmerOverlay;
      data[currentIndex].antialias = this.myForm.value.antialias;

      this.designData.set(data);

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

      return result ?? "";
  }

  determineRectangleHeightDesignView(record: ShapeDetails){

      let startingNumber;

      if ((record.heightMeasurement === "px")){
          startingNumber = record.height;
      }
      else {
          startingNumber = (record.height! * this.canvasPropertiesForm['controls']['repeatDesign'].value) / 100;
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

      return toWrite ?? `${startingNumber}px`;
      
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
          const unit = record.horizontalPositioningUnit ?? "px";
          const amount = Math.abs(record.horizontalPositioningAmount);
          const operator = record.horizontalPositioningAmount >= 0 ? "+" : "-";
          if (record.horizontalPositioningAmount == null || record.horizontalPositioningAmount === 0) {
              return `left 50%`;
          }
          return `left calc(50% ${operator} ${amount}${unit})`;
      }
      return `${record.horizontalPositioningStartingPoint} ${record.horizontalPositioningAmount}${record.horizontalPositioningUnit}`;
  }

  determineVerticalPositioningOfShape(record: ShapeDetails){
      if ((record.verticalPositioningStartingPoint === "center")){
          const unit = record.verticalPositioningUnit ?? "px";
          const amount = Math.abs(record.verticalPositioningAmount);
          const operator = record.verticalPositioningAmount >= 0 ? "+" : "-";
          if (record.verticalPositioningAmount == null || record.verticalPositioningAmount === 0) {
              return `top 50%`;
          }
          return `top calc(50% ${operator} ${amount}${unit})`;
      }
      return `${record.verticalPositioningStartingPoint} ${record.verticalPositioningAmount}${record.verticalPositioningUnit}`;
  }

  private getDesignDataReversed(): ShapeDetails[] {
      return [...this.designData()].reverse();
  }

  private removeGeneratedStyle(): void {
      const existing = document.getElementById("andrew");
      if (existing) {
          existing.remove();
      }
  }

  private buildBaseDeclarations(includePosition: boolean): string {
      const controls = this.canvasPropertiesForm.controls;
      const parts: string[] = [];
      if (includePosition) {
          parts.push("position: relative;");
      }
      parts.push(`height: ${controls['canvasHeight'].value}px;`);
      parts.push(`background-color: ${controls['canvasColor'].value};`);
      parts.push(`border-radius: ${controls['canvasBorderRadiusTopLeft'].value}px ${controls['canvasBorderRadiusTopRight'].value}px ${controls['canvasBorderRadiusBottomRight'].value}px ${controls['canvasBorderRadiusBottomLeft'].value}px;`);
      return parts.join(" ");
  }

  private getRectangleRadii(shape: ShapeDetails) {
      return {
          topLeft: Math.max(0, shape.borderRadiusTopLeft ?? 0),
          topRight: Math.max(0, shape.borderRadiusTopRight ?? 0),
          bottomRight: Math.max(0, shape.borderRadiusBottomRight ?? 0),
          bottomLeft: Math.max(0, shape.borderRadiusBottomLeft ?? 0)
      };
  }

  private buildHorizontalPositionWithOffset(shape: ShapeDetails, offsetPx: number): string {
      const amount = shape.horizontalPositioningAmount ?? 0;
      const unit = shape.horizontalPositioningUnit ?? "px";
      const start = shape.horizontalPositioningStartingPoint;

      if (start === "center") {
          const amountSign = amount >= 0 ? "+" : "-";
          const amountAbs = Math.abs(amount);
          if (offsetPx === 0) {
              if (amountAbs === 0) {
                  return "left 50%";
              }
              return `left calc(50% ${amountSign} ${amountAbs}${unit})`;
          }
          const offsetSign = offsetPx >= 0 ? "+" : "-";
          const offsetAbs = Math.abs(offsetPx);
          if (amountAbs === 0) {
              return `left calc(50% ${offsetSign} ${offsetAbs}px)`;
          }
          return `left calc(50% ${amountSign} ${amountAbs}${unit} ${offsetSign} ${offsetAbs}px)`;
      }

      const keyword = start === "right" ? "right" : "left";
      if (offsetPx === 0) {
          return `${keyword} ${amount}${unit}`;
      }
      return `${keyword} calc(${amount}${unit} + ${offsetPx}px)`;
  }

  private buildShapeLayers(shapes: ShapeDetails[], colorOverride?: string): Array<{ gradient: string; size: string; position: string }> {
      const controls = this.canvasPropertiesForm.controls;
      const repeatDesign = controls['repeatDesign'].value;
      const layers: Array<{ gradient: string; size: string; position: string }> = [];

      shapes.forEach((shape) => {
          const color = colorOverride ?? shape.color;
          const basePosition = `${this.determineHorizontalPositioningOfShape(shape)} ${this.determineVerticalPositioningOfShape(shape)}`;

          if (shape.type === "circle") {
              const radius = (shape.diameter ?? 0) / 2;
              const gradient = shape.antialias === false
                  ? `radial-gradient( circle ${radius}px at ${radius}px ${radius}px, ${color} 99%, transparent 0 )`
                  : `radial-gradient( circle ${radius}px at ${radius}px ${radius}px, ${color} ${radius - 1}px, transparent ${radius}px )`;
              layers.push({
                  gradient,
                  size: `${shape.diameter}${shape.diameterMeasurement} ${repeatDesign}px`,
                  position: basePosition
              });
              return;
          }

          const width = this.determineRectangleWidth(shape);
          const height = this.determineRectangleHeightResultView(shape);
          const baseSize = `${width} ${repeatDesign}px`;
          const radii = this.getRectangleRadii(shape);
          const hasRadius = Object.values(radii).some((value) => value > 0);

          if (!hasRadius) {
              layers.push({
                  gradient: `linear-gradient( ${color} ${height}, transparent 0 )`,
                  size: baseSize,
                  position: basePosition
              });
              return;
          }

          const leftInset = Math.max(radii.topLeft, radii.bottomLeft);
          const rightInset = Math.max(radii.topRight, radii.bottomRight);
          const joinOverlap = 1;
          const leftInsetJoin = Math.max(leftInset - joinOverlap, 0);
          const rightInsetJoin = Math.max(rightInset - joinOverlap, 0);
          const topLeftJoin = Math.max(radii.topLeft - joinOverlap, 0);
          const topRightJoin = Math.max(radii.topRight - joinOverlap, 0);
          const bottomLeftJoin = Math.max(radii.bottomLeft - joinOverlap, 0);
          const bottomRightJoin = Math.max(radii.bottomRight - joinOverlap, 0);
          const topInsetJoin = Math.max(topLeftJoin, topRightJoin);
          const bottomInsetJoin = Math.max(bottomLeftJoin, bottomRightJoin);

          if (radii.topLeft > 0) {
              layers.push({
                  gradient: `radial-gradient( circle ${radii.topLeft}px at ${radii.topLeft}px ${radii.topLeft}px, ${color} ${radii.topLeft}px, transparent ${radii.topLeft}px )`,
                  size: baseSize,
                  position: basePosition
              });
          }

          if (radii.topRight > 0) {
              layers.push({
                  gradient: `radial-gradient( circle ${radii.topRight}px at calc(${width} - ${radii.topRight}px) ${radii.topRight}px, ${color} ${radii.topRight}px, transparent ${radii.topRight}px )`,
                  size: baseSize,
                  position: basePosition
              });
          }

          if (radii.bottomRight > 0) {
              layers.push({
                  gradient: `radial-gradient( circle ${radii.bottomRight}px at calc(${width} - ${radii.bottomRight}px) calc(${height} - ${radii.bottomRight}px), ${color} ${radii.bottomRight}px, transparent ${radii.bottomRight}px )`,
                  size: baseSize,
                  position: basePosition
              });
          }

          if (radii.bottomLeft > 0) {
              layers.push({
                  gradient: `radial-gradient( circle ${radii.bottomLeft}px at ${radii.bottomLeft}px calc(${height} - ${radii.bottomLeft}px), ${color} ${radii.bottomLeft}px, transparent ${radii.bottomLeft}px )`,
                  size: baseSize,
                  position: basePosition
              });
          }

          if (topLeftJoin > 0 || topRightJoin > 0) {
              const topWidth = topLeftJoin === 0 && topRightJoin === 0
                  ? width
                  : `calc(${width} - ${topLeftJoin}px - ${topRightJoin}px)`;
              const topOffset = shape.horizontalPositioningStartingPoint === "center"
                  ? (topLeftJoin - topRightJoin) / 2
                  : (shape.horizontalPositioningStartingPoint === "right" ? topRightJoin : topLeftJoin);
              layers.push({
                  gradient: `linear-gradient(to bottom, ${color} 0 ${Math.max(topLeftJoin, topRightJoin)}px, transparent ${Math.max(topLeftJoin, topRightJoin)}px ${height}, transparent ${height} 100%)`,
                  size: `${topWidth} ${repeatDesign}px`,
                  position: `${this.buildHorizontalPositionWithOffset(shape, topOffset)} ${this.determineVerticalPositioningOfShape(shape)}`
              });
          }

          if (bottomLeftJoin > 0 || bottomRightJoin > 0) {
              const bottomWidth = bottomLeftJoin === 0 && bottomRightJoin === 0
                  ? width
                  : `calc(${width} - ${bottomLeftJoin}px - ${bottomRightJoin}px)`;
              const bottomOffset = shape.horizontalPositioningStartingPoint === "center"
                  ? (bottomLeftJoin - bottomRightJoin) / 2
                  : (shape.horizontalPositioningStartingPoint === "right" ? bottomRightJoin : bottomLeftJoin);
              const bottomInset = Math.max(bottomLeftJoin, bottomRightJoin);
              layers.push({
                  gradient: `linear-gradient(to bottom, transparent 0 calc(${height} - ${bottomInset}px), ${color} calc(${height} - ${bottomInset}px) ${height}, transparent ${height} 100%)`,
                  size: `${bottomWidth} ${repeatDesign}px`,
                  position: `${this.buildHorizontalPositionWithOffset(shape, bottomOffset)} ${this.determineVerticalPositioningOfShape(shape)}`
              });
          }

          layers.push({
              gradient: `linear-gradient(to bottom, transparent 0 ${topInsetJoin}px, ${color} ${topInsetJoin}px calc(${height} - ${bottomInsetJoin}px), transparent calc(${height} - ${bottomInsetJoin}px) 100%)`,
              size: baseSize,
              position: basePosition
          });
      });

      return layers;
  }

  private buildShapeBackgroundDeclarations(shapes: ShapeDetails[], colorOverride?: string): string {
      const layers = this.buildShapeLayers(shapes, colorOverride);
      const gradients = layers.map((layer) => layer.gradient).join(",");
      const sizes = layers.map((layer) => layer.size).join(",");
      const positions = layers.map((layer) => layer.position).join(",");
      return `background-image: ${gradients}; background-repeat: repeat-y; background-size: ${sizes}; background-position: ${positions};`;
  }

  private buildOpacityStops(color: string): string {
      return this.opacitySteps.controls.map((control) => {
          return `rgba(${color}, ${control.get('opacity')!.value}) ${control.get('step')!.value}%`;
      }).join(",");
  }

  private getShimmerRgbaColor(): string {
      const shimmerColor = this.canvasPropertiesForm.controls['shimmerColor'].value;
      return shimmerColor.replace("rgb", "rgba").replace(")", ",1)");
  }

  private getShimmerRgbString(): string {
      const shimmerColor = this.canvasPropertiesForm.controls['shimmerColor'].value;
      return shimmerColor.replace("rgb(", "").replace(")", "");
  }

  private buildShimmerMaskDeclarations(stops: string): string {
      const controls = this.canvasPropertiesForm.controls;
      return `-webkit-mask-image: linear-gradient( ${controls['shimmerAngle'].value}deg, ${stops} ); -webkit-mask-repeat: repeat-y; -webkit-mask-size: ${controls['shimmerWidth'].value}px ${controls['canvasHeight'].value}px; -webkit-mask-position: ${controls['shimmerStartPosition'].value}% 0;`;
  }

  private buildAnimationDeclaration(): string {
      const controls = this.canvasPropertiesForm.controls;
      return `animation: shineForSkeleton-${this.randomSkeletonName} ${controls['playShimmerDuration'].value}s infinite;`;
  }

  private buildKeyframes(shimmerType: number, shapes: ShapeDetails[]): string {
      const controls = this.canvasPropertiesForm.controls;
      const name = this.randomSkeletonName;
      if (shimmerType === 0) {
          return `@keyframes shineForSkeleton-${name} {to {-webkit-mask-position: ${controls['shimmerEndPosition'].value}% 0}}`;
      }
      if (shimmerType === 1) {
          const positions = this.buildShapeLayers(shapes).map((layer) => layer.position).join(",");
          return `@keyframes shineForSkeleton-${name} {to {background-position: ${controls['shimmerEndPosition'].value}% 0,${positions};}}`;
      }
      return `@keyframes shineForSkeleton-${name} {0% {opacity: 1;}50% {opacity: 0.5;}100% {opacity: 1;}}`;
  }

  private appendGeneratedStyle(): void {
      const head = document.getElementsByTagName('head')[0];
      const style = document.createElement('style');
      style.type = 'text/css';
      style.id = 'andrew';
      style.appendChild(document.createTextNode(this.generatedCss()));
      head.appendChild(style);
  }
  


  generate()
  {
      const shapes = this.getDesignDataReversed();
      const controls = this.canvasPropertiesForm.controls;
      const showShimmer = controls['showShimmer'].value === true;
      const shimmerType = controls['shimmerType'].value;
      const name = this.randomSkeletonName;

      this.removeGeneratedStyle();
      this.generatedCss.set("");

      if (!showShimmer) {
          const base = this.buildBaseDeclarations(false);
          const shapesBackground = this.buildShapeBackgroundDeclarations(shapes);
          this.generatedCss.set(`.skeleton-${name}:empty {${base} ${shapesBackground}}`);
          this.appendGeneratedStyle();
          this.recordHistory();
          return;
      }

      if (shimmerType === 0) {
          const base = this.buildBaseDeclarations(true);
          const shapesBackground = this.buildShapeBackgroundDeclarations(shapes);
          const maskStops = this.buildOpacityStops("255, 255, 255");
          const maskDeclarations = this.buildShimmerMaskDeclarations(maskStops);
          const shimmerColor = this.getShimmerRgbaColor();
          const shimmerBackground = this.buildShapeBackgroundDeclarations(shapes, shimmerColor);
          const animation = this.buildAnimationDeclaration();

          const baseBlock = `.skeleton-${name}:empty {${base} ${shapesBackground}}`;
          const beforeBlock = `.skeleton-${name}:empty:before {content: ' '; position: absolute; z-index: ${controls['shapesZIndex'].value}; width: 100%; height: ${controls['canvasHeight'].value}px; ${maskDeclarations} ${shimmerBackground} ${animation}}`;
          this.generatedCss.set(`${baseBlock}${beforeBlock}${this.buildKeyframes(shimmerType, shapes)}`);
          this.appendGeneratedStyle();
          this.recordHistory();
          return;
      }

      if (shimmerType === 1) {
          const base = this.buildBaseDeclarations(false);
          const shimmerStops = this.buildOpacityStops(this.getShimmerRgbString());
          const shimmerGradient = `linear-gradient( ${controls['shimmerAngle'].value}deg, ${shimmerStops} )`;
          const layers = this.buildShapeLayers(shapes);
          const shapeGradients = layers.map((layer) => layer.gradient).join(",");
          const backgroundImage = `background-image: ${shimmerGradient},${shapeGradients};`;
          const backgroundSize = `${controls['shimmerWidth'].value}px ${controls['canvasHeight'].value}px,${layers.map((layer) => layer.size).join(",")}`;
          const backgroundPosition = `${controls['shimmerStartPosition'].value}% 0,${layers.map((layer) => layer.position).join(",")}`;
          const animation = this.buildAnimationDeclaration();

          const block = `.skeleton-${name}:empty {${base} ${backgroundImage} background-repeat: repeat-y; background-size: ${backgroundSize}; background-position: ${backgroundPosition}; ${animation}}`;
          this.generatedCss.set(`${block}${this.buildKeyframes(shimmerType, shapes)}`);
          this.appendGeneratedStyle();
          this.recordHistory();
          return;
      }

      if (shimmerType === 2) {
          const base = this.buildBaseDeclarations(true);
          const shapesBackground = this.buildShapeBackgroundDeclarations(shapes);
          const animation = this.buildAnimationDeclaration();

          const baseBlock = `.skeleton-${name}:empty {${base}}`;
          const beforeBlock = `.skeleton-${name}:empty:before {content: ' '; position: absolute; z-index: ${controls['shapesZIndex'].value}; width: 100%; height: ${controls['canvasHeight'].value}px; ${shapesBackground} ${animation}}`;
          this.generatedCss.set(`${baseBlock}${beforeBlock}${this.buildKeyframes(shimmerType, shapes)}`);
          this.appendGeneratedStyle();
          this.recordHistory();
          return;
      }
  }


  addCircle(position: any) {
      const data: ShapeDetails[] = [...this.designData(), {
          "type": "circle" as const,
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
          "borderRadiusTopLeft": 0,
          "borderRadiusTopRight": 0,
          "borderRadiusBottomRight": 0,
          "borderRadiusBottomLeft": 0,
          "color": this.newShapeColor(),
          "horizontalPositioningStartingPoint": "left",
          "horizontalPositioningAmount": position.x,
          "horizontalPositioningUnit": "px",
          "verticalPositioningStartingPoint": "top",
          "verticalPositioningAmount": position.y,
          "verticalPositioningUnit": "px",
          "allowShimmerOverlay": true,
          "antialias": true
      }];
      this.designData.set(data);
      this.generate();
  }


  addRectangle(position: any) {
      const data: ShapeDetails[] = [...this.designData(), {
          "type": "rectangle" as const,
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
          "borderRadiusTopLeft": 0,
          "borderRadiusTopRight": 0,
          "borderRadiusBottomRight": 0,
          "borderRadiusBottomLeft": 0,
          "color": this.newShapeColor(),
          "horizontalPositioningStartingPoint": "left",
          "horizontalPositioningAmount": position.x,
          "horizontalPositioningUnit": "px",
          "verticalPositioningStartingPoint": "top",
          "verticalPositioningAmount": position.y,
          "verticalPositioningUnit": "px",
          "allowShimmerOverlay": true,
          "antialias": true
      }];
      this.designData.set(data);
      this.generate();
  }


  highlightItem(index: number, item: ShapeDetails)
  {
      this.highlightedItem.set(index);

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
      this.myForm.controls['borderRadiusTopLeft'].patchValue(item.borderRadiusTopLeft ?? 0);
      this.myForm.controls['borderRadiusTopRight'].patchValue(item.borderRadiusTopRight ?? 0);
      this.myForm.controls['borderRadiusBottomRight'].patchValue(item.borderRadiusBottomRight ?? 0);
      this.myForm.controls['borderRadiusBottomLeft'].patchValue(item.borderRadiusBottomLeft ?? 0);
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

      this.highlightedItem.set(-1);
      const data = [...this.designData()];
      data.splice(index, 1);
      this.designData.set(data);
      
      this.generate();
  }





  onPaste(pasteEvent: any) {
      
      // consider the first item (can be easily extended for multiple items)
      var item = pasteEvent.clipboardData.items[0];
     
      if (item.type.indexOf("image") === 0) {
        var blob = item.getAsFile();
     
        var reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === 'string') {
            this.designCanvasTempBackgroundImage.set(result);
            this.tempBackgroundXPos.set(0);
            this.tempBackgroundYPos.set(0);
          }
        };
     
        reader.readAsDataURL(blob);
      }
    }


  


}
