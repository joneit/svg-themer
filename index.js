/* eslint-env browser */

'use strict';

var regexDataSvg64 = /^(data:image\/svg\+xml)(;\w+)?(,)(.*)$/;
var regexUrlDataSvg64 = /^(url\("data:image\/svg\+xml)(;\w+)?(,)(.*)("\))$/;
var ENCODING_MATCH_INDEX = 2, DATA_MATCH_INDEX = 4;
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
            this.src = applyThemeToSvg64.call(this, match, theme, setSvgProps);
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
        propName = propsUsingImageUrl.find(matchProp);
    }

    if (match) {
        ruleProps[propName] = applyThemeToSvg64.call(this, match, theme, setSvgProps);
    }

    return this;
};

function applyThemeToSvg64(match, theme, setSvgProps) {
    var encoding = match[ENCODING_MATCH_INDEX];
    var data = match[DATA_MATCH_INDEX];
    var div = document.createElement('div');

    setSvgProps = setSvgProps || this.setSvgProps || api.setSvgProps;

    switch (encoding) {
        case undefined:
            div.innerHTML = data;
            setSvgProps.call(div.firstElementChild, theme);
            match[DATA_MATCH_INDEX] = div.firstElementChild.outerHTML;
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

    return match.slice(1).join('');
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