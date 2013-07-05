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

var stream = require('stream');
var util = require('util');

function Top() {
  this._aggr = undefined;
  this.count = {};
  this.latency = {};
  this._latency_key = undefined;

  stream.Transform.call(this, {});
}
util.inherits(Top, stream.Transform);

Top.prototype._transform = function(chunk, encoding, cb){
  var orig = chunk.toString('utf8');
  var line = orig.trim();
  //this.push(chunk);

  cb();

  if (!line) return;

  var m = line.match(/^### (\w+)/);

  if (m) {
    if (m[1] === this._aggr) {
      this.emit(this._aggr, this[this._aggr]);
      this._aggr = undefined;
    } else if (!this._aggr) {
      this._aggr = m[1];
    } else {
      throw new Error("out of order?!");
    }

    return;
  }

  switch(this._aggr) {
    case 'count':
      m = line.match(/^(\/.*)\s+(\w+)\s+(\d+)/);
      this.count[m[2] + ' ' + m[1].trim()] = m[3];
      break;
    case 'latency':
      m = line.match(/^(\/.*)\s+(\w+)/);
      if (m) {
        this._latency_key = m[2] + ' ' + m[1].trim();
        this.latency[this._latency_key] = [];
        return;
      }
      /*
      if (/^value/.test(line)) return;
      m = line.match(/(\d+)\s\|(?:@|\s)+(\d+)/);
      this.latency[this._latency_key][m[1]] = m[2];
      */
      this.latency[this._latency_key].push(orig);
      break;
  }
};

module.exports = Top;
