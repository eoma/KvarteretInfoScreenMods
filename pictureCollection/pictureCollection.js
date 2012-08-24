"use strict";

var pictureCollection = {
	slide : null,
	images : null,
	activeImage : null,
	activeImageRef : null,
	intialized : false,

	getName : function () {
		return "pictureCollection";
	},

	initialize : function (callbackWhenFinished) {
		var t = this;

		var triggerCallbackManually = true;

		if ( ! t.initialized ) {

			var images = jQuery(".pictureCollection > img");

			if(images.length > 0) {
				t.resizeImages(images);
			}
		}

		if ( triggerCallbackManually ) {
			callbackWhenFinished();
		}
	},

	resizeImages : function (images) {
		var t = this;

		var bodyHeight = parseInt($('body').css('height').replace('px', ''), 10);
		var bodyWidth = parseInt($('body').css('width').replace('px', ''), 10);

		var bodyRatio = bodyHeight / bodyWidth;

		//console.log('bodyRatio', bodyRatio);

		function resizeAndPadImage () {
			var image = $(this);

			//console.log("isResized", image.data("isResized"));

			if (typeof (image.data('isResized')) === "undefined") {
				var imageHeight = parseInt(image.css('height').replace('px', ''), 10);
				var imageWidth = parseInt(image.css('width').replace('px', ''), 10);

				//console.log('imageWidth', imageWidth, 'imageHeight', imageHeight);

				var imageRatio = imageHeight / imageWidth;

				var height = 0;
				var width = 0;

				if (imageRatio > bodyRatio) {
					// The transform image's width must be shrinked
					height = bodyHeight;
					width = bodyWidth * bodyRatio / imageRatio;
				} else if (imageRatio < bodyRatio) {
					// The transform image's height must be shrinked
					width = bodyWidth;
					height = bodyHeight * imageRatio / bodyRatio;
				} else {
					height = bodyHeight;
					width = bodyWidth;
				}

				image.css({height: height + 'px', width: width + 'px'});

				image.css({
					top: ((bodyHeight - height) / 2) + 'px',
					left: ((bodyWidth - width) / 2) + 'px'
				});

				image.data("isResized", true);
			}

			image = null;
		}

		jQuery('.pictureCollection > img').load(resizeAndPadImage);

		for (var i = 0; i < images.length; i++) {
			var image = images.eq(i);

			if (typeof (image.data("timthumb")) === "undefined") {
				image.attr('src', 'http://et.kvarteret.no/endre/timthumb/timthumb.php?src=' + encodeURI(image.attr('src')) + '&w=' + bodyWidth + '&h=' + bodyHeight + '&zc=3');
				image.data("timthumb", true);
			}

			image = null;

		}

		images = null;
	},

	identifySlide : function (slide) {
		var t = this;
		// Return true or false
		// will take control if true
		if (slide.hasClass('pictureCollection')) {
			t.slide = slide;
			t.images = t.slide.find('img');

			//console.log("this collection has " + t.images.length +  " images");

			return true;
		} else {
			return false;
		}
	},

	cycle : function () {
		var t = this;
		// Will do a single element cycle, will return true or next callback
		//  time if there are more elements to go through, false otherwise.

		if (t.images.length > 0) {

			if (t.activeImage != null) {
				t.activeImage.removeAttr('aria-selected');
				t.activeImageRef++;
			}

			//console.log("On image no. " + (t.activeImageRef + 1) + " of " + t.images.length);
		
			t.activeImage = t.images.eq(t.activeImageRef);

			t.activeImage.attr('aria-selected', true);

			if (t.activeImageRef < (t.images.length - 1)) {
				return true; // We have more stuff to show
			} else {
				return false; // Go to next slide
			}
		} else {
			return false; // Go to next slide
		}
	},

	unbind : function () {
		var t = this;

		if (t.activeImage !== null) {
			t.activeImage.removeAttr('aria-selected');
		}

		t.slide = null;
		t.activeImage = null;
		t.activeImageRef = 0;
		t.images = null;
		
		console.log('module ' + t.getName() + ' unbound');
		
		t = null;
	}
};
