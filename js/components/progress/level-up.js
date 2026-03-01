(function () {
  document.title = "wkstats: Level-up";

  if (!wkof.user) return nav.login();

  wkof.load_script(wkof.support_files["calc_stats.js"], false);

  wkof.ready("wkstats.levelups,wkstats.average").then(draw_chart);
  wkof.ready("wkstats.levelups").then(show_levelups_in_console);

  let chart = {
    levels: {
      min_width: 11,
      max_width: 70,
      spacing_min: 2,
      spacing_pct: 10,
    },
    resets: {
      count: 0,
      width: 8,
      line_width: 4,
      text_height: 10,
      text_width: 40,
      text_offset: 4,
    },
    data: {
      margin_top: 8,
      height: 250,
    },
    x_labels: {
      height: 70,
    },
    y_labels: {
      width: 50,
      num_tics: 5,
    },
    avg_slider: {
      width: 0,
    },
  };

  function draw_chart() {
    let settings = wkof.settings.progress;
    chart.height = chart.data.margin_top + chart.data.height + chart.x_labels.height;
    chart.data.base = chart.data.margin_top + chart.data.height;

    let typical_levelup = wkstats.median_level_duration;
    let max_y = Math.ceil((typical_levelup * 2) / (chart.y_labels.num_tics - 1)) * (chart.y_labels.num_tics - 1);
    let dy = (chart.data.height - 1) / max_y;

    //=========================================
    // Draw Y_LABELS section
    //-----------------------------------------
    let tics_svg = [],
      y_labels = [];
    tics_svg.push('<path d="M' + (chart.y_labels.width - 1) + ",0v" + chart.data.height + '"/>');
    for (let tic_idx = 0; tic_idx <= chart.y_labels.num_tics; tic_idx++) {
      let y = (chart.data.height * tic_idx) / chart.y_labels.num_tics;
      let label = String(Math.round((max_y * tic_idx) / chart.y_labels.num_tics));
      tics_svg.push('<path d="M' + (chart.y_labels.width - 1) + "," + y + 'h-5"/>');
      y_labels.push('<text x="' + (chart.y_labels.width - 9) + '" y="' + -y + '" dy="0.35em">' + label + "</text>");
    }
    let tics_html =
      '<svg viewbox="0 0 ' +
      [chart.y_labels.width, chart.height].join(" ") +
      '">' +
      '  <g class="grid" transform="scale(1,-1) translate(0.5,-' +
      (chart.data.base + 0.5) +
      ')">' +
      tics_svg.join("") +
      "  </g>" +
      '  <g class="labels" transform="translate(0.5,' +
      (chart.data.base + 0.5) +
      ')">' +
      y_labels.join("") +
      '    <text class="y_axis" x="0" y="0" transform="rotate(-90,0,0) translate(' +
      [chart.data.height / 2, 12].join() +
      ')">Time (days)</text>' +
      "  </g>" +
      "</svg>";
    $(".main-content .y_labels").html(tics_html);

    //=========================================
    // Draw DATA section
    //-----------------------------------------
    chart.available_width = $('section[name="level-up"]').innerWidth();
    chart.data.width = chart.available_width - (chart.y_labels.width + chart.avg_slider.width);
    $(".main-content .chart .data").css("max-width", chart.data.width);

    chart.levels.count = wkof.user.level;

    // Test vectors:
    //      wkstats.level_times[14].reset_time = 1;
    //      chart.levels.count = 35;
    //      wkstats.level_durations[3] = max_y * 1.1;
    //      wkstats.level_durations[4] = max_y * 1.1;

    chart.resets.count = wkstats.level_times.filter((level) => level.reset_time !== undefined).length;

    // Calculate an initial width for the level bars.
    chart.levels.width = Math.floor(
      (chart.data.width - chart.resets.count * chart.resets.width) /
        (((chart.levels.count + chart.resets.count + 1) * chart.levels.spacing_pct) / 100 + chart.levels.count),
    );
    if (chart.levels.width > chart.levels.max_width) chart.levels.width = chart.levels.max_width;
    if (chart.levels.width < chart.levels.min_width) chart.levels.width = chart.levels.min_width;

    // Try rounding the spacing up.  If it exceeds length, round down.
    chart.levels.spacing = Math.max(
      chart.levels.spacing_min,
      Math.round((chart.levels.width * chart.levels.spacing_pct) / 100),
    );
    let temp_width = calc_data_width();
    if (temp_width > chart.data.width) {
      chart.levels.spacing = Math.max(
        chart.levels.spacing_min,
        Math.floor((chart.levels.width * chart.levels.spacing_pct) / 100),
      );
      temp_width = calc_data_width();
    }
    if (temp_width > chart.data.width && chart.levels.width > chart.levels.min_width) {
      chart.levels.width--;
      temp_width = calc_data_width();
    }
    chart.data.width = temp_width;

    function calc_data_width() {
      return (
        Math.max(chart.levels.spacing_min, chart.levels.spacing) * (chart.levels.count + chart.resets.count + 1) +
        chart.levels.count * chart.levels.width +
        chart.resets.count * chart.resets.width
      );
    }

    let fastest = Number.MAX_SAFE_INTEGER;
    let slowest = 0;
    for (let level = 1; level < chart.levels.count; level++) {
      if (settings.excluded_levels[level]) continue;
      let duration = wkstats.level_durations[level];
      if (duration > slowest) slowest = duration;
      if (duration < fastest) fastest = duration;
    }

    let offset_mask = false;
    let defs = [],
      groups = [];
    let w = chart.levels.width + chart.levels.spacing;
    let x = chart.levels.spacing / 2;
    for (let level = 1; level <= chart.levels.count; level++) {
      let grp = [];
      let lvl_len = wkstats.level_durations[level];
      let height = Math.round(dy * lvl_len);
      let has_reset = wkstats.level_times[level].reset_time !== undefined;
      if (has_reset) {
        let w = chart.resets.width;
        let lw = chart.resets.line_width;
        let c = x + (w + chart.levels.spacing) / 2;
        let h = chart.data.height;
        let th = chart.resets.text_height;
        let tw = chart.resets.text_width;
        let to = chart.resets.text_offset;
        let d = (th - lw) / 2;
        groups.push(
          '<g data-level="' +
            level +
            '" class="reset" transform="scale(1,-1) translate(' +
            [c + 0.5, -(chart.data.base + 0.5)].join() +
            ')">' +
            '  <path class="bar" d="M' +
            [-th / 2, -(tw + d + to)].join() +
            "v" +
            tw +
            "l" +
            [d, d].join() +
            "v" +
            (h + to) +
            "h" +
            (lw - 1) +
            "v-" +
            (h + to) +
            "l" +
            [d, -d].join() +
            "v" +
            -tw +
            "h" +
            (1 - th) +
            '"/>' +
            '  <text class="time light" x="' +
            ((chart.resets.width - chart.resets.text_height) / 2 - (to + d + 1)) +
            '" y="0" dy="0.3em" transform="scale(1,-1) rotate(-90,0,0)" textLength="33">RESET</text>' +
            "</g>",
        );
        x += chart.resets.width + chart.levels.spacing;
      }
      let bar_class;
      if (level === chart.levels.count) {
        bar_class = "current";
      } else if (settings.excluded_levels[level]) {
        bar_class = "excluded";
      } else if (lvl_len === slowest) {
        bar_class = "slowest";
      } else if (lvl_len === fastest) {
        bar_class = "fastest";
      } else if (lvl_len > typical_levelup) {
        bar_class = "slow";
      } else {
        bar_class = "fast";
      }
      let mask_link = "";
      let mask_lines = "";
      let c = x + w / 2;
      if (lvl_len > max_y) {
        height = chart.data.base;
        let y = Math.round(chart.data.height - Math.max(chart.data.height * 0.1, chart.levels.width * 0.75));
        if (offset_mask) y -= Math.max(chart.levels.min_width, chart.levels.width * 0.5);
        let top_start = [-w / 2, y].join();
        let top_path = "Q" + [-w / 4, y + w / 6, 1, y].join() + "Q" + [w / 4, y - w / 6, w / 2, y + 1].join();
        y -= 6;
        let bottom_start = [w / 2, y].join();
        let bottom_path = "Q" + [w / 4, y - w / 6, -1, y].join() + "Q" + [-w / 4, y + w / 6, -w / 2, y - 1].join();
        let mask_data = "M" + top_start + top_path + "L" + bottom_start + bottom_path + "Z";
        let top_data = "M" + top_start + top_path;
        let bottom_data = "M" + bottom_start + bottom_path;
        mask_link = ' mask="url(#break_' + level + ')"';
        defs.push(
          '<mask id="break_' +
            level +
            '">' +
            '  <path class="keep" d="M' +
            [-w / 2, -2].join() +
            "v" +
            chart.data.base +
            "h" +
            (w - 1) +
            "v-" +
            chart.data.base +
            "h" +
            (1 - w) +
            '"/>' +
            '  <path class="toss" d="' +
            mask_data +
            '"/>' +
            '  <path class="fade_top" fill="url(#fade_bar)" d="M' +
            [-w / 2, chart.data.height - 6].join() +
            "v" +
            (chart.data.margin_top + 6) +
            "h" +
            (w - 1) +
            "v-" +
            (chart.data.margin_top + 6) +
            "h" +
            (1 - w) +
            '"/>' +
            "</mask>",
        );
        mask_lines = '<g class="break_lines"><path d="' + top_data + '"/><path d="' + bottom_data + '"/></g>';
        offset_mask = !offset_mask;
      } else {
        offset_mask = false;
      }
      grp.push(
        '<path class="bar" d="M' +
          [-chart.levels.width / 2, 0].join() +
          "v" +
          height +
          "h" +
          (chart.levels.width - 1) +
          "v-" +
          height +
          "h-" +
          (chart.levels.width - 1) +
          '"' +
          mask_link +
          "/>" +
          mask_lines,
      );
      grp.push(
        '<text class="time light" x="5" y="0" dy="0.3em" transform="scale(1,-1) rotate(-90,0,0)">' +
          duration(lvl_len, true /* no_minutes */) +
          "</text>",
      );
      let level_svg = jap_num(level)
        .split("")
        .map((digit, idx) => {
          return '<text x="0" y="' + 13 * (idx + 1) + '">' + digit + "</text>";
        })
        .join("");
      groups.push(
        '<g data-level="' +
          level +
          '" class="level ' +
          bar_class +
          '" transform="scale(1,-1) translate(' +
          [c + 0.5, -(chart.data.base + 0.5)].join() +
          ')">' +
          grp.join("") +
          '  <g class="x_label" transform="scale(1,-1)">' +
          level_svg +
          "</g>" +
          '  <path class="click" d="M' +
          [-w / 2, -(chart.x_labels.height - 1)].join() +
          "v" +
          (chart.height - 1) +
          "h" +
          (w - 1) +
          "v-" +
          (chart.height - 1) +
          "h" +
          (1 - w) +
          '"/>' +
          "</g>",
      );

      x += chart.levels.width + chart.levels.spacing;
    }
    let data_html =
      '<svg width="' +
      chart.data.width +
      '" height="' +
      chart.height +
      '" viewbox="0 0 ' +
      [chart.data.width, chart.height].join(" ") +
      '">' +
      "  <defs>" +
      '    <linearGradient id="fade_bar" x1="0" y1="0" x2="0" y2="1">' +
      '      <stop offset="0%" stop-color="white"/>' +
      '      <stop offset="100%" stop-color="black"/>' +
      "    </linearGradient>" +
      '    <linearGradient id="avg_slow" x1="0" y1="0" x2="0" y2="1">' +
      '      <stop offset="25%" stop-color="#aa38c6" stop-opacity="0.15"/>' +
      '      <stop offset="95%" stop-color="#aa38c6" stop-opacity="0"/>' +
      "    </linearGradient>" +
      '    <linearGradient id="avg_fast" x1="0" y1="0" x2="0" y2="1">' +
      '      <stop offset="25%" stop-color="#5571e2" stop-opacity="0"/>' +
      '      <stop offset="95%" stop-color="#5571e2" stop-opacity="0.15"/>' +
      "    </linearGradient>" +
      '    <clipPath id="data_mask">' +
      '      <rect x="0" y="0" height="' +
      chart.data.base +
      '" width="' +
      chart.data.width +
      '"/>' +
      "    </clipPath>" +
      defs.join("") +
      "  </defs>" +
      '  <g class="grid" transform="scale(1,-1) translate(0,-' +
      chart.data.base +
      ')" clip-path="url(#data_mask)">' +
      '    <g class="avg" transform="translate(0,' +
      Math.round(dy * typical_levelup) +
      ')">' +
      '      <path fill="url(#avg_slow)" d="M0,0h' +
      chart.data.width +
      "v75h-" +
      chart.data.width +
      'z"/>' +
      '      <path fill="url(#avg_fast)" d="M0,0h' +
      chart.data.width +
      "v-75h-" +
      chart.data.width +
      'z"/>' +
      '      <path class="divider" d="M0.5,-0.5h' +
      chart.data.width +
      '"/>' +
      "    </g>" +
      "  </g>" +
      '  <text class="x_axis" x="0" y="0" transform="translate(' +
      [chart.data.width / 2, chart.data.base + chart.x_labels.height].join() +
      ')">WaniKani Level</text>' +
      groups.join("") +
      '  <g class="grid" transform="translate(0.5,0.5)">' +
      '    <path d="M0,' +
      chart.data.base +
      "h" +
      chart.data.width +
      '"/>' +
      "  </g>" +
      "</svg>";
    $(".main-content .data").html(data_html);
    $(".main-content .y_labels").width(chart.y_labels.width);
    $(".main-content .avg_slider").width(chart.avg_slider.width);

    $(".main-content .chart .average").text(
      "Average: " + duration(wkstats.average_level_duration, false /* no_minutes */),
    );
    $(".main-content .chart .median").text(
      "Median: " + duration(wkstats.median_level_duration, false /* no_minutes */),
    );
    $(".main-content .init_msg").prop("hidden", true);
    $(".main-content .chart").prop("hidden", false);

    $(".main-content .data > svg").on("click", ".click", level_clicked);

    for (let level = 1; level <= chart.levels.count; level++) {
      let elem = $('.main-content .level[data-level="' + level + '"] .time');
      let text_length = elem[0].getBBox().width;
      let height = Math.round(dy * wkstats.level_durations[level]);
      if (text_length < height - 10) continue;
      elem
        .removeClass("light")
        .addClass("dark")
        .attr("x", height + 5);
    }
  }

  function level_clicked(e) {
    let settings = wkof.settings.progress;
    let group = e.target.closest(".level");
    let level = Number(group.attributes["data-level"].value);
    if (level === wkof.user.level) return;
    settings.excluded_levels[level] = !settings.excluded_levels[level];
    wkof.Settings.save("progress");
    calc_average_levelup();
    draw_chart();
  }

  function jap_num(num) {
    ten = Math.floor(num / 10);
    one = num % 10;
    let digits = "例一二三四五六七八九十";
    let str = "";
    if (ten) str = (ten === 1 ? "" : digits[ten]) + digits[10];
    if (one) str += digits[one];
    return str;
  }

  window.addEventListener("resize", window_resized);
  function window_resized() {
    if (!chart.available_width) return;
    let new_width = $('section[name="level-up"]').innerWidth();
    if (new_width !== chart.available_width) draw_chart();
  }

  function show_levelups_in_console() {
    dump_log("resets,level_progressions,levelups");
  }
})();
