// ==UserScript==
// @version     1.0.7
// @copyright   2018+, Robin Findley
// ==/UserScript==

//================================================
wklogs = {};
function log(category, message) {
  let cat = wklogs[category];
  if (!cat) wklogs[category] = cat = [];
  cat.push(message);
}
function dump_log(categories) {
  categories = split_list(categories);
  let logs = [];
  for (let cat_idx in categories) {
    let log = wklogs[categories[cat_idx]];
    if (log) logs.push(log.join("\n"));
  }
  if (logs.length > 0) console.log(logs.join("\n\n"));
}

//================================================
load_progress_settings();

wkof.Apiv2.get_endpoint("resets").then(process_resets);
wkof.Apiv2.get_endpoint("level_progressions").then(process_level_progressions);
wkof.ItemData.get_items("assignments,review_statistics").then(process_items);

wkof.ready("wkdata.items").then(calc_accuracy);
wkof.ready("wkdata.resets,wkdata.level_progressions,wkdata.items").then(calc_levelups);
wkof.ready("wkstats.levelups,settings.progress").then(calc_average_levelup);

//================================================
function split_list(str) {
  return str
    .replace(/^\s+|\s*(,)\s*|\s+$/g, "$1")
    .split(",")
    .filter(function (name) {
      return name.length > 0;
    });
}

function pad(num, pad_char, width) {
  if (!pad_char) pad_char = "0";
  if (!width) width = 2;
  return (pad_char.repeat(width - 1) + num.toString()).slice(-width);
}

