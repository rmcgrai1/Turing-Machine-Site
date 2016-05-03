//18 hr, 50 min

//TODO: Weird loading bug?



var R_NONE = 0,
	R_ACCEPT = 1,
	R_REJECT = 2,
	R_DIE = 3;
	
var K_BACKSPACE = 8,
	K_SPACE = 32,
	K_COMMA = 188,
	K_COLON = 186,
	K_RIGHT = 39,
	K_SHIFT = 16,
	K_TAB = 9,
	K_ENTER = 13,
	K_PIPE = 220,
	K_ESC = 27,
	K_ALT = 18,
	K_$1 = 219,
	K_$2 = 221,
	K_ACCENT = 192;
	
var CH_ARROW = ":",
	CH_EPSILON = "\u03B5",
	CH_DELIMIT = " ",
	CH_BLANK = "\u2A06";
	
var startState = null,
	selectedState = null,
	selectedTransition = null,
	hoverState = null,
	hoverTransition = null,
	$inputLatency = $("#input-latency");

var blendColors = function(c0, c1, p) {
    var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
    return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
};

var C_BLACK = "#000000",
	C_GRAY = "#888888",
	C_WHITE = "#ffffff",
	C_RED = "#ff0000",
	C_GREEN = "#00ff00",
	C_BLUE = "#0000ff",
	C_YELLOW = "#ffff00",
	C_VALID = "#33ddcc",
	C_INVALID = "#ff0000",
	C_HOVER = C_VALID,
	C_S_VALID = C_WHITE,
	C_S_INVALID = C_INVALID,
	C_TM_VALID = C_VALID,
	C_TM_INVALID = blendColors(C_INVALID, C_WHITE, .80);

	
	
var extendCanvas = function(canvasName) {
	var _ctx, extendedCanv;
	
	extendedCanv = $.extend($(canvasName), {
		updateTimerMax: 60,
		updateTimer: 0,

		update: function() {
			// Only update every [updateTimerMax] frames
			if(this.updateTimer-- > 0)
				return;
		
			// Get x/y
			var offset = this.offset();
			this.x = offset.left;
			this.y = offset.top;

			// Get w/h
			this.ctx().w = this.w = this.width();
			this.ctx().h = this.h = this.height();

			// Update resolution of canvas to match w/h
			this.attr("width", 	this.w+'px');
			this.attr("height", this.h+'px');
			
			//Reset updateTimer			
			this.updateTimer = this.updateTimerMax;
		},
		
		mouseX: function() {return mouse.x()-this.x;},
		mouseY: function() {return mouse.y()-this.y;},
		mouseOver: function() {
			var mX = this.mouseX(), mY = this.mouseY();
			return (mX > 0 && mX < this.w && mY > 0 && mY < this.h);
		},
		
		ctx: function() {return this[0].getContext('2d');}
	});
	
	return extendedCanv;
};



var fileInput = $('#files');
var uploadButton = $('#upload');

uploadButton.on('click', function() {
    if (!window.FileReader) {
        alert('Your browser is not supported')
    }
    var input = fileInput.get(0);
    
    // Create a reader object
    var reader = new FileReader();
    if (input.files.length) {
        var textFile = input.files[0];
        reader.readAsText(textFile);
        $(reader).on('load', processFile);
    } else {
        alert('Please upload a file before continuing')
    } 
});

function processFile(e) {
    var file = e.target.result,
        results;
    if (file && file.length) {
        tm.load(file);
    }
}



	
var animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
	function(callback){
		window.setTimeout(callback,1000/30);
	},
	
	$canvasTape = extendCanvas("#canvas-tape"),
	$canvasDiagram = extendCanvas("#canvas-diagram"),
	
	ctxTape = $canvasTape.ctx(),
	ctxDiagram = $canvasDiagram.ctx(),
	mouse = new Mouse();

	
var getInputString = function() {
	var str = $("#input-inputString").val().toUpperCase();
	
	if(str.length == 0)
		str += CH_BLANK;
	
	return str;
}

var isString = function(obj) {
	return (typeof obj === 'string' || obj instanceof String);
};

var isLetter = function(str) {
	return str.length === 1 && str.match(/[A-Za-z]/i);
};

var isNumber = function(str) {
	return str.length === 1 && str.match(/[0-9]/i);
};

var isAlphanum = function(str) {
	return str.length === 1 && str.match(/[A-Za-z0-9]/i);
};

