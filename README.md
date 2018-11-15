# svg-themer

Apply a theme to SVG elements as well as image data and css rules constructed from SVG markup.

## Abstract

The basic function of this module is to "theme" an SVG data by setting arbitrary properties on the root `<svg>` element and/or its descendants. Typical use case is to apply `stroke` and `fill` via the `style` property.

This module is not necessary for `<svg>...</svg>` DOM elements which can be styled with CSS. Unfortunately, CSS cannot be used to style image data derived from SVG, such as `<img/>` elements and CSS style rule properties with `url()` values that reference SVG data.

With `svg-themer` you can theme such objects as easily as actual `<svg>` elements. You can also attach custom theming "scripts" (functions) so that all SVG data can be themed from a single `theme` object definition regardless of their individual levels of complexity.

## Background

> **TL;DR** Skip to [API](#api) with examples.

SVG data is displayed on a web page by the following DOM `Element`s:
* `SVGSVGElement` — Represented in XML as `<svg>...</svg>` (with descendant elements)
* `HTMLImageElement` — Represented in HTML as `<img src="filename.svg"/>` or `<img src="data:image/svg+xml...">`
* `HTMLElement` — Any DOM element inheriting a CSS property value like `url(filename.svg)` or `url(data:image/svg+xml...)`

An `SVGSVGElement`, along with its descendant elements, picks up cascading style properties (including but not limited to `stroke` and `fill`) from CSS stylesheet rules. This works quite well, albeit at the memory cost of having to deep-clone the entire element everywhere it needs to appear. However, with the memory capacity of today's machines this cost is usually of no concern.

The situation is quite different, however, for `<img/>` elements with underlying SVG data and for any element referencing SVG data via a CSS `url()` function. In these cases applying styles has _no effect_ on the image because it has already been rasterized. **With this module, you can apply a set of thematic styles directly to such SVG data.**

## Data encoding
This module properly handles all flavors of SVG data:
Entity | SVG Data Source | Example
------ | --------------- | -------
`HTMLImageElement` object | GET request | `<img src="yourfile.svg">`
`HTMLImageElement` object | in-line, raw (unencoded) | `<img src="data:image/svg+xml,...">`
`HTMLImageElement` object | in-line, base64-encoded | `<img src="data:image/svg+xml;base64,...">`
`CSSStyleRule` property | GET request | `background-image: url(yourfile.svg)`
`CSSStyleRule` property | in-line, URI-encoded | `background-image: url(data:image/svg+xml,...)`
`CSSStyleRule` property | in-line, base64-encoded | `background-image: url(data:image/svg+xml;base64,...)`

> **Note:** Data in CSS `url()` constructs must always be encoded. (FYI, base64 encoding produces shorter results.)

> **Note:** Some browsers (looking at you, IE11) require `HTMLImageElement#src` to be encoded as well, depending on the content. For this reason, formerly unencoded data is always URI-encoded on write-back to `src` after styling as the content is now indeterminate.

## `theme` objects

Theming is performed in this module by calling property-setting functions that you supply. These "prop setters" take a `theme` parameter and applies it to the SVG element.

Your theming scheme (the shape of your theme object) is up to you and your prop setter functions. The standard implementation uses a very simple scheme with two properties, `color` and `backgroundColor`. A theme registry using this scheme might look like this:
```js
var theme = {
    blackAndWhite: { backgroundColor: 'white', color: 'black' },
    highwaySignage: { backgroundColor: '#006A4D', color: 'white' }, // Pantone 342
    stopSignage: { backgroundColor: '#da291c', color: 'white' } // Pantone 485
};
```

If you don't specify a custom prop setter for your SVG image, the fallback ([`svgThemer.setSvgProps`](#apisetsvgpropstheme)) will be called. The fallback assumes a particular simple scheme for `theme` objects. It may however be overridden to accommodate custom theming schemes.

## API

Access npm module:
```bash
npm i svg-themer --save
```
```js
var svgThemer = require('svg-themer');
```
Access UMD module (one of the following):
```html
<script src="https://unpkg.com/svg-themer/umd/svg-themer.js"></script>
<script src="https://unpkg.com/svg-themer/umd/svg-themer.min.js"></script>
```

### `svgThemer.setSvgProps(theme)`
Set properties on an `SVGSVGElement` element. Used by the other API methods to style an element extracted from an `<img>` element's `src` or a `CSSStyleRule` object property with a `url()` value. It then re-injects the styled version back into the `src` attribute or the CSS `url()`.

This method serves primarily as a fallback when a custom method is not supplied to the other API methods.

#### The standard implementation
The standard implementation accommodates a basic theming scheme, which it applies only to the root `SVGSVGElement`:

Color | `theme`<br>property | SVG style
:---: | :---: | :---:
Foreground | `.color` | `stroke` and `color`
Background | `.backgroundColor` | `fill`

> **Note:** The reason the standard implementation also sets `color` style is to facilitate using [`fill: currentColor`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentColor_keyword) inside the svg.

#### Styling `<svg>` DOM elements
This method can also be called directly on "live" `SVGSVGElement`s in the DOM:

```html
<html>
<body>
  <svg viewBox="25 25 450 450" width="45" height="45" xmlns="http://www.w3.org/2000/svg">
      <polygon points="475 350 350 475 150 475 25 350 25 150 150 25 350 25 475 150"></polygon>
      <path d="M 450 339 L 339 450 L 161 450 L 50 339 L 50 161 L 161 50 L 339 50 L 450 161 Z" style="stroke-width:15px"></path>
      <text transform="matrix(1, 0, 0, 1.689489, 3.74598, -160.023605)" style="fill: currentColor; font: 140.871px sans-serif; font-weight: bold; letter-spacing: -4.1px;" x="61" y="292">STOP</text>
  </svg>
  <svg viewBox="25 25 450 450" width="45" height="45" xmlns="http://www.w3.org/2000/svg">
      <polygon points="475 350 350 475 150 475 25 350 25 150 150 25 350 25 475 150"></polygon>
      <path d="M 450 339 L 339 450 L 161 450 L 50 339 L 50 161 L 161 50 L 339 50 L 450 161 Z" style="stroke-width:15px"></path>
      <text transform="matrix(1, 0, 0, 1.689489, 3.74598, -160.023605)" style="fill: currentColor; font: 140.871px sans-serif; font-weight: bold; letter-spacing: -4.1px;" x="61" y="292">STOP</text>
  </svg>
</body>
```
```js
var svg = document.querySelectorAll('svg');
svgThemer.setSvgProps.call(svg[0], theme.blackAndWhite);
svgThemer.setSvgProps.call(svg[1], theme.stopSignage);
```

Results (when `<svg>` elements use [this markup](https://raw.githubusercontent.com/joneit/svg-themer/master/STOP.svg)):

![black on white stop sign](STOP-black-on-white.svg) ![white on red stop sign](STOP-white-on-red.svg)

#### Overriding the standard implementation
The standard implementation may be overridden to accommodate custom theming schemes:
```js
svgThemer.setSvgProps = function(theme) { ... };
```

### `svgThemer.setImgSvgProps(theme, setSvgProps = svgThemer.setSvgProps)`
Themes SVG image data. Similar to calling `setSvgProps` on an `<svg>` element directly, except the context is expected to be an `HTMLImageElement` (shown here demonstrating both unencoded and encoded data):
```html
<html>
<body>
  <img src='data:image/svg+xml,<svg viewBox="25 25 450 450" width="45" height="45" xmlns="http://www.w3.org/2000/svg"><polygon points="475 350 350 475 150 475 25 350 25 150 150 25 350 25 475 150"></polygon><path d="M 450 339 L 339 450 L 161 450 L 50 339 L 50 161 L 161 50 L 339 50 L 450 161 Z" style="stroke-width:15px"></path><text transform="matrix(1, 0, 0, 1.689489, 3.74598, -160.023605)" style="fill: currentColor; font: 140.871px sans-serif; font-weight: bold; letter-spacing: -4.1px;" x="61" y="292">STOP</text></svg>'>
    <img src="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIyNSAyNSA0NTAgNDUwIiB3aWR0aD0iNDUiIGhlaWdodD0iNDUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBvbHlnb24gcG9pbnRzPSI0NzUgMzUwIDM1MCA0NzUgMTUwIDQ3NSAyNSAzNTAgMjUgMTUwIDE1MCAyNSAzNTAgMjUgNDc1IDE1MCI+PC9wb2x5Z29uPjxwYXRoIGQ9Ik0gNDUwIDMzOSBMIDMzOSA0NTAgTCAxNjEgNDUwIEwgNTAgMzM5IEwgNTAgMTYxIEwgMTYxIDUwIEwgMzM5IDUwIEwgNDUwIDE2MSBaIiBzdHlsZT0ic3Ryb2tlLXdpZHRoOjE1cHgiPjwvcGF0aD48dGV4dCB0cmFuc2Zvcm09Im1hdHJpeCgxLCAwLCAwLCAxLjY4OTQ4OSwgMy43NDU5OCwgLTE2MC4wMjM2MDUpIiBzdHlsZT0iZmlsbDogY3VycmVudENvbG9yOyBmb250OiAxNDAuODcxcHggc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IGJvbGQ7IGxldHRlci1zcGFjaW5nOiAtNC4xcHg7IiB4PSI2MSIgeT0iMjkyIj5TVE9QPC90ZXh0Pjwvc3ZnPg==">
</body>
```
```js
var img = document.querySelectorAll('img');
svgThemer.setImgSvgProps.call(img[0], theme.blackAndWhite);
svgThemer.setImgSvgProps.call(img[1], theme.stopSignage);
```
![black on white stop sign](STOP-black-on-white.svg) ![white on red stop sign](STOP-white-on-red.svg)

### `svgThemer.setRuleSvgProps(theme, setSvgProps = svgThemer.setSvgProps, propName = undefined)`
Themes an SVG style rule property. Similar to calling `setSvgProps` on an `<svg>` element directly, except the context is expected to be an `CSSStyleRule` (shown here using encoded data):
```html
<html>
<body>
  <style>
    .stop-sign {
      background-image: url(data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIyNSAyNSA0NTAgNDUwIiB3aWR0aD0iNDUiIGhlaWdodD0iNDUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBvbHlnb24gcG9pbnRzPSI0NzUgMzUwIDM1MCA0NzUgMTUwIDQ3NSAyNSAzNTAgMjUgMTUwIDE1MCAyNSAzNTAgMjUgNDc1IDE1MCI+PC9wb2x5Z29uPjxwYXRoIGQ9Ik0gNDUwIDMzOSBMIDMzOSA0NTAgTCAxNjEgNDUwIEwgNTAgMzM5IEwgNTAgMTYxIEwgMTYxIDUwIEwgMzM5IDUwIEwgNDUwIDE2MSBaIiBzdHlsZT0ic3Ryb2tlLXdpZHRoOjE1cHgiPjwvcGF0aD48dGV4dCB0cmFuc2Zvcm09Im1hdHJpeCgxLCAwLCAwLCAxLjY4OTQ4OSwgMy43NDU5OCwgLTE2MC4wMjM2MDUpIiBzdHlsZT0iZmlsbDogY3VycmVudENvbG9yOyBmb250OiAxNDAuODcxcHggc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IGJvbGQ7IGxldHRlci1zcGFjaW5nOiAtNC4xcHg7IiB4PSI2MSIgeT0iMjkyIj5TVE9QPC90ZXh0Pjwvc3ZnPg==)
    }
  </style>
  <span class='stop-sign'></span>
  <span class='stop-sign'></span>
</body>
```
```js
var rule = document.styleSheets[0].cssRules[0]; // first rule in first stylesheet
svgThemer.setRuleSvgProps.call(rule, theme.stopSignage);
```
In this case, all referencing elements are themed simultaneously:

![white on red stop sign](STOP-white-on-red.svg) ![white on red stop sign](STOP-white-on-red.svg)

If `propName` is not given, the following CSS style properties are searched in order for the first one with a `url()` value beginning with `data:image/svg+xml`:
* `background-image`
* `list-style-image`
* `border-image`
* `content`

### `svgThemer.mixin(svgOrImgOrRule, setSvgProps = svgThemer.setSvgProps)`

This method installs the above calls on an object directly, providing an alternative means of theming the object.

Mixes in one of the above methods as `setTheme` into the object referenced by `svgOrImgOrRule` when that object is one of:
* `SVGSVGElement` (`<svg>...</svg>`)
* `HTMLImageElement (`<img/>`) with underlying SVG markup in the `src` attribute
* `CSSStyleRule` (a stylesheet rule) with SVG markup in a particular style's `url` function

The method returns the object for chaining.

```js
var svgEl = document.querySelector('svg');
var imgEl = document.querySelector('img');
var rule = document.styleSheets[0].cssRules[0]; // first rule in first stylesheet

svgThemer.mixin(svgEl, propSetter);
svgThemer.mixin(imgEl, propSetter);
svgThemer.mixin(styleRule, propSetter);
```
The 2nd parameter is optional. If specified, it is used during the theming call (below), overriding the fallback [`svgThemer.setSvgProps`](#apisetsvgpropstheme). It is mixed in as `setSvgProps`.
Theme can then be applied the the above objects as follows:
```js
svgEl.setTheme(theme); // calls setSvgProps on itself
imgEl.setTheme(theme); // calls setImgSvgProps on itself
styleRule.setTheme(theme); // calls setRuleSvgProps on itself
```
Recall that `setImgSvgProps` and `setRuleSvgProps` take an optional 2nd parameter to override the prop setter; and `setRuleSvgProps` takes and optional 3rd paramter to name the property holding the `url()` to operate on. As noted in the comments in the example, the `setTheme` methods are references to these methods and therefore can also accept these optional parameters.

`mixin` is chainable (returns its context) for setting a default theme:
```js
svgThemer.mixin(object).setTheme(theme);
```
`setTheme` also returns its context so you can make the following assignment:
```js
var imgEl = svgThemer.mixin(document.querySelector('img')).setTheme(theme);
```

## UAT
Tested in the following browsers:
* macOS 10.13.6 (17G65)
   * Chrome 70.0.3538.77
   * Safari 12.0 (13606.2.11)
   * Opera 56.0.3051.102
   * Firefox 63.0.1
* Windows 10
   * Chrome 70.0.3538.77
   * Opera 56.0.3051.70
   * Firefox 63.0.0.6865
   * Edge 42.17134.1.0
   * Internet Explorer 11.345.17134.0 (Update 11.0.90)

## Version History
See [releases](https://github.com/joneit/svg-themer/releases).
