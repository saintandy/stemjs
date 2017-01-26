// Tries to be a more flexible implementation of fetch()
// Still work in progress

import {isPlainObject} from "./Utils";

// May need to polyfill Headers, Request, Response, Body, URLSearchParams classes, so import them
import {polyfillRequest} from "../polyfill/Request";
import {polyfillResponse} from "../polyfill/Response";
import {polyfillHeaders} from "../polyfill/Headers";
import {polyfillURLSearchParams} from "../polyfill/URLSearchParams";

if (window) {
    polyfillRequest(window);
    polyfillResponse(window);
    polyfillHeaders(window);
    polyfillURLSearchParams(window);
}

// Parse the headers from an xhr object, to return a native Headers object
function getHeaders(xhr) {
    let rawHeader = xhr.getAllResponseHeaders() || "";
    let headers = new Headers();
    for (let line of rawHeader.split(/\r?\n/)) {
        let parts = line.split(":");
        let key = parts.shift().trim();
        if (key) {
            let value = parts.join(":").trim();
            headers.append(key, value);
        }
    }
    return headers;
}

// Creates a new URLSearchParams object from a plain object
// Fields that are arrays are spread
function getURLSearchParams(data) {
    if (!isPlainObject(data)) {
        return data;
    }

    let urlSearchParams = new URLSearchParams();
    for (const key of Object.keys(data)) {
        let value = data[key];
        if (Array.isArray(value)) {
            for (let instance of value) {
                urlSearchParams.append(key + "[]", instance);
            }
        } else {
            urlSearchParams.set(key, value);
        }
    }
    return urlSearchParams;
}

// Appends search parameters from an object to a given URL or Request, and returns the new URL
function composeURL(url, params) {
    if (url.url) {
        url = url.url;
    }
    // TODO: also extract the preexisting arguments in the url
    if (params) {
        url += "?" + getURLSearchParams(params);
    }
    return url;
}

class XHRPromise {
    constructor(request, options = {}) {
        request = new Request(request, options);
        let xhr = new XMLHttpRequest();
        this.options = options;
        this.request = request;

        this.promise = new Promise((resolve, reject) => {
            this.promiseResolve = resolve;
            this.promiseReject = reject;

            xhr.onload = () => {
                let headers = getHeaders(xhr);
                let body = xhr.response || xhr.responseText;
                let responseInit = {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: headers,
                    url: xhr.responseURL || headers.get("X-Request-URL"),
                };
                let response = new Response(body, responseInit);
                // In case dataType is "arrayBuffer", "blob", "formData", "json", "text"
                // Response has methods to return these as promises
                if (typeof response[options.dataType] === "function") {
                    // TODO: should whitelist dataType to json, blob
                    response[options.dataType]().then((json) => {
                        this.resolve(json);
                    }).catch((error) => {
                        this.reject(error);
                    });
                } else {
                    this.resolve(response);
                }
            };

            // TODO: also dispatch all arguments here on errors
            xhr.onerror = () => {
                this.reject(new TypeError("Network error"));
            };

            // TODO: need to have an options to pass setting to xhr (like timeout value)
            xhr.ontimeout = () => {
                this.reject(new TypeError("Network timeout"));
            };

            xhr.open(request.method, request.url, true);

            if (request.credentials === "include") {
                xhr.withCredentials = true;
            }

            xhr.responseType = "blob";

            // TODO: do this with default headers
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

            for (const [name, value] of request.headers) {
                xhr.setRequestHeader(name, value)
            }

            // TODO: there's no need to do this on a GET or HEAD
            request.blob().then((blob) => {
                // TODO: save the blob here?
                let body = (blob.size) ? blob : null;
                xhr.send(body);
            });
        });

        this.xhr = xhr;
        this.request = request;
    }

    resolve(payload) {
        if (this.options.onSuccess) {
            this.options.onSuccess(...arguments);
        } else {
            this.promiseResolve(...arguments);
        }
        if (this.options.complete) {
            this.options.complete();
        }
    }

    reject(error) {
        if (this.options.onError) {
            this.options.onError(...arguments);
        } else {
            this.promiseReject(...arguments);
        }
        if (this.options.complete) {
            this.options.complete();
        }
    }

    // TODO: next 2 functions should fail if you have onSuccess/onError
    then() {
        return this.getPromise().then(...arguments);
    }

    catch() {
        return this.getPromise().catch(...arguments);
    }

    getXHR() {
        return this.xhr;
    }

    getPromise() {
        return this.promise;
    }

    getRequest() {
        return this.request;
    }

    abort() {
        this.getXHR().abort();
    }

    addXHRListener(name, callback) {
        this.getXHR().addEventListener(name, callback);        
    }

    addProgressListener() {
        this.addXHRListener("progress", ...arguments);
    }
}

function jQueryCompatibilityPreprocessor(options) {
    if (options.type) {
        options.method = options.type.toUpperCase();
    }

    if (options.contentType) {
        options.headers.set("Content-Type", options.contentType);
    }

    if (isPlainObject(options.data)) {
        let method = options.method.toUpperCase();
        if (method === "GET" || method === "HEAD") {
            options.urlParams = options.urlParams || options.data;
        } else {
            let formData = new FormData();
            for (const key of Object.keys(options.data)) {
                formData.set(key, options.data[key]);
            }
            options.body = formData;
        }
    } else {
        // TODO: a better compatibility with jQuery style options?
        options.body = options.body || options.data;
    }
    return options;
}

// Can either be called with
// - 1 argument: (Request)
// - 2 arguments: (url/Request, options)
function fetch(input, init) {
    // In case we're being passed in a single plain object (not Request), assume it has url field
    if (isPlainObject(input)) {
        return fetch(input.url, Object.assign({}, input, init));
    }

    let options = Object.assign({}, init);

    options.headers = new Headers(options.headers || {});

    const preprocessors = options.preprocessors || fetch.defaultPreprocessors || [];

    for (const preprocessor of preprocessors) {
        options = preprocessor(options) || options;
    }

    options.onSuccess = options.onSuccess || options.success;
    options.onError = options.onError || options.error;

    if (typeof options.cache === "boolean") {
        options.cache = options.cache ? "force-cache" : "reload";
    }

    options.method = options.method || "GET";

    const urlParams = options.urlParams || options.urlSearchParams;
    if (urlParams) {
        // Change the URL of the request to add a query
        if (input instanceof Request) {
            input = new Request(composeURL(input.url, urlParams), input);
        } else {
            input = new Request(composeURL(input, urlParams), {});
        }
    }

    return new XHRPromise(input, options);
}

fetch.defaultPreprocessors = [jQueryCompatibilityPreprocessor];

fetch.polyfill = true;

export {XHRPromise, fetch, getURLSearchParams, jQueryCompatibilityPreprocessor};
