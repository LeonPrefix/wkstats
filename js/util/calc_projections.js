// ==UserScript==
// @version     1.0.2
// @copyright   2018+, Robin Findley
// ==/UserScript==

//================================================
wkof.load_script(wkof.support_files["calc_stats.js"], true);

wkof.ready("wkstats.average").then(get_srs_info);

//================================================
let recent_now,
  now_is_valid = false;
function get_now() {
  if (now_is_valid) return recent_now;
  recent_now = new Date().getTime();
  now_is_valid = true;
  setTimeout(() => {
    now_is_valid = false;
  }, 0);
  return recent_now;
}

//================================================
function get_srs_info() {
  if (wkdata.srs_info) return Promise.resolve();
  return wkof.Apiv2.get_endpoint("spaced_repetition_systems").then((data) => {
    wkdata.srs_info = data;
    wkof.set_state("wkof.wkstats.projections", "ready");
  });
}

//================================================
function project_level(level) {
  let retval = { type: "level", level: level };
  if (level <= wkof.user.level) {
    retval.timestamp = wkstats.level_times[level].min.getTime();
    retval.date = new Date(retval.timestamp).toLocaleString();
    return retval;
  }
  level--;

  if (!wkstats.projected_levelups) wkstats.projected_levelups = [];
  if (wkstats.projected_levelups[level]) return wkstats.projected_levelups[level];

  let kanji = wkdata.items_by_level[level].filter((item) => item.object === "kanji");
  let dependencies = kanji.map(project_item).sort((a, b) => {
    return (a.passed ? 0 : a.timestamp) - (b.passed ? 0 : b.timestamp);
  });
  let _90percent = Math.ceil(dependencies.length * 0.9);
  let level_up = dependencies[_90percent - 1].timestamp;
  retval.timestamp = level_up;
  retval.date = new Date(retval.timestamp).toLocaleString();
  retval.needed_kanji = _90percent;
  dependencies = dependencies.filter((dependency) => !dependency.passed);
  if (dependencies.length > 0) {
    retval.dependencies = dependencies;
  } else {
    retval.passed = true;
  }
  wkstats.projected_levelups[level] = retval;
  return retval;
}

//================================================
function project_item(item) {
  let now = get_now();
  let next_review,
    srs_stage,
    guru_timestamp,
    components,
    prior_level,
    dependencies = [];
  let retval = { type: "item", slug: item.data.slug, item: item };

  if (item.assignments && item.assignments.unlocked_at) {
    if (item.assignments.passed_at !== null) {
      retval.passed = true;
      return retval;
    }
    next_review = Math.max(
      now,
      item.assignments.available_at ? new Date(item.assignments.available_at).getTime() : now,
    );
    next_review = new Date(next_review).setMinutes(0, 0, 0);
    srs_stage = item.assignments.srs_stage + 1;
  } else {
    srs_stage = 0;
    switch (item.object) {
      case "radical":
        prior_level = project_level(item.data.level);
        next_review = prior_level.timestamp;
        if (next_review > now) {
          dependencies.push(prior_level);
        }
        break;

      case "kanji":
      case "vocabulary":
        components = item.data.component_subject_ids
          .map((id) => wkdata.items_by_subject_id[id])
          .filter((component) => component.data.level === item.data.level);
        dependencies = components.map(project_item).filter((dependency) => !dependency.passed);
        if (item.data.level > wkof.user.level && dependencies.length === 0) {
          prior_level = project_level(item.data.level);
          next_review = prior_level.timestamp;
          if (next_review > now) dependencies.push(prior_level);
        }
        next_review = Math.max.apply(
          null,
          dependencies.map((dependency) => dependency.timestamp),
        );
        break;
    }
  }

  while (srs_stage < 5) {
    next_review += wkdata.srs_info[item.data.spaced_repetition_system_id].data.stages[srs_stage].interval * 1000;
    srs_stage++;
  }

  guru_timestamp = Math.max(now, next_review);
  retval.timestamp = guru_timestamp;
  retval.date = new Date(retval.timestamp).toLocaleString();
  if (dependencies.length > 0) retval.dependencies = dependencies;
  return retval;
}
