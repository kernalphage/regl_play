exports.keys = [];

var _ = require('lodash');

exports.finishFrame = function(){
	exports.keys.forEach((k) => {
		k.pressed = false;
		k.released = false;
	});
};

exports.getKey = function(kcode){
	if(! exports.keys[kcode]){
		exports.keys[kcode] = _makeButton();
	}
	return exports.keys[kcode];
};

exports.debugRender = function(buffer){
	buffer.push("input");
	_.forEach(exports.keys,
		function(key, index){
			curkey = exports.keys[index];
			if(curkey && (curkey.pressed || curkey.released || curkey.down))
				buffer.log(curkey);
		}
	);
	buffer.pop();
};

function _makeButton(kcode){
	return {kcode: kcode, down: false, pressed: false, released: false};
};

window.addEventListener('keydown', function keyEvent(event){
	let kcode = event.keyCode;
	if(! exports.keys[kcode]){
		console.log("Making key " + kcode);
		exports.keys[kcode] = _makeButton(kcode);
	}
	exports.keys[kcode].pressed = !exports.keys[kcode].down;
	exports.keys[kcode].down = true;
});

window.addEventListener('keyup', function keyEvent(event){
	let kcode = event.keyCode;
	if(! exports.keys[kcode]){
		exports.keys[kcode] = _makeButton(kcode);
	}
	exports.keys[kcode].released = exports.keys[kcode].down;
	exports.keys[kcode].down = false;
});