function yyyymmdd(date) {
  date = new Date(date);
  if (date.getTime() === wkdata.load_time.getTime()) {
    return "   now    ";
  }
  date.setHours(0, 0, 0, 0);
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

function days_ago(date) {
  date = new Date(date);
  date = date.setHours(0, 0, 0, 0);
  let now = new Date(wkdata.load_time).setHours(0, 0, 0, 0);
  let days_ago = Math.round((now - date) / 86400000);
  return days_ago + " day" + (days_ago === 1 ? "" : "s") + " ago";
}

function duration(days, no_minutes) {
  let seconds = days * 86400;
  let d = Math.floor(seconds / 86400);
  seconds -= d * 86400;
  let h,
    m = 0;
  if (no_minutes !== true) {
    h = Math.floor(seconds / 3600);
    seconds -= h * 3600;
    m = Math.round(seconds / 60);
  } else {
    h = Math.round(seconds / 3600);
  }
  if (m === 60) {
    m = 0;
    h++;
  }
  if (h === 24) {
    h = 0;
    d++;
  }
  let str = pad(d, " ", 4) + " day" + (d === 1 ? " " : "s");
  str += ", " + pad(h, " ", 2) + " hour" + (h === 1 ? " " : "s");
  if (no_minutes !== true) str += ", " + pad(m, " ", 2) + " minute" + (m === 1 ? " " : "s");
  return str;
}

function time_between(time1, time2) {
  return duration((new Date(time2) - new Date(time1)) / 86400000);
}

function percent(num) {
  return (num * 100).toFixed(2) + "%";
}

//================================================
function process_resets(data) {
  let resets = [];
  wkdata.resets = resets;
  Object.keys(data).forEach((key) => {
    resets.push(data[key].data);
  });
  log("resets", "--[ APIv2 /resets ]----------------");
  log("resets", "Count: " + resets.length);
  resets.forEach((reset, idx) => {
    log(
      "resets",
      "    " + reset.original_level + " -> " + reset.target_level + " (" + yyyymmdd(reset.confirmed_at) + ")",
    );
  });
  wkof.set_state("wkof.wkdata.resets", "ready");
}

//================================================
function process_level_progressions(data) {
  let levelups = [];
  wkdata.levelups = levelups;
  log("level_progressions", "--[ APIv2 /level_progressions ]----------------");
  let keys = Object.keys(data);
  for (let key_idx in keys) {
    let key = keys[key_idx];
    let levelup = data[key].data;
    let level = levelup.level;
    levelups.push(levelup);
    log(
      "level_progressions",
      "Level " +
        level +
        ": (" +
        yyyymmdd(levelup.unlocked_at) +
        " - " +
        (levelup.passed_at ? yyyymmdd(levelup.passed_at) : levelup.abandoned_at ? "abandoned " : "   now    ") +
        ")",
    );
  }
  wkof.set_state("wkof.wkdata.level_progressions", "ready");
}

//================================================
function process_items(items) {
  wkdata.items = items;
  wkdata.items_by_level = wkof.ItemData.get_index(items, "level");
  wkdata.items_by_subject_id = wkof.ItemData.get_index(items, "subject_id");
  wkdata.items_by_type = wkof.ItemData.get_index(items, "item_type");
  wkdata.items_by_slug = wkof.ItemData.get_index(items, "slug");
  wkof.set_state("wkof.wkdata.items", "ready");
}

//================================================
function calc_accuracy() {
  let items = wkdata.items;

  let item_counts = {
    radical: 0,
    kanji: 0,
    vocabulary: 0,
  };

  let review_counts = {
    total_readings: 0,
    total_meanings: 0,
    total_reviews: 0,
    correct_readings: 0,
    correct_meanings: 0,
    correct_reviews: 0,
    incorrect_readings: 0,
    incorrect_meanings: 0,
    incorrect_reviews: 0,
    radical: { correct_readings: 0, incorrect_readings: 0, correct_meanings: 0, incorrect_meanings: 0 },
    kanji: { correct_readings: 0, incorrect_readings: 0, correct_meanings: 0, incorrect_meanings: 0 },
    vocabulary: { correct_readings: 0, incorrect_readings: 0, correct_meanings: 0, incorrect_meanings: 0 },
  };

  let accuracy = {
    readings: 0,
    meanings: 0,
    total: 0,
    radical: { meanings: 0, total: 0 },
    kanji: { readings: 0, meanings: 0, total: 0 },
    vocabulary: { readings: 0, meanings: 0, total: 0 },
  };

  let item_progress = {
    overall_items: items.length,
    per_stage: {
      apprentice: 0,
      guru: 0,
      master: 0,
      enlightened: 0,
      burned: 0,
    },
  };

  for (let idx = 0; idx < items.length; idx++) {
    let item = items[idx];
    // Removed: Items may have been moved to higher levels!!
    //		if (item.data.level > wkof.user.level) continue;
    let stats = item.review_statistics;
    if (!stats) continue;

    let itype = item.object;
    if (item.assignments.srs_stage >= 5) item_counts[itype]++;

    if ([1, 2, 3, 4].includes(item.assignments.srs_stage)) {
      item_progress.per_stage.guru++;
    } else if ([5, 6].includes(item.assignments.srs_stage)) {
      item_progress.per_stage.guru++;
    } else if (item.assignments.srs_stage === 7) {
      item_progress.per_stage.master++;
    } else if (item.assignments.srs_stage === 8) {
      item_progress.per_stage.enlightened++;
    } else if (item.assignments.srs_stage === 9) {
      item_progress.per_stage.burned++;
    }

    let mc, mi, rc, ri;
    if (itype === "radical") {
      rc = ri = 0;
    } else if (itype === "kana_vocabulary") {
      rc = ri = 0;
      itype = "vocabulary";
    } else {
      rc = stats.reading_correct;
      ri = stats.reading_incorrect;
    }
    mc = stats.meaning_correct;
    mi = stats.meaning_incorrect;

    review_counts.total_readings += rc + ri;
    review_counts.total_meanings += mc + mi;
    review_counts.total_reviews += rc + ri + mc + mi;
    review_counts.correct_readings += rc;
    review_counts.correct_meanings += mc;
    review_counts.correct_reviews += rc + mc;
    review_counts.incorrect_readings += ri;
    review_counts.incorrect_meanings += mi;
    review_counts.incorrect_reviews += ri + mi;
    review_counts[itype].correct_readings += rc;
    review_counts[itype].incorrect_readings += ri;
    review_counts[itype].correct_meanings += mc;
    review_counts[itype].incorrect_meanings += mi;
  }

  accuracy.readings = review_counts.correct_readings / review_counts.total_readings;
  accuracy.meanings = review_counts.correct_meanings / review_counts.total_meanings;
  accuracy.total = review_counts.correct_reviews / review_counts.total_reviews;
  accuracy.radical.meanings =
    review_counts.radical.correct_meanings /
    (review_counts.radical.correct_meanings + review_counts.radical.incorrect_meanings);
  accuracy.radical.total =
    review_counts.radical.correct_meanings /
    (review_counts.radical.correct_meanings + review_counts.radical.incorrect_meanings);
  accuracy.kanji.readings =
    review_counts.kanji.correct_readings /
    (review_counts.kanji.correct_readings + review_counts.kanji.incorrect_readings);
  accuracy.kanji.meanings =
    review_counts.kanji.correct_meanings /
    (review_counts.kanji.correct_meanings + review_counts.kanji.incorrect_meanings);
  accuracy.kanji.total =
    (review_counts.kanji.correct_readings + review_counts.kanji.correct_meanings) /
    (review_counts.kanji.correct_readings +
      review_counts.kanji.correct_meanings +
      review_counts.kanji.incorrect_readings +
      review_counts.kanji.incorrect_meanings);
  accuracy.vocabulary.readings =
    review_counts.vocabulary.correct_readings /
    (review_counts.vocabulary.correct_readings + review_counts.vocabulary.incorrect_readings);
  accuracy.vocabulary.meanings =
    review_counts.vocabulary.correct_meanings /
    (review_counts.vocabulary.correct_meanings + review_counts.vocabulary.incorrect_meanings);
  accuracy.vocabulary.total =
    (review_counts.vocabulary.correct_readings + review_counts.vocabulary.correct_meanings) /
    (review_counts.vocabulary.correct_readings +
      review_counts.vocabulary.correct_meanings +
      review_counts.vocabulary.incorrect_readings +
      review_counts.vocabulary.incorrect_meanings);

  wkstats.item_counts = item_counts;
  wkstats.item_progress = item_progress;
  wkstats.review_counts = review_counts;
  wkstats.accuracy = accuracy;
  wkof.set_state("wkof.wkstats.accuracy", "ready");
}

//================================================
function calc_levelups() {
  let level_times = (wkstats.level_times = []);

  // For each level, initialize a valid range of possible level times (initial = any time)
  for (let level = 1; level <= wkof.user.subscription.max_level_granted; level++) {
    level_times[level] = {
      min: new Date(0),
      max: wkdata.load_time,
      source: "unknown",
    };
  }

  // Using level resets, throw out old level start times (by marking the min start time)
  for (let reset_idx = 0; reset_idx < wkdata.resets.length; reset_idx++) {
    let reset = wkdata.resets[reset_idx];
    let reset_time = new Date(reset.confirmed_at);
    for (let level = reset.target_level; level <= wkof.user.level; level++) {
      let level_time = level_times[level];

      // Ignore resets that happened before this level-up.
      if (reset_time < level_time.min) continue;

      // Update the min start time.
      level_time.min = reset_time;
      delete level_times[level].reset_time;
    }
    level_times[reset.target_level].reset_time = reset_time;
  }

  // Using the newest levelup record for each level, set known start times.
  let oldest_levelup = { index: -1, time: new Date("2999-01-01") };
  for (let levelup_idx = 0; levelup_idx < wkdata.levelups.length; levelup_idx++) {
    let levelup = wkdata.levelups[levelup_idx];
    let level = levelup.level;
    if (level > wkof.user.level) continue;
    let unlocked_time = new Date(levelup.unlocked_at);
    let level_time = level_times[level];

    // Check if this is the oldest recorded level-up, which may be invalid.
    if (unlocked_time < oldest_levelup.time) {
      oldest_levelup = { index: levelup_idx, time: unlocked_time, level: level };
    }

    // Ignore levelups that were invalidated by a reset.
    if (unlocked_time < level_time.min) continue;

    // Update the level start time.
    level_time.min = unlocked_time;
    level_time.source = "APIv2 level_progressions";
    if (!levelup.abandoned_at && levelup.passed_at) {
      level_time.max = new Date(levelup.passed_at);
    } else if (level === wkof.user.level) {
      level_time.max = new Date();
    }
  }

  if (
    oldest_levelup.index >= 0 &&
    oldest_levelup.level > 1 &&
    oldest_levelup.time === level_times[oldest_levelup.level].min
  ) {
    let level_time = level_times[oldest_levelup.level];
    let estimated_start = calc_levelup_from_vocab(oldest_levelup.level - 1);
    level_time.min = estimated_start;
    level_time.max = calc_levelup_from_vocab(oldest_levelup.level);
  }

  // Using all successive levelup records, set known end times.
  for (let levelup_idx = 0; levelup_idx < wkdata.levelups.length; levelup_idx++) {
    let levelup = wkdata.levelups[levelup_idx];
    let level = levelup.level;
    if (level > wkof.user.level) continue;
    let unlocked_time = new Date(levelup.unlocked_at);
    let level_time = level_times[level];

    // Eliminate reset info if it was superceded by another reset.
    if (level_time.reset_time && level_time.reset_time > level_time.min) {
      delete level_time.reset_time;
    }

    // Use known start times as max end times for prior levels.
    if (level > 1 && unlocked_time > level_times[level - 1].min && unlocked_time < level_times[level - 1].max) {
      level_times[level - 1].max = unlocked_time;
      if (level_time.reset_time) {
        let estimated_start = calc_levelup_from_vocab(level - 1);
        if (estimated_start < unlocked_time) level_times[level - 1].max = estimated_start;
      }
    }
  }

  if (wkstats.level_times[1].reset_time) {
    wkof.user.restarted_at = level_times[1].reset_time;
  }

  let all_levels_known = true;
  for (let level = 1; level <= wkof.user.level; level++) {
    let level_time = level_times[level];
    if (level_time.source !== "unknown") continue;
    all_levels_known = false;
    break;
  }

  if (!all_levels_known) estimate_missing_levelups();

  let durations = (wkstats.level_durations = []);
  for (let level = 1; level <= wkof.user.level; level++) {
    let level_time = level_times[level];
    durations[level] = (level_time.max - level_time.min) / 86400000;
  }

  log("levelups", "--[ Level-ups ]----------------");
  let level_durations = wkstats.level_durations;
  // Log the current level statuses.
  log("levelups", "Started: " + yyyymmdd(wkof.user.started_at));
  if (wkof.user.restarted_at) {
    log("levelups", "Restarted: " + yyyymmdd(wkof.user.restarted_at));
  }
  for (let level = 1; level <= wkof.user.level; level++) {
    let level_time = level_times[level];
    let level_duration = level_durations[level];
    if (level_time.reset_time) {
      log("levelups", "Reset");
    }
    // Flag any unusual level durations.
    if (level < wkof.user.level && (level_duration < 3.0 || level_duration > 2000))
      log("levelups", "###################");
    log(
      "levelups",
      "Level " +
        level +
        ": (" +
        yyyymmdd(level_time.min) +
        " - " +
        yyyymmdd(level_time.max) +
        ") - " +
        duration(level_duration) +
        " (source: " +
        level_time.source +
        ")",
    );
  }

  wkof.set_state("wkof.wkstats.levelups", "ready");
}

//================================================
function estimate_missing_levelups() {
  // Find the median of each level.
  let cutoff = wkof.user.restarted_at || new Date(wkof.user.started_at);
  for (let level = 1; level <= wkof.user.level; level++) {
    let level_time = wkstats.level_times[level];
    if (level_time.source !== "unknown") continue;

    if (level === 1) {
      if (wkof.user.restarted_at) {
        level_time.min = wkof.user.restarted_at || new Date(wkof.user.started_at);
        level_time.source = "Wanikani restart";
      } else {
        level_time.min = wkof.user.restarted_at || new Date(wkof.user.started_at);
        level_time.source = "Wanikani start";
      }
    } else {
      let prior_level_time = wkstats.level_times[level - 1];
      if (!level_time.reset_time) {
        level_time.min = prior_level_time.max;
      }
      level_time.source = "kanji estimated from vocab";
    }

    let next_level_time = wkstats.level_times[level + 1];
    if (next_level_time.source !== "unknown" && !next_level_time.reset_time) {
      level_time.max = next_level_time.min;
    } else {
      level_time.max = calc_levelup_from_vocab(level);
    }
  }
}

//================================================
function calc_levelup_from_vocab(level, show) {
  let by_id = wkdata.items_by_subject_id;
  let kanji = wkof.ItemData.get_index(wkdata.items_by_level[level], "item_type").kanji;
  let kanji_completions = [];

  for (let kan_idx = 0; kan_idx < kanji.length; kan_idx++) {
    let kan = kanji[kan_idx];
    if (!kan.data.amalgamation_subject_ids) continue;
    let earliest_unlock = new Date("2999-01-01");
    for (let voc_idx = 0; voc_idx < kan.data.amalgamation_subject_ids.length; voc_idx++) {
      let voc = by_id[kan.data.amalgamation_subject_ids[voc_idx]];
      if (!voc) continue;
      if (!voc.assignments || !voc.assignments.unlocked_at) continue;
      let voc_unlock = new Date(voc.assignments.unlocked_at);
      if (voc_unlock < earliest_unlock) earliest_unlock = voc_unlock;
    }
    if (earliest_unlock.getFullYear() < 2998) kanji_completions.push(earliest_unlock);
  }
  if (kanji_completions.length === 0) return null;
  kanji_completions.sort((a, b) => a.getTime() - b.getTime());
  if (show) {
    let str = [];
    kanji_completions.forEach((date) => str.push(date));
    console.log(str.join("\n"));
  }
  return kanji_completions[Math.ceil(kanji_completions.length * 0.9) - 1];
}

//================================================
function load_progress_settings() {
  let default_progress_settings = {
    excluded_levels: [],
  };
  wkof.Settings.load("progress", default_progress_settings).then((settings) => {
    wkof.set_state("wkof.settings.progress", "ready");
  });
}

//================================================
function calc_average_levelup() {
  let avg = 0,
    count = 0;
  let excluded = wkof.settings.progress.excluded_levels;
  let sorted = [];
  for (let level = 1; level < wkof.user.level; level++) {
    if (excluded[level]) continue;
    let duration = wkstats.level_durations[level];
    sorted.push(duration);
    avg += duration;
    count++;
  }
  wkstats.average_level_duration = count > 0 ? avg / count : 8.0;

  if (count === 0) {
    wkstats.median_level_duration = 8.0;
  } else {
    sorted.sort((a, b) => a - b);
    let mid = (count - 1) / 2;
    wkstats.median_level_duration = (sorted[Math.floor(mid)] + sorted[Math.ceil(mid)]) / 2;
  }

  wkof.set_state("wkof.wkstats.average", "ready");
}
