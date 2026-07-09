// SPDX-License-Identifier: Apache-2.0

(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function scriptElement() {
    if (document.currentScript) {
      return document.currentScript;
    }
    var scripts = document.querySelectorAll("script[src]");
    for (var i = scripts.length - 1; i >= 0; i -= 1) {
      if (scripts[i].src.indexOf("version-switcher.js") !== -1) {
        return scripts[i];
      }
    }
    return null;
  }

  function versionedRoot(slug) {
    if (!slug) {
      return null;
    }
    var parts = window.location.pathname.split("/");
    var index = parts.indexOf(slug);
    if (index === -1) {
      return null;
    }
    return parts.slice(0, index).join("/") + "/";
  }

  function switcherUrl(script, slug) {
    var root = versionedRoot(slug);
    if (root) {
      return new URL(root + "switcher.json", window.location.origin).toString();
    }
    return new URL(script.dataset.switcherJsonUrl, window.location.href).toString();
  }

  function currentVersion(entries, slug, version) {
    for (var i = 0; i < entries.length; i += 1) {
      if (slug && entries[i].url) {
        var pathParts = new URL(entries[i].url, window.location.href).pathname.split("/");
        if (pathParts.indexOf(slug) !== -1) {
          return entries[i];
        }
      }
      if (version && entries[i].version === version) {
        return entries[i];
      }
    }
    return entries.length ? entries[0] : null;
  }

  function insertSwitcher(entries, current) {
    var search = document.querySelector(".wy-side-nav-search");
    if (!search || !current) {
      return;
    }

    var wrapper = document.createElement("div");
    wrapper.className = "tcapi-version-switcher";

    var label = document.createElement("label");
    label.className = "tcapi-version-switcher__label";
    label.htmlFor = "tcapi-version-switcher-select";
    label.textContent = "Version";

    var select = document.createElement("select");
    select.id = "tcapi-version-switcher-select";
    select.className = "tcapi-version-switcher__select";
    select.setAttribute("aria-label", "Documentation version");

    entries.forEach(function (entry) {
      var option = document.createElement("option");
      option.value = entry.url;
      option.textContent = entry.name || entry.version || entry.url;
      if (entry === current) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.addEventListener("change", function () {
      if (select.value) {
        window.location.href = select.value;
      }
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);

    var searchContainer = search.querySelector('[role="search"]');
    search.insertBefore(wrapper, searchContainer || null);
  }

  ready(function () {
    var script = scriptElement();
    if (!script || !script.dataset.switcherJsonUrl) {
      return;
    }

    var slug = script.dataset.versionSlug || "";
    var version = script.dataset.version || "";

    fetch(switcherUrl(script, slug))
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Unable to load version switcher.");
        }
        return response.json();
      })
      .then(function (entries) {
        if (!Array.isArray(entries) || entries.length === 0) {
          return;
        }
        insertSwitcher(entries, currentVersion(entries, slug, version));
      })
      .catch(function () {
        return undefined;
      });
  });
}());
