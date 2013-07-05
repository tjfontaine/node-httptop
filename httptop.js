#!/usr/bin/env node

// Copyright 2013 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn;
var util = require('util');

var blessed = require('blessed');
var lstream = require('lstream');

var Top = require('./dtrace_transform');
var transform = new Top();

var dtrace = spawn('dtrace', ['-qZs', path.join(__dirname, 'httptop.d')]);
dtrace.stdout.pipe(new lstream({})).pipe(transform);

var screen = new blessed.Screen();

var outer = blessed.Box({
  border: {
    type: 'ascii',
  },
});

var upper = blessed.List({
  bg: 'default',
  border: {
    type: 'ascii',
  },
  height: '50%',
  selectedBg: 'green',
});

var lower = blessed.Box({
  align: 'center',
  top: '49%',
  height: '53%',
  border: {
    type: 'ascii',
  },
});

outer.append(upper);
outer.append(lower);

screen.on('keypress', function (ch, key) {
  switch(key.name) {
    case 'up':
      upper.up();
      break;
    case 'down':
      upper.down();
      break;
    case 'q':
      process.exit();
      break;
  }
  displayLatency();
  screen.render();
});

screen.append(outer);

transform.on('count', function(count) {
  var items = [];
  var width = upper.width - 5;

  Object.keys(count).forEach(function (k) {
    var item = count[k];
    var t = k;

    while(t.length < (width - item.length)) t += ' ';
    
    items.push({k: t, v: item});
  });

/*
  items.sort(function (a, b) {
    if (a.v > b.v)
      return -1;
    else if (a.v < b.v)
      return 1;
    else
      return 0;
  });
*/

  var keys = [];

  items.forEach(function (i) {
    keys.push(i.k + i.v);
  });

  upper.setItems(keys);

  screen.render();
});

function displayLatency() {
  var item = upper.items[upper.selected];
  if (!item) return;
  item = item.content;
  item = item.split(/\d+$/)[0].trim();
  //lower.setContent(item);
  var latent = transform.latency[item];
  if (!latent) return;
  lower.setContent(latent.join('\n'));
}

transform.on('latency', function(latency) {
  //console.log(latency);
  displayLatency();
  screen.render();
});

transform.on('readable', function() {
  // pipe to devnull
  while(transform.read(10 * 1024) != null) {}
});

screen.render();