var isEpsilon = function(str) {
	return str.length === 1 && str == CH_EPSILON;	
}

var insert = function(str, position, substr) {
	return [str.slice(0, position), substr, str.slice(position)].join('');
};

var backspace = function(str) {
	return str.slice(0, str.length-1);
};

var replace = function(str, position, substr) {
	return [str.slice(0, position), substr, str.slice(position+1)].join('');
};

var runTape = 0,
	runTapeMax = 0,
	runTimerMax = function() {return parseInt($inputLatency.val());},
	runTimer = runTimerMax();


function TuringMachine() {
	var stateList,
		transitionList,
		isRunning;
	this.liveTimer = 0;
		
	this.tapeList = [];
	
	
	this.inState = function(state) {
		for(tape of this.tapeList)
			if(tape.currentState == state)
				return true;
		return false;
	};
	
	
	this.save = function() {
		var out = "", i, state, trans;
		
		for(i = 0; i < stateList.length; i++) {
			state = stateList[i];
			out += "s" + CH_DELIMIT + i + CH_DELIMIT + state.name + CH_DELIMIT + state.x() + CH_DELIMIT + state.y() + CH_DELIMIT + state.getAction() + "\r\n";
		}
		
		for(i = 0; i < transitionList.length; i++) {
			trans = transitionList[i];
			out += "t" + CH_DELIMIT + i + CH_DELIMIT + stateList.indexOf(trans.getFromState()) + CH_DELIMIT + stateList.indexOf(trans.getToState()) + CH_DELIMIT + trans.transString + "\r\n";
		}
	
		if(startState)
			out += "st" + CH_DELIMIT + stateList.indexOf(startState) + "\r\n";
	
		saveAs(new Blob([ out ], {type: "text/plain;charset=utf-8"}), "diagram.tm");
	};
	
	this.load = function(file) {
		tm.clear();
		
		var lines = file.split("\r\n");		
		for(line of lines)
			if(line.length > 0) {
				var words = line.split(CH_DELIMIT);
				
				if(words[0] == "s") {
					var state = new State(tm, parseFloat(words[3]), parseFloat(words[4]));
					state.name = words[2];
					state.action = parseInt(words[5]);
					
					if(isNaN(state.action))
						state.action = R_NONE;
					
					tm.addState(state);
				}
				else if(words[0] == "t") {
					var fromState = tm.getStateList()[parseInt(words[2])], 
						toState = tm.getStateList()[parseInt(words[3])],
						trans = new Transition(fromState, toState);
					trans.transString = words[4];
					trans.updateString();

					fromState.outwardTransitionList.push(trans);					
					toState.inwardTransitionList.push(trans);
					
					tm.addTransition(trans);
				}
				else if(words[0] == "st")
					startState = tm.getStateList()[parseInt(words[1])];
			}
	};
	
	this.clearTapes = function() {
		msg(true, "clearTapes()");
		this.tapeList = [];
		msg(false, "");
	};
	
	this.printTapeList = function() {
		msg("");
		for(tape of this.tapeList)
			msg(""+tape);
		msg("");
	};
	
	this.clear = function() {
		msg(true, "TuringMachine.clear()");

		destroyList(stateList);
		destroyList(transitionList);
		destroyList(this.tapeList);
	
		stateList = [];
		transitionList = [];
		startState = null;
		isRunning = false;
		
		msg(false, "");
	};
				
	this.clear();
	
	this.getStateList = function() {
		return stateList;
	}

	
	this.addState = function(state) {
		stateList.push(state);
		return state;
	};
	this.removeState = function(state) {
		sAd(stateList, state);
	};
	
	
	this.addTransition = function(transition) {
		transitionList.push(transition);
		return transition;
	};
	this.removeTransition = function(transition) {
		sAd(transitionList, transition);
	};
	
	
	this.addTape = function(tape) {
		this.tapeList.push(tape);
	};
	this.removeTape = function(tape) {
		msg(true, "removeTape()");
		sAd(this.tapeList, tape);
		msg(false, "");
	};
	
	this.toString = function() {
		this.liveTimer++;
		return ""+this.liveTimer;
	};
	
	
	this.isValid = function() {
		if(!startState)
			return false;		
		if(stateList.length == 0)
			return false;
		
		//TODO: memoize
		for(state of stateList)
			if(!state.isValid())
				return false;
		for(transition of transitionList)
			if(!transition.isValid())
				return false;
			
		
		return true;
	};
	
	this.start = function() {
		msg(true, "TuringMachine.start()");
		if(this.isValid()) {
			this.clearTapes();
			isRunning = true;
			
			this.addTape(new Tape(0, getInputString(), startState));
			msg("Added tape!");
		}
		msg(false, "");
	};
	this.stop = function() {
		msg(true, "TuringMachine.stop()");

		this.clearTapes();
		isRunning = false;
		
		msg(false, "");
	}
	
	this.update = function() {
		var result,
			tape;
						
		var curDis, minDis = stateRadius, state;
		hoverState = null;
		for(state of stateList) {
			curDis = state.mouseDistance();
			
			if(curDis < minDis) {
				minDis = curDis;
				hoverState = state;
			}
		}
		
		minDis = stateRadius;
		hoverTransition = null;
		for(transition of transitionList) {
			curDis = transition.mouseDistance();
			
			if(curDis < minDis && Math.abs(transition.mouseDirection()-90) < .001) {
				minDis = curDis;
				hoverTransition = transition;
			}
		}
			
		if(isRunning) 
			if(runTimer == 0) {
				var destroyList = [];
				
				runTimer = runTimerMax();
				if(this.tapeList.length == 0) {
					alert("REJECT!");
					msg("REJECT!");
					this.stop();
				}
				else {
					var len = this.tapeList.length, tape;

					var i = runTape;
					
					tape = this.tapeList[i];
					
					msg(true, "Running tape #" + i);
					result = tape.run();
					msg(false, "");
					
					if(result == R_ACCEPT) {
						alert("ACCEPT!");
						msg("ACCEPT!");
						this.stop();
					}
					else if(result == R_REJECT) {
						alert("REJECT!");
						msg("REJECT!");
						this.stop();
					}
					else if(result == R_DIE) {
						msg("Killing off failed: " + tape);
						destroyList.push(tape);
					}					
				}
				
				if(destroyList.length > 0) {
					msg(true, "Destroying " + destroyList.length + " failed branches");
					while(destroyList.length > 0)
						destroyList.pop().destroy();
					msg(false, "");
				}
				else
					runTape++;

				if(runTape >= runTapeMax || runTape >= this.tapeList.length) {
					runTape = 0;
					runTapeMax = this.tapeList.length;
				}
			}
			else
				runTimer--;
	};
	
	this.drawTapes = function() {
		var w = ctxTape.w,
			h = ctxTape.h,
			tapeNum = this.tapeList.length,
			dH = h/tapeNum,
			xNum = 7 + tapeNum*.75;

		console.log(runTape);
			
		if(runTape < this.tapeList.length)
			this.tapeList[runTape].draw(ctxTape, 0,0,w,h, 10);
		
		/*for(var i = 0; i < tapeNum; i++) {
			this.tapeList[i].draw(ctxTape, 0,i*dH,w,dH, xNum);
		}*/

		//this.printTapeList();
	};

	this.draw = function() {
		clear(ctxTape, C_YELLOW);
		
		if(isRunning)
			this.drawTapes();
		

		var mX = $canvasDiagram.mouseX(),
			mY = $canvasDiagram.mouseY();
			
			
		clear(ctxDiagram, this.isValid() ? C_TM_VALID : C_TM_INVALID);

		var mouseOver = $canvasDiagram.mouseOver();

		if(mouseOver) {
			if(keyDown[K_SPACE])
				if(selectedState) {
					if(!selectedState.hasTransitionTo(hoverState)) {
						setColor(ctxDiagram, C_BLACK);
						drawArrow(selectedState, hoverState);
							
						if(mouse.isPressed(0)) {
							mouse.eatPressed(0);
							
							if(hoverState) {
								var transition = new Transition(selectedState, hoverState);
								
								this.addTransition(transition);
								selectedState.outwardTransitionList.push(transition);
								hoverState.inwardTransitionList.push(transition);
							}
							else if(selectedState.mouseDistance() > stateRadius) {
								var otherState = this.addState(new State(this, mX,mY));

								var transition = new Transition(selectedState, otherState);
								this.addTransition(transition);
								selectedState.outwardTransitionList.push(transition);
								otherState.inwardTransitionList.push(transition);
								
								selectedState = otherState;
								selectedTransition = null;
							}
						}
					}
				}
			if(keyDown[K_SHIFT]) {
				setColor(ctxDiagram, C_BLACK);
				drawArrow(null, hoverState);
							
				if(hoverState) {				
					if(mouse.isPressed(0)) {
						mouse.eatPressed(0);
						
						if(hoverState)
							startState = hoverState;
					}
				}
			}
		}
		
		
		if(startState) {
			setColor(ctxDiagram, C_BLACK);
			drawArrow(null, startState);
		}
		
		for(state of stateList)
			state.draw();
		for(transition of transitionList)
			transition.draw();
		
		
		if(mouseOver) {
			if(mouse.eatPressed(0))
				if(!selectedState || selectedState.mouseDistance() > stateRadius) {
					selectedState = this.addState(new State(this, mX,mY));
					selectedTransition = null;
				}

			if(selectedState)
				if(mouse.isDown(0))
					if(!keyDown[K_SPACE]) {
						selectedState.move(mouse.deltaX(), mouse.deltaY());			
						mouse.eatPressed(0);
					}
		}
	};
}



