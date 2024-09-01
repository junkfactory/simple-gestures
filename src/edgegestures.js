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
  #threshold = 0.05;
  #scroller;

  constructor(config) {
    this.#config = config;
    this.#scroller = new Scroller();
    this.toggle();
  }

  #calculateJump({ pos, max, direction, threshold }) {
    const step = 10;
    const quarter = threshold / 4;
    if (direction === Direction.TOP || direction === Direction.LEFT) {
      if (pos < max + quarter) {
        return step << 4;
      } else if (pos < max + quarter * 2) {
        return step << 3;
      } else if (pos < max + quarter * 3) {
        return step << 2;
      } else {
        return step << 1;
      }
    } else {
      console.debug(
        `pos: ${pos}, max: ${max}, q1: ${max + quarter}, q2: ${max + quarter * 2}, q3: ${max + quarter * 3}`,
      );
      if (pos > max + quarter * 3) {
        return step << 4;
      } else if (pos > max + quarter * 2) {
        return step << 3;
      } else if (pos > max + quarter) {
        return step << 2;
      } else {
        return step << 1;
      }
    }
  }

  toggle() {
    const active = !this.#active;
    console.debug("EdgeGestures active: ", active);
    // if (!active) {
    //   this.#scroller.stop(Direction.ANY);
    // }
    this.#active = active;
  }

  trackingEdge(event) {
    if (!this.#active) {
      return false;
    }
    const vw = window.visualViewport.width - window.screenX;
    const vh = window.visualViewport.height - window.screenY;
    const thresholdValue = vh * this.#threshold;
    const x = event.clientX;
    const y = event.clientY;
    const edgeArea = {
      top: y < vh * this.#threshold,
      bottom: y > vh * (1 - this.#threshold),
      left: x < vw * this.#threshold,
      right: x > vw * (1 - this.#threshold),
    };

    if (event.type == "mouseout") {
      this.#scroller.stop(Direction.ANY);
      return true;
    }

    if (edgeArea.top) {
      const jump = this.#calculateJump({
        pos: y,
        max: 0,
        threshold: thresholdValue,
        direction: Direction.TOP,
      });
      console.debug(
        `bottom x: ${x}, y: ${y}, vw: ${vw}, vh: ${vh}, thresholdValue: ${thresholdValue}, jump: ${jump}`,
      );
      this.#scroller.start({
        direction: "y",
        amount: -jump,
      });
    } else if (edgeArea.bottom) {
      const jump = this.#calculateJump({
        pos: y,
        max: vh - thresholdValue,
        threshold: thresholdValue,
        direction: Direction.BOTTOM,
      });
      console.debug(
        `bottom x: ${x}, y: ${y}, vw: ${vw}, vh: ${vh}, thresholdValue: ${thresholdValue}, jump: ${jump}`,
      );
      this.#scroller.start({
        direction: "y",
        amount: jump,
      });
    } else if (edgeArea.right) {
      this.#scroller.start({
        direction: "x",
        amount: 10,
      });
    } else if (edgeArea.left) {
      this.#scroller.start({
        direction: "x",
        amount: -10,
      });
    } else {
      this.#scroller.stop(Direction.ANY);
    }
    return true;
  }
}
