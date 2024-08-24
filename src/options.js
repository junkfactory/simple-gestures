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

const IGNORE_DOMAIN = "IGNORE_DOMAIN";
const VALID_GESTURES = /^[DULR]*$/;

const colorNameToCode = {
  red: "ff3300",
  green: "008000",
  blue: "00008B",
  yellow: "FFFF00",
};

const colorCodeToName = {
  ff3300: "red",
  "008000": "green",
  "00008B": "blue",
  FFFF00: "yellow",
};

const defaultGestures = { R: "forward", L: "back", D: "closetab" };

const commandMapping = {
  "History Back": "back",
  "History Forward": "forward",
  "Reload (bypass cache)": "reload",
  "Open New Tab": "newtab",
  "Close Current Tab": "closetab",
  "Next Page": "nextpage",
  "Previous Page": "prevpage",
};

function switchTab(tabId) {
  for (const c of $(".tab")) {
    c.style.display = "none";
  }
  $("." + tabId).style.display = "block";
}

function displayError(errorInput, errorMessage) {
  for (const c of $(".tab")) {
    c.style.display = "none";
  }
  errorInput.closest(".tab").classList.forEach((c) => {
    if (c.startsWith("config")) {
      $("#" + c).dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
    }
  });
  errorInput.classList.add("error");
  const status = $("#status");
  if (status.innerHTML == "") {
    errorInput.focus();
  }
  status.innerHTML = errorMessage;
}

function createOptions(config) {
  let key, div, tr, td, inp;
  let gests = "gestures" in config ? config.gestures : {};

  if (Object.keys(gests).length == 0) gests = invertHash(defaultGestures);

  div = $("#optsTab");
  for (key in commandMapping) {
    tr = div.insertRow(div.rows.length);
    td = $().createElement("td");
    td.appendChild($().createTextNode(key));
    tr.appendChild(td);
    td = $().createElement("td");
    inp = $().createElement("input");
    inp.type = "text";
    inp.name = "gvalue";
    inp.id = commandMapping[key];
    inp.className = "config gesture";
    if (gests[commandMapping[key]]) inp.value = gests[commandMapping[key]];
    tr.appendChild(td);
    td.appendChild(inp);
  }

  //build custom urls config
  for (const g in config.gestures) {
    if (Object.hasOwnProperty.call(config.gestures, g)) {
      const url = config.gestures[g];
      if (url.startsWith("http")) {
        addCustomUrl(url, g);
      }
    }
  }
}

function addCustomUrl(url, g) {
  const urlTable = $("#customUrlTab");
  const tr = urlTable.insertRow(urlTable.rows.length);
  //url
  let td = $().createElement("td");
  const inp = $().createElement("input");
  inp.type = "text";
  inp.name = "url";
  inp.value = url ? url : "";
  inp.className = "config";
  td.appendChild(inp);
  tr.appendChild(td);
  //gesture
  td = $().createElement("td");
  const gurl = $().createElement("input");
  gurl.type = "text";
  gurl.name = "gvalue";
  gurl.value = g ? g : "";
  gurl.className = "config";
  td.appendChild(gurl);
  tr.appendChild(td);

  td = $().createElement("td");
  const removeLink = $().createElement("a");
  removeLink.className = "addremove";
  removeLink.title = "Click to remove custom url mappin";
  removeLink.href = "#";
  removeLink.innerHTML = "-";
  removeLink.addEventListener("click", (e) => {
    $("#customUrlTab tbody").removeChild(e.target.parentElement.parentElement);
  });
  td.appendChild(removeLink);
  tr.appendChild(td);
  //focus on url input
  inp.focus();
}

//validate configurations
function validateConfiguration(optionForm) {
  const status = $("#status");
  status.innerHTML = "";
  const definedGestures = [];
  for (const i of optionForm.querySelectorAll("input[type=text]")) {
    i.classList.remove("error");
    const gval = i.value.trim();
    switch (i.name) {
      case "url":
        try {
          i.value = new URL(gval).toString().trim();
        } catch (error) {
          displayError(i, "Invalid url!");
        }
        break;
      case "gvalue":
        if (definedGestures.indexOf(gval) > -1) {
          displayError(i, "Duplicate gesture defined.");
        } else if (!VALID_GESTURES.test(gval)) {
          displayError(i, "Invalid gesture pattern!");
        } else {
          if (gval.trim().length > 0) {
            definedGestures.push(gval);
          }
        }
        break;
    }
  }
  return status.innerHTML == "";
}

