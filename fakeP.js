(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("FakeP", [], factory);
	else if(typeof exports === 'object')
		exports["FakeP"] = factory();
	else
		root["FakeP"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "FakeP": () => (/* binding */ FakeP)
});

;// CONCATENATED MODULE: ./src/assets/locales/utils.ts

const isFunction = (value) => typeof value === 'function';
const isObject = (value) => value ? typeof value === 'object' : false;
const isFakeP = (value) => value instanceof FakeP;

;// CONCATENATED MODULE: ./src/assets/locales/fakeP.ts

/**
 * 1. 三种状态 pending、fullfilled、rejected
 * 2. FakeP 构造函数
 *    - 静态方法 resolve，返回值为 FakeP 实例
 *    - 实例方法 then、catch，返回值为 FakeP 实例
 */
var FakePStatus;
(function (FakePStatus) {
    FakePStatus[FakePStatus["PENDING"] = 0] = "PENDING";
    FakePStatus[FakePStatus["FULLFILLED"] = 1] = "FULLFILLED";
    FakePStatus[FakePStatus["REJECTED"] = 2] = "REJECTED";
})(FakePStatus || (FakePStatus = {}));
const Resolve = (promise, value) => {
    if (promise === value) {
        promise.reject(new TypeError("The promise and its value refer to the same object"));
    }
    else if (isFakeP(value)) {
        if (value.state === FakePStatus.PENDING) {
            value.then((v) => {
                Resolve(promise, v);
            }, (err) => {
                promise.reject(err);
            });
        }
        else {
            promise.transition(value.state, value.value);
        }
    }
    else if (isObject(value) || isFunction(value)) {
        let called = false;
        try {
            const thenHandler = value.then;
            if (isFunction(thenHandler)) {
                thenHandler.call(value, (v) => {
                    if (!called) {
                        Resolve(promise, v);
                        called = true;
                    }
                }, (e) => {
                    if (!called) {
                        promise.reject(e);
                        called = true;
                    }
                });
            }
            else {
                promise.fullfill(value);
                called = true;
            }
        }
        catch (err) {
            if (!called) {
                promise.reject(err);
                called = true;
            }
        }
    }
    else {
        promise.fullfill(value);
    }
};
class FakeP {
    constructor(fn) {
        this.state = FakePStatus.PENDING;
        this.queue = [];
        this.handles = {
            fullfill: null,
            reject: null
        };
        this.value = null;
        if (fn) {
            fn((value) => {
                Resolve(this, value);
            }, (err) => {
                this.reject(err);
            });
        }
    }
    transition(state, value) {
        if (this.state === state || this.state !== FakePStatus.PENDING)
            return;
        this.state = state;
        this.value = value;
        this.process();
    }
    /**
     * TODO: type complement
     * 执行任务队列
     * @returns
     */
    process() {
        if (this.state === FakePStatus.PENDING)
            return;
        const fulfillFallBack = (value) => value;
        const rejectFallBack = (err) => err;
        setTimeout(() => {
            while (this.queue.length) {
                const queueFakeP = this.queue.shift();
                let handler;
                let _value;
                if (this.state === FakePStatus.FULLFILLED) {
                    handler = (queueFakeP === null || queueFakeP === void 0 ? void 0 : queueFakeP.handles.fullfill) || fulfillFallBack;
                }
                else if (this.state === FakePStatus.REJECTED) {
                    handler = (queueFakeP === null || queueFakeP === void 0 ? void 0 : queueFakeP.handles.reject) || rejectFallBack;
                }
                try {
                    _value = handler(this.value);
                }
                catch (err) {
                    this.transition(FakePStatus.REJECTED, err);
                    continue;
                }
                Resolve(queueFakeP, _value);
            }
        });
    }
    fullfill(value) {
        this.transition(FakePStatus.FULLFILLED, value);
    }
    reject(err) {
        this.transition(FakePStatus.REJECTED, err);
    }
    // TODO: class inside overload function
    static resolve(value) {
        return new FakeP((resolve) => {
            resolve(value);
        });
    }
    then(onFulfilled, onRejected) {
        const queueFakeP = new FakeP();
        if (isFunction(onFulfilled)) {
            queueFakeP.handles.fullfill = onFulfilled;
        }
        if (isFunction(onRejected)) {
            queueFakeP.handles.reject = onRejected;
        }
        this.queue.push(queueFakeP);
        this.process();
        return queueFakeP;
    }
    catch(err) {
    }
}
FakeP.FakePNativefn = new FakeP();

/******/ 	return __webpack_exports__;
/******/ })()
;
});