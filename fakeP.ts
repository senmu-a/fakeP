import { isObject, isFunction, isFakeP } from './utils'
/**
 * 1. 三种状态 pending、fullfiled、rejected
 * 2. FakeP 构造函数
 *    - 静态方法 resolve，返回值为 FakeP 实例
 *    - 实例方法 then、catch，返回值为 FakeP 实例
 */

enum FakePStatus {
  PENDING = 0,
  FULLFILLED = 1,
  REJECTED = 2
}

type FakePResolve = (value: unknown) => void

type FakePReject = (err: any) => void

type FakePCallbackFn = (resolve: FakePResolve, reject: FakePReject) => void

const Resolve = (promise: FakeP, value: unknown) => {
  if (promise === value) {
    promise.reject(new TypeError("The promise and its value refer to the same object"))
} else if (isFakeP(value)) {
    if (value.state === FakePStatus.PENDING) {
      value.then((v) => {
        Resolve(promise, v)
      }, (err) => {
        promise.reject(err)
      })
    } else {
      promise.transition(value.state, value.value)
    }
  } else if (isObject(value) || isFunction(value)) {
    let called = false
    try {
      const thenHandler = (value as any).then
      if (isFunction(thenHandler)) {
        thenHandler.call(value, (v) => {
          if (!called) {
            Resolve(promise, v)
            called = true
          }
        }, (e) => {
          if (!called) {
            promise.reject(e)
            called = true
          }
        })
      } else {
        promise.fullfill(value)
        called = true
      }
    } catch (err) {
      if (!called) {
        promise.reject(err)
        called = true
      }
    }
  } else {
    promise.fullfill(value)
  }
}

export class FakeP {
  value: unknown
  state = FakePStatus.PENDING
  queue: Array<FakeP> = []
  handles = {
    fullfill: null,
    reject: null
  }
  static FakePNativefn = new FakeP()

  constructor(fn?: FakePCallbackFn) {
    this.value = null
    if (fn) {
      fn((value) => {
        Resolve(this, value)
      }, (err) => {
        this.reject(err)
      })
    }
  }

  transition(state: FakePStatus, value: unknown) {
    if (this.state === state || this.state !== FakePStatus.PENDING) return

    this.state = state
    this.value = value

    this.process()
  }

  /**
   * TODO: type complement
   * 执行任务队列
   * @returns 
   */
  process() {
    if (this.state === FakePStatus.PENDING) return

    const fulfillFallBack = (value) => value
    const rejectFallBack = (err) => err

    setTimeout(() => {
      while(this.queue.length) {
        const queueFakeP = this.queue.shift()
        let handler
        let _value

        if (this.state === FakePStatus.FULLFILLED) {
          handler = queueFakeP?.handles.fullfill || fulfillFallBack
        } else if (this.state === FakePStatus.REJECTED) {
          handler = queueFakeP?.handles.reject || rejectFallBack
        }

        try {
          _value = handler(this.value)
        } catch (err) {
          this.transition(FakePStatus.REJECTED, err)
          continue
        }
        Resolve(queueFakeP, _value)
      }
    })
  }

  fullfill(value) {
    this.transition(FakePStatus.FULLFILLED, value)
  }

  reject(err) {
    this.transition(FakePStatus.REJECTED, err)
  }

  // TODO: class inside overload function
  static resolve<T extends unknown>(value: T) {
    return new FakeP((resolve) => {
      resolve(value)
    })
  }

  then<T extends unknown>(onFulfilled?: ((value: T) => void | FakeP) | undefined | null, onRejected?: (err: any) => void | FakeP) {
    const queueFakeP = new FakeP()
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

  catch(err: any) {

  }
}
