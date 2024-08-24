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
