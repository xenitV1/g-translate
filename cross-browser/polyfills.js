/**
 * Polyfills for Cross-Browser Compatibility
 * Eksik API'ler için polyfill'ler
 */

(function () {
  "use strict";

  /**
   * Promise polyfill for older browsers
   */
  if (typeof Promise === "undefined") {
    window.Promise = function (executor) {
      var self = this;
      self.state = "pending";
      self.value = undefined;
      self.handlers = [];

      function resolve(result) {
        if (self.state === "pending") {
          self.state = "fulfilled";
          self.value = result;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }

      function reject(error) {
        if (self.state === "pending") {
          self.state = "rejected";
          self.value = error;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }

      function handle(handler) {
        if (self.state === "pending") {
          self.handlers.push(handler);
        } else {
          if (
            self.state === "fulfilled" &&
            typeof handler.onFulfilled === "function"
          ) {
            handler.onFulfilled(self.value);
          }
          if (
            self.state === "rejected" &&
            typeof handler.onRejected === "function"
          ) {
            handler.onRejected(self.value);
          }
        }
      }

      this.then = function (onFulfilled, onRejected) {
        return new Promise(function (resolve, reject) {
          handle({
            onFulfilled: function (result) {
              try {
                resolve(onFulfilled ? onFulfilled(result) : result);
              } catch (ex) {
                reject(ex);
              }
            },
            onRejected: function (error) {
              try {
                resolve(onRejected ? onRejected(error) : error);
              } catch (ex) {
                reject(ex);
              }
            },
          });
        });
      };

      this.catch = function (onRejected) {
        return this.then(null, onRejected);
      };

      try {
        executor(resolve, reject);
      } catch (ex) {
        reject(ex);
      }
    };
  }

  /**
   * Object.assign polyfill
   */
  if (typeof Object.assign !== "function") {
    Object.assign = function (target) {
      "use strict";
      if (target == null) {
        throw new TypeError("Cannot convert undefined or null to object");
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }

  /**
   * Array.from polyfill
   */
  if (!Array.from) {
    Array.from = function (arrayLike, mapFn, thisArg) {
      var C = this;
      var items = Object(arrayLike);
      if (arrayLike == null) {
        throw new TypeError(
          "Array.from requires an array-like object - not null or undefined",
        );
      }
      var mapFunction = mapFn;
      var T;
      if (typeof mapFn !== "undefined") {
        if (typeof mapFn !== "function") {
          throw new TypeError(
            "Array.from: when provided, the second argument must be a function",
          );
        }
        if (arguments.length > 2) {
          T = thisArg;
        }
      }
      var len = parseInt(items.length) || 0;
      var A = typeof C === "function" ? Object(new C(len)) : new Array(len);
      var k = 0;
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFunction) {
          A[k] =
            typeof T === "undefined"
              ? mapFunction(kValue, k)
              : mapFunction.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      A.length = len;
      return A;
    };
  }

  /**
   * String.includes polyfill
   */
  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
      "use strict";
      if (typeof start !== "number") {
        start = 0;
      }

      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }

  /**
   * Array.includes polyfill
   */
  if (!Array.prototype.includes) {
    Array.prototype.includes = function (searchElement, fromIndex) {
      "use strict";
      var O = Object(this);
      var len = parseInt(O.length) || 0;
      if (len === 0) {
        return false;
      }
      var n = parseInt(fromIndex) || 0;
      var k;
      if (n >= 0) {
        k = n;
      } else {
        k = len + n;
        if (k < 0) {
          k = 0;
        }
      }
      function sameValueZero(x, y) {
        return (
          x === y ||
          (typeof x === "number" &&
            typeof y === "number" &&
            isNaN(x) &&
            isNaN(y))
        );
      }
      for (; k < len; k++) {
        if (sameValueZero(O[k], searchElement)) {
          return true;
        }
      }
      return false;
    };
  }

  /**
   * Fetch API polyfill (basic)
   */
  if (typeof fetch === "undefined") {
    window.fetch = function (url, options) {
      options = options || {};
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(options.method || "GET", url);

        if (options.headers) {
          Object.keys(options.headers).forEach(function (key) {
            xhr.setRequestHeader(key, options.headers[key]);
          });
        }

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              ok: true,
              status: xhr.status,
              statusText: xhr.statusText,
              text: function () {
                return Promise.resolve(xhr.responseText);
              },
              json: function () {
                return Promise.resolve(JSON.parse(xhr.responseText));
              },
            });
          } else {
            reject(new Error("HTTP " + xhr.status + ": " + xhr.statusText));
          }
        };

        xhr.onerror = function () {
          reject(new Error("Network error"));
        };

        xhr.send(options.body);
      });
    };
  }

  /**
   * LocalStorage polyfill for extensions
   */
  if (typeof localStorage === "undefined") {
    window.localStorage = {
      _data: {},
      setItem: function (id, val) {
        return (this._data[id] = String(val));
      },
      getItem: function (id) {
        return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
      },
      removeItem: function (id) {
        return delete this._data[id];
      },
      clear: function () {
        return (this._data = {});
      },
    };
  }

  /**
   * Chrome extension API polyfill for Firefox
   */
  if (typeof chrome === "undefined" && typeof browser !== "undefined") {
    window.chrome = browser;
  }

  /**
   * Console polyfill for older browsers
   */
  if (typeof console === "undefined") {
    window.console = {
      log: function () {},
      warn: function () {},
      error: function () {},
      info: function () {},
      debug: function () {},
    };
  }

  /**
   * URL polyfill
   */
  if (typeof URL === "undefined") {
    window.URL = function (url, base) {
      var anchor = document.createElement("a");
      if (base) {
        anchor.href = base;
      }
      anchor.href = url;

      return {
        href: anchor.href,
        protocol: anchor.protocol,
        host: anchor.host,
        hostname: anchor.hostname,
        port: anchor.port,
        pathname: anchor.pathname,
        search: anchor.search,
        hash: anchor.hash,
        origin: anchor.protocol + "//" + anchor.host,
      };
    };
  }

  console.log("Polyfills loaded successfully");
})();
