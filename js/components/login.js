(function () {
  document.title = "wkstats: Login";

  if (wkof.user) return nav.go("/progress/dashboard");

  document.querySelector(".apikey-dialog button.submit").addEventListener("click", function (e) {
    var apikey = document.querySelector(".apikey-dialog input.apikey").value.replace(/(^\s*|\s*$)/g, "");
    if (wkof.Apiv2.is_valid_apikey_format(apikey)) {
      localStorage.setItem("apiv2_key", apikey);

      // Tell the framework we have an API key ready to try.
      wkof.set_state("wkof.Apiv2.key", "retry");
    } else {
      set_error("Invalid API key format!");
    }
    return false;
  });

  function set_error(message) {
    document.querySelector(".apikey-dialog note.error").innerText = message;
  }

  wkof.wait_state("wkof.Apiv2.key", "error", error);
  wkof.wait_state("wkof.Apiv2.key", "ready", ready);

  function error() {
    var error = wkof.get_state("wkof.Apiv2.key.error");
    set_error(error);
  }

  function ready() {
    set_error("");
  }
})();
