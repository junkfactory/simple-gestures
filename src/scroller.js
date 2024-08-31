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
  #state = {
    scrollId: false,
    direction: null,
  };

  #currentScrollingElement() {
    return document.scrollingElement;
  }

  startScroll({ scrollValue, direction, x, y }) {
    const state = this.#state;
    if (state.scrollId) {
      return;
    }
    this.stopScroll(direction);
    const scrollingElement = this.#currentScrollingElement();
    state.direction = direction;
    state.scrollId = setInterval(
      () => {
        scrollingElement.scrollBy({ left: x, top: y, behavior: "smooth" });
      },
      scrollValue,
      this,
    );
    console.debug("EdgeGestures startScroll", state);
  }

  stopScroll({ direction }) {
    const state = this.#state;
    if (state.scrollId && state.direction !== direction) {
      console.debug("EdgeGestures stopScroll");
      clearInterval(state.scrollId);
      state.scrollId = false;
      state.direction = null;
    }
  }
}
