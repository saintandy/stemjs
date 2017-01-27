// A map that supports multiple values to the same key
class MultiMap {
    constructor() {
        this.map = new Map();
    }

    static iterator(items) {
        return items[Symbol.iterator];
    }

    // Methods that are called before every access inside
    // the internal map
    normalizeKey(key) {
        return key;
    }
    normalizeValue(value) {
        return value;
    }

    append(key, value) {
        let nKey = this.normalizeKey(key);
        let nValue = this.normalizeValue(value);
        if (this.map.has(nKey)) {
            this.map.get(nValue).push(nValue);
        } else {
            this.map.set(nKey, [nValue]);
        }
    }

    has(key) {
        return this.map.has(this.normalizeKey(key));
    }

    delete(key) {
        this.map.delete(this.normalizeKey(key));
    }

    set(key, value) {
        this.map.set(this.normalizeKey(key), [this.normalizeValue(value)]);
    }

    get(key) {
        let nKey = this.normalizeKey(key);
        if (this.map.has(nKey)) {
            return this.map.get(nKey)[0];
        }
        return null;
    }

    getAll(key) {
        let nKey = this.normalizeKey(key);
        if (this.map.has(nKey)) {
            return this.map.get(nKey).slice();
        }
        return null;
    }

    forEach(callback, context) {
        for (let [key, value] of this.entries()) {
            callback.call(context, value, key, this);
        }
    }

    // TODO: this should be a wrapper on top of this.map.entries
    entriesArray() {
        let entries = [];
        for (let [key, values] of this.map.entries()) {
            for (let value of values) {
                entries.push([key, value]);
            }
        }
        return entries;
    }

    keys() {
        return this.constructor.iterator(this.entriesArray().map(entry => entry[0]));
    }

    values() {
        return this.constructor.iterator(this.entriesArray().map(entry => entry[1]));
    }

    entries() {
        return this.constructor.iterator(this.entriesArray());
    }

    [Symbol.iterator]() {
        return this.entries();
    }
}

export {MultiMap};