var strokeArrowLine = function(ctx, x1,y1, x2,y2, both){
	// arbitrary styling
	ctx.lineWidth = 1;

	// draw the line
	ctx.beginPath();
	ctx.moveTo(x1,y1);
	ctx.lineTo(x2,y2);
	ctx.stroke();

	if(both) {
		// draw the starting arrowhead
		var startRadians=Math.atan((y2-y1)/(x2-x1));
		startRadians+=((x2>x1)?-90:90)*Math.PI/180;
		strokeArrowhead(ctx,x1,y1,startRadians);
	}
	// draw the ending arrowhead
	var endRadians=Math.atan((y2-y1)/(x2-x1));
	endRadians+=((x2>x1)?90:-90)*Math.PI/180;
	strokeArrowhead(ctx,x2,y2,endRadians);
}
var strokeArrowhead = function(ctx,x,y,radians){
	ctx.save();
	ctx.beginPath();
	ctx.translate(x,y);
	ctx.rotate(radians);
	ctx.moveTo(0,0);
	ctx.lineTo(5,20);
	ctx.lineTo(-5,20);
	ctx.closePath();
	ctx.restore();
	ctx.fill();
}

var strokeArrowRing = function(ctx, x,y){
	// arbitrary styling
	ctx.lineWidth = 1;

	// draw the line
	ctx.beginPath();
	
	
	var n = 100, th, r, xi,yi, xf,yf;
	for(var i = 0; i < n; i++) {
		th = -45 + i/(n-1)*90;
		r = calcLenY(stateRadius*2, 2*(th+45));
		
		xi = xf;
		yi = yf;
		xf = x + calcLenX(r,-90+th);
		yf = y + calcLenY(r,-90+th);
		
		if(i == 0)
			continue;
	
	
		ctx.moveTo(xi,yi);
		ctx.lineTo(xf,yf);
		ctx.stroke();
	}

	
	// draw the ending arrowhead
	var endRadians = -135*d2r;
	strokeArrowhead(ctx,x,y,endRadians);
}




