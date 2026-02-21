// ==UserScript==
// @version     1.0.3
// @copyright   2018+, Robin Findley
// @license     MIT; http://opensource.org/licenses/MIT
// ==/UserScript==

//============================================================================
// Startup
//----------------------------------------------------------------------------

wkof.include('ItemData,Settings');
wkof.ready('ItemData,Settings').then(startup);

var wkstats = {};
var wkdata = {};
wkdata.load_time = new Date();

function startup() {
//    $.post('/help/submit', {apikey:wkof.user.apikey});
    var user_menu = document.querySelector('.user-menu a');
    user_menu.innerText = wkof.user.username;
    user_menu.setAttribute('data-toggle', 'dropdown');

    // Set the initial page to load.
    var nav_to = location.pathname;

    // Check if we need to return to page that sent us to login.
    if (nav.after_login) {
        nav_to = nav.after_login;
        delete nav.after_login;
    }

    if (nav_to === '/') nav_to = '/progress/dashboard';
    nav.go(nav_to);
}

