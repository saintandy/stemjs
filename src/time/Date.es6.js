import {padNumber, suffixWithOrdinal, extendsNative} from "../base/Utils";

@extendsNative
class StemDate extends window.Date {
    static unix(unixTime) {
        return new this(unixTime * 1000);
    }

    getWeekDay() {
        return this.getDay();
    }

    // Just to keep moment compatibility, until we actually implement locales
    locale() {
        return this;
    }

    static splitToTokens(str) {
        let tokens = [];
        let lastIsLetter = null;
        for (let i = 0; i < str.length; i++) {
            let charCode = str.charCodeAt(i);
            let isLetter = (65 <= charCode && charCode <= 90) || (97 <= charCode && charCode <= 122);
            if (isLetter === lastIsLetter) {
                tokens[tokens.length - 1] += str[i];
            } else {
                tokens.push(str[i]);
            }
            lastIsLetter = isLetter;
        }
        return tokens;
    }

    evalToken(token) {
        let func = this.constructor.tokenFormattersMap.get(token);
        if (!func) {
            return token;
        }
        return func(this);
    }

    format(str="ISO8601") {
        let tokens = this.constructor.splitToTokens(str);
        tokens = tokens.map(token => this.evalToken(token));
        return tokens.join("");
    }
}

const miniWeekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const shortWeekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const longWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const longMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

StemDate.tokenFormattersMap = new Map([
    ["ISO8601", date => date.toString()], // TODO: implement ISO format
    ["Y", date => date.getFullYear()],
    ["YY", date => padNumber(date.getFullYear() % 100, 2)],
    ["YYYY", date => date.getFullYear()],
    ["M", date => (date.getMonth() + 1)],
    ["MM", date => padNumber(date.getMonth() + 1, 2)],
    ["MMM", date => shortMonths[date.getMonth()]],
    ["MMMM", date => longMonths[date.getMonth()]],
    ["D", date => date.getDate()],
    ["Do", date => suffixWithOrdinal(date.getDate())],
    ["DD", date => padNumber(date.getDate(), 2)],

    ["d", date => date.getWeekDay()],
    ["do", date => suffixWithOrdinal(date.getWeekDay())],
    ["dd", date => miniWeekDays[date.getWeekDay()]],
    ["ddd", date => shortWeekDays[date.getWeekDay()]],
    ["dddd", date => longWeekdays[date.getWeekDay()]],
    ["H", date => date.getHours()],
    ["HH", date => padNumber(date.getHours(), 2)],
    ["h", date => date.getHours() % 12],
    ["hh", date => padNumber(date.getHours() % 12, 2)],
    ["m", date => date.getMinutes()],
    ["mm", date => padNumber(date.getMinutes(), 2)],
    ["s", date => date.getSeconds()],
    ["ss", date => padNumber(date.getSeconds(), 2)],

    ["LL", date => date.format("MMMM Do, YYYY")],
]);

let Date = StemDate;

export {Date, StemDate};