import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

@Injectable()
export class GeneralService {

    constructor(private http: HttpClient) { }

    presetOption1()
    {
        let option1 = {
            "canvasHeight": 400,
            "repeatDesign": 133,
            "shapes": [
                {
                    "type": "circle",
                    "width": 40,
                    "widthMeasurement": "px",
                    "height": 40,
                    "color": "#F5F7F9",
                    "x": 12,
                    "y": 12,
                    "allowShimmerOverlay": true,
                    "antialias": false
                },
                {
                    "type": "rectangle",
                    "width": 88,
                    "widthMeasurement": "px",
                    "height": 6,
                    "color": "#F5F7F9",
                    "x": 59,
                    "y": 21,
                    "allowShimmerOverlay": true,
                    "antialias": true
                },
                {
                    "type": "rectangle",
                    "width": 52,
                    "widthMeasurement": "px",
                    "height": 6,
                    "color": "#F5F7F9",
                    "x": 59,
                    "y": 39,
                    "allowShimmerOverlay": true,
                    "antialias": true
                },
                {
                    "type": "rectangle",
                    "width": 74,
                    "widthMeasurement": "%",
                    "height": 6,
                    "color": "#F5F7F9",
                    "x": 12,
                    "y": 73,
                    "allowShimmerOverlay": true,
                    "antialias": true
                },
                {
                    "type": "rectangle",
                    "width": 90,
                    "widthMeasurement": "%",
                    "height": 6,
                    "color": "#F5F7F9",
                    "x": 12,
                    "y": 92,
                    "allowShimmerOverlay": true,
                    "antialias": true
                },
                {
                    "type": "rectangle",
                    "width": 43,
                    "widthMeasurement": "%",
                    "height": 6,
                    "color": "#F5F7F9",
                    "x": 12,
                    "y": 111,
                    "allowShimmerOverlay": true,
                    "antialias": true
                }
            ]
        };

        return option1;
    }

    presetOption2()
    {
        let option2 = {
            "canvasHeight": 170,
            "repeatDesign": 170,
            "shapes": [
                {
                    "type": "circle",
                    "width": 28,
                    "widthMeasurement": "px",
                    "height": 28,
                    "color": "#cccccc",
                    "x": 20,
                    "y": 20,
                    "allowShimmerOverlay": true,
                    "antialias": true
                },
                {
                    "type": "rectangle",
                    "width": 300,
                    "widthMeasurement": "px",
                    "height": 20,
                    "color": "#cccccc",
                    "x": 70,
                    "y": 25,
                    "allowShimmerOverlay": true,
                    "antialias": true
                },
                {
                    "type": "circle",
                    "width": 28,
                    "widthMeasurement": "px",
                    "height": 28,
                    "color": "#cccccc",
                    "x": 20,
                    "y": 70,
                    "allowShimmerOverlay": true,
                    "antialias": true
                },
                {
                    "type": "rectangle",
                    "width": 300,
                    "widthMeasurement": "px",
                    "height": 20,
                    "color": "#cccccc",
                    "x": 70,
                    "y": 75,
                    "allowShimmerOverlay": true,
                    "antialias": true
                },
                {
                    "type": "circle",
                    "width": 28,
                    "widthMeasurement": "px",
                    "height": 28,
                    "color": "#cccccc",
                    "x": 20,
                    "y": 120,
                    "allowShimmerOverlay": true,
                    "antialias": true
                },
                {
                    "type": "rectangle",
                    "width": 300,
                    "widthMeasurement": "px",
                    "height": 20,
                    "color": "#cccccc",
                    "x": 70,
                    "y": 125,
                    "allowShimmerOverlay": true,
                    "antialias": true
                }
            ]
        };

        return option2;
    }



    






    presetOption3()
    {
    
    
        let option3 = {
            "canvasHeight": 290,
            "repeatDesign": 290,
            "shapes": [
                {
                    "type": "rectangle",
                    "width": 360,
                    "widthMeasurement": "px",
                    "height": 200,
                    "color": "#E0E0E0",
                    "x": 20,
                    "y": 20,
                    "allowShimmerOverlay": true,
                    "antialias": true
                },
                {
                    "type": "circle",
                    "width": 35,
                    "widthMeasurement": "px",
                    "height": 35,
                    "color": "#E0E0E0",
                    "x": 20,
                    "y": 236,
                    "allowShimmerOverlay": true,
                    "antialias": true
                },
                {
                    "type": "rectangle",
                    "width": 300,
                    "widthMeasurement": "px",
                    "height": 20,
                    "color": "#E0E0E0",
                    "x": 70,
                    "y": 244,
                    "allowShimmerOverlay": true,
                    "antialias": true
                }
            ]
        };


        return option3;
    }



    presetOption4()
    {
    
    
        let option4 = {
            "canvasHeight": 290,
            "repeatDesign": 290,
            "shapes": [
                
            ]
        };


        return option4;
    }


}