/*var drawText=function(ctx, txt, dX, dY) {
	
	ctx.font = "20px serif";
	
	var dW = ctx.measureText(txt).width,
		dH = getTextHeight(ctx.font).height;	
	
	dY += dH;
	
	ctx.setLineDash([]);
	ctx.strokeStyle = "black";
	ctx.lineWidth = 3;
	ctx.strokeText(txt, dX,dY);

	ctx.fillStyle = "white";
	ctx.fillText(txt, dX,dY);
};*/

var fillPolygon = function(ctx, pts) {
	ctx.beginPath();
	ctx.moveTo(pts[0].x,pts[0].y);
	
	for(var i = 1; i < pts.length; i++)
		ctx.lineTo(pts[i].x, pts[i].y);

	ctx.closePath();
	ctx.fill();
}

var strokePolygon = function(ctx, pts) {
	ctx.beginPath();
	ctx.moveTo(pts[0].x,pts[0].y);
	
	for(var i = 1; i < pts.length; i++)
		ctx.lineTo(pts[i].x, pts[i].y);

	ctx.closePath();
	ctx.stroke();
}

var shadePolygon = function(ctx, pts, n) {
	var x01,y01, x02,y02, p;
	var	pt1 = pts[0],
		pt2 = pts[1],
		pt3 = pts[2],
		pt4 = pts[3];
	var x1 = pt1.x,	y1 = pt1.y,
		x2 = pt2.x,	y2 = pt2.y,
		x3 = pt3.x,	y3 = pt3.y,
		x4 = pt4.x,	y4 = pt4.y;
	var l12 = calcPtDis(x1,y1, x2,y2), l23 = calcPtDis(x2,y2, x3,y3),
		l14 = calcPtDis(x1,y1, x4,y4),	l43 = calcPtDis(x4,y4, x3,y3);
	var f;
	
	for(i = 0; i < n; i++) {
		p = 1.*i/n;
		
		// Calculate (x01, y01)
		f = (l12+l23)*p;
		if(f > l12) {
			f = (f - l12)/l23;
			x01 = x2 + f*(x3-x2);
			y01 = y2 + f*(y3-y2);
		}
		else {
			f /= l12;
			x01 = x1 + f*(x2-x1);
			y01 = y1 + f*(y2-y1);
		}

		// Calculate (x02, y02)
		f = (l14+l43)*p;
		if(f > l14) {
			f = (f - l14)/l43;
			x02 = x4 + f*(x3-x4);
			y02 = y4 + f*(y3-y4);
		}
		else {
			f /= l14;
			x02 = x1 + f*(x4-x1);
			y02 = y1 + f*(y4-y1);
		}

		
		strokeLine(ctx, x01,y01, x02,y02);
	}
	strokePolygon(ctx, pts);
};


var strokeLine = function(ctx, x1,y1, x2,y2) {
	ctx.beginPath();
	ctx.moveTo(x1,y1);
	ctx.lineTo(x2,y2);
	ctx.stroke();
};

var shadeRect = function(ctx, x,y,w,h, n, angle) {
	var x1,y1, x2,y2, p, xF, yF, nF, doMirror = false;
	
	if(angle < 0) {
		doMirror = true;
		angle = -angle;
	}

	xF = 1;
	yF = Math.tan( angle/180*3.14159 );
	
	nF = (1/yF/xF);
	
	//console.alert(yF);
	
	for(i = 0; i < n; i++) {
		p = 1.*i/n * nF;
		
		x1 = (w+h)*p*xF;
		y1 = y;
		if(x1 > w) {
			y1 = (x1-w)*yF;
			x1 = w;
		}

		x2 = 0;
		y2 = (w+h)*p*yF;
		if(y2 > h) {
			x2 = (y2-h)/yF;
			y2 = h;
		}

		
		if(!doMirror)
			strokeLine(ctx, x+x1,y+y1, x+x2,y+y2);
		else
			strokeLine(ctx, x+w-x1,y+y1, x+w-x2,y+y2);
	}
	ctx.strokeRect(x,y,w,h);
};


var clear = function(ctx, color) {
	ctx.fillStyle = color;
	ctx.fillRect(0,0,ctx.w,ctx.h);
};

var setColor = function(ctx, color) {
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
};


var strokeEllipse=function(ctx, x,y,rX,rY){
	circPath(ctx, x,y,rX,rY);
	ctx.stroke();
};
var strokeCircle=function(ctx, x,y,r){
	strokeEllipse(ctx, x,y,r,r);
};

var fillEllipse=function(ctx, x,y,rX,rY){
	//ctx.beginPath();
	//ctx.arc(x,y,r,0,2*Math.PI,false);
	//ctx.fill();
	circPath(ctx, x,y,rX,rY);
	ctx.fill();
};
var fillCircle=function(ctx, x,y,r){
	fillEllipse(ctx, x,y,r,r);
};

var circPath=function(ctx, x,y,rX,rY){
	var n = 20;
	
	ctx.beginPath();
	ctx.moveTo(x + rX,y);
	
	var d,dX,dY;
	for(var i = 1; i < n; i++) {
		d = 3.14159*2 * i/n;
		
		dX = x + rX*Math.cos(d);
		dY = y + rY*Math.sin(d);
		
		ctx.lineTo(dX,dY);
	}
	
	ctx.closePath();
};


var drawText = function(ctx, str, x,y) {
	var lines = str.split("\n"), dir, fH;
	fH = getTextHeight(ctx.font).height;
	
	if(ctx.textBaseline == "alphabetic" || ctx.textBaseline == "bottom")
		dir = 1;
	else if(ctx.textBaseline == "top" || ctx.textBaseline == "hanging")
		dir = -1;
	else
		dir = 0;
	
	//TODO: Dir == 0?
	
	lines.reverse();
	for(line of lines) {
		//ctx.fillText(line, x,y);
		ctx.strokeText(line, x,y);
		y -= fH*dir;
	}
};


var getTextHeight = function(font) {
	var text = $('<span>Hg</span>').css({ fontFamily: font });
	var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');

	var div = $('<div></div>');
	div.append(text, block);

	var body = $('body');
	body.append(div);

	try {
		var result = {};

		block.css({ verticalAlign: 'baseline' });
		result.ascent = block.offset().top - text.offset().top;

		block.css({ verticalAlign: 'bottom' });
		result.height = block.offset().top - text.offset().top;

		result.descent = result.height - result.ascent;
	} finally {
		div.remove();
	}

	return result;
};
