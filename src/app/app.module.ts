import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';

import { Routes, RouterModule } from "@angular/router";

import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ClickOutsideModule } from 'ng-click-outside';
import { OverlayModule } from '@angular/cdk/overlay';

import { GeneralService } from "./shared/services/general.service";

import { NotifyService } from "./shared/services/notify.service";

import { ColorPickerModule } from 'ngx-color-picker';


const routes: Routes = [
  {
    path: '',
    component: AppComponent
    }
];

@NgModule({
  declarations: [
    AppComponent
    ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
      BrowserAnimationsModule,
      DragDropModule,
      ColorPickerModule,
      ClickOutsideModule,
      OverlayModule
  ],
  providers: [GeneralService, NotifyService],
  bootstrap: [AppComponent]
})
export class AppModule { }
