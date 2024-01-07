// ==UserScript==
// @name         Hjjoi
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Something new,something interesting,something out of imagation
// @author       0hoster
// @match        https://*.hjjoi.com/*
// @icon         https://hjjoi.com/favicon.ico
// @grant        none
// ==/UserScript==
(function () {
	'use strict';

	function get(key, def) {
		if (localStorage.getItem(key)) {
			return localStorage.getItem(key);
		} else {
			return def;
		}
	}
	function set(key, value) {
		localStorage.setItem(key, value);
	}
	let path = window.location.href;
	function main() {
		let IS_PROBLEM = (path.search('training') != -1 || path.search('contest') != -1) && path.search('problem') != -1 && path.search('login?') == -1;
		if (IS_PROBLEM) {
			showDetail();
		}	//mouseKey();
	}
	function showDetail() {
		let Quz;
		let path = window.location.pathname;
		let infobar = document.querySelector('div.ant-card:nth-child(2) > div:nth-child(1)');
		infobar.innerHTML = `<div class="ant-space-item"><button type="button" class="ant-btn ant-btn-default ant-btn-block"><span>&lt;Loading...&gt;</span></button></div>`;

		let xmlhttp = new XMLHttpRequest();
		xmlhttp.open('GET', `/api${path.replace('training', 'contest')}`, false);
		xmlhttp.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
		xmlhttp.send();
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			let dataQuz = JSON.parse(xmlhttp.responseText);
			let data_ = JSON.parse(dataQuz.judgeConfig.judgeConfigJson);
			Quz = {
				'type': dataQuz.judgeConfig.judgeType,
				'case': dataQuz.judgeConfig.caseSensitive == 'true' ? 'It checks case.' : "It doesn't check."
			};
			if (Quz.type == 'VJudge') {
				Quz.platform = data_.platform;
				switch (data_.platform) {
					case "luogu": // www.luogu.com.cn
						Quz.quz = `https://www.luogu.com.cn/problem/${data_.problemId}`;
						break;
					case "codeforces": // codeforces.com
						Quz.quz = `https://codeforces.com/problemset/problem/${data_.problemId.slice(0, data_.problemId.length - 1)}/${data_.problemId[data_.problemId.length - 1]}`;
						break;
					case "atcoder": // atcoder.jp
						Quz.quz = `https://atcoder.jp/contests/${data_.problemId.slice(0, data_.problemId.length - 2)}/tasks/${data_.problemId}`;
						break;
					case "vjudge": // vjudge.net
						Quz.quz = `https://vjudge.net/problem/${data_.problemId}`;
						break;
				}
				if (get("openSource", "N") != "N") {
					window.open(Quz.quz);
				}
			}
			else if (Quz.type == 'Traditional') {
				Quz.score = data_.subtasks[0].scoringType;
			}
		} else {
			infobar.innerHTML = `<div class="ant-space-item"><button type="button" class="ant-btn ant-btn-primary ant-btn-block" onclick="location.reload();" title="点击刷新"><span>Request Error(￣.￣)</span></button></div>`;
			return;
		}

		xmlhttp.open('GET', `https://hjjoi.com/api/submissions?page=1&pageSize=10&searchContestDisplayId=${path.match(/(?<=\/)[A-Z]\d+(?=\/)/)[0]}&searchProblemDisplayId=${path.match(/(?<=\/)\w+$/)[0]}`, false);
		xmlhttp.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
		xmlhttp.send();
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			let dataQuz = JSON.parse(xmlhttp.responseText);
			Quz.all = dataQuz.total;
		}

		xmlhttp.open('GET', `https://hjjoi.com/api/submissions?page=1&pageSize=10&searchContestDisplayId=${path.match(/(?<=\/)[A-Z]\d+(?=\/)/)[0]}&searchProblemDisplayId=${path.match(/(?<=\/)\w+$/)[0]}&status=Accepted`, false);
		xmlhttp.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
		xmlhttp.send();
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			let dataQuz = JSON.parse(xmlhttp.responseText);
			Quz.ac = dataQuz.total;
		}

		Quz.can_ac = Quz.all != 0 ? `${Math.round(Quz.ac * 10000 / Quz.all) / 100}%` : 'No data';
		Quz.parent = `https://hjjoi.com/contest/${path.match(/(?<=\/)[A-Z]\d+(?=\/)/)[0]}`;
		console.info(Quz);
		infobar.innerHTML = '';
		for (let key in Quz) {
			var value = Quz[key];
			let title, description;
			switch (key) {
				case 'type':
					title = 'Type';
					description = "What kind of mode is used to judge your program."
					break;
				case 'case':
					title = 'A/a';
					description = `If so, "YES"!="yes".`;
					break;
				case 'score':
					title = 'Point';
					description = "Hope it is 100. ('o')/";
					break;
				case 'all':
					title = 'Record';
					value = `<span style="green">${Quz.ac}</span> &frasl; ${Quz.all}&rarr;${Quz.can_ac}`
					description = `${Quz.ac} passed, ${Quz.all} posted...\nHow about you?`;
					break;
				case 'quz':
					title = `<span id="source" title="You can change the behavior of \nauto-open by right click.\nNow: ${get("openSource", "N")=="N"?"Off":"On"}">Source</span>`;
					value = `<a href="${Quz[key]}" target="_blank">${Quz.platform}`;
					description = "HJJ copied other platform's problem...";
					break;
			}
			if (title != undefined) {
				let bar = `<div class="ant-space-item"><div class="ant-row ant-row-no-wrap" style="row-gap: 0px;">
                    <div style="flex: 0 0 auto; min-width: 0px;" class="ant-col">
                    <span class="ant-typography">${title}</span></div>
                    <div style="flex: 1 1 auto; min-width: 0px;" class="ant-col">
                    <div class="description-content" title="${description}">${value}</div></div></div></div>`;
				infobar.innerHTML += bar;
			}
		}

		let source = document.querySelector('#source');
		infobar.addEventListener('contextmenu', function (e) {
			if (get("openSource", "N") == "N") set("openSource", "Y");
			else set("openSource", "N");
			e.preventDefault();
		});
	}
	function mouseKey() {
		let infobar = document.querySelector('.ant-col-18');
		infobar.addEventListener('contextmenu', function (e) {
			window.location.replace(`https://hjjoi.com/contest/${window.location.pathname.match(/(?<=\/)[A-Z]\d+(?=\/)/)[0]}`);
			e.preventDefault();
		});
		infobar.addEventListener('mousedown', function (e) {
			if (e.button == 1) {
				let code = getClipboardContents();
				console.log(code);
			}
			e.preventDefault();
		});
	}
	async function getClipboardContents() {
		console.info(navigator.clipboard);
		try {
			const text = await navigator.clipboard.readText();
			return text;
		} catch (err) {
			console.error('Failed to read clipboard contents: ', err);
			return 'E';
		}
	}
	//====================================================END=======================================================//
	main();
	function check_reload() {
		if (path != window.location.href) {
			path = window.location.href;
			main();
		}
	}
	setInterval(check_reload, 1800);	// Your code here...
}());