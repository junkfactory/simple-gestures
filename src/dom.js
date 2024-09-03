class Dom {
  #mouse;

  constructor() {
    this.#mouse = new Mouse();
  }

  #isLinkRef(linkElement) {
    if (linkElement.nodeName.toLowerCase() === "link") {
      return true;
    }

    return false;
  }

  #followLink(linkElement) {
    if (this.#isLinkRef(linkElement)) {
      window.location.href = linkElement.href;
    } else {
      //for javascript based links
      linkElement.scrollIntoView({ behavior: "smooth", block: "start" });
      this.#mouse.click(linkElement);
    }
  }

  makeXPath(elementArray) {
    const xpath = [];
    for (const element of elementArray) {
      xpath.push(".//" + element, ".//xhtml:" + element);
    }
    return xpath.join(" | ");
  }

  evaluateXPath(xpath, resultType) {
    const contextNode = document.webkitIsFullScreen
      ? document.webkitFullscreenElement
      : document.documentElement;
    const namespaceResolver = function (namespace) {
      if (namespace === "xhtml") return "http://www.w3.org/1999/xhtml";
      else return null;
    };
    return document.evaluate(
      xpath,
      contextNode,
      namespaceResolver,
      resultType,
      null,
    );
  }

  findLinkElement(linkStrings) {
    const linksXPath = this.makeXPath([
      "a",
      "button",
      "*[@onclick or @role='link' or contains(@class, 'button')]",
    ]);
    const links = this.evaluateXPath(
      linksXPath,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    );
    let candidateLinks = [];

    // at the end of this loop, candidateLinks will contain all visible links that match our patterns
    // links lower in the page are more likely to be the ones we want, so we loop through the snapshot
    // backwards
    for (let i = links.snapshotLength - 1; i >= 0; i--) {
      const link = links.snapshotItem(i);

      // ensure link is visible (we don't mind if it is scrolled offscreen)
      const boundingClientRect = link.getBoundingClientRect();
      if (boundingClientRect.width === 0 || boundingClientRect.height === 0) {
        continue;
      }

      const computedStyle = window.getComputedStyle(link, null);
      const isHidden =
        computedStyle.getPropertyValue("visibility") != "visible" ||
        computedStyle.getPropertyValue("display") == "none";
      if (isHidden) continue;

      let linkMatches = false;
      for (const linkString of linkStrings) {
        // SVG elements can have a null innerText.
        const matches =
          link.innerText?.toLowerCase().includes(linkString) ||
          link.value?.includes?.(linkString) ||
          link.getAttribute("title")?.toLowerCase().includes(linkString) ||
          link.getAttribute("aria-label")?.toLowerCase().includes(linkString);
        if (matches) {
          linkMatches = true;
          break;
        }
      }

      if (!linkMatches) continue;

      candidateLinks.push(link);
    }

    if (candidateLinks.length == 0) return false;

    for (const link of candidateLinks) {
      link.wordCount = link.innerText.trim().split(/\s+/).length;
    }

    // We can use this trick to ensure that Array.sort is stable. We need this property to retain the
    // reverse in-page order of the links.
    candidateLinks.forEach((a, i) => (a.originalIndex = i));

    // favor shorter links, and ignore those that are more than one word longer than the shortest link
    candidateLinks = candidateLinks
      .sort(function (a, b) {
        if (a.wordCount === b.wordCount) {
          return a.originalIndex - b.originalIndex;
        } else {
          return a.wordCount - b.wordCount;
        }
      })
      .filter((a) => a.wordCount <= candidateLinks[0].wordCount + 1);

    for (const linkString of linkStrings) {
      const exactWordRegex =
        /\b/.test(linkString[0]) || /\b/.test(linkString[linkString.length - 1])
          ? new RegExp("\\b" + linkString + "\\b", "i")
          : new RegExp(linkString, "i");
      for (const candidateLink of candidateLinks) {
        if (
          candidateLink.innerText.match(exactWordRegex) ||
          candidateLink.value?.match(exactWordRegex) ||
          candidateLink.getAttribute("title")?.match(exactWordRegex) ||
          candidateLink.getAttribute("aria-label")?.match(exactWordRegex)
        ) {
          return candidateLink;
        }
      }
    }
    return false;
  }

  findAndFollowLink(linkStrings) {
    const linkElement = this.findLinkElement(linkStrings);
    if (linkElement) {
      this.#followLink(linkElement);
      return true;
    }
    return false;
  }

  findAndFollowRel(value) {
    const relTags = ["link", "a", "area"];
    for (const tag of relTags) {
      const elements = document.getElementsByTagName(tag);
      for (const element of Array.from(elements)) {
        if (
          element.hasAttribute("rel") &&
          element.rel.toLowerCase() === value
        ) {
          this.#followLink(element);
          return true;
        }
      }
    }
  }

  determineLink(target, allowedDrillCount) {
    if (target.href) {
      return target.href;
    }
    if (target.parentElement && allowedDrillCount > 0) {
      return this.determineLink(target.parentElement, allowedDrillCount - 1);
    }
    return null;
  }

  //
  // Returns the first visible clientRect of an element if it exists. Otherwise it returns null.
  //
  // WARNING: If testChildren = true then the rects of visible (eg. floated) children may be
  // returned instead. This is used for LinkHints and focusInput, **BUT IS UNSUITABLE FOR MOST OTHER
  // PURPOSES**.
  //
  static getVisibleClientRect(element, testChildren) {
    // Note: this call will be expensive if we modify the DOM in between calls.
    let clientRect;
    if (testChildren == null) testChildren = false;
    const clientRects = (() => {
      const result = [];
      for (clientRect of element.getClientRects()) {
        result.push(Rect.copy(clientRect));
      }
      return result;
    })();

    // Inline elements with font-size: 0px; will declare a height of zero, even if a child with
    // non-zero font-size contains text.
    let isInlineZeroHeight = function () {
      const elementComputedStyle = window.getComputedStyle(element, null);
      const isInlineZeroFontSize =
        0 ===
          elementComputedStyle.getPropertyValue("display").indexOf("inline") &&
        elementComputedStyle.getPropertyValue("font-size") === "0px";
      // Override the function to return this value for the rest of this context.
      isInlineZeroHeight = () => isInlineZeroFontSize;
      return isInlineZeroFontSize;
    };

    for (clientRect of clientRects) {
      // If the link has zero dimensions, it may be wrapping visible but floated elements. Check for
      // this.
      let computedStyle;
      if ((clientRect.width === 0 || clientRect.height === 0) && testChildren) {
        for (const child of Array.from(element.children)) {
          computedStyle = window.getComputedStyle(child, null);
          // Ignore child elements which are not floated and not absolutely positioned for parent
          // elements with zero width/height, as long as the case described at isInlineZeroHeight
          // does not apply.
          // NOTE(mrmr1993): This ignores floated/absolutely positioned descendants nested within
          // inline children.
          const position = computedStyle.getPropertyValue("position");
          if (
            computedStyle.getPropertyValue("float") === "none" &&
            !["absolute", "fixed"].includes(position) &&
            !(
              clientRect.height === 0 &&
              isInlineZeroHeight() &&
              0 === computedStyle.getPropertyValue("display").indexOf("inline")
            )
          ) {
            continue;
          }
          const childClientRect = Dom.getVisibleClientRect(child, true);
          if (
            childClientRect === null ||
            childClientRect.width < 3 ||
            childClientRect.height < 3
          )
            continue;
          return childClientRect;
        }
      } else {
        clientRect = Dom.cropRectToVisible(clientRect);

        if (
          clientRect === null ||
          clientRect.width < 3 ||
          clientRect.height < 3
        )
          continue;

        // eliminate invisible elements (see test_harnesses/visibility_test.html)
        computedStyle = window.getComputedStyle(element, null);
        if (computedStyle.getPropertyValue("visibility") !== "visible")
          continue;

        return clientRect;
      }
    }

    return null;
  }

  //
  // Bounds the rect by the current viewport dimensions. If the rect is offscreen or has a height or
  // width < 3 then null is returned instead of a rect.
  //
  static cropRectToVisible(rect) {
    const boundedRect = Rect.create(
      Math.max(rect.left, 0),
      Math.max(rect.top, 0),
      rect.right,
      rect.bottom,
    );
    if (
      boundedRect.top >= window.innerHeight - 4 ||
      boundedRect.left >= window.innerWidth - 4
    ) {
      return null;
    } else {
      return boundedRect;
    }
  }

  // Get the element in the DOM hierachy that contains `element`.
  // If the element is rendered in a shadow DOM via a <content> element, the <content> element will
  // be returned, so the shadow DOM is traversed rather than passed over.
  static getContainingElement(element) {
    return (
      (typeof element.getDestinationInsertionPoints === "function"
        ? element.getDestinationInsertionPoints()[0]
        : undefined) || element.parentElement
    );
  }

  static elementFromPoint(x, y) {
    return document.elementFromPoint(x, y);
  }
}
