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

const STEP = 10;

class EdgeGestures {
  #config;
  #active = false;
  #threshold = 0.1;
  #scroller;
  #activeArea = null;

  constructor(config) {
    this.#config = config;
    this.#scroller = new Scroller();
    addEventListener("blur", this.#cancelIfScrolling.bind(this));
    addEventListener("pagehide", this.#cancelIfScrolling.bind(this));
    addEventListener("hashchange", this.#cancelIfScrolling.bind(this));
    addEventListener("scroll", this.#onScrollEnd.bind(this));
    this.toggle();
  }

  #onScrollEnd(event) {
    this.#activeArea?.render();
  }

  #createActiveArea(id, { x, y, width, height }) {
    let activeArea = this.#activeArea;
    if (!activeArea || activeArea.canvas.id !== id) {
      activeArea = {
        canvas: Canvas.create(id, { x: x(), y: y(), width, height }),
        pos: { x, y },
        render() {
          this.canvas.style.left = this.pos.x() + "px";
          this.canvas.style.top = this.pos.y() + "px";
        },
      };
      activeArea.canvas.onmouseout = this.#cancelIfScrolling.bind(this);
      this.#activeArea = activeArea;
    }
    activeArea.render();
  }

  #cancelIfScrolling(event) {
    if (this.#activeArea) {
      Canvas.destroy(this.#activeArea.canvas);
      this.#activeArea = null;
    }
    this.#scroller.stop(Direction.ANY);
  }

  #calculateJump({ pos, max, direction, threshold }) {
    const area = Math.ceil(threshold / 2);
    if (direction === Direction.TOP || direction === Direction.LEFT) {
      if (pos < max + area) {
        return STEP << 3;
      }
      return STEP << 1;
    } else {
      if (pos > max + area) {
        return STEP << 3;
      }
      return STEP << 1;
    }
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
    const vw = window.visualViewport.width - window.screenX - 2;
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

    if (edgeArea.top) {
      this.#createActiveArea("topArea", {
        x: () => 0,
        y: () => window.visualViewport.pageTop,
        width: vw,
        height: 10,
      });
      const jump = this.#calculateJump({
        pos: y,
        max: 0,
        threshold: thresholdValue,
        direction: Direction.TOP,
      });
      this.#scroller.start({
        direction: "y",
        amount: -jump,
      });
    } else if (edgeArea.bottom) {
      this.#createActiveArea("bottomArea", {
        x: () => 0,
        y: () =>
          window.visualViewport.pageTop + window.visualViewport.height - 10,
        width: vw,
        height: 10,
      });
      const jump = this.#calculateJump({
        pos: y,
        max: vh - thresholdValue,
        threshold: thresholdValue,
        direction: Direction.BOTTOM,
      });
      this.#scroller.start({
        direction: "y",
        amount: jump,
      });
    } else if (edgeArea.right) {
      this.#scroller.start({
        direction: "x",
        amount: STEP,
      });
    } else if (edgeArea.left) {
      this.#scroller.start({
        direction: "x",
        amount: -STEP,
      });
    } else {
      this.#cancelIfScrolling(event);
    }
    return true;
  }
}
