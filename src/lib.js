// The MIT License (MIT)
// ----------------------------------------------
//
// Copyright © 2024 junkfactory@gmail.com
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the “Software”), to deal in
// the Software without restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
// Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR
// A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH
// THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const $ = function (path) {
  if (path) {
    var objs = document.querySelectorAll(path);
    return objs.length > 1 ? objs : objs.item(0);
  }
  return document;
};

function invertHash(hash) {
  var inv = {};
  for (key in hash) {
    //don't invert urls
    try {
      inv[key] = new URL(hash[key]).toString().trim();
    } catch (error) {
      inv[hash[key]] = key;
    }
  }
  return inv;
}

function isUrl(value) {
  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
}

function removeFromArray(arr, item) {
  let i = arr.indexOf(item);
  while (i > -1) {
    arr.splice(i, 1);
    i = arr.indexOf(item);
  }
}

function addToArrayIfNotExists(arr, item) {
  if (arr.indexOf(item) == -1) {
    arr.push(item);
  }
}
