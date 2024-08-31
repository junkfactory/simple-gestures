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

class Scroller {
  static #DEFAULT_SCROLL_SPEED = 2500;
  #state;

  constructor() {
    this.#state = {
      scrollId: false,
      direction: null,
      x: 0,
      y: 0,
    };
  }

  #currentScrollingElement() {
    return document.scrollingElement;
  }

  start({ direction, x, y }) {
    if (this.stop({ direction })) {
      const scrollingElement = this.#currentScrollingElement();
      const state = this.#state;
      scrollingElement.scrollBy({ left: x, top: y, behavior: "smooth" });
      state.direction = direction;
      state.x = x;
      state.y = y;
      state.scrollId = setInterval(
        (edge) => {
          console.debug("edge", edge);
          scrollingElement.scrollBy({ left: x, top: y, behavior: "smooth" });
        },
        Scroller.#DEFAULT_SCROLL_SPEED,
        state,
      );
      console.debug(`start scroll ${direction}`, this.#state);
    }
  }

  stop({ direction, x, y }) {
    const state = this.#state;
    if (
      state.scrollId &&
      (state.direction !== direction || state.x !== x || state.y !== y)
    ) {
      console.debug(`stop scroll ${direction}`, this);
      clearInterval(state.scrollId);
      state.scrollId = false;
      state.direction = null;
      return true;
    }
    return state.scrollId === false;
  }
}
