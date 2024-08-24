const PI = 3.141592653589793;

const Actions = {
  NewTab: "newtab",
  NextTab: "nexttab",
  PrevTab: "prevtab",
  NextPage: "nextpage",
  PrevPage: "prevpage",
};

class Coords {
  current = { x: 0, y: 0 };
  next = { x: 0, y: 0 };
  last = { x: 0, y: 0 };
  phi = 0;
}

class Config {
  enabled = true;
  trail = {
    enabled: true,
    color: "red",
    width: 2,
  };
  rockerEnabled = true;
  gestures = {};
  actionMap = {};
  update(config) {
    this.rockerEnabled = Boolean(config.rockerEnabled);
    this.trail.enabled = Boolean(config.trailEnabled);
    this.trail.color = config.trailColor;
    this.trail.width = config.trailWidth;
    this.actionMap = invertHash(config.gestures);
    this.enabled =
      !config?.disabled_domains?.includes(window.location.hostname) || false;
  }
}

class SimpleGesture {
  config;
  moved = false;
  #loaded = false;
  #currentGesture = "";
  #previousGesture = "";
  #coords;
  #link;
  #canvas;
  #dom;

  constructor() {
    this.config = new Config();
    this.#coords = new Coords();
    this.#canvas = new Canvas(this.config);
    this.#dom = new Dom();
  }

  start(event) {
    if (!this.#loaded) {
      this.#watch();
      this.#loaded = true;
    }
    this.#coords.current.y = event.pageX;
    this.#coords.current.x = event.pageY;
    this.#coords.last.x = event.pageX;
    this.#coords.last.y = event.pageY;
    this.#currentGesture = "";
    this.#previousGesture = "";
    this.moved = false;
    this.#link = this.#dom.determineLink(event.target, 10);
  }

  nextPage() {
    const nextPatterns = "next,more results,more,newer,>,›,→,»,≫,>>";
    const nextStrings = nextPatterns.split(",").filter((s) => s.trim().length);
    return (
      this.#dom.findAndFollowRel("next") ||
      this.#dom.findAndFollowLink(nextStrings)
    );
  }

  prevPage() {
    const prevPatterns = "prev,previous,back,older,<,‹,←,«,≪,<<";
    const prevStrings = prevPatterns.split(",").filter((s) => s.trim().length);
    return (
      this.#dom.findAndFollowRel("prev") ||
      this.#dom.findAndFollowLink(prevStrings)
    );
  }

  move(event) {
    const ny = event.pageX;
    const nx = event.pageY;
    const mx = this.#coords.current.x;
    const my = this.#coords.current.y;
    const r = Math.sqrt(Math.pow(nx - mx, 2) + Math.pow(ny - my, 2));
    if (r > 16) {
      let phi = Math.atan2(ny - my, nx - mx);
      if (phi < 0) {
        phi += 2 * PI;
      }

      let tmove;
      if (phi >= PI / 4 && phi < (3 * PI) / 4) {
        tmove = "R";
      } else if (phi >= (3 * PI) / 4 && phi < (5 * PI) / 4) {
        tmove = "U";
      } else if (phi >= (5 * PI) / 4 && phi < (7 * PI) / 4) {
        tmove = "L";
      } else if (phi >= (7 * PI) / 4 || phi < PI / 4) {
        tmove = "D";
      }

      if (tmove != this.#previousGesture) {
        this.#currentGesture += tmove;
        this.#previousGesture = tmove;
      }

      if (this.config.trail.enabled) {
        if (this.moved == false) {
          this.#canvas.create();
        }
        this.#coords.last = this.#canvas.draw({
          move: this.#coords.last,
          line: { x: ny, y: nx },
        });
      }
      this.moved = true;
      this.#coords.current.x = nx;
      this.#coords.current.y = ny;
    }
  }

  stop() {
    this.#canvas.destroy();
  }

  execute() {
    let action = this.config.actionMap[this.#currentGesture];
    if (action) {
      if (isUrl(action)) {
        this.#link = action;
        action = Actions.NewTab;
      }
      switch (action) {
        case Actions.NextPage:
          this.nextPage();
          break;
        case Actions.PrevPage:
          this.prevPage();
          break;
        default:
          browser.runtime
            .sendMessage({ msg: action, url: this.#link })
            .then((result) => {
              if (result != null) {
                this.#link = null;
              }
            })
            .catch((error) => console.error(`Failed to send ${action}`, error));
      }
    }
  }

  #watch() {
    browser.runtime.sendMessage({ msg: "config" }).then(
      (response) => {
        if (response) {
          this.config.update(response.resp);
        }
      },
      (error) => console.error(error),
    );

    browser.runtime.onMessage.addListener((request) => {
      switch (request.msg) {
        case "tabs.config.update":
          this.config.update(request.updatedConfig);
          break;
      }
    });
  }

  install(doc) {
    doc.addEventListener("DOMContentLoaded", this.#watch.bind(this));
  }
}

const mouseHandler = new MouseHandler(new SimpleGesture());
mouseHandler.install(document);
