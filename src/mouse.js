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

class Mouse {
  #lastHoveredElement = undefined;

  click(element, modifiers) {
    if (modifiers == null) modifiers = {};
    const eventSequence = [
      "pointerover",
      "mouseover",
      "pointerdown",
      "mousedown",
      "pointerup",
      "mouseup",
      "click",
    ];
    for (const event of eventSequence) {
      this.#dispatchMouseEvent(event, element, modifiers);
    }
  }

  // Returns false if the event is cancellable and one of the handlers called
  // event.preventDefault().
  #dispatchMouseEvent(event, element, modifiers) {
    if (modifiers == null) modifiers = {};
    if (event === "mouseout") {
      // Allow unhovering the last hovered element by passing undefined.
      if (element == null) element = this.#lastHoveredElement;
      this.#lastHoveredElement = undefined;
      if (element == null) return;
    } else if (event === "mouseover") {
      // Simulate moving the mouse off the previous element first, as if we were a real mouse.
      this.#dispatchMouseEvent("mouseout", undefined, modifiers);
      this.#lastHoveredElement = element;
    }

    const mouseEvent = new MouseEvent(event, {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      detail: 1,
      ctrlKey: modifiers.ctrlKey,
      altKey: modifiers.altKey,
      shiftKey: modifiers.shiftKey,
      metaKey: modifiers.metaKey,
    });
    return element.dispatchEvent(mouseEvent);
  }
}
