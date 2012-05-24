var smugmug = {
	slide : null,
	intialized : false,
	nextRefresh : null,
	refreshInterval : 5, /** standard refresh interval is 5 minutes **/

	/**
	 * Returns the name of this module. Required.
	 * Mostly used in debugging.
	 *
	 * @return string
	 */
	getName : function () {
		return "smugmug";
	},

	/**
	 * This method will be called at the start of a slideshow. Ie. right
	 * before it starts a new cycle.
	 */
	initialize : function (callbackWhenFinished) {
		var t = this;

		if ( t.nextRefresh === null || (new Date()) > t.nextRefresh ) {
			// Do something if this is the first time the module initializer
			// has been called or it's time change some of the content in the
			// slides, eg. tweets, events, pictures, latest news...

			//console.log("Time for a smug refreshment...");

			t.nextRefresh = new Date();
			t.nextRefresh.setTime(t.nextRefresh.getTime() + t.refreshInterval * 60 * 1000);
			//console.log("Next refreshment at ", t.nextRefresh);
			//alert("refresh");

			var smugmugs = $('.smugmug[data-nickname][data-album-id]');

			for (var i = 0; i < smugmugs.length; i++) {
				t.load(smugmugs.eq(i));
			}

			smugmugs = null;
		}

		callbackWhenFinished();
	},

	load : function (smugmugElem) {
		var t = this;
		var nickname = smugmugElem.data('nickname');
		var albumId = smugmugElem.data('albumId');

		$.smugmug.albums.get(
			{NickName: nickname, Extras:"LastUpdated", Empty: false},
			function(data) {
				var album = t.locateAlbum(data.Albums, albumId);
				var lastUpdated = (new Date(album.LastUpdated)).getTime() / 1000;

				console.log(lastUpdated, smugmugElem.data("lastUpdated"), lastUpdated > smugmugElem.data("lastUpdated"));

				if ( typeof smugmugElem.data("lastUpdated") === "undefined" || lastUpdated > smugmugElem.data("lastUpdated")) {
					console.log("Will update photo elems.");
					smugmugElem.empty();
					smugmugElem.addClass("pictureCollection");

					smugmugElem.data("lastUpdated", lastUpdated);

					$.smugmug.images.get(
						{AlbumID: album.id, AlbumKey: album.Key, Extras: "XLargeURL,Caption,Height,Width"},
						function (album) {
							//console.log(album);

							for (var i = 0; i < album.Album.Images.length; i++) {
								var image = album.Album.Images[i];
								var imageElem = $("<img>");

								imageElem.attr({
									alt: image.Caption,
									width: image.Width,
									height: image.Height,
									src: image.XLargeURL,
								});

								smugmugElem.append(imageElem);
							}
							pictureCollection.resizeImages(smugmugElem.find("img"));
						}
					);
				}
			}
		);
	},

	locateAlbum : function (albums, albumId) {
		var album = null;

		for (var i = 0; i < albums.length; i++) {
			if (albums[i].id == albumId) {
				album = albums[i];
				break;
			}
		}

		return album;
	},

	/**
	 * This method is called every time the slide controller changes to a new slide.
	 * The slide controller goes through the list of registered modules and
	 * will pick the first module that returns true from the identofySlide method.
	 * If you return true, you will have "complete" control of the slide.
	 *
	 * @param object slide
	 * @return bool
	 */
	identifySlide : function (slide) {
		var t = this;
		// Return true or false
		// will take control if true
		return false;
	},

	/**
	 * Will do a single element cycle, will return true or next callback
	 * time if there are more elements to go through, false otherwise.
	 */
	cycle : function () {
		var t = this;

		return false;
	},

	/**
	 * Remove your connection to the current slide
	 */
	unbind : function () {
		var t = this;

		t.slide = null;
	}
};
