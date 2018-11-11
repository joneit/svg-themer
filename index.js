/* eslint-env browser */

'use strict';

var PATTERN = '((data:image/svg\\+xml)(;\\w+)?(,)(.*)|(.*\\.svg))';
var regexDataSvg64 = new RegExp('^()' + PATTERN + '()$');
var regexUrlDataSvg64 = new RegExp('^(url\\(")' + PATTERN + '("\\))$');
var WHOLE_MATCH_INDEX = 0,
    URL_CONSTRUCT_INDEX = 1,
    URI_MATCH_INDEX = 2,
    SCHEME_INDEX = 3,
    ENCODING_MATCH_INDEX = 4,
    DATA_MATCH_INDEX = 6,
    SVG_FILE_URL_INDEX = 7;
var propsUsingImageUrl = ['background-image', 'list-style-image', 'border-image', 'content'];

// UMD accommodation
var api;
if (typeof exports === 'undefined') {
    window.svgThemer = api = {};
} else {
    api = exports;
}

// prop setter "standard implementation"; override as needed
api.setSvgProps = function(theme) {
    if (theme.color) { this.style.stroke = this.style.color = theme.color; }
    if (theme.backgroundColor) { this.style.fill = theme.backgroundColor; }
};

api.setImgSvgProps = function(theme, setSvgProps) {
    if (this.tagName === 'IMG') {
        var match = this.src.match(regexDataSvg64);
        if (match) {
            applyThemeToSvgData.call(this, match, theme, setSvgProps, function(imageData) {
                this.src = imageData;
            });
        }
    }
    return this;
};

api.setRuleSvgProps = function(theme, setSvgProps, propName) {
    var match;
    var ruleProps = this.style;

    if (typeof setSvgProps === 'string') {
        propName = setSvgProps;
        setSvgProps = undefined;
    }

    function matchProp(propName) {
        return (match = ruleProps[propName].match(regexUrlDataSvg64));
    }

    if (propName) {
        matchProp(propName);
    } else {
        // propName = propsUsingImageUrl.find(matchProp);
        // avoiding .find() for IE11's sake
        for (var i = 0; i < propsUsingImageUrl.length; ++i) {
            propName = propsUsingImageUrl[i];
            if (matchProp(propName)) {
                break;
            }
        }
    }

    if (match) {
        applyThemeToSvgData.call(this, match, theme, setSvgProps, function(urlImageData) {
            ruleProps[propName] = urlImageData;
        });
    }

    return this;
};

function applyThemeToSvgData(match, theme, setSvgProps, callback) {
    var self = this;
    if (match[SVG_FILE_URL_INDEX]) {
        get(match[SVG_FILE_URL_INDEX], function(svgMarkup) {
            match[SCHEME_INDEX] = 'data:image/svg+xml,';
            match[DATA_MATCH_INDEX] = svgMarkup;
            match[SVG_FILE_URL_INDEX] = '';
            applyNow.call(self, match, theme, setSvgProps, callback);
        });
    } else {
        applyNow.call(this, match, theme, setSvgProps, callback);
    }
}

var HTTP_STATE_DONE = 4, HTTP_STATUS_OK = 200;
function get(url, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', url, true);
    httpRequest.onreadystatechange = function() {
        if (
            httpRequest.readyState === HTTP_STATE_DONE &&
            httpRequest.status === HTTP_STATUS_OK
        ) {
            callback(httpRequest.responseText);
        }
    };
    httpRequest.send(null);
}

function applyNow(match, theme, setSvgProps, callback) {
    var encoding = match[ENCODING_MATCH_INDEX];
    var data = match[DATA_MATCH_INDEX];
    var div = document.createElement('div');

    setSvgProps = setSvgProps || this.setSvgProps || api.setSvgProps;

    switch (encoding) {
        case undefined:
            div.innerHTML = data.indexOf('%3C') >= 0 ? decodeURIComponent(data) : data;
            setSvgProps.call(div.firstElementChild, theme);
            var svgMarkup = (new XMLSerializer()).serializeToString(div.firstElementChild);
            match[DATA_MATCH_INDEX] = encodeURIComponent(svgMarkup); // always encode result for IE11's sake
            break;
        case ';base64':
            div.innerHTML = atob(data);
            setSvgProps.call(div.firstElementChild, theme);
            var svgMarkup = (new XMLSerializer()).serializeToString(div.firstElementChild);
            match[DATA_MATCH_INDEX] = btoa(svgMarkup);
            break;
        default:
            throw new TypeError('Unexpected encoding "' + encoding + '"');
    }

    match[WHOLE_MATCH_INDEX] = match[URI_MATCH_INDEX] = undefined; // omit from join
    callback.call(this, match.join(''));
}

api.mixin = function(svgOrImgOrRule, setSvgProps) {
    if (svgOrImgOrRule.tagName === 'svg') {
        if (setSvgProps) {
            svgOrImgOrRule.setTheme = setSvgProps;
        } else {
            Object.defineProperty(svgOrImgOrRule, 'setTheme', {
                get: function() { return api.setSvgProps; }
            });
        }
    } else if (svgOrImgOrRule.tagName === 'IMG') {
        if (setSvgProps) {
            svgOrImgOrRule.setSvgProps = setSvgProps;
        }
        svgOrImgOrRule.setTheme = api.setImgSvgProps;
    } else if (svgOrImgOrRule == '[object CSSStyleRule]') { // eslint-disable-line eqeqeq
        if (setSvgProps) {
            svgOrImgOrRule.setSvgProps = setSvgProps;
        }
        svgOrImgOrRule.setTheme = api.setRuleSvgProps;
    }
    return svgOrImgOrRule;
};