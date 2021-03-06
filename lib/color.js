/**
# Color Utilities

Creating color objects:

    parse(css_or_html_color_spec);

Accepts colors in typical formats, e.g:

    parse('firebrick');
    parse('#007');
    parse('rgba(255,128,0,0.5)');

You can also create colors directly:

    rgb(r, g, b);
    rgb({r, g, b});

Generate a color from rgb values.

    hsv(h, s, v);
    hsv({h, s, v});

Generate a color from hsv values.

    rgba(r, g, b, a);
    rgba({r, g, b, a});

Generate a color from rgba values.

Note that **parse** supports CSS color names.

Speaking of which:

    cssColors();

Returns a list of CSS colors.

    cssColorNames();

Returns just the names of the CSS colors.

    clamp(min, x, max);

Returns `x` if it's in [min, max], `min` if it's less and `max` if it's more.

    lerp(a, b, t);

Returns a vallue that is between a and b, interpolated by t (clamped to [0, 1]);

    gamma(v, g);

Returns `v` gamma-adjusted by `g`. (if `g` is < 1 then `v` will be *brightened*).
Gamma is confusing -- you may be used to seeing numbers like 2.2 being the gamma adjustment of a modern
computer display -- this would be `gamma(some_value, 1/2.2)`;

Note that gamma applies to floats, assumed to be in [0,1], and not colors.
*/
/* jshint latedef:false */
/* global module, require, console */
'use strict';

let _cssColors;
const cssColors = () => {
  if(!_cssColors) {
    _cssColors = require('./css-color-names.json');
  }
  return _cssColors;
};

const hex2 = n => ('00' + Number(n).toString(16)).substr(-2);

const cssColorNames = () => Object.keys(cssColors());

let hsv;

function clamp(min, v, max) {
  return v < min ? min : (v > max ? max : v);
}

function lerp(a, b, t) {
  t = clamp(0, t, 1);
  return t * (b - a) + a;
}

function gamma(v, g) {
  if (v >= 1) {
    return 1;
  } else if (v <= 0) {
    return 0;
  } else {
    return Math.exp(Math.log(v) * g);
  }
}

class color {
/**

## Color Objects

    new color(r, g, b [, a]); // creates a color object

The color constructor is used internally.

### Properties

Internally, color methods retain **r** [0, 255], **g** [0, 255], **b** [0, 255], and **a** [0, 1] values.

### Methods

Once you have a color, there are lots of handy utilites:

    color.invert();

Inverts the color (but not its alpha channel!)

    color.rgb();

Returns the color as a css color in `rgb(...)` form.

    color.rgba();

Returns the color as a css color in `rgba(...)` form.

    color.html();

Returns the color as a css color in `#xxxxxx` form.

    color.hsv();

Return an {h, s, v} object. `h` is 0-360°.

    brightness();

Returns the color's `brightness` (Y or luminance) using the formula used for HD TV (http://www.itu.int/rec/R-REC-BT.601)

    mono();

Returns a new greyscale color object based on `brightness()`.

    blend(other_color, t);

Returns a new color created by blending in other_color scaled by t (in [0,1]).

    swatch();

Logs the color to the console (if the console supports log colors).

*/
  constructor(r, g, b, a) {
    this.r = clamp(0, r, 255);
    this.g = clamp(0, g, 255);
    this.b = clamp(0, b, 255);
    this.a = a !== undefined ? clamp(0, a, 1) : a = 1;
  }
  invert(){
    return new color(255 - this.r, 255 - this.g, 255 - this.b, this.a);
  }
  rgb(){
    const {r,g,b} = this;
    return `rgb(${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)})`;
  }
  rgba(){
    const {r,g,b,a} = this;
    return `rgba(${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)},${a.toFixed(3)})`;
  }
  hsv(){
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;
    const cmax = Math.max(r, g, b);
    const cmin = Math.min(r, g, b);
    const delta = cmax - cmin;
    let h;
    if (delta === 0) {
      h = 0;
    } else if (cmax === r) {
      h = (((g - b) / delta) + 6) % 6;
    } else if (cmax === g) {
      h = (((b - r) / delta) + 2) % 6;
    } else { // cmax === b
      h = (((r - g) / delta) + 4) % 6;
    }
    h *= 60;
    const s = cmax > 0 ? (cmax - cmin) / cmax : 0;
    return {h, s, v: cmax};
  }
  mono () {
    const v = this.brightness() * 255;
    return new color (v, v, v);
  }
  brightness () {
    // http://www.itu.int/rec/R-REC-BT.601
    return (0.299 * this.r + 0.587 * this.g + 0.114 * this.b) / 255;
  }
  html() {
    return '#' + hex2(this.r) + hex2(this.g) + hex2(this.b);
  }
  swatch() {
    const {r,g,b,a} = this;
    console.log('%c %s', `background-color: rgba(${r}, ${g}, ${b}, ${a})`, `rgba(${r}, ${g}, ${b}, ${a})`);
  }
  blend(other_color, t) {
    return rgba(
      lerp(this.r, other_color.r, t),
      lerp(this.g, other_color.g, t),
      lerp(this.b, other_color.b, t),
      lerp(this.a, other_color.a, t)
    );
  }
/**
    color.difference(other_color) // => info object

This is the difference between two colors expressed in a variety of ways. The object
returns looks like:

    {
      h, s, v,
      r, g, b, a,
      brightness,
      color_distance,
      distance,
    }

**h**, **s**, and **v** are differences in hue, saturation, and value. h is on a scale of 0-180.

**r**, **g**, **b**, and **a** are differences in r, g, b, and a.

__color_distance__ is the cartesian distance between the two colors multiplied by the
higher of the two colors' opacities. (So the difference between two very transparent
colors is always slight; the difference between opaque colors is exactly what you expect).

E.g. the difference between bright red and black is √(1/3). The difference between red and white
is √(2/3). The difference between black and white is 1. The difference between yellow `#ff0` and
blue `#00f` is also 1.

__distance__ is the cartesian distance between the colors (calculated above and the difference
in alpha).

E.g. The difference between black and white is √2, while the difference between opaque
black and transparent white is 1.
*/
  difference(other_color) {
    const r = Math.abs(this.r - other_color.r);
    const g = Math.abs(this.g - other_color.g);
    const b = Math.abs(this.b - other_color.b);
    const a = Math.abs(this.a - other_color.a);
    const a_max = Math.max(this.a - other_color.a);
    const hsv_0 = this.hsv();
    const hsv_1 = other_color.hsv();
    const color_distance = Math.sqrt((r * r + g * g + b * b) / 3) * a_max;
    let h = Math.abs(hsv_0.h - hsv_1.h);
    if (h > 180) {
      h = 360 - h;
    }
    const s = Math.abs(hsv_0.s - hsv_1.s);
    const v = Math.abs(hsv_0.v - hsv_1.v);
    const brightness = this.brightness() - other_color.brightness();
    return {
      h, s, v,
      r, g, b, a,
      brightness,
      color_distance,
      distance: Math.sqrt((color_distance * color_distance + a * a) / 2),
    };
  }
}

