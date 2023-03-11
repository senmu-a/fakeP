/**
 * 定义三种状态 pending、fulfilled、rejected
 */
const FakePState = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected'
}

const isFunction = (value) => typeof value === 'function';
const isObject = (value) => value ? typeof value === 'object' : false;
const isFakeP = (value) => value instanceof FakeP;

const Noop = (...args) => {}

const resolvePromise = (promise, x) => {
  if (promise === x) {
    throw new TypeError('The promise and its value refer to the same object');
  } else if (isFakeP(x)) {
    x.then((y) => {
      resolvePromise(promise, y);
    }, (err) => {
      promise.reject(err);
    })
  } else if (isObject(x) || isFunction(x)) {
    let called = false;
    let then
    try {
      then = x.then;
    } catch (err) {
      return promise.reject(err);
    }
    if (isFunction(then)) {
      try {
        then.call(x, (y) => {
          if (called) return;
          called = true;
          resolvePromise(promise, y);
        }, (e) => {
          if (called) return;
          called = true;
          promise.reject(e);
        })
      } catch (err) {
        if (called) return;
        called = true;
        promise.reject(err);
      }
    } else {
      promise.resolve(x)
    }
  } else {
    return promise.resolve(x);
  }
}

class FakeP {

  constructor(fn) {
    if (typeof fn !== 'function') throw new TypeError('fn must be a function');
    this.FakePState = FakePState.PENDING;
    this.FakePResult = null;
    this.FakeFulfilledQueue = [];
    this.FakeRejectedQueue = [];
    try {
      fn(this.resolve.bind(this), this.reject.bind(this));
    } catch (e) {
      this.reject(e);
    }
  }

  static deferred() {
    const result = {};
    result.promise = new FakeP((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });
    return result;
  }

  process(queues, result) {
    queues.forEach((callback) => {
      callback(result);
    })
  }

  resolve(value) {
    if (this.FakePState === FakePState.PENDING) {
      this.FakePState = FakePState.FULFILLED;
      this.FakePResult = value;
      this.process(this.FakeFulfilledQueue, value);
    }
  }

  reject(err) {
    if (this.FakePState === FakePState.PENDING) {
      this.FakePState = FakePState.REJECTED;
      this.FakePResult = err;
      this.process(this.FakeRejectedQueue, err);
    }
  }

  then(onFulfilled, onRejected) {
    const queueFakeP = new FakeP(Noop);
    switch(this.FakePState) {
      case FakePState.FULFILLED:
        queueMicrotask(() => {
          try {
            if (isFunction(onFulfilled)) {
              const x = onFulfilled(this.FakePResult);
              resolvePromise(queueFakeP, x);
            } else {
              queueFakeP.resolve(this.FakePResult);
            }
          } catch (e) {
            queueFakeP.reject(e);
          }
        });
        break;
      case FakePState.REJECTED:
        queueMicrotask(() => {
          try {
            if (isFunction(onRejected)) {
              const x = onRejected(this.FakePResult);
              resolvePromise(queueFakeP, x);
            } else {
              queueFakeP.reject(this.FakePResult);
            }
          } catch (e) {
            queueFakeP.reject(e);
          }
        })
        break;
      default:
        this.FakeFulfilledQueue.push(() => {
          queueMicrotask(() => {
            try {
              if (isFunction(onFulfilled)) {
                const x = onFulfilled(this.FakePResult);
                resolvePromise(queueFakeP, x);
              } else {
                queueFakeP.resolve(this.FakePResult);
              }
            } catch (e) {
              queueFakeP.reject(e);
            }
          })
        });
        this.FakeRejectedQueue.push(() => {
          queueMicrotask(() => {
            try {
              if (isFunction(onRejected)) {
                const x = onRejected(this.FakePResult);
                resolvePromise(queueFakeP, x);
              } else {
                queueFakeP.reject(this.FakePResult);
              }
            } catch (e) {
              queueFakeP.reject(e);
            }
          })
        });
        break;
    }
    return queueFakeP
  }

}

// const a = new FakeP((resolve, reject) => {
//   // throw Error(2);
//   resolve(2);
//   reject('hello');
// })
// a.then((res) => {
//   console.log('first');
//   return new FakeP((resolve, reject) => resolve(3 * res))
// }, (err) => {
//   console.log(err);
// }).then((res) => {
//   console.log('second');
//   console.log(res);
// }, (err) => {
//   console.log(err, 'second');
// })

module.exports = FakeP