/**************************** MATH FUNCTIONS ****************************/

var d2r = Math.PI/180,
	r2d = 1/d2r;

var sqr = function(x) 			{return x*x;};
var ln = function(x) 			{return Math.log(x);};
var logBase = function(x, y) 	{return Math.log(x)/Math.log(y);};
var log = function(x) 			{return logBase(x, 10);};

var abs = function(x)			{return Math.abs(x);};

var calcAngleDiff = function(ang1, ang2) {
	var a = ang2-ang1;
	
	a += 180;
	a = a - Math.floor(a/360) * 360;
	a -= 180;
	
	return a;
};

var calcLenX = function(dis, dir) {return dis*Math.cos(dir*d2r);};
var calcLenY = function(dis, dir) {return dis*Math.sin(dir*d2r);};

var calcPtDis = function(x1,y1, x2,y2) {
	return Math.sqrt(sqr(y2-y1) + sqr(x2-x1));
};

var calcLinePtDis = function(x0,y0,  x1,y1, x2,y2, isSegment) {
	var pt = calcLinePt(x0,y0, x1,y1,x2,y2, isSegment);
	return calcPtDis(x0,y0, pt[0],pt[1]);
};
var calcLinePtDir = function(x0,y0,  x1,y1, x2,y2, isSegment) {
	var pt = calcLinePt(x0,y0, x1,y1,x2,y2, isSegment);
	return calcPtDir(pt[0],pt[1], x0,y0);
};
var calcLinePt = function(x0,y0,  x1,y1, x2,y2, isSegment) {
	var dx, dy, t, px, py;
	dx = x2-x1;
	dy = y2-y1;
		
	if ((dx == 0) && (dy == 0)) {
		px = x1;
		py = y1;
	}
	else {
		t = (dx*(x0-x1) + dy*(y0-y1)) / (dx*dx+dy*dy);
				
		if(isSegment)
			t = contain(0,t,1);
		
		px = x1 + t*dx;
		py = y1 + t*dy;		
	}
	
	
	return [px,py];
};


var calcPtDir = function(x1,y1, x2,y2) {
	return Math.atan2(y2-y1, x2-x1) / 3.14159265 * 180;
};

var map = function(x,in_min,in_max,out_min,out_max)	{
	return (x-in_min)*(out_max-out_min)/(in_max-in_min)+out_min;
};

var contain = function(mi, x, ma)	{return Math.max( mi, Math.min(x, ma) );};

var absDiff = function(x, sub) {
	var oriSi = Math.sign(x),
		newSi = Math.sign(x = x-oriSi*sub);
	
	return (oriSi != newSi)	? 0 : x;
};

var time = function() {
	return new Date().getTime();
};