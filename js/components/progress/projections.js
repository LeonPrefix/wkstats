(function () {
  document.title = "wkstats: Projections";

  if (!wkof.user) return nav.login();

  wkof.load_script(wkof.support_files["calc_projections.js"], false);
  wkof.ready("wkstats.projections").then(populate_projections);

  //================================================
  function populate_projections() {
    wkof.trigger("wkstats.projections.loaded");
    for (let level = 1; level <= wkof.user.subscription.max_level_granted; level++) {
      console.log(level + ": " + project_level(level).date);
    }

    wkof.ready("ItemData, Apiv2").then(() => {
      wkof.Apiv2.get_endpoint("level_progressions").then((levels) => {
        wkof.Apiv2.get_endpoint("spaced_repetition_systems").then((systems) => {
          wkof.ItemData.get_items("subjects, assignments").then((items) => {
            api(wkof.user, levels, systems, items);
          });
        });
      });
    });
  }

  Date.prototype.add = function (seconds) {
    return this.setTime(this.getTime() + seconds * 1000) && this;
  };

  Date.prototype.subtractDate = function (date) {
    return (this.getTime() - date.getTime()) / 1000;
  };

  Date.prototype.format = function () {
    return new window.Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(this);
  };

  let maxLevel = null;
  let progressions = [];
  let stats = null;
  let now = null;

  function median(arr) {
    const mid = Math.floor(arr.length / 2);
    return arr.length === 0 ? 0 : arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  }

  function countComponent(componentLevel, itemLevel) {
    // For items in future levels, don't count passing time for components on preceding levels
    return !(itemLevel > progressions[progressions.length - 1].level && componentLevel < itemLevel);
  }

  function levelDuration(level) {
    return new Date(level.passed_at || level.abandoned_at).subtractDate(new Date(level.unlocked_at));
  }

  function getLater(a, b) {
    return new Date(Math.max(a, b));
  }

  function getFools(date, fools) {
    return fools ? new Date(date.getFullYear() + (date.getMonth() >= 3), 3, 1) : date;
  }

  function get(a, b) {
    return a && a[b];
  }

  function getID(a, b) {
    return get(document.getElementById(a), b);
  }

  function getHyp(fastest, isCurrent) {
    const s = isCurrent ? "current" : fastest;
    return getID("speed" + (getID("hypothetical", "checked") ? "-" + s : ""), "value") * 3600 || 864000;
  }

  function formatInterval(seconds) {
    const days = seconds / 86400;
    const hours = (days % 1) * 24;
    const minutes = (hours % 1) * 60;
    const secs = (minutes % 1) * 60;
    return `${Math.floor(days)}d ${Math.floor(hours)}h ${Math.floor(minutes)}m ${Math.floor(secs)}s`;
  }

  function findLevel(levels, level) {
    return levels
      .slice()
      .reverse()
      .find((p) => level == p.level);
  }

  function rangeFormat(arr) {
    return arr
      .map((n, i) =>
        i < arr.length - 1 && arr[i + 1] - n === 1 ? `${i > 0 && n - arr[i - 1] === 1 ? "" : n}-` : `${n}, `,
      )
      .join("")
      .replace(/-+/g, "-")
      .slice(0, -2);
  }

  function project() {
    const current = progressions[progressions.length - 1];
    const levels = progressions
      .slice()
      .concat(Array.from({ length: maxLevel - current.level + 2 }, (_, i) => ({ level: current.level + 1 + i })));
    const medianSpeed = median(
      progressions
        .slice(0, -1)
        .map(levelDuration)
        .sort((a, b) => a - b),
    );
    const showPast = getID("showPast", "checked");
    const fools = getID("fools", "checked");
    const hypothetical = getID("hypothetical", "checked");
    const time = stats.map((d) => d.length && d.sort((a, b) => a[0] - b[0])[Math.ceil(d.length * 0.9) - 1][0]);
    const expanded = getID("expand", "checked") && findLevel(levels, getID("expanded", "value"));
    const u = time.map((d, i) => {
      const unlocked = get(findLevel(levels, i), "unlocked_at");
      return [(unlocked ? now.subtractDate(new Date(unlocked)) : 0) + d, i];
    });

    let output = `<input type="checkbox" id="expand" class="project" ${expanded ? "checked" : ""}>
            <label for="speed">Show Details for Level:</label>
            <input type="number" id="expanded" size="3" value="${get(expanded, "level") || current.level}"><br/>
            <input type="checkbox" id="showPast" class="project" ${showPast ? "checked" : ""}>
            <label for="showPast">Show Past Levels</label><br/>
            <input type="checkbox" id="fools" class="project" ${fools ? "checked" : ""}>
            <label for="fools">Dark Blockchain</label><br/>
            <input type="checkbox" id="hypothetical" class="project" ${hypothetical ? "checked" : ""}>
            <label for="hypothetical">Expand Hypothetical</label><br/>
            ${
              hypothetical
                ? Array.from(new Set(u.slice(current.level, -1).map((d) => d[0])))
                    .map((time, i) => {
                      const s = i === 0 ? "current" : time;
                      return `<label for="speed-${s}">Hypothetical Speed for fastest ${formatInterval(time)}
                (levels ${rangeFormat(u.filter((d, i) => time === d[0]).map((d) => d[1]))}):</label>
                <input type="number" id="speed-${s}" size="4" value="${getHyp(time, i === 0) / 3600}"> hours<br/>`;
                    })
                    .reduce((a, b) => a + b)
                : `<label for="speed">Hypothetical Speed:</label>
            <input type="number" id="speed" size="4" value="${getHyp(time) / 3600}"> hours`
            }
            <button id="project" class="project">Project</button><br/>
            <table class="coverage"><tbody><tr class="header"> ${
              expanded
                ? "<td>Kanji</td><td colspan=3>Fastest</td>"
                : "<td>Level </td><td> Real/Predicted </td><td> Fastest </td><td> Hypothetical</td>"
            }</tr>`,
      unlocked = new Date(now),
      currentReached = false,
      info = "",
      real = null,
      fastest = null,
      given = null,
      p = [];

    for (const i of levels) {
      if (i === current) currentReached = true;
      if (!showPast && !currentReached) continue;

      const l = i.level,
        _fastest = new Date(fastest || now).add(time[l - 1]),
        _real = getLater(new Date(real || unlocked).add(l === maxLevel + 2 ? time[l - 1] : medianSpeed), _fastest),
        _given = getLater(
          new Date(given || unlocked).add(
            l === maxLevel + 2 ? time[l - 1] : getHyp(time[l - 1], l === current.level + 1),
          ),
          _fastest,
        );

      if (i.unlocked_at) {
        unlocked = new Date(i.unlocked_at);
        info = `<td> ${unlocked.format()} </td><td> - </td><td> - </td>`;
      } else if (l <= maxLevel) {
        p[l] = {
          fastest: getFools((fastest = _fastest), fools).format(),
          real: (real = _real).format(),
          given: (given = _given).format(),
        };
        info = `<td> ${p[l].real} </td><td> ${p[l].fastest} </td><td> ${p[l].given} </td>`;
      } else {
        p[l] = { fastest: getFools(_fastest, fools).format(), real: _real.format(), given: _given.format() };
        info = `<td> ${p[l].real} </td><td> ${p[l].fastest} </td><td> ${p[l].given} </td>`;
      }

      if (!expanded) {
        output += `<tr ${i === current ? 'class="current_level"' : ""}><td> ${
          l === maxLevel + 2 ? "全火" : String("0" + l).slice(-2)
        } </td> ${info} </tr>`;
      } else if (expanded === i) {
        for (const kan of stats[expanded.level]) {
          const date = (kan[0] < 0 ? "Passed on " : "") + new Date(fastest || now).add(kan[0]).format();
          output += `<tr><td>${kan[1].data.characters}</td><td colspan=3>${date}</tr>`;
        }
      }
    }

    output += "</tbody></table>";

    const element = document.getElementsByClassName("projections")[0];
    if (!element.className.includes("chart")) element.className += " chart";
    element.innerHTML = output;
    Array.from(document.getElementsByClassName("project")).forEach((x) => x.addEventListener("click", project));

    return JSON.stringify(Object.assign({}, p));
  }

  function api(userData, levels, systems, items) {
    if (progressions.length > 0) return project();

    maxLevel = userData.subscription.max_level_granted;
    progressions = Object.values(levels).map((level) => level.data);
    now = new Date();

    const time = function (item, burn) {
      if (!get(item.assignments, burn ? "burned_at" : "passed_at")) {
        let interval = get(item.assignments, "available_at")
          ? Math.max(0, new Date(item.assignments.available_at).subtractDate(now))
          : 0;
        const srs = systems[item.data.spaced_repetition_system_id].data;
        const target = get(srs, burn ? "burning_stage_position" : "passing_stage_position");
        for (let i = (get(item.assignments, "srs_stage") || 0) + 1; i < target; i++) {
          interval += srs.stages[i].interval;
        }
        return interval;
      }
      return new Date(get(item.assignments, burn ? "burned_at" : "passed_at")).subtractDate(now);
    };

    const unlock = function (item, itemLevel, burn) {
      return countComponent(item.data.level, itemLevel)
        ? (item.object === "radical" || item.object === "kana_vocabulary"
            ? 0
            : item.data.component_subject_ids
                .map((id) =>
                  Math.max(
                    0,
                    unlock(
                      items.find((o) => o.id === id),
                      item.data.level,
                    ),
                  ),
                )
                .reduce((a, b) => Math.max(a, b))) + time(item, burn)
        : 0;
    };

    stats = Array.from(Array(maxLevel + 1), () => []);
    for (const item of items) {
      if (item.data.hidden_at || item.object !== "kanji") continue;
      stats[item.data.level].push([unlock(item, item.data.level, false), item]);
    }

    let burnStats = items.filter((item) => !item.data.hidden_at).map((item) => unlock(item, item.data.level, true));
    stats.push([[burnStats.sort((a, b) => a - b)[burnStats.length - 1], burnStats]]);

    return project();
  }
})();
