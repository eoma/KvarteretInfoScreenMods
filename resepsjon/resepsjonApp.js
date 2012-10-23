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
		},

		render : function (data, clear, putAfterElement) {
			/**
			 * Data børe inneholde 
			 * {
			 *   promos: []
			 *   events: []
			 *   helhus: []
			 * }
			 */
			if (clear === true) {
				$(".resepsjon").empty().remove();
			}

			var dates = groupEventsByDate(data.events.data),
			    dateEvents = [],
			    promoEvents = [],
			    helhus = {};

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
					
					var promoEv = {
						src: event.primaryPicture.url,
						title: event.title,
						description: formatDate(event.startDate, true) + ' - ' + formatTime(event.startTime)
					};
					
					if (event.covercharge.length > 0) {
						promoEv.description += ' - CC: ' + event.covercharge;
					}
					
					promoEvents.push(promoEv);
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
						src: "http://placekitten.com/720/415",
						title: "Just a lil kitty",
						description: "Just a kitty from placekitten.com",
				});
			}

			if (data.helhus !== null && data.helhus.count > 0) {
				helhus.date = data.helhus.data[0].festival.startDate;
				helhus.events = data.helhus.data;
			}

			var sectionData = {
				days : dateEvents,
				promos : promoEvents,
				helhus : helhus,
				extraClasses : "",
			};

			console.log("sectionData", sectionData);

			if ((typeof putAfterElement !== 'undefined') && (putAfterElement !== null)) {
				console.log("will insert elements!");
				var formatId = '#resepsjonSection';

				if (putAfterElement.hasClass("onlyPromo")) {
					formatId = '#resepsjonSectionOnlyPromo';
					sectionData.extraClasses += "onlyPromo";
				}

				if (putAfterElement.data('eventFormatId')) {
					formatId = '#' + putAfterElement.data('eventFormatId');
				}
				
				$(formatId).tmpl(sectionData).insertAfter(putAfterElement);
				console.log(putAfterElement);
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

				jQuery.extend(queryParams, t.state.filter);

				//console.log("queryParams", queryParams);

				var data = {
					promos: null,
					events: null,
					helhus: null,
				};

				var renderWhenAllIsDefined = function(index) {
					if ((data.promos !== null) && (data.events !== null) && (data.helhus !== null)) {
						console.log("will render all items for index " + index + "!");
						t.render(data, (index === 0) ? true : false, elems.eq(index));

						t.fixPromoPictures();

						if ($.isFunction(callback)) {
							callback();
						}
					}
				};

				var queryPromoParams = {
					category_id: "1,20",
					dayspan: 13,
					limit: 30
				};

				var prepareHelhus = function (json, index) {
					data.helhus = json;
					renderWhenAllIsDefined(index);
				};

				var findHelhus = function(json, index) {
					if (json.count >= 1) {
						//console.log("findHelhus", json);
						t.loadEvents({festival_id: json.data[0].id}, async, prepareHelhus, index);
					} else {
						prepareHelhus(false, index);
					}
				};

				var ajaxQueueIndex = 0;
				var ajaxQueue = [];

				var nextAjaxQueue = function () {
					if (ajaxQueueIndex < ajaxQueue.length) {
						ajaxQueue[ajaxQueueIndex]();
						ajaxQueueIndex += 1;
					}
				};

				ajaxQueue = [
					function (index) {
						return function () {
							t.loadEvents(queryParams, async, function (json, index) {
								data.events = json;
								nextAjaxQueue();
								renderWhenAllIsDefined(index);
							}, index);
						}
					}(i),
					function (index) {
						return function () {
							t.loadEvents(queryPromoParams, async, function (json, index) {
								data.promos = json;
								nextAjaxQueue();
								renderWhenAllIsDefined(index);
							}, index);
						}
					}(i),
					function (index) {
						return function () {
							eventQuery.festivalList(
								{
									titleContains: 'helhus',
									dayspan: 6,
									limit: 1
								},
								function(json){
									findHelhus(json, index);
									nextAjaxQueue();
								}
							);
						}
					}(i)
				];

				nextAjaxQueue();
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
				setTimeout(
					function() {
						t.loadEvents(queryParams, async, callback, callbackArguments);
					},
					Math.random() * 700 + 300
				);
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