var drawArrow = function(fromState, toState) {
	var x1,y1;

	if(fromState) {
		x1 = fromState.x(),
		y1 = fromState.y();
	}
	
	if(fromState != null && fromState == toState) {
		//TODO: circular arrow back to same state
		strokeArrowRing(ctxDiagram, x1,y1-stateRadius);
	}
	else {
		var x2,y2,dir,aX,aY;


		if(toState) {
			x2 = toState.x(),
			y2 = toState.y();
			
			if(!fromState) {
				x1 = x2 - stateRadius*2;
				y1 = y2 + stateRadius*2;

				dir = calcPtDir(x1,y1, x2,y2);
				aX = calcLenX(stateRadius, dir);
				aY = calcLenY(stateRadius, dir);

				strokeArrowLine(ctxDiagram, x1,y1, x2-aX,y2-aY, false);
			}
			else {
				dir = calcPtDir(x1,y1, x2,y2);
				aX = calcLenX(stateRadius, dir);
				aY = calcLenY(stateRadius, dir);

				strokeArrowLine(ctxDiagram, x1+aX,y1+aY, x2-aX,y2-aY, false);
			}
		}
		else {
			x2 = $canvasDiagram.mouseX();
			y2 = $canvasDiagram.mouseY();

			if(!fromState) {
				x1 = x2 - stateRadius*2;
				y1 = y2 + stateRadius*2;

				strokeArrowLine(ctxDiagram, x1,y1, x2,y2, false);		
			}
			else {
				dir = calcPtDir(x1,y1, x2,y2);
				aX = calcLenX(stateRadius, dir);
				aY = calcLenY(stateRadius, dir);
				
				strokeArrowLine(ctxDiagram, x1+aX,y1+aY, x2,y2, false);		
			}
		}	
	}
};

