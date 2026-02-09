import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { FormGroup } from '@angular/forms';
import { NgClickOutsideDirective } from 'ng-click-outside2';
import { ShapeDetails } from '../../shared/interfaces/shape-template-interface';

@Component({
  selector: 'app-design-view',
  standalone: true,
  imports: [CommonModule, NgClickOutsideDirective, DragDropModule],
  templateUrl: './design-view.component.html'
})
export class DesignViewComponent {
  @Input({ required: true }) selectedTemplate!: string;
  @Input({ required: true }) showTips!: boolean;
  @Input({ required: true }) designCanvasTempBackgroundImage!: string | null;
  @Input({ required: true }) tempBackgroundXPos!: number;
  @Input({ required: true }) tempBackgroundYPos!: number;
  @Input({ required: true }) designData!: ShapeDetails[];
  @Input({ required: true }) highlightedItem!: number;
  @Input({ required: true }) canvasPropertiesForm!: FormGroup;
  @Input({ required: true }) determineRectangleWidth!: (record: ShapeDetails) => string;
  @Input({ required: true }) determineRectangleHeightDesignView!: (record: ShapeDetails) => string;

  @Output() templateSelect = new EventEmitter<string>();
  @Output() toggleTips = new EventEmitter<void>();
  @Output() contextMenu = new EventEmitter<MouseEvent>();
  @Output() paste = new EventEmitter<ClipboardEvent>();
  @Output() clickedOutside = new EventEmitter<any>();
  @Output() itemClick = new EventEmitter<{ index: number; item: ShapeDetails }>();
  @Output() dragEnded = new EventEmitter<{ index: number; event: CdkDragEnd }>();

  getItemWidth(item: ShapeDetails): string {
    if (item.type === 'circle') {
      return `${item.diameter}${item.diameterMeasurement ?? ''}`;
    }
    return this.determineRectangleWidth(item);
  }

  getItemHeight(item: ShapeDetails): string {
    if (item.type === 'circle') {
      return `${item.diameter}${item.diameterMeasurement ?? ''}`;
    }
    return this.determineRectangleHeightDesignView(item);
  }

  getCenteredLeft(item: ShapeDetails): string {
    const amount = item.horizontalPositioningAmount ?? 0;
    const unit = item.horizontalPositioningUnit ?? 'px';
    return `calc(50% + ${amount}${unit})`;
  }

  getCenteredTop(item: ShapeDetails): string {
    const amount = item.verticalPositioningAmount ?? 0;
    const unit = item.verticalPositioningUnit ?? 'px';
    return `calc(50% + ${amount}${unit})`;
  }

  getCenteredMarginLeft(item: ShapeDetails): string {
    return `calc(-1 * (${this.getItemWidth(item)}) / 2)`;
  }

  getCenteredMarginTop(item: ShapeDetails): string {
    return `calc(-1 * (${this.getItemHeight(item)}) / 2)`;
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.contextMenu.emit(event);
  }
}
