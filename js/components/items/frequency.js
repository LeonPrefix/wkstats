(function () {
  document.title = "wkstats: Kanji Frequency";

  if (!wkof.user) return nav.login();

  wkof.load_script(wkof.support_files["calc_stats.js"], true);
  wkof.load_script(wkof.support_files["freq_kanji.js"], true);

  let settings_name = "items_freq";
  load_settings();
  wkof.ready("settings." + settings_name).then(init_query_ui);
  wkof.ready("wkdata.items,freq.kanji,settings." + settings_name).then(populate_items);

  $(".main-content .config .open_btn").on("click", config_open_clicked);
  $(".main-content .query button").on("click", query_button_clicked);
  $(".main-content .items").on("click", ".item", item_clicked);
  $(".main-content .items").on("copy", copy_items);
  $(".main-content .items").on("mouseenter", ".item", item_info_show);
  $(".main-content .items").on("mouseleave", ".group", item_info_hide);
  $('.main-content .query input[name="freq_size"]').on("change", freq_size_changed);

  //================================================
  let srs_class = [
    "nonwk",
    "lock",
    "init",
    "appr1",
    "appr2",
    "appr3",
    "appr4",
    "guru1",
    "guru2",
    "mast",
    "enli",
    "burn",
  ];
  let srs_names = [
    "Not On Wanikani",
    "Locked",
    "Lesson",
    "Apprentice 1",
    "Apprentice 2",
    "Apprentice 3",
    "Apprentice 4",
    "Guru 1",
    "Guru 2",
    "Master",
    "Enlightened",
    "Burned",
  ];

  //================================================
  function load_settings() {
    let default_settings = {
      config_open: false,
      freq_size: 500,
      group1: "freq",
      group1_reverse: false,
      group2: "none",
      group2_reverse: false,
      sort: "freq",
      sort_reverse: false,
      enabled: {
        rad: true,
        kan: true,
        voc: true,
        lock: true,
        init: true,
        appr1: true,
        appr2: true,
        appr3: true,
        appr4: true,
        guru1: true,
        guru2: true,
        mast: true,
        enli: true,
        burn: true,
      },
    };
    wkof.Settings.load(settings_name, default_settings).then((settings) => {
      wkof.set_state("wkof.settings." + settings_name, "ready");
    });
  }

  //================================================
  function init_query_ui() {
    let settings = wkof.settings[settings_name];
    if (settings.group1 === "none" || settings.group2 === settings.group1) settings.group2 = "none";
    if (settings.sort !== "freq" && (settings.sort === settings.group1 || settings.sort === settings.group2))
      settings.sort = "slug";
    $(".main-content .query .select button").removeClass("active").prop("disabled", false);

    $('.main-content .query input[name="freq_size"]').val(settings.freq_size);

    if (settings.group1 === "none") {
      $('.main-content .query .select[name="group2"] button:not([name="none"]').prop("disabled", true);
    } else {
      $('.main-content .query .select[name="group2"] button[name="' + settings.group1 + '"]').prop("disabled", true);
    }

    if (settings.group1 !== "freq")
      $('.main-content .query .select[name="sort"] button[name="' + settings.group1 + '"]').prop("disabled", true);
    if (settings.group2 !== "freq")
      $('.main-content .query .select[name="sort"] button[name="' + settings.group2 + '"]').prop("disabled", true);

    $('.main-content .query .select[name="group1"] button[name="' + settings.group1 + '"]').addClass("active");
    $('.main-content .query .select[name="group2"] button[name="' + settings.group2 + '"]').addClass("active");
    $('.main-content .query .select[name="sort"] button[name="' + settings.sort + '"]').addClass("active");
    $('.main-content .query .select[name="color"] button[name="' + settings.color + '"]').addClass("active");
    let enable_names = Object.keys(settings.enabled);
    for (let idx in enable_names) {
      let enable_name = enable_names[idx];
      let enabled = settings.enabled[enable_name];
      if (!enabled)
        $('.main-content .query .select[name="enable"] button[name="' + enable_name + '"]').addClass("active");
    }

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
  function query_button_clicked(e) {
    let target = e.currentTarget;
    let row = target.closest(".select");
    let button_name = target.attributes.name.value;
    let row_name = row.attributes.name.value;

    let settings = wkof.settings[settings_name];
    let recalc = false;
    let save = false;
    let reverse = e.shiftKey === true;
    switch (row_name) {
      case "group1":
      case "group2":
      case "sort":
        let reverse_name = row_name + "_reverse";
        reverse |= settings[row_name] === button_name && !settings[reverse_name];
        if (settings[row_name] === button_name && settings[reverse_name] === reverse) return;
        settings[row_name] = button_name;
        settings[reverse_name] = reverse;
        if (reverse) {
          $(row).addClass("reverse");
        } else {
          $(row).removeClass("reverse");
        }
        save = true;
        recalc = true;
        break;

      case "color":
        if (settings.color === button_name) return;
        settings.color = button_name;
        save = true;
        recalc = true;
        break;

      case "enable":
        recalc = false;
        target = $(target);
        let container = $(".main-content .items");
        if (e.shiftKey) {
          let siblings = target.siblings("button");
          let remove_all = siblings.filter(":not(.active)").length > 0;
          siblings.each((idx, sibling) => {
            sibling = $(sibling);
            let sibling_name = sibling.attr("name");
            if (remove_all) {
              settings.enabled[sibling_name] = false;
              sibling.addClass("active");
              container.addClass("hide_" + sibling_name);
            } else {
              settings.enabled[sibling_name] = true;
              sibling.removeClass("active");
              container.removeClass("hide_" + sibling_name);
            }
          });
          settings.enabled[button_name] = true;
          target.removeClass("active");
          container.removeClass("hide_" + button_name);
        } else {
          settings.enabled[button_name] = !settings.enabled[button_name];
          container.toggleClass("hide_" + button_name);
        }
        save = true;
        break;
    }
    if (save) wkof.Settings.save(settings_name);
    init_query_ui();
    if (recalc) {
      populate_items();
    } else {
      draw_item_counts();
    }
  }

  //================================================
  let group_infos = {
    freq: {
      compare: numeric_compare,
      get_key: (item) => item.level,
      get_order: (key) => key,
      get_label: (key) =>
        key * wkof.settings[settings_name].freq_size + 1 + "-" + (key + 1) * wkof.settings[settings_name].freq_size,
    },
    wk_level: {
      compare: numeric_compare,
      get_key: (item) => (item.is_on_wk ? item.data.level : 0),
      get_order: (key) => (key === 0 ? 999 : key),
      get_label: (key) => (key > 0 ? "Level " + key : "Not On Wanikani"),
    },
    item_type: {
      compare: numeric_compare,
      get_key: (item) => item.object,
      get_order: (key) => ({ radical: 0, kanji: 1, vocabulary: 2 })[key],
      get_label: (key) => ({ radical: "Radicals", kanji: "Kanji", vocabulary: "Vocabulary" })[key],
    },
    srs: {
      compare: numeric_compare,
      get_key: (item) =>
        Number(
          item.is_on_wk ? (item.assignments && item.assignments.unlocked_at ? item.assignments.srs_stage : -1) : -2,
        ),
      get_order: (key) => (key === -2 ? 999 : key),
      get_label: (key) => srs_names[key + 2],
    },
    slug: {
      compare: string_compare,
      get_key: (item) => item.data.slug,
      get_order: (key) => key,
      get_label: (key) => key,
    },
  };
  function numeric_compare(a, b) {
    return a - b;
  }
  function string_compare(a, b) {
    return a.localeCompare(b);
  }

  //================================================
  let items = [],
    items_by_id = {};
  function get_items() {
    // Assemble a list of Freq kanji.
    let freq_group_size = wkof.settings[settings_name].freq_size;
    freq.kanji = [];
    freq.kanji_by_id = {};
    for (let idx = 0; idx < freq.kanji_by_freq.length; idx++) {
      let slug = freq.kanji_by_freq[idx];
      let item = (freq.kanji_by_id[slug] = {});
      freq.kanji.push(item);
      item.id = slug;
      item.object = "kanji";
      item.level = Math.floor(idx / freq_group_size);
      item.freq = idx + 1;
      let wk_items = wkdata.items_by_slug[slug];
      if (wk_items === undefined) wk_items = [];
      if (!(wk_items instanceof Array)) wk_items = [wk_items];
      wk_items = wk_items.filter((item) => item.object === "kanji");
      if (wk_items.length > 0) {
        let wk_item = wk_items[0];
        item.is_on_wk = true;
        item.data = wk_item.data;
        item.assignments = wk_item.assignments;
        item.study_materials = wk_item.study_materials;
      } else if (freq.kanji_details[slug]) {
        item.is_on_wk = false;
        item.data = freq.kanji_details[slug];
        item.data.slug = slug;
        item.data.level = "---";
        item.assignments = { srs_stage: -2, unlocked_at: 1 };
      } else {
        item.is_on_wk = false;
        item.assignments = { srs_stage: -2, unlocked_at: 1 };
        item.data = { slug: slug, level: "---", meanings: ["---"], kunyomi: ["---"], onyomi: ["---"] };
      }
    }

    items = freq.kanji;
    items_by_id = freq.kanji_by_id;
  }

  //================================================
  function populate_items() {
    let content = $('section[name="items-freq"] .items');
    content.html("");

    let settings = wkof.settings[settings_name];
    let group_by = [];
    if (settings.group1 !== "none") group_by.push([settings.group1, settings.group1_reverse]);
    if (settings.group2 !== "none") group_by.push([settings.group2, settings.group2_reverse]);
    let order_by = settings.sort;
    let color_by = "srs";

    get_items();

    let html;
    if (group_by.length === 0) {
      html = '<div class="group" data-depth="1">';
      html += '<h3 class="header">All Items <span class="count"></span></h3>';
      html += populate_array(items);
    } else {
      let grouped_items = categorize(items, group_by);
      html = populate_groups(grouped_items);
    }
    content.html(html);
    content.attr("data-color", color_by);

    let enable_names = Object.keys(settings.enabled);
    let hidden = [];
    for (let idx in enable_names) {
      let enable_name = enable_names[idx];
      let enabled = settings.enabled[enable_name];
      if (!enabled) hidden.push("hide_" + enable_name);
    }
    $(".main-content .items").addClass(hidden.join(" "));
    draw_item_counts();

    //--------------------------------
    function populate_groups(grouped_items, depth) {
      if (!depth) depth = 1;
      let html = "";
      let group_type = grouped_items._group_type;
      let keys = grouped_items._order;
      for (let key_idx in keys) {
        let key = keys[key_idx];
        let group = grouped_items[key];
        let group_name = group_infos[group_type].get_label(key);
        if (depth <= 2) html += '<div class="group" data-type="' + group_type + '" data-depth="' + depth + '">';
        if (depth <= 2) html += '<h3 class="header">' + group_name + ' <span class="count"></span></h3>';
        if (group instanceof Array) {
          html += populate_array(group);
        } else {
          html += populate_groups(group, depth + 1);
        }
        if (depth <= 2) html += "</div>";
      }
      return html;
    }

    //--------------------------------
    function populate_array(group) {
      let html = "";
      let order_info = group_infos[order_by];
      let get_key = order_by === "freq" ? (item) => item.freq : order_info.get_key;
      let get_order = order_info.get_order;
      let reverse = settings.sort_reverse ? -1 : 1;
      let compare = order_info.compare;
      group.sort((a, b) => {
        let result = reverse * compare(get_order(get_key(a)), get_order(get_key(b)));
        if (result) return result;
        result = reverse * a.data.slug.localeCompare(b.data.slug);
        if (result) return result;
        return reverse * a.object.localeCompare(b.object);
      });
      items_html = group.map((item) => {
        let text;
        switch (item.object) {
          case "radical":
            text = load_radical(item);
            break;
          case "kanji":
          case "vocabulary":
            text = item.data.slug;
            break;
        }
        let srs = -1;
        if (item.assignments && item.assignments.unlocked_at) srs = item.assignments.srs_stage || 0;
        html +=
          '<span class="item" lang="ja" ' +
          'data-id="' +
          item.id +
          '" ' +
          'data-type="' +
          item.object.slice(0, 3) +
          '" ' +
          'data-srs="' +
          srs_class[srs + 2] +
          '">' +
          text +
          "</span>";
      });
      return html;
    }
  }

  //================================================
  function categorize(items, groups) {
    let settings = wkof.settings[settings_name];
    let group = groups[0][0];
    let reverse = groups[0][1] ? -1 : 1;
    groups = groups.slice(1);
    group_info = group_infos[group];
    let grouped_items = {};
    let keys_are_numbers = items.length > 0 && typeof group_info.get_key(items[0]) === "number";
    for (let item_idx in items) {
      let item = items[item_idx];
      let key = group_info.get_key(item);
      let item_group = grouped_items[key];
      if (!item_group) grouped_items[key] = item_group = [];
      item_group.push(item);
    }

    let keys = Object.keys(grouped_items);
    if (keys_are_numbers) keys = keys.map((key) => Number(key));
    let get_order = group_info.get_order;
    let compare = group_info.compare;
    keys.sort((a, b) => {
      return reverse * compare(get_order(a), get_order(b));
    });

    // Categorize sub-groups
    if (groups.length > 0) {
      for (let key_idx in keys) {
        let key = keys[key_idx];
        grouped_items[key] = categorize(grouped_items[key], groups);
      }
    }

    Object.defineProperty(grouped_items, "_group_type", { value: group, writable: true, enumerable: false });
    Object.defineProperty(grouped_items, "_order", { value: keys, writable: true, enumerable: false });
    return grouped_items;
  }

  //================================================
  function load_radical(item) {
    if (!window.wksvg) window.wksvg = {};
    let id = item.id;
    if (wksvg[id]) return wksvg[id];

    let url = item.data.character_images.filter(
      (ci) => ci.content_type === "image/svg+xml" && !ci.metadata.inline_styles,
    )[0].url;
    if (typeof url !== "string") return "??";
    wkof.load_file(url).then((content) => {
      content = content.replace(/(^\s+|\s+$)/g, "");
      wksvg[id] = content;
      $('.main-content [data-type="rad"][data-id="' + id + '"]').html(content);
    });

    return "&nbsp;";
  }

  //================================================
  function draw_item_counts() {
    let settings = wkof.settings[settings_name];
    $(".main-content .group")
      .prop("hidden", false)
      .each((idx, group) => {
        let items = group.querySelectorAll(".item");
        let visible_cnt = 0;
        for (let idx = 0; idx < items.length; idx++) {
          if (items[idx].offsetWidth > 0) visible_cnt++;
        }
        group.querySelector(".count").innerText = "(" + visible_cnt + " of " + items.length + " shown)";
        if (visible_cnt === 0) group.setAttribute("hidden", "hidden");
      });
  }

  //================================================
  function to_title_case(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  //================================================
  function item_info_show(e) {
    let target = $(e.currentTarget);

    let item_id = target.attr("data-id");
    let item = items_by_id[item_id];
    let html;

    let meanings, readings, reading_type;
    switch (item.object) {
      case "kanji":
        html =
          '<span class="item_name">Kanji: <span class="data slug" lang="ja">' + item.data.slug + "</span></span><br>";
        if (item.is_on_wk) {
          readings = item.data.readings.filter((reading) => reading.accepted_answer);
          reading_type = to_title_case(readings[0].type);
          readings = readings.map((reading) => reading.reading);
          html += reading_type + ': <span class="data" lang="ja">' + readings.join(", ") + "</span><br>";
          meanings = item.data.meanings.filter((meaning) => meaning.accepted_answer).map((meaning) => meaning.meaning);
        } else {
          reading_type = "Reading";
          readings = item.data.readings;
          html += 'Kunyomi: <span class="data" lang="ja">' + item.data.kunyomi.join(", ") + "</span><br>";
          html += 'Onyomi: <span class="data" lang="ja">' + item.data.onyomi.join(", ") + "</span><br>";
          meanings = item.data.meanings;
        }
        break;
    }
    html += 'Meaning: <span class="data">' + to_title_case(meanings.join(", ")) + "</span><br>";
    html += 'Wanikani Level: <span class="data">' + item.data.level + "</span><br>";
    if (item.is_on_wk) {
      let srs = item.is_on_wk
        ? item.assignments && item.assignments.unlocked_at
          ? item.assignments.srs_stage
          : -1
        : -2;
      html += 'SRS Level: <span class="data">' + srs_names[srs + 2] + "</span>";
      if (item.assignments && item.assignments.available_at) {
        html +=
          '<br>Next Review: <span class="data">' + new Date(item.assignments.available_at).toLocaleString() + "</span>";
      }
    }
    let nth = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][item.freq % 10];
    html += '<hr>Frequency: <span class="data">' + item.freq + "<sup>" + nth + "</sup></span><br>";

    let offset = target.position();
    let info = $(".main-content .item_info");
    let center = $(".main-content section").innerWidth() / 2;
    let css;
    if (offset.left <= center) {
      css = {
        left: offset.left,
        right: "unset",
        top: offset.top + target.outerHeight() + 4,
      };
    } else {
      css = {
        left: "unset",
        right: center * 2 - (offset.left + target.outerWidth()),
        top: offset.top + target.outerHeight() + 4,
      };
    }
    css["max-width"] = Math.round(center) + "px";
    info.html(html).css(css).prop("hidden", false);
  }

  //================================================
  function item_clicked(e) {
    let elem = e.currentTarget;
    let id = elem.attributes["data-id"].value;
    let item = items_by_id[id];
    let item_type = item.object;
    if (item_type === "radical") item_type = "radicals";
    let url;
    if (!item.is_on_wk || e.shiftKey) {
      url = "https://jisho.org/search/%23kanji%20" + encodeURI(item.data.slug);
    } else {
      url = encodeURI("https://www.wanikani.com/" + item_type + "/" + item.data.slug);
    }
    window.open(url, "_blank");
  }

  //================================================
  function copy_items() {
    $('.main-content .items .item[data-type="rad"]').each((idx, elem) => {
      let id = elem.attributes["data-id"].value;
      let item = items_by_id[id];
      $(elem).append('<span class="comma">' + item.data.slug + "</span>");
    });
    $(".main-content .items .group").find(">.item:visible:not(:last)").append('<span class="comma">,</span>');
    setTimeout(function () {
      $(".main-content .items .item > .comma").remove();
    }, 100);
  }

  //================================================
  function item_info_hide(e) {
    $(".main-content .item_info").prop("hidden", true);
  }

  //================================================
  function freq_size_changed() {
    let settings = wkof.settings[settings_name];
    let value = Number($('.main-content .query input[name="freq_size"]').val());
    if (value === settings.freq_size) return;
    settings.freq_size = value;
    populate_items();
    wkof.Settings.save(settings_name);
  }
})();
