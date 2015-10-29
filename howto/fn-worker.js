var hd;
(function (hd) {
    function notify(result) {
        self.postMessage({ result: result, complete: false });
    }
    hd.notify = notify;
    function fulfill(result) {
        self.postMessage({ result: result, complete: true });
    }
    hd.fulfill = fulfill;
    function reject(error) {
        self.postMessage({ error: error, complete: true });
    }
    hd.reject = reject;
    self.addEventListener('message', function (event) {
        var fn = self[event.data.fnName];
        if (typeof fn === 'function') {
            try {
                var result = fn.apply(null, event.data.inputs);
                if (result !== undefined) {
                    fulfill(result);
                }
            }
            catch (e) {
                if (typeof e === 'object' &&
                    Object.getPrototypeOf(e) !== Object.prototype) {
                    e = e.toString();
                }
                reject(e);
            }
        }
        else {
            reject('Unknown function: ' + event.data.fnName);
        }
    });
})(hd || (hd = {}));
//
//# sourceMappingURL=fn-worker.js.map