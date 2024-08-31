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

const Direction = {
  TOP: 0,
  RIGHT: 1,
  BOTTOM: 2,
  LEFT: 3,
  ANY: -1,
};

class EdgeGestures {
  #config;
  #active = false;
  #threshold = 0.1;
  #scroller;

  constructor(config) {
    this.#config = config;
    this.#scroller = new Scroller();
  }

  toggle() {
    const active = !this.#active;
    console.debug("EdgeGestures active: ", active);
    this.#active = active;
  }

  trackingEdge(event) {
    if (!this.#active) {
      return false;
    }
    const vw = window.visualViewport.width - window.screenX;
    const vh = window.visualViewport.height - window.screenY;
    let scrollValue = 50;
    const thresholdValue = vh * this.#threshold;
    const thresholdValueHalf = thresholdValue / 2;
    const x = event.clientX;
    const y = event.clientY;
    const edgeArea = {
      top: y < vh * this.#threshold,
      bottom: y > vh * (1 - this.#threshold),
      left: x < vw * this.#threshold,
      right: x > vw * (1 - this.#threshold),
    };
    if (edgeArea.top) {
      this.#scroller.startScroll({
        scrollValue,
        direction: Direction.TOP,
        x: 0,
        y: -10,
      });
    } else if (edgeArea.right) {
      this.#scroller.startScroll({
        scrollValue,
        direction: Direction.RIGHT,
        x: 10,
        y: 0,
      });
    } else if (edgeArea.bottom) {
      this.#scroller.startScroll({
        scrollValue,
        direction: Direction.BOTTOM,
        x: 0,
        y: 10,
      });
    } else if (edgeArea.left) {
      this.#scroller.startScroll({
        scrollValue,
        direction: Direction.LEFT,
        x: -10,
        y: 0,
      });
    } else {
      this.#scroller.stopScroll(Direction.ANY);
    }
    return true;
  }
}