// Saves options to local storage.
async function saveConfiguration(e) {
  e.preventDefault();
  if (!validateConfiguration(e.target)) {
    return false;
  }
  let store = await browser.storage.local.get("simple_gestures_config");
  console.log("storage", store);
  let config = store?.simple_gestures_config || { gestures: {}, extras: {} };
  config.extras = config?.extras || {};
  console.debug("config", config);

  let select = $("#color");
  let value = select.children[select.selectedIndex].value;
  config.trailColor = colorNameToCode[value];

  select = $("#width");
  config.trailWidth = select.children[select.selectedIndex].value;

  const trail = $("#trail");
  config.trailEnabled = trail.checked;

  config.rockerEnabled = $("#rockerEnabled").checked;

  let disabled_domains = config?.disabled_domains || [];
  const domainUrl = $("#domain_url").innerHTML;
  if (domainUrl !== IGNORE_DOMAIN) {
    const domainEnabled = $("#domain").checked;
    if (domainEnabled) {
      removeFromArray(disabled_domains, domainUrl);
    } else {
      addToArrayIfNotExists(disabled_domains, domainUrl);
    }
  }
  config.disabled_domains = disabled_domains;

  let url = null;
  for (const i of $("#option_form input")) {
    const val = i.value.trim();
    if (url == null && i.name === "url") {
      url = val;
    } else if (url != null && i.name === "gvalue") {
      config.gestures[val] = url;
      url = null;
    } else if (i.name === "gvalue") {
      const s = i.parentElement.parentElement.children[0].textContent;
      if (val.length > 0) {
        config.gestures[commandMapping[s]] = val;
      } else {
        delete config.gestures[commandMapping[s]];
      }
    } else if (i.name === "nextPatterns") {
      console.debug("nextPatterns", val);
      config.extras.nextPatterns = val;
    } else if (i.name === "prevPatterns") {
      console.debug("prevPatterns", val);
      config.extras.prevPatterns = val;
    }
  }
  await browser.storage.local.set({ simple_gestures_config: config });
  const result = await browser.runtime.sendMessage({
    msg: "config.update",
    updatedCconfig: config,
  });

  // Update status to let user know options were saved.
  const status = $("#status");
  status.innerHTML = result.resp;
  setTimeout(() => {
    status.innerHTML = "";
  }, 5000);
  return false;
}

async function getCurrentUrl() {
  let [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  return new URL(tab?.url || "about:blank");
}

function extensionToggle(e) {
  $(".config").forEach((c) => {
    c.disabled = !e.target.checked;
  });
}

// Restores select box state to saved value from local storage.
function restoreOptions() {
  browser.storage.local.get("simple_gestures_config", (result) => {
    const config = result.simple_gestures_config;
    const trailEnabled = $("#trail");
    trailEnabled.checked = config.trailEnabled;

    const rockerEnabled = $("#rockerEnabled");
    rockerEnabled.checked = config.rockerEnabled;

    let select = $("#color");
    let value = colorCodeToName[config.trailColor];
    if (!value) value = "red";
    for (let i = 0; i < select.children.length; i++) {
      const child = select.children[i];
      if (child.value == value) {
        child.selected = "true";
        break;
      }
    }

    select = $("#width");
    value = config.trailWidth;
    if (!value) value = 3;
    for (let i = 0; i < select.children.length; i++) {
      const child = select.children[i];
      if (child.value == value) {
        child.selected = "true";
        break;
      }
    }

    getCurrentUrl().then((url) => {
      let domainCheckbox = $("#domain");
      const hostname = url.hostname.trim();
      if (hostname.length > 0) {
        $("#domain_container").style.display = "block";
        $("#domain_url").innerHTML = hostname;
        const disabled = config?.disabled_domains?.includes(hostname) || false;
        domainCheckbox.checked = !disabled;
      } else {
        $("#domain_container").style.display = "none";
        $("#domain_url").innerHTML = IGNORE_DOMAIN;
        domainCheckbox.checked = true;
      }
      createOptions(config);
      extensionToggle({ target: domainCheckbox });
    });

    //set extra options
    if (config?.extras) {
      if (config.extras?.nextPatterns) {
        var nextPage = $("#option_form input[name='nextPatterns']");
        nextPage.value = config.extras.nextPatterns;
      }
      if (config.extras?.prevPatterns) {
        var prevPage = $("#option_form input[name='prevPatterns']");
        prevPage.value = config.extras.prevPatterns;
      }
    }
  });
}

async function grantPermissions() {
  let result = await browser.permissions.request({ origins: ["<all_urls>"] });
  console.debug("Permission result", result);
  if (result) {
    await checkHostPermissions();
  }
}

async function checkHostPermissions() {
  let permissions = await browser.permissions.getAll();
  console.debug("Permissions", permissions);
  let askPermission = $("#askPermission");
  let configUi = $("#configUi");
  if (permissions.origins.includes("<all_urls>")) {
    askPermission.style.display = "none";
    configUi.style.display = "block";
  } else {
    askPermission.style.display = "block";
    configUi.style.display = "none";
  }
}

$().addEventListener("DOMContentLoaded", function () {
  checkHostPermissions();
  browser.action.setBadgeText({ text: "" });
  restoreOptions();
  const tabNav = $("input[name=tabs]");
  tabNav.forEach((t) => {
    t.addEventListener("click", (e) => switchTab(e.target.id));
  });
  $("#option_form").addEventListener("submit", saveConfiguration);
  $("#plus").addEventListener("click", (e) => {
    e.preventDefault();
    addCustomUrl();
  });
  $("#domain").addEventListener("click", extensionToggle);
  $("#grantPermissions").addEventListener("click", grantPermissions);
});