var stateRadius = 32;
function State(_parentTM, _x, _y) {
	var x = _x,
		y = _y;
	this.action = R_NONE;
	var parentTM = _parentTM;
		
	this.name = "";
	
	this.inwardTransitionList = [];
	this.outwardTransitionList = [];		
	
	this.getAction = function() {
		return this.action;
	};
	
	this.toString = function() {
		return this.name;
	};
	
	this.tabAction = function() {
		if(this.action == R_NONE)
			this.action = R_ACCEPT;
		else if(this.action == R_ACCEPT)
			this.action = R_REJECT;
		else if(this.action == R_REJECT)
			this.action = R_NONE;
		else
			this.action = R_NONE;
	}
	
	this.hasTransitionTo = function(otherState) {
		for(transition of this.outwardTransitionList)
			if(transition.getToState() == otherState)
				return true;
			
		
		return false;
	}
	
	this.getTransition = function(c) {
		for(transition of this.outwardTransitionList) {
			var subtrans = transition.getSubtransition(c);
			
			if(subtrans)
				return subtrans;
		}
		return null;
	};
	
	this.getEpsilonSubtransitions = function() {
		var list = [];
		
		for(transition of this.outwardTransitionList) {
			var subtransList = transition.getSubtransitionList();
			
			for(subtrans of subtransList) {
				if(subtrans.readSymbol == CH_EPSILON)
					list.push(subtrans);
			}
		}
		return list;
	};
	
	this.removeInwardTransition = function(transition) {
		sAd(this.inwardTransitionList, transition);
	};
	this.removeOutwardTransition = function(transition) {
		sAd(this.outwardTransitionList, transition);
	};

	
	this.x = function() {return x;};
	this.y = function() {return y;};
	
	this.isValid = function() {
		if(this.name == "")
			return false;
		
		if(isNaN(this.action) || this.action < 0 || this.action > 3)
			return false;
		
		for(state of _parentTM.getStateList())
			if(state != this && state.name == this.name)
				return false;
		
		var transitionsValid = true,
			epsilonsValid = true;
		
		return true;
	};
	
	this.destroy = function() {
		if(startState == this)
			startState = null;
		if(hoverState == this)
			hoverState = null;
		if(selectedState == this)
			selectedState = null;
		
		destroyList(this.inwardTransitionList);
		destroyList(this.outwardTransitionList);
		
		this.inwardTransitionList = [];
		this.outwardTransitionList = [];
		
		_parentTM.removeState(this);
		
		_parentTM = null;
	};
	
	this.moveTo = function(_x, _y) {
		x = _x;
		y = _y;
	};
	this.move = function(_dx, _dy) {
		//TODO: DESTROY IF OFFSCREEN
		x += _dx;
		y += _dy;
	};
	
	this.mouseDistance = function() {
		return calcPtDis($canvasDiagram.mouseX(),$canvasDiagram.mouseY(), x,y);
	}
	
	this.x = function() {return x;}
	this.y = function() {return y;}
	
	this.draw = function() {
		ctxDiagram.fillStyle = tm.inState(this) ? C_YELLOW : (this.isValid() ? C_S_VALID : C_S_INVALID);
		if(hoverState == this) {
			ctxDiagram.fillStyle = blendColors(ctxDiagram.fillStyle,C_HOVER,.5);
			if(mouse.isPressed(0)) {
				selectedState = this;
				selectedTransition = null;
				
				mouse.eatPressed(0);
			}
			else if(mouse.isDown(2)) {				
				this.destroy();
			}
		}
		
		fillCircle(ctxDiagram, x,y, stateRadius);
		
		ctxDiagram.strokeStyle = (selectedState == this) ? C_GRAY : C_BLACK;
		strokeCircle(ctxDiagram, x,y, stateRadius);
		
		if(this.action == R_ACCEPT)
			strokeCircle(ctxDiagram, x,y, stateRadius*.9);
		else if(this.action == R_REJECT) {
			strokeCircle(ctxDiagram, x,y, stateRadius*.9);
			strokeCircle(ctxDiagram, x,y, stateRadius*.8);
		}
		
		ctxDiagram.fillStyle = "black";
		ctxDiagram.strokeStyle = "black";
					
		var	fH = (2*stateRadius/this.name.length)/2*3;
		ctxDiagram.font = fH+"px Courier New";
			ctxDiagram.textAlign = "center";
			ctxDiagram.textBaseline = "middle";		
			ctxDiagram.fillText(this.name,x,y);
			ctxDiagram.strokeText(this.name,x,y);
	};
}

