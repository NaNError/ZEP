const poop = App.loadSpritesheet("suragi.png");
let tomb = App.loadSpritesheet("oops.png", 32, 48, {
	left: [0],
	right: [0],
	up: [0],
	down: [0],
});

const STATE_INIT = 3000;
const STATE_READY = 3001;
const STATE_PLAYING = 3002;
const STATE_JUDGE = 3004;
const STATE_END = 3005;
const STATE_INTRO = 3006;

let _level = 1;
let _levelTimer = 15;
let _levelAddTimer = 0;

let _start = false;
let _ending = false;
let _timer = 5;

let _poops = [];
let _stateTimer = 0;

let _genTime = 0;
let _dropTime = 0;
let _flushTime = 0;

let _viewPlayer = false;
let _viewTimer = 1;
let _viewAddTimer = 0;

let _live = 0;
let _liveList = "";

let _widget = null;
let _widget2 = null;
let _players = App.players;

let HEIGHT_KEY = 10000000;
let _areaPoint = {};

let poopkeys = [];

// CustomLabel을 span 태그로 스타일을 지정해출력하는 함수
function customShowLabelWithRadius(player, str, width, radius) {
	if (player) {
		if (player.isMobile) {
			width = 100;
		}
	}
	// span 태그
	let spanStyle = `<span style="
			position: absolute;
			margin: auto;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 10px;
			width: ${width}%;
			top: 200px;
			left: ${(100 - width) / 2}%;
			background-color: rgba(0, 0, 0, 0.6);
			flex-direction: column;
			border-radius: ${radius}px;">`;

	let res = spanStyle + str + "</span>";
	if (player) {
		player.showCustomLabel(res, 0xffffff, 0x000000, -150, 100, 1);
	} else {
		App.showCustomLabel(res, 0xffffff, 0x000000, -150, 100, 1);
	}
}

// 모든 플레이어에게 라벨을 출력하는 함수
function showLabel(str) {
	for (let i in _players) {
		let p = _players[i];
		customShowLabelWithRadius(p, str, 40, 14);
	}
}

function startState(state) {
	_state = state;
	_stateTimer = 0;

	if (_widget) {
		_widget.destroy();
		_widget = null;
	}

	switch (_state) {
		case STATE_INTRO:
			// 게임시작 라벨 및 사운드 출력
			showLabel("\n 미니게임 - 똥피하기 \n\n");
			App.playSound("intro.ogg");

			// 게임시작 변수(_start)를 true로 변경
			_start = true;
			break;

		case STATE_INIT:
			// 게임 목표 라벨 출력 및 게임 변수 초기화
			showLabel("- 게임목표 - \n\n 위에서 떨어지는 똥을 피해 마지막까지 생존하세요 \n\n ( 잠시 후 게임이 시작됩니다 )");

			_stateTimer = 0;
			_genTime = 0;
			_dropTime = 0;
			_timer = 90;

			for (let i in _players) {
				let p = _players[i];
				p.tag = {
					alive: true,
				};
			}
			break;

		case STATE_PLAYING:
			break;

		case STATE_JUDGE:
			// 최종 생존자 라벨 출력
			Map.clearAllObjects();
			App.playSound("result.ogg", false);

			if (_live == 1) {
				showLabel(`- 최종 생존자는 - \n\n ${lastSurvivor.name}`);
			} else if (_live == 0) {
				showLabel(`생존자가 없습니다.`);
			} else {
				showLabel(`- 최종 생존자는 - \n\n ${_liveList}`);
			}

			break;

		case STATE_END:
			// 게임시작 변수(_start)를 false로 변경, 모든 플레이어의 속도 80, 스프라이트를 null(기본상태)로 변경
			_start = false;
			for (let i in _players) {
				let p = _players[i];
				p.sprite = null;
				p.moveSpeed = 80;
				p.sendUpdated();
			}
			App.stopSound(); // 사운드 Off
			break;
	}
}

App.onInit.Add(function () {
	if (_widget) {
		_widget.destroy();
		_widget = null;
	}
});

App.onStart.Add(function () {
	startState(STATE_INTRO);
});

App.onJoinPlayer.Add(function (p) {
	// 게임이 시작 된 후 새로운 플레이어가 입장하면 탈락으로 처리
	if (_start) {
		p.tag = {
			alive: false,
		};

		p.moveSpeed = 20;
		p.sprite = tomb;
		p.sendUpdated();
	} else {
		p.moveSpeed = 80;
		p.sprite = null;
		p.sendUpdated();
	}
	_players = App.players;
});

// 플레이어가 나갈 때 sprite title moveSpeed 초기화
App.onLeavePlayer.Add(function (p) {
	p.title = null;
	p.sprite = null;
	p.moveSpeed = 80;
	p.sendUpdated();

	_players = App.players;
});

// 똥 오브젝트에 닿았을 때
App.onAppObjectTouched.Add(function (player, key, x, y, tileID) {
	// 플레이어가 탈락하지 않은 상태일 경우 똥에 닿으면 탈락
	if (player.tag.alive) {
		_viewPlayer = true;
		_viewAddTimer = 0;
		player.tag.alive = false;
		player.sprite = tomb;
		player.moveSpeed = 20;
		player.sendUpdated();
		App.playSound("poopp.mp3");
		if (checkSuvivors() !== 1) {
			showLabel(`${player.name} 님 탈락!`);
		}
	}
});

