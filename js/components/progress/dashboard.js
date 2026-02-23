(function () {
  document.title = "wkstats: Dashboard";

  if (!wkof.user) {
    nav.login();
    return;
  }

  wkof.load_script(wkof.support_files["calc_stats.js"], false).then(populate_user_info);

  wkof.ready("wkstats.accuracy").then(() => {
    populate_progress();
    populate_accuracy();
  });
  wkof.ready("wkstats.levelups").then(populate_levelups);
  wkof.ready("wkstats.average").then(populate_averages);

  function populate_user_info() {
    $('[data-id="user_level"]').text(wkof.user.level);
    $('[data-id="start_date"]').text(yyyymmdd(wkof.user.started_at) + " (" + days_ago(wkof.user.started_at) + ")");
  }

  function populate_progress() {
    const max = wkstats.item_progress.overall_items;
    const burned = wkstats.item_progress.per_stage.burned;
    const enlightened = wkstats.item_progress.per_stage.enlightened;
    const master = wkstats.item_progress.per_stage.master;
    const guru = wkstats.item_progress.per_stage.guru;
    const apprentice = wkstats.item_progress.per_stage.apprentice;
    const overall = apprentice + guru + master + enlightened + burned;

    const burned_percentage = Math.round((burned / max) * 100);
    const enlightened_percentage = Math.round((enlightened / max) * 100);
    const master_percentage = Math.round((master / max) * 100);
    const guru_percentage = Math.round((guru / max) * 100);
    const apprentice_percentage = Math.round((apprentice / max) * 100);
    const overall_percentage = Math.round((overall / max) * 100);

    $('[data-id="overall-learned"]').attr("data-label", `${overall_percentage}% (${overall} / ${max})`);
    $('[data-id="apprentice-learned-fill"]').css("width", apprentice_percentage + "%");
    $('[data-id="guru-learned-fill"]').css("width", guru_percentage + "%");
    $('[data-id="master-learned-fill"]').css("width", master_percentage + "%");
    $('[data-id="enlightened-learned-fill"]').css("width", enlightened_percentage + "%");
    $('[data-id="burned-learned-fill"]').css("width", burned_percentage + "%");
  }

  function populate_accuracy() {
    $('[data-id="radicals_learned"]').text(wkstats.item_counts.radical);
    $('[data-id="kanji_learned"]').text(wkstats.item_counts.kanji);
    $('[data-id="vocabulary_learned"]').text(wkstats.item_counts.vocabulary);

    $('[data-id="total_readings"]').text(wkstats.review_counts.total_readings);
    $('[data-id="total_meanings"]').text(wkstats.review_counts.total_meanings);
    $('[data-id="total_reviews"]').text(wkstats.review_counts.total_reviews);
    $('[data-id="correct_readings"]').text(wkstats.review_counts.correct_readings);
    $('[data-id="correct_meanings"]').text(wkstats.review_counts.correct_meanings);
    $('[data-id="correct_reviews"]').text(wkstats.review_counts.correct_reviews);
    $('[data-id="incorrect_readings"]').text(wkstats.review_counts.incorrect_readings);
    $('[data-id="incorrect_meanings"]').text(wkstats.review_counts.incorrect_meanings);
    $('[data-id="incorrect_reviews"]').text(wkstats.review_counts.incorrect_reviews);
    $('[data-id="accuracy_readings"]').text(percent(wkstats.accuracy.readings));
    $('[data-id="accuracy_meanings"]').text(percent(wkstats.accuracy.meanings));
    $('[data-id="accuracy_total"]').text(percent(wkstats.accuracy.total));
    $('[data-id="radical_meanings"]').text(percent(wkstats.accuracy.radical.meanings));
    $('[data-id="radical_total"]').text(percent(wkstats.accuracy.radical.total));
    $('[data-id="kanji_readings"]').text(percent(wkstats.accuracy.kanji.readings));
    $('[data-id="kanji_meanings"]').text(percent(wkstats.accuracy.kanji.meanings));
    $('[data-id="kanji_total"]').text(percent(wkstats.accuracy.kanji.total));
    $('[data-id="vocabulary_readings"]').text(percent(wkstats.accuracy.vocabulary.readings));
    $('[data-id="vocabulary_meanings"]').text(percent(wkstats.accuracy.vocabulary.meanings));
    $('[data-id="vocabulary_total"]').text(percent(wkstats.accuracy.vocabulary.total));
  }

  function populate_levelups() {
    $('[data-id="time_on_level"]').text(duration(wkstats.level_durations[wkof.user.level]));
  }

  function populate_averages() {
    let typical_levelup = wkstats.median_level_duration;
    $('[data-id="typical_levelup"]').text(duration(typical_levelup));

    let typical_levelup_in = typical_levelup - wkstats.level_durations[wkof.user.level];
    let fastest_levelup_in = 0;

    let levelup_in = Math.max(typical_levelup_in, fastest_levelup_in);
    $('[data-id="levelup_in"]').text(duration(levelup_in));

    if (wkof.user.restarted_at) {
      $(".restart_date").prop("hidden", false);
      $('[data-id="restart_date"]').text(
        yyyymmdd(wkof.user.restarted_at) + " (" + days_ago(wkof.user.restarted_at) + ")",
      );
    }
  }
})();
