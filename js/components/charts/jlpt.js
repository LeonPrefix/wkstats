(function () {
  document.title = "wkstats: JLPT Coverage";

  //================================================
  let MAX_LEVEL = 60;

  let use_snapshot = !wkof.user || wkof.user.subscription.max_level_granted < MAX_LEVEL;

  if (use_snapshot) {
    wkof.load_script(wkof.support_files["wk_snapshot.js"]);
  } else {
    wkof.load_script(wkof.support_files["calc_stats.js"], true);
  }

  wkof.load_script(wkof.support_files["jlpt_kanji.js"], true);

  let settings_name = "charts_jlpt";
  load_settings();
  wkof.ready("settings." + settings_name).then(init_query_ui);

  let items_src = use_snapshot ? "wk_snapshot" : "wkdata.items";
  wkof.ready(items_src + ",jlpt.kanji,settings." + settings_name).then(draw_chart);

  $(".main-content .config .open_btn").on("click", config_open_clicked);
  $('.main-content .config input[name="cumulative"]').on("click", cumulative_clicked);

  //================================================
  function load_settings() {
    let default_settings = {
      config_open: false,
      cumulative: false,
    };
    wkof.Settings.load(settings_name, default_settings).then((settings) => {
      wkof.set_state("wkof.settings." + settings_name, "ready");
    });
  }

  //================================================
  function init_query_ui() {
    let settings = wkof.settings[settings_name];
    $('.main-content .query input[name="cumulative"]').prop("checked", settings.cumulative);

    let config = $(".main-content .config");
    if (settings.config_open !== config.hasClass("open")) {
      if (settings.config_open) {
        config.addClass("open");
        config.find(".open_btn").text("Close Config");
        $(".main-content .query").slideDown();
      } else {
        config.removeClass("open");
        config.find(".open_btn").text("Open Config");
        $(".main-content .query").slideUp();
      }
    }
  }

  //================================================
  function config_open_clicked(e) {
    let settings = wkof.settings[settings_name];
    settings.config_open = !settings.config_open;
    init_query_ui();
    wkof.Settings.save(settings_name);
  }

  //================================================
  function cumulative_clicked(e) {
    let settings = wkof.settings[settings_name];
    settings.cumulative = !settings.cumulative;
    init_query_ui();
    draw_chart();
    wkof.Settings.save(settings_name);
  }

  //================================================
  let data;
  function draw_chart() {
    let content = $('section[name="charts-jlpt"] .chart');
    content.html("");

    let settings = wkof.settings[settings_name];

    let user_level;
    if (!data) {
      if (use_snapshot) {
        process_items_snapshot();
        user_level = 61;
      } else {
        process_items();
        user_level = wkof.user.level;
      }
      calculate_chart();
    }

    // Draw headers.
    let have_leftover = false;
    let html =
      '<table class="coverage"><tr class="header"><td>Wanikani</td><td class="header_div" colspan="' +
      data.length +
      '">JLPT</td></tr>';
    html += '<tr class="header"><td>Level</td>';
    for (let col = 0; col < data.length; col++) {
      let total = settings.cumulative ? data[col].cumulative_total : data[col].group_total;
      html += '<td><span class="nowrap">' + data[col].name + "</span></td>";
    }
    html += '</tr><tr class="header count bottom"><td></td>';
    for (let col = 0; col < data.length; col++) {
      let total = settings.cumulative ? data[col].cumulative_total : data[col].group_total;
      html += "<td>/" + total + "</td>";
      if (data[col].not_on_wk.length > 0) have_leftover = true;
    }
    html += "</tr>";

    // Draw data.
    let complete = new Array(data.length).fill(false);
    for (let row = 0; row < MAX_LEVEL; row++) {
      html += "<tr" + (row + 1 === user_level ? ' class="current_level"' : "") + ">";
      html += "<td>" + (row + 1) + "</td>";
      for (let col = 0; col < data.length; col++) {
        let total = settings.cumulative ? data[col].cumulative_total : data[col].group_total;
        let count = settings.cumulative ? data[col].levels[row].cumulative_sum : data[col].levels[row].group_sum;
        if (!complete[col]) {
          html +=
            '<td title="' + data[col].levels[row].kanji + '">' + (((count / total) * 100).toFixed(2) + "%") + "</td>";
          if (count === total) complete[col] = true;
        } else {
          html += "<td>---</td>";
        }
      }
      html += "</tr>";
    }
    html += "</table>";

    if (have_leftover) {
      html += '<table class="nonwk"><tr class="header"><td colspan="2">Kanji Not On Wanikani</td></tr>';
      for (let col = 0; col < data.length; col++) {
        let total = data[col].group_total;
        let count = data[col].not_on_wk.length;
        if (count > 0) {
          html +=
            '<tr><td class="header"><span class="nowrap">' +
            data[col].name +
            '</span><br><span class="count">' +
            count +
            "/" +
            total +
            "</span></td>";
          html += "<td>" + data[col].not_on_wk.split("").join(" ") + "</td></tr>";
        }
      }
      html += "</table></div>";
    }

    content.html(html);
  }

  //================================================
  function process_items_snapshot() {
    let not_on_wk = [];
    let cumulative_total = 0;
    data = jlpt.kanji_by_level.map((group) => {
      let levels = new Array(MAX_LEVEL).fill("");
      let not_on_wk = "";
      for (let idx = 0; idx < group.kanji.length; idx++) {
        let slug = group.kanji[idx];
        let lvl;
        for (lvl = 1; lvl <= 60; lvl++) {
          if (wk_snapshot[lvl].indexOf(slug) >= 0) {
            levels[lvl - 1] += slug;
            break;
          }
        }
        if (lvl > 60) not_on_wk += slug;
      }
      let group_total = group.kanji.length;
      cumulative_total += group_total;
      return {
        name: group.name,
        levels: levels,
        not_on_wk: not_on_wk,
        group_total: group_total,
        cumulative_total: cumulative_total,
      };
    });
  }

  //================================================
  function process_items() {
    let not_on_wk = [];
    let cumulative_total = 0;
    data = jlpt.kanji_by_level.map((group) => {
      let levels = new Array(MAX_LEVEL).fill("");
      let not_on_wk = "";
      for (let idx = 0; idx < group.kanji.length; idx++) {
        let slug = group.kanji[idx];
        let wk_item = wkdata.items_by_slug[slug];
        if (wk_item instanceof Array) wk_item = wk_item.filter((item) => item.object === "kanji")[0];
        if (wk_item) {
          levels[wk_item.data.level - 1] += slug;
        } else {
          not_on_wk += slug;
        }
      }
      let group_total = group.kanji.length;
      cumulative_total += group_total;
      return {
        name: group.name,
        levels: levels,
        not_on_wk: not_on_wk,
        group_total: group_total,
        cumulative_total: cumulative_total,
      };
    });
  }

  //================================================
  function calculate_chart() {
    let prior_group;
    data.forEach((group) => {
      let group_sum = 0;
      for (let level = 0; level < MAX_LEVEL; level++) {
        let kanji = group.levels[level];
        let count = kanji.length;
        kanji = kanji.split("").sort().join("");
        group_sum += count;

        let cumulative_sum = (prior_group ? prior_group.levels[level].cumulative_sum : 0) + group_sum;
        group.levels[level] = { group_sum: group_sum, cumulative_sum: cumulative_sum, kanji: kanji };
      }

      prior_group = group;
    });
  }
})();
