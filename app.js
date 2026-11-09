(function () {
  "use strict";

  var STORAGE_KEY = "romance-anime-shelf-v1";
  var CATEGORIES = ["Slice of Life", "Harem", "Love Triangle", "Movies"];
  // Jikan's public host stopped answering in October 2026. Tenrai returns the same search shape, with no key.
  var JIKAN_URL = "https://api.jikan.moe/v4/anime";
  var TENRAI_URL = "https://api.tenrai.org/v1/anime";

  var SEED = [
    {
      id: "horimiya",
      title: "Horimiya",
      year: 2021,
      category: "Slice of Life",
      note: "Hori and Miyamura look ordinary at school, and each is hiding a very different life at home."
    },
    {
      id: "kimi-ni-todoke",
      title: "Kimi ni Todoke",
      year: 2009,
      category: "Slice of Life",
      note: "Classmates call shy Sawako Sadako because of how she looks, until a kind boy starts to know her."
    },
    {
      id: "tsurezure-children",
      title: "Tsurezure Children",
      year: 2017,
      category: "Slice of Life",
      note: "Short stories about high-school couples who are earnest, awkward, and bad at saying how they feel."
    },
    {
      id: "wotakoi",
      title: "Wotakoi: Love is Hard for Otaku",
      year: 2018,
      category: "Slice of Life",
      note: "Two office workers who love games and fandom try dating without pretending to be someone else."
    },
    {
      id: "tsuki-ga-kirei",
      title: "Tsuki ga Kirei",
      year: 2017,
      category: "Slice of Life",
      note: "Kotaro and Akane, quiet third-years, start a shy first romance between club practice and exams."
    },
    {
      id: "quintuplets",
      title: "The Quintessential Quintuplets",
      year: 2019,
      category: "Harem",
      note: "Futaro is hired to tutor five quintuplet sisters who are failing their classes together."
    },
    {
      id: "nisekoi",
      title: "Nisekoi",
      year: 2014,
      category: "Harem",
      note: "Raku, heir to a yakuza family, has to fake a romance with the daughter of a rival gang."
    },
    {
      id: "saekano",
      title: "Saekano: How to Raise a Boring Girlfriend",
      year: 2015,
      category: "Harem",
      note: "Tomoya recruits a circle of girls to help him finish the dating sim he is set on making."
    },
    {
      id: "we-never-learn",
      title: "We Never Learn",
      year: 2019,
      category: "Harem",
      note: "Nariyuki tutors three genius classmates who stumble the moment they leave their best subject."
    },
    {
      id: "twgok",
      title: "The World God Only Knows",
      year: 2010,
      category: "Harem",
      note: "Dating-sim master Keima must make real girls fall in love with him to free hidden spirits."
    },
    {
      id: "white-album-2",
      title: "White Album 2",
      year: 2013,
      category: "Love Triangle",
      note: "Haruki, Setsuna, and Kazusa form a light-music trio, then a love triangle pulls them apart."
    },
    {
      id: "toradora",
      title: "Toradora!",
      year: 2008,
      category: "Love Triangle",
      note: "Taiga and Ryuuji pair up to win their crushes, and end up falling for each other."
    },
    {
      id: "kokoro-connect",
      title: "Kokoro Connect",
      year: 2012,
      category: "Love Triangle",
      note: "Five friends start swapping bodies, and a love triangle among them comes to the surface."
    },
    {
      id: "golden-time",
      title: "Golden Time",
      year: 2013,
      category: "Love Triangle",
      note: "College freshman Banri, missing his memories, is torn between Kouko and a friend from his past."
    },
    {
      id: "ao-haru-ride",
      title: "Ao Haru Ride",
      year: 2014,
      category: "Love Triangle",
      note: "Futaba meets her middle-school crush Kou again, while a classmate falls for him too."
    },
    {
      id: "your-name",
      title: "Your Name",
      year: 2016,
      category: "Movies",
      note: "Taki and Mitsuha wake in each other's bodies and search for one another across time."
    },
    {
      id: "a-silent-voice",
      title: "A Silent Voice",
      year: 2016,
      category: "Movies",
      note: "Shoya tries to make amends with Shoko, the deaf classmate he bullied as a child."
    },
    {
      id: "josee",
      title: "Josee, the Tiger and the Fish",
      year: 2020,
      category: "Movies",
      note: "Student Tsuneo meets Josee, a fierce artist who uses a wheelchair and has seldom left home."
    },
    {
      id: "pancreas",
      title: "I Want to Eat Your Pancreas",
      year: 2018,
      category: "Movies",
      note: "A reserved classmate keeps the secret of a lively girl living with a terminal illness."
    },
    {
      id: "weathering-with-you",
      title: "Weathering With You",
      year: 2019,
      category: "Movies",
      note: "Runaway Hodaka meets Hina, whose prayer can clear Tokyo's unending rain."
    }
  ];

  var state = {
    items: loadItems(),
    category: "All",
    query: ""
  };

  var onlineState = { phase: "idle", query: "", results: [] };
  var onlineTimer = null;
  var onlineAbort = null;
  var skipJikan = false;

  var filtersEl = document.getElementById("filters");
  var listEl = document.getElementById("list");
  var statusEl = document.getElementById("status");
  var searchEl = document.getElementById("search");
  var formEl = document.getElementById("add-form");
  var errorEl = document.getElementById("form-error");
  var resetEl = document.getElementById("reset-shelf");
  var onlineButton = document.getElementById("search-online");
  var onlineStatusEl = document.getElementById("online-status");
  var onlineResultsEl = document.getElementById("online-results");

  filtersEl.addEventListener("click", onFilterClick);
  searchEl.addEventListener("input", onSearchInput);
  onlineButton.addEventListener("click", function () {
    state.query = searchEl.value;
    renderShelf();
    scheduleOnline(true);
  });
  formEl.addEventListener("submit", onAdd);
  resetEl.addEventListener("click", onReset);
  listEl.addEventListener("click", onListClick);
  onlineResultsEl.addEventListener("click", onOnlineAdd);

  renderShelf();
  renderOnline();

  function loadItems() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneSeed();
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return cloneSeed();
      var clean = parsed.filter(isValidItem).map(function (item) {
        return {
          id: String(item.id),
          title: String(item.title).trim(),
          year: normalizeYear(item.year),
          category: item.category,
          note: String(item.note || "").trim(),
          poster: safePoster(item.poster),
          malId: cleanMalId(item.malId)
        };
      });
      return clean;
    } catch (err) {
      return cloneSeed();
    }
  }

  function isValidItem(item) {
    return (
      item &&
      typeof item.title === "string" &&
      item.title.trim() &&
      CATEGORIES.indexOf(item.category) !== -1
    );
  }

  function normalizeYear(value) {
    if (value === null || value === undefined || value === "") return null;
    var year = Number(value);
    if (!isFourDigitYear(year)) return null;
    return year;
  }

  function isFourDigitYear(year) {
    return Number.isInteger(year) && year >= 1910 && year <= 2035;
  }

  function cloneSeed() {
    return SEED.map(function (item) {
      return {
        id: item.id,
        title: item.title,
        year: item.year,
        category: item.category,
        note: item.note
      };
    });
  }

  function saveItems() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (err) {
      // Private mode or a full disk should not break the shelf in memory.
    }
  }

  function onFilterClick(event) {
    var button = event.target.closest("button[data-category]");
    if (!button) return;
    state.category = button.getAttribute("data-category");
    renderShelf();
  }

  function onSearchInput() {
    state.query = searchEl.value;
    renderShelf();
    scheduleOnline(false);
  }

  function onAdd(event) {
    event.preventDefault();
    var title = document.getElementById("title").value.trim();
    var category = document.getElementById("category").value;
    var yearText = document.getElementById("year").value.trim();
    var note = document.getElementById("note").value.trim();

    if (!title) {
      showError("Title is required.");
      document.getElementById("title").focus();
      return;
    }
    if (CATEGORIES.indexOf(category) === -1) {
      showError("Choose a category.");
      return;
    }
    var year = null;
    if (yearText) {
      if (!/^\d{4}$/.test(yearText) || !isFourDigitYear(Number(yearText))) {
        showError("Year should be a four-digit year, like 2016.");
        document.getElementById("year").focus();
        return;
      }
      year = Number(yearText);
    }

    var item = {
      id: createId(),
      title: title,
      year: year,
      category: category,
      note: note
    };
    state.items.push(item);
    state.category = category;
    state.query = "";
    searchEl.value = "";
    saveItems();
    formEl.reset();
    showError("");
    showIdleOnline();
    renderShelf();
    var card = listEl.querySelector('[data-id="' + cssEscape(item.id) + '"]');
    if (card && card.scrollIntoView) {
      card.scrollIntoView({ block: "nearest" });
    }
  }

  function onReset() {
    state.items = cloneSeed();
    state.category = "All";
    state.query = "";
    searchEl.value = "";
    formEl.reset();
    showError("");
    saveItems();
    showIdleOnline();
    renderShelf();
  }

  function onListClick(event) {
    var button = event.target.closest("button[data-delete]");
    if (!button) return;
    var id = button.getAttribute("data-delete");
    state.items = state.items.filter(function (item) {
      return item.id !== id;
    });
    saveItems();
    renderShelf();
    renderOnline();
  }

  function renderShelf() {
    renderFilters();
    var visible = visibleItems();
    statusEl.textContent = statusText(visible.length);
    listEl.replaceChildren();
    if (!visible.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No titles match that filter.";
      listEl.appendChild(empty);
      return;
    }
    visible.forEach(function (item) {
      listEl.appendChild(renderCard(item));
    });
  }

  function renderFilters() {
    var counts = countByCategory();
    filtersEl.replaceChildren();
    [{ name: "All", count: state.items.length }]
      .concat(
        CATEGORIES.map(function (name) {
          return { name: name, count: counts[name] || 0 };
        })
      )
      .forEach(function (entry) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "filter";
        button.setAttribute("data-category", entry.name);
        button.setAttribute("aria-pressed", state.category === entry.name ? "true" : "false");
        var label = document.createElement("span");
        label.textContent = entry.name;
        var count = document.createElement("span");
        count.className = "filter-count";
        count.textContent = String(entry.count);
        button.append(label, count);
        filtersEl.appendChild(button);
      });
  }

  function renderCard(item) {
    var card = document.createElement("article");
    card.className = "card";
    card.setAttribute("data-id", item.id);

    if (item.poster) {
      card.classList.add("has-poster");
      card.appendChild(posterImage(item.poster));
    }

    var body = document.createElement("div");
    body.className = "card-body";

    var tag = document.createElement("p");
    tag.className = "tag";
    tag.textContent = item.category;

    var title = document.createElement("h3");
    title.textContent = item.title;

    body.append(tag, title);

    if (item.year) {
      var year = document.createElement("p");
      year.className = "year";
      year.textContent = String(item.year);
      body.appendChild(year);
    }

    if (item.note) {
      var note = document.createElement("p");
      note.className = "note";
      note.textContent = item.note;
      body.appendChild(note);
    }

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete";
    remove.setAttribute("data-delete", item.id);
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", "Delete " + item.title);
    body.appendChild(remove);
    card.appendChild(body);
    return card;
  }

  function posterImage(url) {
    var img = document.createElement("img");
    img.className = "poster";
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.src = url;
    img.addEventListener("error", function () {
      var card = img.closest(".card, .online-card");
      if (card) card.classList.remove("has-poster");
      img.remove();
    });
    return img;
  }

  function scheduleOnline(immediate) {
    if (onlineTimer) {
      clearTimeout(onlineTimer);
      onlineTimer = null;
    }
    state.query = searchEl.value;
    var query = state.query.trim();
    if (query.length < 2) {
      if (immediate && query.length > 0) {
        abortOnline();
        onlineState = { phase: "short", query: query, results: [] };
        renderOnline();
        return;
      }
      showIdleOnline();
      return;
    }
    if (immediate) {
      runOnline(query);
      return;
    }
    onlineTimer = setTimeout(function () {
      onlineTimer = null;
      if (state.query.trim() === query) runOnline(query);
    }, 600);
  }

  function showIdleOnline() {
    abortOnline();
    onlineState = { phase: "idle", query: "", results: [] };
    renderOnline();
  }

  function abortOnline() {
    if (onlineAbort) {
      onlineAbort.abort();
      onlineAbort = null;
    }
  }

  function runOnline(query) {
    abortOnline();
    var controller = new AbortController();
    onlineAbort = controller;
    onlineState = { phase: "loading", query: query, results: [] };
    renderOnline();
    var params = "q=" + encodeURIComponent(query) + "&limit=10&sfw=true";
    var hosts = skipJikan ? [TENRAI_URL] : [JIKAN_URL, TENRAI_URL];
    attempt(0);

    function attempt(index) {
      if (controller.signal.aborted) return;
      if (index >= hosts.length) {
        finish("error", []);
        return;
      }
      var host = hosts[index];
      var timeoutMs = host === JIKAN_URL ? 4000 : 12000;
      fetchJson(host + "?" + params, controller.signal, timeoutMs)
        .then(function (response) {
          if (controller.signal.aborted) return null;
          if (response.status === 429) {
            finish("limited", []);
            return null;
          }
          if (!response.ok) {
            if (host === JIKAN_URL) {
              skipJikan = true;
              attempt(index + 1);
              return null;
            }
            finish("error", []);
            return null;
          }
          return response.json();
        })
        .then(function (payload) {
          if (!payload || controller.signal.aborted) return;
          var results = normalizeResults(payload);
          finish(results.length ? "results" : "empty", results);
        })
        .catch(function () {
          if (controller.signal.aborted) return;
          if (host === JIKAN_URL) {
            skipJikan = true;
            attempt(index + 1);
            return;
          }
          finish("error", []);
        });
    }

    function finish(phase, results) {
      if (controller.signal.aborted) return;
      onlineState = { phase: phase, query: query, results: results };
      renderOnline();
    }
  }

  function fetchJson(url, userSignal, timeoutMs) {
    var controller = new AbortController();
    var timedOut = false;
    var timer = setTimeout(function () {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    var onUserAbort = function () {
      controller.abort();
    };
    if (userSignal.aborted) controller.abort();
    else userSignal.addEventListener("abort", onUserAbort);
    return fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    }).then(
      function (response) {
        clearTimeout(timer);
        userSignal.removeEventListener("abort", onUserAbort);
        return response;
      },
      function (err) {
        clearTimeout(timer);
        userSignal.removeEventListener("abort", onUserAbort);
        if (timedOut && !userSignal.aborted) err.timedOut = true;
        throw err;
      }
    );
  }

  function normalizeResults(payload) {
    var rows = payload && Array.isArray(payload.data) ? payload.data : [];
    return rows.map(normalizeAnime).filter(Boolean);
  }

  function normalizeAnime(anime) {
    if (!anime || typeof anime !== "object") return null;
    var title = textValue(anime.title_english) || textValue(anime.title);
    if (!title) return null;
    var year = null;
    if (isFourDigitYear(Number(anime.year))) year = Number(anime.year);
    else {
      var from = anime.aired && anime.aired.prop && anime.aired.prop.from;
      if (from && isFourDigitYear(Number(from.year))) year = Number(from.year);
    }
    var images = anime.images && (anime.images.jpg || anime.images.webp);
    var poster = images
      ? safePoster(images.image_url || images.large_image_url || images.small_image_url)
      : null;
    return {
      malId: cleanMalId(anime.mal_id),
      title: title.slice(0, 180),
      year: year,
      type: textValue(anime.type) || "Anime",
      score: typeof anime.score === "number" && isFinite(anime.score) ? anime.score : null,
      synopsis: shortSynopsis(anime.synopsis),
      poster: poster
    };
  }

  function renderOnline() {
    var query = onlineState.query;
    if (onlineState.phase === "loading") {
      onlineStatusEl.textContent = "Looking up \u201c" + query + "\u201d\u2026";
    } else if (onlineState.phase === "empty") {
      onlineStatusEl.textContent = "No titles found online for \u201c" + query + "\u201d.";
    } else if (onlineState.phase === "limited") {
      onlineStatusEl.textContent = "The anime search is busy right now. Wait a moment, then try again.";
    } else if (onlineState.phase === "error") {
      onlineStatusEl.textContent = "Couldn\u2019t reach the anime search. Check your connection and try again.";
    } else if (onlineState.phase === "short") {
      onlineStatusEl.textContent = "Type at least 2 letters to search online.";
    } else if (onlineState.phase === "results") {
      var count = onlineState.results.length;
      onlineStatusEl.textContent =
        count + " online " + (count === 1 ? "result" : "results") + " for \u201c" + query + "\u201d.";
    } else {
      onlineStatusEl.textContent =
        "Find a title on MyAnimeList, then add it to a category. The shelf below filters as you type.";
    }

    onlineResultsEl.replaceChildren();
    if (onlineState.phase !== "results") return;
    onlineState.results.forEach(function (result, index) {
      onlineResultsEl.appendChild(renderOnlineCard(result, index));
    });
  }

  function renderOnlineCard(result, index) {
    var card = document.createElement("article");
    card.className = "online-card";
    if (result.poster) card.appendChild(posterImage(result.poster));

    var body = document.createElement("div");
    var title = document.createElement("h3");
    title.textContent = result.title;

    var meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = metaLine(result);

    var synopsis = document.createElement("p");
    synopsis.className = "synopsis";
    synopsis.textContent = result.synopsis;

    var row = document.createElement("div");
    row.className = "add-row";
    var saved = alreadySaved(result);
    var label = document.createElement("label");
    label.appendChild(document.createTextNode("Add to"));
    var select = document.createElement("select");
    select.setAttribute("aria-label", "Add " + result.title + " to");
    CATEGORIES.forEach(function (category) {
      var option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      if (category === (result.type === "Movie" ? "Movies" : "Slice of Life")) option.selected = true;
      select.appendChild(option);
    });
    if (saved) select.disabled = true;
    label.appendChild(select);

    var add = document.createElement("button");
    add.type = "button";
    add.setAttribute("data-add-online", String(index));
    add.textContent = saved ? "On your shelf" : "Add";
    add.disabled = saved;
    row.append(label, add);
    body.append(title, meta, synopsis, row);
    card.appendChild(body);
    return card;
  }

  function onOnlineAdd(event) {
    var button = event.target.closest("button[data-add-online]");
    if (!button || button.disabled) return;
    var index = Number(button.getAttribute("data-add-online"));
    var result = onlineState.results[index];
    if (!result || alreadySaved(result)) return;
    var card = button.closest(".online-card");
    var select = card ? card.querySelector("select") : null;
    var category = select ? select.value : CATEGORIES[0];
    if (CATEGORIES.indexOf(category) === -1) return;
    state.items.push({
      id: result.malId ? "mal-" + result.malId : createId(),
      malId: result.malId,
      title: result.title,
      year: result.year,
      category: category,
      note: result.synopsis === "No synopsis yet." ? "" : result.synopsis,
      poster: result.poster
    });
    saveItems();
    renderShelf();
    renderOnline();
  }

  function alreadySaved(result) {
    var title = result.title.toLowerCase();
    return state.items.some(function (item) {
      if (result.malId && item.malId === result.malId) return true;
      return item.title.toLowerCase() === title;
    });
  }

  function metaLine(result) {
    var bits = [];
    if (result.year) bits.push(String(result.year));
    if (result.type) bits.push(result.type);
    if (result.score != null) bits.push("Score " + formatScore(result.score));
    return bits.join(" \u00b7 ");
  }

  function formatScore(score) {
    return (Math.round(score * 100) / 100).toFixed(2).replace(/\.?0+$/, "");
  }

  function shortSynopsis(text) {
    var clean = textValue(text).replace(/\s+/g, " ");
    clean = clean.replace(/\s*\[Written by MAL Rewrite\]\s*$/i, "");
    if (!clean) return "No synopsis yet.";
    if (clean.length <= 180) return clean;
    var cut = clean.slice(0, 180);
    var space = cut.lastIndexOf(" ");
    if (space > 120) cut = cut.slice(0, space);
    return cut + "\u2026";
  }

  function textValue(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function safePoster(url) {
    if (typeof url !== "string" || !url || url.length > 500) return null;
    try {
      var parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
      return parsed.href;
    } catch (err) {
      return null;
    }
  }

  function cleanMalId(value) {
    if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
    if (typeof value === "string" && /^\d+$/.test(value)) {
      var parsed = Number(value);
      if (parsed > 0) return parsed;
    }
    return null;
  }

  function visibleItems() {
    var query = state.query.trim().toLowerCase();
    return state.items.filter(function (item) {
      if (state.category !== "All" && item.category !== state.category) return false;
      if (!query) return true;
      var haystack = [item.title, item.year ? String(item.year) : "", item.note]
        .join(" ")
        .toLowerCase();
      return haystack.indexOf(query) !== -1;
    });
  }

  function countByCategory() {
    return state.items.reduce(function (counts, item) {
      counts[item.category] = (counts[item.category] || 0) + 1;
      return counts;
    }, {});
  }

  function statusText(count) {
    var noun = count === 1 ? "title" : "titles";
    var searching = state.query.trim().length > 0;
    if (!searching && state.category === "All") return "Showing all " + count + " " + noun + ".";
    if (!searching) return "Showing " + count + " " + state.category + " " + noun + ".";
    if (state.category === "All") return "Showing " + count + " " + noun + ".";
    return "Showing " + count + " " + state.category + " " + noun + ".";
  }

  function showError(message) {
    if (!message) {
      errorEl.hidden = true;
      errorEl.textContent = "";
      return;
    }
    errorEl.hidden = false;
    errorEl.textContent = message;
  }

  function createId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "title-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }
})();
