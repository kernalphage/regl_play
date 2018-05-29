const kernal = {

	rangeMap : function(t, inStart, inEnd, outStart, outEnd, easing = null){
		if(! easing ) easing = x=>x;
		out = t - inStart;
		out /= (inEnd - inStart); // [0,1]
		out = easing(out);
		out *= (outEnd - outStart);
		return out + outStart;
	},

	mix: function(a, b, t){
		return a * t + b * (1-t);
	}
}

module.exports.kernal = kernal;