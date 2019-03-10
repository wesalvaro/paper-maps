/*
 * const setT = promisify(setTimeout, { successI: 0 });
 * const setI = iteratify(setInterval, { successI: 0, stopper: clearInterval });
 * (async () => {
 *   for await (const t of setI(100)) {
 *     console.log(t);
 *   }
 * })();
 */

const promisify = (f, { successI, errorI, context }) => {
  return function() {
    const args = [].slice.call(arguments, 0);
    return new Promise((resolve, reject) => {
      args.splice(successI, 0, resolve);
      if (errorI != null) {
        args.splice(errorI, 0, reject);
      }
      f.apply(context || this, args);
    });
  };
};

const STOP = Symbol.stop;
const iteratify = (f, { successI, errorI, context, stopper }) => {
  return function() {
    let resolveCurrent;
    let rejectCurrent;
    const createIteration = () =>
      new Promise((resolve, reject) => {
        resolveCurrent = r => {
          iteration.push(createIteration());
          resolve(r);
        };
        rejectCurrent = reject;
      });
    const iteration = [createIteration()];
    const args = Array.from(arguments);
    args.splice(successI, 0, r => {
      resolveCurrent(r);
    });
    if (errorI != null) {
      args.splice(errorI, 0, e => {
        rejectCurrent(e);
      });
    }
    const result = f.apply(context || this, args);
    const stop = () => {
      resolveCurrent(STOP);
      stopper(result);
    };
    return {
      result,
      stop,
      [Symbol.asyncIterator]: async function* foo() {
        while (iteration.length) {
          const value = await iteration.shift();
          if (value === STOP) {
            return;
          } else {
            yield value;
          }
        }
        stop();
        console.log("stopped");
      }
    };
  };
};