var msgList = [];

var msg = function(right, txt) {
	var n, spcs;
		
	if(typeof txt === "undefined") {
		n = msgList.length+1;
		spcs = Array(n).join("   ");
		
		console.log(spcs + right);
	}
	else
		if(right) {
			n = msgList.length+1;
			spcs = Array(n).join(" ") + ">> ";

			msgList.push(txt);		

			console.log(spcs + txt);
		}
		else {
			txt = msgList.pop() + ", " + txt;
			
			n = msgList.length+1;
			spcs = Array(n).join(" ") + "<< ";
			
			console.log(spcs + txt);
		}
};

var sAd = function(list, item) {
	var ind = list.indexOf(item);
	if(ind != -1)
		list.splice(ind, 1);
};

var destroyList = function(list) {
	if(typeof list === "undefined")
		return;
		
	var item;	
	while(list.length > 0) {
		item = list[0];
		item.destroy();
		
		if(item == list[0])
			list.splice(0, 1);
	}
};

function Transition(_fromState, _toState) {
	var subtransitionList = [],
		fromState = _fromState,
		toState = _toState;
	this.transString = "";

		
	this.isValid = function() {
		if(subtransitionList.length == 0)
			return false;
		
		//TODO: check overlap with others
		
		return true;
	};
	
	this.getSubtransitionList = function() {
		return subtransitionList;
	};
	
	this.c2Amt = function(c) {
		c = c.toUpperCase();
		
		if(c == "L")
			return -1;
		else if(c == "R")
			return 1;
		else
			return 0;
	};
	
	this.updateString = function() {
		var lines = this.transString.split("|"),
			readSymbolList = [],
			readSymbol;
		subtransitionList = [];
		
		

		for(txt of lines) {
			if(/^[A-Za-z0-9\u03B5$#\u2A06]:[A-Za-z0-9\u03B5$#\u2A06],[LRNlrn]$/.test(txt)) {
				readSymbol = txt.charAt(0);
				subtransitionList.push({
					readSymbol:		readSymbol,
					writeSymbol:	txt.charAt(2),
					moveAmt:		this.c2Amt(txt.charAt(4)),
					toState:		toState
				});
				
				if(readSymbolList.indexOf(readSymbol) == -1)
					readSymbolList.push(readSymbol);
				else {
					subtransitionList = [];
					break;	
				}
			}
			else {
				subtransitionList = [];
				break;
			}
		}
	};
	
	this.getSubtransition = function(readSymbol) {
		for(subtransition of subtransitionList)
			if(subtransition.readSymbol == readSymbol)
				return subtransition;
		return null;
	};
	this.getFromState = function() {return fromState;};
	this.getToState = function() {return toState;};
	
	
	this.mouseDistance = function() {
		if(fromState == toState) {
			var dis = calcPtDis($canvasDiagram.mouseX(),$canvasDiagram.mouseY(), fromState.x(),fromState.y()-2*stateRadius);
			return dis;
		}
		
		return calcLinePtDis($canvasDiagram.mouseX(),$canvasDiagram.mouseY(), fromState.x(),fromState.y(),toState.x(),toState.y(), true);				
	};

	this.toDirection = function() {
		if(fromState == toState)
			return 270;

		
		var x1 = fromState.x(),
			y1 = fromState.y(),
			x2 = toState.x(),
			y2 = toState.y();
			
		return calcPtDir(x1,y1,x2,y2);
	}
	
	this.perpDirection = function() {
		return this.toDirection() - 90;
	}
	
	this.mouseDirection = function() {
		if(fromState == toState)
			return 90;
		
		var x1 = fromState.x(),
			y1 = fromState.y(),
			x2 = toState.x(),
			y2 = toState.y(),
			dir = calcLinePtDir($canvasDiagram.mouseX(),$canvasDiagram.mouseY(), x1,y1,x2,y2, true);
			
		var delt = calcAngleDiff(dir, calcPtDir(x1,y1, x2,y2));
				
		return delt;
	};
	
	this.draw = function() {
		var	fH = 16;
		ctxDiagram.font = fH+"px Courier New";
			
		
		var col = this.isValid() ? C_BLACK : C_RED;

		if(hoverTransition == this) {
			col = blendColors(col,C_HOVER,.5);
			if(mouse.isPressed(0)) {
				selectedState = null;
				selectedTransition = this;
				mouse.eatPressed(0);
			}
			else if(mouse.isDown(2)) {				
				this.destroy();
				
				return;
			}
		}
		if(selectedTransition == this)
			col = blendColors(col,C_WHITE,.95);

		setColor(ctxDiagram, col);

		drawArrow(fromState, toState);
		
		var str = this.transString.replace(/\|/g, "|\n");
		
		if(fromState != toState) {
			var x1 = fromState.x(),
				y1 = fromState.y(),
				x2 = toState.x(),
				y2 = toState.y(),
				dir = this.toDirection();
				
			ctxDiagram.save();
			ctxDiagram.translate((x1+x2)/2, (y1+y2)/2);
					
			if(dir > -90 && dir < 90) {
				ctxDiagram.rotate((dir)*d2r);
				ctxDiagram.textBaseline = "alphabetic";
				str = "> " + str + " >";
			}
			else {
				ctxDiagram.rotate((dir+180)*d2r);
				ctxDiagram.textBaseline = "hanging";
				str = "< " + str + " <";
			}
						
			drawText(ctxDiagram, str, 0,0);
			ctxDiagram.restore();
		}
		else {				
			ctxDiagram.textBaseline = "alphabetic";
			drawText(ctxDiagram, str, fromState.x(),fromState.y()-3*stateRadius);
		}
	};
	
	this.destroy = function() {
		if(selectedTransition == this)
			selectedTransition = null;
		
		tm.removeTransition(this);
		
		if(fromState) {
			fromState.removeOutwardTransition(this);
			fromState = null;
		}
		
		if(toState) {
			toState.removeInwardTransition(this);			
			toState = null;
		}
	};
}

function Tape(_headPos, _tapeString, _stateObj) {
	var headPos = _headPos,
		drawHeadPos = _headPos,
		tapeString = _tapeString;
	this.currentState = _stateObj;
	this.brightness = 0;
	this.liveTimer = 0;
		
	this.read = function() {
		return tapeString.charAt(headPos);
	};
	
	this.write = function(c) {
		//TODO: INSERT/REMOVE BLANK CHARACTERS
		
		if(c != CH_EPSILON)
			tapeString = replace(tapeString, headPos, c);
	};
	
	this.move = function(amt) {
		msg(true, "Tape.move(" + amt + "), " + headPos);
		headPos += amt;
		
		if(headPos < 0)
			headPos = 0;
		if(headPos >= tapeString.length) {
			tapeString += CH_BLANK;
		}
		msg(false, ""+headPos);
	}
	
	this.run = function() {			
		msg(true, "TAPE: " + this);
		var c = this.read();
		
		msg("Read \"" + c + "\" at the head position!");


		var subtransList = this.currentState.getEpsilonSubtransitions();
		if(subtransList.length > 0) {
			for(subtrans of subtransList) {
				var newTape = this.clone();
				
				newTape.write(subtrans.writeSymbol);
				newTape.move(subtrans.moveAmt);
				newTape.currentState = subtrans.toState;
								
				tm.addTape(newTape);
			}
		}

		
		var transition = this.currentState.getTransition(c);
	
		if(!transition) {
			msg(false, "No transition found for \'" + c + "\'!");
			
			var act = this.currentState.getAction();
			if(act == R_ACCEPT || act == R_REJECT)
				return act;
			else
				return R_DIE;
		}
		else {
			this.write(transition.writeSymbol);
			this.move(transition.moveAmt);

			this.currentState = transition.toState;
			
			msg(false, ""+this);
			
			
			//TODO: INSTANT ACCEPT/REJECT?
			return R_NONE;
		}
	};

	
	this.length = function() {
		return tapeString.length;
	};
	this.charAt = function(ind) {
		if(ind < 0 || ind >= this.length())
			return "";
		else
			return tapeString.charAt(ind);
	};
	
	this.toString = function() {
		this.liveTimer++;
		return "[" + headPos + ", " + tapeString + ", " + this.currentState + ", " + this.liveTimer + "]";
	}
	
	this.clone = function() {
		msg("Clone: " + this);
		return new Tape(headPos, tapeString, this.currentState);
	};
	
	this.destroy = function() {
		msg(true, "Destroying: " + this);
		tm.removeTape(this);
		msg(false, "");
	};

	this.draw = function(ctx, x, y, w, h, xNum) {		
		
		drawHeadPos += (headPos - drawHeadPos)/5;
		
		var pos = drawHeadPos - 1;
		
		var ind,
			dX,
			dY,
			dX0,
			dY0,
			c,
			dW = w/xNum,
			dH = h,
			le = this.length();
			
		var	fH = dW;
				
		var drawNum = 2*(Math.ceil(xNum/2)+2);
		
		for(var i = 0; i < drawNum; i++) {
			dX = x + w/2 + (ind-pos)*dW;
			dY = y + h/2;
			
			dX0 = dX-dW/2;
			dY0 = dY-dH/2;

			ind = headPos - drawNum/2 + i;

			if(ind < 0)
				continue;
			
			if(ind == headPos) {
				ctx.fillStyle = C_WHITE;
				ctx.fillRect(dX0,dY0, dW,dH);
			}

			ctx.strokeStyle = C_BLACK;
			ctx.strokeRect(dX0,dY0, dW,dH);
			

			ctx.fillStyle = C_BLACK;

			ctx.font = fH+"px Courier New";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";		
				c = this.charAt(ind);				
				
				ctx.fillText(c,dX,dY);
				
				
			ctx.font = (fH/2)+"px Courier New";
				ctx.textAlign = "left";
				ctx.textBaseline = "top";
				ctx.fillText(ind,dX0,dY0);
		}
	};
}


var keyDown = {};
	keyDown[K_SPACE] = false,
	KS_DOWN = true,
	KS_UP = false;
	
document.addEventListener("keydown",
	function(e) {
		if(document.activeElement.tagName == "BODY")
			e.preventDefault();
		
		var keyCode = e.keyCode,
			c = String.fromCharCode(e.keyCode);
		
		if(keyCode == K_ENTER && !keyDown[K_ENTER]) {
			tm.start();
			document.activeElement.blur();			
		}
		if(keyCode == K_ESC && !keyDown[K_ESC])
			tm.clear();
		if(keyCode == K_ACCENT && !keyDown[K_ACCENT])
			tm.save();
	
		if(!keyDown[keyCode])
			keyDown[keyCode] = KS_DOWN;
		 
		if(document.activeElement.tagName != "INPUT") {	
			if(selectedState) {
				if(keyCode == K_BACKSPACE)
					selectedState.name = backspace(selectedState.name);
				else if(keyCode == K_TAB)
					selectedState.tabAction();
				else if(isAlphanum(c))
					selectedState.name += c;
			}
			if(selectedTransition) {
				if(keyCode == K_BACKSPACE) {
					if(selectedTransition.transString.endsWith(CH_ARROW)) {
						for(var i = 0; i < CH_ARROW.length; i++)
							selectedTransition.transString = backspace(selectedTransition.transString);
					}
					else
						selectedTransition.transString = backspace(selectedTransition.transString);
				}
				else if(keyCode == K_ALT)
					selectedTransition.transString += CH_BLANK;
				else if(keyCode == K_$1)
					selectedTransition.transString += "$";
				else if(keyCode == K_$2)
					selectedTransition.transString += "#";
				else if(keyCode == K_COLON)
					selectedTransition.transString += CH_ARROW;
				//TODO: EPSILON TRANSITIONS
				else if(keyCode == K_SPACE)
					selectedTransition.transString += CH_EPSILON;
				else if(keyCode == K_COMMA)
					selectedTransition.transString += ",";
				else if(keyCode == K_PIPE)
					selectedTransition.transString += "|";
				else if(isAlphanum(c))
					selectedTransition.transString += c;
				
				selectedTransition.updateString();
			}
		}
	},false);
	
	
document.addEventListener("keyup",
	function(e) {		
		allowed = true;

		var keyCode = e.keyCode,
			c = String.fromCharCode(e.keyCode);
		
		keyDown[keyCode] = KS_UP;
	},false);


var tm = new TuringMachine();

var render=function() {	
	tm.draw();
	
	mouse.update();
};

var update=function(){
	$canvasTape.update();
	$canvasDiagram.update();
	
	tm.update();
};


var step=function(){
	update();
	render();
	animate(step);
};

animate(step);
