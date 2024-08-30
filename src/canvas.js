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

class Canvas {
  #id = "canvas";
  #config;

  constructor(config) {
    this.#config = config;
  }

  get instance() {
    return $("#" + this.#id);
  }

  create() {
    let canvas = this.instance;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = this.#id;
      document.body.appendChild(canvas);
    }

    const vw = window.visualViewport.width - window.screenX;
    const vh = window.visualViewport.height - window.screenY;

    const canvas_top = window.visualViewport.pageTop + "px";
    canvas.style.width = vw;
    canvas.width = vw;
    canvas.style.height = vh;
    canvas.height = vh;
    canvas.style.left = "0px";
    canvas.style.top = canvas_top;
    canvas.style.overflow = "visible";
    canvas.style.position = "absolute";
    canvas.style.zIndex = "10000";
  }

  draw({ move, line }) {
    const canvas = this.instance;
    if (canvas) {
      const canvas_top = canvas.style.top.replace("px", "");
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.strokeStyle = "#" + this.#config.trail.color;
      ctx.lineWidth = this.#config.trail.width;
      ctx.moveTo(move.x, move.y - canvas_top);
      ctx.lineTo(line.x, line.y - canvas_top);
      ctx.stroke();
    } else {
      console.warn("Canvas not found to draw");
    }
    return line;
  }

  destroy() {
    const canvas = this.instance;
    if (canvas) {
      try {
        document.body.removeChild(canvas);
      } catch (error) {}
    } else {
      console.info("Canvas not found to destroy");
    }
  }
}