function rgb(...args) {
  let r, g, b;
  if (args.length === 1) {
    ({r, g, b} = args);
  } else if (args.length === 3) {
    [r, g, b] = args;
  }
  return new color(r, g, b);
}

function rgba(...args) {
  let r, g, b, a;
  if (args.length === 1) {
    ({r, g, b, a} = args);
  } else if (args.length === 4) {
    [r, g, b, a] = args;
  }
  return new color(r, g, b, a);
}

function parse(color_spec) {
  color_spec = color_spec.replace(/\, /g, ',');
  const [,rgb,,rgba,,html6,html3,name] = color_spec.match(/(rgb\(\d+(,\d+){2}\))|(rgba\(\d+(,\d+){2},[\d.]+\))|(#[0-9a-fA-F]{6})|(#[0-9a-fA-F]{3})|(\w+)/);
  var r = 0, g = 0, b = 0, a = 1;
  if (rgb) {
    [r,g,b] = rgb.match(/\d+/g).map(n => parseFloat(n));
  } else if (rgba) {
    [r,g,b,a] = rgba.match(/[\d.]+/g).map(n => parseFloat(n));
  } else if (html6) {
    [r,g,b] = html6.match(/[\da-fA-F]{2}/g).map(h => parseInt(h, 16));
  } else if (html3) {
    [r,g,b] = html3.match(/[\da-fA-F]/g).map(h => parseInt(h + h, 16));
  } else {
    if (name && cssColors()[name]) {
      [r,g,b] = cssColors()[name].match(/[\da-fA-F]{2}/g).map(h => parseInt(h, 16));
    } else {
      console.warn(`could not parse "${color_spec}" as color`);
    }
  }
  return new color(r, g, b, a);
}

function random() {
  return hsv(Math.random() * 360, 1, 1);
}

function randomCssColor() {
  const names = cssColorNames();
  return names[Math.floor(Math.random() * names.length)];
}

hsv = (...args) => {
  let h, s, v;
  if (args.length === 1) {
    ({h, s, v} = args[0]);
  } else if (args.length === 3) {
    [h, s, v] = args;
  } else {
    throw 'hsv expects either three args or an {h, s, v} object';
  }
  h = (h + 360) % 360;
  s = clamp(0, s, 1);
  v = clamp(0, v, 1);
  const cmax = v;
  const cmin = (1 - s) * v;
  const delta = cmax - cmin;
  let r, g, b;
  h = h/60;
  if (h < 1) {
    r = cmax;
    g = h * delta + cmin;
    b = cmin;
  } else if (h < 3) {
    r = cmin + Math.max(0, 2 - h) * delta;
    g = cmax;
    b = cmin + Math.max(0, h - 2) * delta;
  } else if (h < 5) {
    g = cmin + Math.max(0, 4 - h) * delta;
    b = cmax;
    r = cmin + Math.max(0, h - 4) * delta;
  } else {
    r = cmax;
    g = cmin;
    b = cmin + Math.max(0, 6 - h) * delta;
  }

  return new color(r * 255, g * 255, b * 255);
};

/**

```
<style>
  .color-test {
    border-collapse: collapse;
  }
  .color-test td {
    padding: 2px 4px;
    min-width: 30px;
  }
</style>
<table class="color-test">
  <thead>
    <tr>
      <th>test color</th>
      <th>hsv</th>
      <th>hue +15°</th>
      <th>hue -60°</th>
      <th>sat +25%</th>
      <th>50% sat</th>
      <th>25% sat</th>
      <th>mono</th>
      <th>darken</th>
      <th>brighten</th>
      <th>gamma</th>
      <th>invert</th>
    </tr>
  </thead>
  <tbody>
    <tr data-list="_component_.color_test"
      data-bind="style(backgroundColor)=.spec;style(color)=.accent"
    >
      <td data-bind="text=.spec"></td>
      <td data-bind="style(backgroundColor)=.hsv"></td>
      <td data-bind="style(backgroundColor)=.hue"></td>
      <td data-bind="style(backgroundColor)=.hue60"></td>
      <td data-bind="style(backgroundColor)=.sat"></td>
      <td data-bind="style(backgroundColor)=.desat"></td>
      <td data-bind="style(backgroundColor)=.desat25"></td>
      <td data-bind="style(backgroundColor)=.mono"></td>
      <td data-bind="style(backgroundColor)=.darken"></td>
      <td data-bind="style(backgroundColor)=.brighten"></td>
      <td data-bind="style(backgroundColor)=.gc"></td>
      <td data-bind="style(backgroundColor)=.invert"></td>
    </tr>
  </tbody>
</table>
<script>
const color = require('../lib/color.js');

const color_test = [];

const hsv_render = ({h, s, v}) => `${h.toFixed(2)}° s:${s.toFixed(2)}  v:${v.toFixed(2)}`;
const specs = color.cssColorNames();

const white = color.parse('white');
const black = color.parse('black');

specs.unshift('#a00', '#a74', '#aa4', '#7a4', '#4a4', '#4a7', '#4aa', '#47a', '#44a', '#74a', '#a4a', '#a47');
specs.unshift('#f00', '#f70', '#ff0', '#7f0', '#0f0', '#0f7', '#0ff', '#07f', '#00f', '#70f', '#f0f', '#f07');
specs.unshift('#000', '#111', '#222', '#333', '#444', '#555', '#666', '#777', '#888', '#999', '#aaa', '#bbb', '#ccc', '#ddd', '#eee', '#fff');

specs.forEach(spec => {
  const c = color.parse(spec);
  const {r, g, b} = c;
  const c_hsv = c.hsv();
  const {h, s, v} = c_hsv;
  const hsv = color.hsv(c_hsv).rgb();
  const hue = color.hsv(h + 15, s, v).rgb();
  const hue60 = color.hsv(h - 60, s, v).rgb();
  const mono = c.mono().rgb();
  const sat = color.hsv(h, s + 0.25, v).rgb();
  const desat = color.hsv(h, s * 0.5, v).rgb();
  const desat25 = color.hsv(h, s * 0.25, v).rgb();
  const darken = color.hsv(h, s, v - 0.2).rgb();
  const brighten = color.hsv(h, s, v + 0.2).rgb();
  const gc = color.hsv(h, s, color.gamma(v, 0.5)).rgb();
  const invert = c.invert().rgb();
  const accent = color.hsv(h + 180, s * 0.5, c.brightness() < 0.5 ? 0.95 : 0.05).rgb();
  color_test.push({spec, hsv, mono, hue, hue60, sat, desat, desat25, darken, brighten, gc, invert, accent});
});

set({color_test});

</script>
```
*/

module.exports = {rgb, rgba, hsv, random, randomCssColor, parse, cssColors, cssColorNames, gamma};
