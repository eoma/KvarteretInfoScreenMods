var pictureCollectionEditor = function (slide, elem) {

	if (slide.content == "") {
		slide.content = "<section class=\"pictureCollection\"></section>";
	}

	var dom = jQuery(slide.content);

	elem.addClass('pictureCollectionEditor');
	elem.find('.title').eq(0).text('Picture collection');
	var canvas = elem.find('.canvas').eq(0);
	var leftToolbar = elem.find('.toolbar .left').eq(0);

	var timthumb = 'http://et.kvarteret.no/endre/timthumb/timthumb.php?zc=2&w=400&h=400&src=';

	var imageTemplate = function (src, alt) {
		var img = $('<img />');

		if ((typeof src != 'string') || (src.length == 0)) {
			src = "";
		}

		if ((typeof alt != 'string') || (alt.length == 0)) {
			alt = "";
		}

		img.attr('src', (src.length > 0) ? timthumb + encodeURI(src) : src);
		img.data('src', src);
		img.attr('alt', alt);

		var listElem = $('<li />').append(img);
		listElem.append($('<a />')
			.addClass('delete')
			.text('Delete')
		);

		return listElem;
	}

	var spawnPicDialog = function (e) {
		var imgElem = $(e.target);

		var tips = $('<p>');

		var imgSrc = $('<input />')
			.attr('type', 'text')
			.attr('required', 'required')
			.val(imgElem.data('src'))
		;

		var imgAlt = $('<input />')
			.attr('type', 'text')
			.val(imgElem.attr('alt'))
		;

		var picDialog = $('<div>')
			.attr('title', 'edit picture')
			.append($('<p>').text('Edit picture'))
			.append(tips)
			.append($('<label>').text('Source: ').append(imgSrc))
			.append($('<label>').text('Alt: ').append(imgAlt))
		;

		function updateTips( t ) {
			tips
				.text( t )
				.addClass( "ui-state-highlight" );
			setTimeout(function() {
				tips.removeClass( "ui-state-highlight", 1500 );
			}, 500 );
		}

		jQuery(picDialog).dialog({
			modal: true,
			buttons: {
				Save: function () {

					if ( imgSrc.val().length > 0 ) {
						imgElem.attr('src', timthumb + encodeURI(imgSrc.val()));
						imgElem.data('src', imgSrc.val());
						imgElem.attr('alt', imgAlt.val());

						$( this ).dialog( "close" );
					} else {
						updateTips("Source kan ikke være tom!");
					}
				},
				Cancel: function() {
					$( this ).dialog( "close" );
				}
			}
		});
	}

	var newImage = function () {		
		var listItem = imageTemplate();
		list.append(listItem);

		listItem.find('img').click();
	}

	var getRawContent = function() {
		var d = $('<div />');
		var section = $('<section />')
			.addClass('pictureCollection');

		var newImagesPerCycle = elem.find('.imagesPerCycle').eq(0).val();

		console.log('images per cycle', newImagesPerCycle);
		if (newImagesPerCycle > 0) {
			//console.log('images per cycle', newImagesPerCycle);

			section.attr('data-images-per-cycle', newImagesPerCycle);
		}

		var imgs = list.find('img');

		for (var i = 0; i < imgs.length; i++) {
			var img = imgs.eq(i).clone();
			img.attr('src', imgs.eq(i).data('src'));
			section.append(img);
			img = null;
		}

		d.append(section);

		return d.html();
	};

	var getRawCss = function () {
		return "";
	};

	//var dom = jQuery(slide.content);

	var pictures = dom.find('img');

	var list = jQuery('<ul />');
	list.addClass('cf');
	list.delegate('img', 'click', spawnPicDialog);
	list.delegate('li .delete', 'click', function (e) {
		var a = $(e.target);
		var parent = a.closest('li');
		parent.empty().remove();
	});

	for (var i = 0; i < pictures.length; i++) {
		var pic = pictures.eq(i);

		list.append(imageTemplate(pic.attr('src'), pic.attr('alt')));
	}

	list.sortable({
		placeholder : "ui-state-highlight",
	});

	canvas.append(list);

	leftToolbar.append($('<li />').text("Add picture").click(newImage));

	var imagesPerCycle = 0;

	if (typeof(dom.filter('section').eq(0).data('imagesPerCycle')) == 'number') {
		imagesPerCycle = dom.filter('section').eq(0).data('imagesPerCycle');
	}

	leftToolbar.append($('<li />')
		.text('Max images per cycle')
		.append($('<input />')
			.addClass('imagesPerCycle')
			.val(imagesPerCycle)
		)
	);

	leftToolbar = null;

	return {
		getRawContent : getRawContent,
		getRawCss : getRawCss
	}
};

pictureCollectionEditor.identifySlide = function (slide) {
	console.log(slide);

	var data = jQuery(slide.content);

	return data.hasClass('pictureCollection');
}

pictureCollectionEditor.staticButtonSetup = function () {
	return {
		name : "Add pictureCollection",
		callback : pictureCollectionEditor,
	};
}

dakSlideshowEditor.registerModule(pictureCollectionEditor);