// 생존자 수를 체크하는 자바스크립트 일반 함수
function checkSuvivors() {
	if (!_start) return;

	let alive = 0;
	for (let i in _players) {
		let p = _players[i];
		if (!p.sprite) {
			lastSurvivor = p;
			++alive;
		}
	}
	return alive;
}

// 최종 생존자의 이름을 _liveList에 추가하는 자바스크립트 일반 함수
function broardCastingSuvivors() {
	if (!_start) return;
	_liveList = "";
	for (let i in _players) {
		let p = _players[i];
		if (p.tag.alive) {
			_liveList += p.name + " ";
		}
	}
}

// 게임 종료 블록을 눌렀을 때
App.onDestroy.Add(function () {
	// 스크립트로 설치한 모든 오브젝트 제거
	Map.clearAllObjects();

	if (_widget) {
		_widget.destroy();
		_widget = null;
	}
	// 사운드 전체 Off
	App.stopSound();
});

App.onUpdate.Add(function (dt) {
	if (!_start) return;

	_stateTimer += dt;
	switch (_state) {
		case STATE_INTRO:
			// STATE_INTRO 상태에서 3초동안 똥피하기 인트로 라벨을 보여주고 STATE_INIT 로직 실행
			if (_stateTimer >= 3) {
				startState(STATE_INIT);
			}
			break;
		case STATE_INIT:
			// STATE_INIT 상태에서 3초동안 게임 목표 라벨을 보여주고 STATE_INIT 로직 실행
			if (_stateTimer >= 3) {
				startState(STATE_PLAYING);
			}
			break;

		case STATE_PLAYING:
			// 탈락 메시지를 표시중이지 않을 때 라벨을 표시하도록 처리
			if (!_viewPlayer) {
				if (_level < 6) {
					showLabel(`- 레벨 ${_level} - \n ${_timer} 초`);
				} else {
					showLabel(`- 최고레벨 - \n ${_timer} 초`);
				}
			}
			_genTime -= dt;
			let poopkey;
			if (_genTime <= 0) {
				// 오브젝트 생성주기(genTime)가 똥피하기 난이도 단계(_level)에 따라 짧아짐
				_genTime = Math.random() * (0.5 - _level * 0.05);
				let rand_X = Math.floor(Map.width * Math.random());

				// 똥 오브젝트의 key 값 생성
				poopkey = new Date().getTime() + Math.random();
				poopkeys.push(poopkey);

				// 똥피하기 난이도 단계(_level)에 따라 똥의 이동속도가 증가
				Map.putObjectWithKey(rand_X, 0, poop, {
					overlap: true,
					movespeed: 80 + _level * 10,
					key: poopkey,
				});

				// 똥 오브젝트를 맵 끝으로 이동
				Map.moveObjectWithKey(poopkey, rand_X, Map.height - 1, false);
			}

			//_flushTime(3초) 마다 맵 하단에 쌓인 똥 오브젝트를 삭제
			_flushTime += dt;
			if (_flushTime >= 3) {
				_flushTime = 0;
				for (let i = 0; i < poopkeys.length; i++) {
					let key = poopkeys[i];
					if (Map.getObjectWithKey(key).tileY == Map.height - 1) {
						Map.putObjectWithKey(Map.getObjectWithKey(key).tileX, Map.height - 1, null, {
							key: key,
						});
						poopkeys.splice(i--, 1);
					}
				}
			}

			// _levelTimer(15초) 마다 난이도 단계가 1씩 증가
			_levelAddTimer += dt;
			if (_levelAddTimer >= _levelTimer) {
				_level++;
				_levelAddTimer = 0;

				// 최고 난이도 단계를 6으로 제한
				if (_level > 6) {
					_level = 6;
				}
			}

			// 생존자 수 체크 함수 호출
			_live = checkSuvivors();

			// 생존자 수 가 1명 또는 0명일 경우 게임 종료 로직 실행
			if (_live == 1 || _live == 0) {
				startState(STATE_JUDGE);
			} else {
				if (_stateTimer >= 1) {
					_stateTimer = 0;
					_timer--;
					// 시간(_timer)변수가 0이 되면 최종 생존자 발표
					if (_timer <= 0) {
						broardCastingSuvivors();
						startState(STATE_JUDGE);
					}
				}
			}

			// 플레이어가 탈락 한 경우 1초 동안 탈락 메시지를 보여주고 _viewPlayer를 false로 변경
			if (!_viewPlayer) {
			} else {
				_viewAddTimer += dt;
				if (_viewAddTimer >= _viewTimer) {
					_viewAddTimer = 0;
					_viewPlayer = false;
				}
			}
			break;

		case STATE_JUDGE:
			// STATE_JUDGE 상태에서 5초 동안 최종 생존자 라벨을 보여준 뒤 게임 종료로직 실행
			if (_stateTimer >= 5) {
				startState(STATE_END);
			}
			break;
		case STATE_END:
			break;
	}
});