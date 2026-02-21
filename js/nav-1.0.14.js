// ==UserScript==
// @version     1.0.14
// @copyright   2018+, Robin Findley
// ==/UserScript==

(function(gobj) {

	var nav = {
		go: go,
		login: login,
	};
	gobj.nav = nav;
	nav.no_cache = true;

	var versions = {
		'/404':                  '1.0.0',
		'/login':                '1.0.1',

		'/progress/dashboard':   '1.0.1',
		'/progress/level-up':    '1.0.1',
		'/progress/projections': '1.0.1',

		'/items/wanikani':       '1.0.10',
		'/items/jlpt':           '1.0.5',
		'/items/joyo':           '1.0.5',
		'/items/frequency':      '1.0.5',

		'/charts/jlpt':          '1.0.2',
		'/charts/joyo':          '1.0.2',
		'/charts/frequency':     '1.0.2',
		'/charts/reading':       '1.0.3',
	};

	window.onpopstate = go_back;
	if (location.pathname.match(/^\/charts\//) !== null) {
		wkof.ready('Settings').then(function() {
				nav.go(location.pathname);
		});
	} else {
		wkof.wait_state('wkof.Apiv2.key', 'prompt', prompt_apikey);
	}

	function login() {
		nav.after_login = location.pathname;
		if (nav.after_login === '/login') nav.after_login = '/progress/dashboard';
		nav.go('/login');
	}

	function go(path, options) {
		if (!options) options = {};
		var title = document.title;
		var url = '/components'+path+'-'+versions[path]+'.html';
		console.clear();
		load_content('section.main-content', url)
		.then(function(){
			if (options.history_url) path = options.history_url;
			history.pushState({path:path}, document.title, path);
		})
		.catch(function() {
			if (path !== '/404.html') nav.go('/404', {history_url: path});
		})
	}

	function go_back(e) {
		if (!e.state) return;
		var path = e.state.path;
		var url = '/components'+path+'.html';
		load_content('section.main-content', url);
	}

	function load_content(selector, url) {
		let use_cache = (nav.no_cache !== true);
		return wkof.load_file(url, use_cache).then(function(html){
			var elem = document.querySelector(selector);
			elem.innerHTML = html;

			// Scripts don't run when injected into innerHTML.
			// We need to re-add them as new script tags.
			var scripts = elem.querySelectorAll('script');
			for (var script_idx = 0; script_idx < scripts.length; script_idx++) {
				var node = scripts[script_idx]
					var script = document.createElement('script');
				script.text = node.innerHTML;
				for (var attr_idx = node.attributes.length-1; attr_idx >= 0; attr_idx--) {
					script.setAttribute(node.attributes[attr_idx].name, node.attributes[attr_idx].value);
				}
				node.parentNode.replaceChild(script, node);
			}
		});
	}

	function prompt_apikey() {
		nav.login();
	}

	$('nav.navbar').on('click', '.ilink', process_link_click);
	function process_link_click(e) {
		e.preventDefault();
		var path = e.target.getAttribute('href');

		switch (path) {

			case '/refresh':
				console.log('Refreshing data...');
				location.pathname = location.pathname;
				break;

			case '/logout':
				console.log('Logging out...');
				if (wkof.settings.progress) wkof.settings.progress.excluded_levels = [];
				wkof.Settings.save('progress')
				.then(wkof.Apiv2.clear_cache)
				.then(function(){
					delete localStorage.apiv2_key;
					delete wkof.user;
					location.href = '/';
				});
				break;

			default:
				var title = e.target.text;
				nav.go(path, title);
				e.preventDefault();
				break;
		}
	}

})(window);

