/**************************** MOUSE FUNCTIONS ****************************/

function Mouse() {
	var _me = this;
		_x = 0,
		_y = 0,
		_xPrev = 0,
		_yPrev = 0,
		_wheelDelta = 0;
		_isDown = [0, 0, 0, 0, 0, 0, 0, 0, 0],
		_isPressed = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	
	this.x = function() 					{return _x;};
	this.y = function() 					{return _y;};
	this.deltaX = function() 				{return _x-_xPrev;};
	this.deltaY = function() 				{return _y-_yPrev;};
	this.wheelDelta = function() 			{return _wheelDelta;};
	this.isDown = function(btn) 			{return _isDown[btn];};

	this.isPressed = function(btn) 			{return _isPressed[btn];};
	this.eatPressed = function(btn) {
		var val = _isPressed[btn];
		_isPressed[btn] = 0;
		return val;
	};
	
	this.eatWheelDelta = function() {
		var delta = _wheelDelta;
		_wheelDelta = 0;
		return delta;
	};
	
	this.checkCircle = function(x,y,r) 		{return this.checkEllipse(x,y,r,r);};
	this.checkEllipse = function(x,y,rx,ry) {return (sqr(_x - x)/sqr(rx) + sqr(_y - y)/sqr(ry) <= 1 );};
	
	//this.checkRectangle = function(x,y,r) 	{return (calcPtDis(_x,_y, x,y) < r);};

	this.update = function() {
		_xPrev = _x;
		_yPrev = _y;
	}
	
	// Add methods for linking document events to mouse
	document.onmousemove = function(e) {		
		_x = e.pageX;
		_y = e.pageY;
	};
	document.body.onmousedown = function(e) {
		_isDown[e.button] = 1;
		_isPressed[e.button] = 1;
	};
	document.body.onmouseup = function(e) {
		_isDown[e.button] = 0;
		_isPressed[e.button] = 0;
	};
	document.addEventListener('DOMMouseScroll', function(e) {
		_wheelDelta = e.detail;
	}, false);
}