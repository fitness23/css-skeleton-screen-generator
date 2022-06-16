import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Injectable()
export class NotifyService {


    // Observable navItem source
    private _notifySource = new BehaviorSubject<string>(null);
    // Observable navItem stream
    notify$ = this._notifySource.asObservable();

    constructor() { }

    changeNotify(val) {
        console.log('changeNotify ' + val);
        this._notifySource.next(val);


        setTimeout(() => {
            this._notifySource.next(null);
        }, 3000);

    }
}