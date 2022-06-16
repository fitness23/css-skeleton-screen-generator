import { FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';



// create your class that extends the angular validator class
export class CustomValidators extends Validators {








    static checkPointInPolygon(xPoint: number, yPoint: number, polygon: string): ValidatorFn {
        return (c: AbstractControl): { [key: string]: string } | null => {

            var point = [xPoint, yPoint];
            var vs = JSON.parse('[' + polygon.replace(/\d+,\d+/g, '[$&]') + ']');

            var x = point[0], y = point[1];

            var inside = false;
            for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                var xi = vs[i][0], yi = vs[i][1];
                var xj = vs[j][0], yj = vs[j][1];

                var intersect = ((yi > y) != (yj > y))
                    && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }


            if ((inside == false)) {
                return { "errorMessage": "This plot point is outside the walkable area." };
            }

            

        }
    }


}