(function () {
  document.title = "wkstats: Projections";

  if (!wkof.user) return nav.login();

  wkof.load_script(wkof.support_files["calc_projections.js"], true);
  wkof.ready("wkstats.projections").then(populate_projections);

  //================================================
  function populate_projections() {
    wkof.trigger("wkstats.projections.loaded");
    for (let level = 1; level <= wkof.user.subscription.max_level_granted; level++) {
      console.log(level + ": " + project_level(level).date);
    }
  }
})();
