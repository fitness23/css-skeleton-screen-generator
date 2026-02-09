import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ColorPickerComponent, ColorPickerDirective } from 'ngx-color-picker';
import { UserPreset } from '../../shared/interfaces/user-preset-interface';

@Component({
  selector: 'app-tools-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ColorPickerComponent, ColorPickerDirective],
  templateUrl: './tools-panel.component.html'
})
export class ToolsPanelComponent {
  @Input({ required: true }) myForm!: FormGroup;
  @Input({ required: true }) canvasPropertiesForm!: FormGroup;
  @Input({ required: true }) newShapeColor!: string;
  @Input({ required: true }) highlightedItem!: number;
  @Input({ required: true }) selectedType!: 'rectangle' | 'circle' | null;
  @Input({ required: true }) opacitySteps!: FormArray;
  @Input({ required: true }) showAdvanced!: boolean;
  @Input({ required: true }) canUndo!: boolean;
  @Input({ required: true }) canRedo!: boolean;

  @Input({ required: true }) presetName!: string;
  @Input({ required: true }) userPresets!: UserPreset[];

  @Output() newShapeColorChange = new EventEmitter<string>();
  @Output() toggleAdvanced = new EventEmitter<void>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() focusInput = new EventEmitter<void>();
  @Output() blurInput = new EventEmitter<void>();
  @Output() horizontalPositioningStartingPointChanged = new EventEmitter<void>();
  @Output() verticalPositioningStartingPointChanged = new EventEmitter<void>();
  @Output() widthMeasurementChanged = new EventEmitter<void>();
  @Output() widthCalcChanged = new EventEmitter<void>();
  @Output() heightMeasurementChanged = new EventEmitter<void>();
  @Output() heightCalcChanged = new EventEmitter<void>();
  @Output() diameterCalcChanged = new EventEmitter<void>();
  @Output() changeColor = new EventEmitter<string>();
  @Output() syncHeight = new EventEmitter<void>();
  @Output() addOpacityStep = new EventEmitter<void>();
  @Output() removeOpacityStep = new EventEmitter<number>();
  @Output() generate = new EventEmitter<void>();
  @Output() changeCanvasColorBasedOnShimmerType = new EventEmitter<void>();

  @Output() presetNameChange = new EventEmitter<string>();
  @Output() savePreset = new EventEmitter<void>();
  @Output() loadPreset = new EventEmitter<string>();
  @Output() deletePreset = new EventEmitter<string>();
  @Output() exportPresets = new EventEmitter<void>();
  @Output() importPresets = new EventEmitter<File>();
}
