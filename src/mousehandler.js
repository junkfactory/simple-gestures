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

// console.debug = () => {};

class MouseHandler {
  #gesture;
  #edgeGesture;
  #rmouseDown = false;
  #currentElement = null;
  #suppress = 1;
  #elementFromPoint;
  #elementMouseDown;

  constructor({ gesture, edgeGesture }) {
    this.#gesture = gesture;
    this.#edgeGesture = edgeGesture;
    this.#elementMouseDown = this.#mouseDown.bind(this);
  }

  #contextMenu(event) {
    if (!this.#gesture.config.enabled) {
      return true;
    }

    if (this.#suppress) {
      console.debug("context menu suppress", {
        event: event,
        rmouseDown: this.#rmouseDown,
        suppress: this.#suppress,
      });
      return false;
    }

    this.#rmouseDown = false;
    this.#suppress++;
    console.debug("context menu", {
      event: event,
      rmouseDown: this.#rmouseDown,
      suppress: this.#suppress,
    });
    return true;
  }

  #watchCurrentElement(event) {
    const currentElement = this.#elementFromPoint(event.clientX, event.clientY);
    if (currentElement) {
      //track the mouse if we are holding the right button
      if (currentElement !== this.#currentElement) {
        if (this.#currentElement) {
          this.#currentElement.removeEventListener(
            "mousedown",
            this.#elementMouseDown,
          );
        }
        currentElement.addEventListener("mousedown", this.#elementMouseDown);
        this.#currentElement = currentElement;
      }
    }
  }

  #mouseUp(event) {
    if (!this.#gesture.config.enabled) {
      return true;
    }
    console.debug("mouse up", event);
    // const edgeGesture = this.#edgeGesture;
    // if (event.button == 1) {
    //   edgeGesture.toggle();
    // }
    if (this.#rmouseDown && event.buttons > 0) {
      if (event.button == 2) {
        browser.runtime.sendMessage({ msg: Actions.NextTab });
      } else if (event.button == 0) {
        browser.runtime.sendMessage({ msg: Actions.PrevTab });
        ++this.#suppress;
      }
    } else if (event.button == 2) {
      if (this.#gesture.moved) {
        this.#gesture.execute();
      } else {
        --this.#suppress;
      }
    }
    this.#rmouseDown = false;
    //always remove canvas on mouse up
    this.#gesture.stop();
    return true;
  }

  #mouseDown(event) {
    if (!this.#gesture.config.enabled) {
      return true;
    }
    console.debug("mouse down", {
      rmouseDown: this.#rmouseDown,
      suppress: this.#suppress,
      event,
    });
    this.#rmouseDown = event.button == 2;
    if (this.#rmouseDown && this.#suppress) {
      this.#gesture.start(event);
      return false;
    }

    return false;
  }

  #mouseMove(event) {
    if (!this.#gesture.config.enabled) {
      return true;
    }
    this.#watchCurrentElement(event);
    if (this.#rmouseDown) {
      this.#gesture.move(event);
      return false;
    }
    this.#edgeGesture.trackingEdge(event);
    return true;
  }

  #mouseLeave(event) {
    if (!this.#gesture.config.enabled) {
      return true;
    }
    console.debug("mouse leave", event);
    // this.#edgeGesture.trackingEdge(event);
    return true;
  }

  install(doc) {
    this.#elementFromPoint = doc.elementFromPoint.bind(doc);
    doc.oncontextmenu = this.#contextMenu.bind(this);
    doc.onmousemove = this.#mouseMove.bind(this);
    doc.onmouseup = this.#mouseUp.bind(this);
    doc.onmousedown = this.#mouseDown.bind(this);
    doc.onmouseleave = this.#mouseLeave.bind(this);
    this.#gesture.install(doc);
  }
}
