exports.keys = [];

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
}


function _makeButton(){
	return {down: false, pressed: false, released: false};
};

window.addEventListener('keydown', function keyEvent(event){
	let kcode = event.keyCode;
	if(! exports.keys[kcode]){
		exports.keys[kcode] = _makeButton();
	}
	exports.keys[kcode].pressed = !exports.keys[kcode].down;
	exports.keys[kcode].down = true;
});

window.addEventListener('keyup', function keyEvent(event){
	let kcode = event.keyCode;
	if(! exports.keys[kcode]){
		exports.keys[kcode] = _makeButton();
	}
	exports.keys[kcode].released = exports.keys[kcode].down;
	exports.keys[kcode].down = false;
});