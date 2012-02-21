"use strict";

var resepsjonApp;

(function ($) {
	var eventServer = "http://events.kvarteret.no";

	resepsjonApp = {

		state : {},

		init : function () {
			var t = this;

			t.state.limit = 1000;
			t.state.offset = 0;
			t.state.totalCount = 0;

			t.state.filter = {};
			//$('.resepsjon').one('DOMNodeInserted', '.photoElem > img', t.loadPicture);
		},

		render : function (data, clear, putAfterElement) {
			/**
			 * Data børe inneholde 
			 * {
			 *   promos: []
			 *   events: []
			 * }
			 */
			if (clear === true) {
				$(".resepsjon").empty().remove();
			}

			var dates = groupEventsByDate(data.events.data),
			    dateEvents = [],
			    promoEvents = [];

			$.each(dates, function (date) {

				var dateEvent = {};
				dateEvent.date = date;
				dateEvent.events = [];

				$.each(this, function (index, eventIndex) {
					dateEvent.events.push(data.events.data[eventIndex]);
				});

				dateEvents.push(dateEvent);
				dateEvent = null;
			});

			$.each(data.promos.data, function (index) {
				var event = data.promos.data[index];

				if ( ! $.isEmptyObject(event.primaryPicture) ) {
					console.log(event.primaryPicture);
					promoEvents.push({
						src: event.primaryPicture.url,
						title: event.title,
						description: formatDate(event.startDate) + ' - ' + formatTime(event.startTime) + ' - CC: ' + event.covercharge
					});
				}
			});

			console.log(promoEvents);

			if (promoEvents.length == 0) {
				promoEvents.push({
						src: "http://placepuppy.it/720/415",
						title: "Just a lil puppy",
						description: "Just a puppy from placepuppy.it",
				});
				promoEvents.push({
						src: "http://placekitten.com/g/720/415",
						title: "Just a lil kitty",
						description: "Just a kitty from placekitten.com",
				});
				promoEvents.push({
						src: "http://placekitten.com/720/415",
						title: "Just a lil kitty",
						description: "Just another kitten from placekitten.com",
				});
			}

			var sectionData = {
				days : dateEvents,
				promos : promoEvents,
			};

			if ((typeof putAfterElement !== 'undefined') && (putAfterElement !== null)) {
				console.log("will insert elements!");
				if (putAfterElement.data('eventFormatId')) {
					var formatId = putAfterElement.data('eventFormatId');
					//console.log("eventFormatId", formatId, $('#' + formatId).html());
					//putAfterElement.after($.tmpl($('#' + formatId).html(), dateEvents));

					$('#' + formatId).tmpl(sectionData).insertAfter(putAfterElement);
				} else {
					$('#resepsjonSection').tmpl(sectionData).insertAfter(putAfterElement);
				}
			}

			dates = null;
			dateEvents = null;
			sectionData = null;
		},

		refresh : function (callback, async) {
			var t = this,
			    elems,
			    i,
			    queryParams,
		        elemData;

			if (typeof async !== 'boolean') {
				async = true;
			}

			t.state.offset = 0;
			t.state.totalCount = 0;

			elems = $('.resepsjonTrigger');

			//if (elems.length == 0) {

			//}

			for (i = 0; i < elems.length; i++) {
				queryParams = {};
				queryParams.limit = t.state.limit;
				queryParams.offset = t.state.offset;

				elemData = elems.eq(i).data();

				if (typeof elemData.dayspan === 'number') {
					queryParams.dayspan = elemData.dayspan;
				}

				if ((typeof elemData.arranger === 'number') || (typeof elemData.arranger === 'string')) {
					queryParams.arranger_id = elemData.arranger;
				}

				if ((typeof elemData.location === 'number') || (typeof elemData.location === 'string')) {
					queryParams.location_id = elemData.location;
				}

				if ((typeof elemData.category === 'number') || (typeof elemData.category === 'string')) {
					queryParams.category_id = elemData.category;
				}

				if ((typeof elemData.festival === 'number') || (typeof elemData.festival === 'string')) {
					queryParams.category_id = elemData.festival;
				}

				jQuery.extend(queryParams, t.state.filter);

				console.log("queryParams", queryParams);

				var data = {
					promos: null,
					events: null,
				};

				var renderWhenAllIsDefined = function(index) {
					if ((data.promos !== null) && (data.events !== null)) {
						t.render(data, (index === 0) ? true : false, elems.eq(index));

						t.fixPromoPictures();

						if ($.isFunction(callback)) {
							callback();
						}
					}
				};

				t.loadEvents(queryParams, async, function (json, index) {
					data.events = json;
					renderWhenAllIsDefined(index);
				}, i);

				var queryPromoParams = {
					category_id: "1,20",
					dayspan: 13,
					limit: 30
				};

				t.loadEvents(queryPromoParams, async, function (json, index) {
					data.promos = json;
					renderWhenAllIsDefined(index);
				}, i);
			}
		},

		loadEvents : function (queryParams, async, callback, callbackArguments) {
			var t = this,
			    eventSuccess,
			    eventError;

			if (typeof async !== 'boolean') {
				async = true;
			}

			eventSuccess = function (json) {
				t.state.offset = json.offset;
				t.state.totalCount = json.totalCount;
				t.state.limit = json.limit;

				console.log('GOT RESPONSE! ' + json.count + ' elements');

				callback(json, callbackArguments);
			};

			eventError = function (xhr, textStatus, errorThrown) {
				console.log('error loading events: ' + textStatus + ' msg: ' + errorThrown);
			};

			//alert(t.isOnline());
			$.ajax({
				url: eventServer + "/api/json/filteredEvents?callback=?",
				dataType: 'json',
				data: queryParams,
				success: eventSuccess,
				error: eventError,
				timeout: 10000,
				async: async
			});
		},

		fixPromoPictures: function() {
			var t = this;
			$('.resepsjon .photoElem > img').each(t.fixPromoPicture);
		},

		fixPromoPicture: function(index, rawElem) {
			var elem = $(rawElem);
			var parent = elem.parent();
			var height = parent.height();
			var width = parent.width();

			console.log('height', height, 'width', width);

			var timthumb = 'http://et.kvarteret.no/endre/timthumb/timthumb.php?src='
			             + encodeURI(elem.data('src')) + '&w=' + width + '&h=' + height;

			elem.attr('src', timthumb);
		}
	};
})(jQuery);
