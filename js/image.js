function loadImage(source) {
    // call the notify_complete function when the image has loaded
	var img = new Image();

    // load the image
    img.src = source;
	
	return img;
}

var setImageScale = function(img, scX, scY) {
	img.width *= scX;
	img.height *= (typeof scY === "undefined") ? scX : scY;
};

var drawImage = function(ctx, img, x,y, w,h) {	
	if(typeof h === "undefined") {
		if(typeof w === "undefined") {
			w = img.width;
			h = img.height;
		}
		else {
			var sc = w;
			w = img.width*sc;
			h = img.height*sc;
		}
	}

	ctx.drawImage(img, x,y, w,h);
};

var drawImageCentered = function(ctx, img, x,y, w,h) {	
	if(typeof h === "undefined") {
		if(typeof w === "undefined") {
			w = img.width;
			h = img.height;
		}
		else {
			var sc = w;
			w = img.width*sc;
			h = img.height*sc;
		}
	}
	
	x -= w/2;
	y -= h/2;

	ctx.drawImage(img, x,y, w,h);
};