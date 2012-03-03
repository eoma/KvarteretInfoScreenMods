"use strict";

jQuery(document).ready(function() {

	$.get(moduleUrl.resepsjon + '/templates/_section.tmpl.html', function(templates) {
		// Inject templates at the end of the document.
		$('body').append(templates);
	});
});

(function($) {
    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    }
})(jQuery);

var resepsjon = {
	promo : {
		current : null,
		currentRef : 0,
		ref : [],
	},

	sheet : {
		current : null,
		currentRef : 0,
		ref : [],
	},

	id : { promo: 0, sheet: 1 },

	slide : null,

	duration : {
		table : {},
		tableIndex : [],
		current : 0,
		duration : 10 * 1000,
	},

	initialized : false,
	slideRuns : 0,
	eventSlideTriggerExists : false,

	initialize : function (callbackWhenFinished) {
		var t = this;
		// To be used at every start of a new slide cycle.

		var triggerCallbackManually = true;

		if ( ! t.initialized ) {
			t.initialized = true;

			resepsjonApp.init();

			/*eventApp.state.limit = 10;*/
			resepsjonApp.state.filter.dayspan = 3;
			resepsjonApp.state.filter.onlySummaries = 1;

			if ($('.resepsjonTrigger').length > 0) {
				resepsjonApp.refresh(callbackWhenFinished, true);
				triggerCallbackManually = false;
				
				t.eventSlideTriggerExists = true;
			}
		} else {

			console.log("t.resepsjonTriggerExists", t.eventSlideTriggerExists);

			if ( t.eventSlideTriggerExists ) {

				if (t.slideRuns > 3) {
					t.slideRuns = 0;

					console.log("Will refresh events");
					resepsjonApp.refresh(callbackWhenFinished, true);
					triggerCallbackManually = false;
				}

				t.slideRuns++;
			}
		}

		if (triggerCallbackManually) {
			callbackWhenFinished();
		}
	},

	getName : function () {
		return "resepsjon";
	},

	identifySlide : function (slide) {
		var t = this,
		    x,
		    ribbon,
		    childHeight;
		// Return true or false
		// will take control if true
		if (slide.hasClass('resepsjon')) {
			t.slide = slide;

			t.setupReferences();
			
			t.initDuration();
			
			var promoNum = t.promo.ref.length;
			var sheetNum = t.sheet.ref.length;
			
			if ( (promoNum > 0) && (sheetNum > 0) ) {
				var maxObj = { num: 0, id: -1 };
				var minObj = { num: 0, id: -1 };
				
				if (promoNum > sheetNum) {
					maxObj.num = promoNum;
					maxObj.id = t.id.promo;
					
					minObj.num = sheetNum;
					minObj.id = t.id.sheet;
				} else {
					maxObj.num = sheetNum;
					maxObj.id = t.id.sheet;

					minObj.num = promoNum;
					minObj.id = t.id.promo;
				}

				var scaleFactor = 1;

				if (minObj.num > 1) {
					while (maxObj.num / (minObj.num * scaleFactor) > 1.5) {
						scaleFactor += 1;
					}
				}

				for (var i = 1; i < maxObj.num; i++) {
					var time = i * t.duration.duration;

					if (typeof t.duration.table[time] === 'undefined') {
						t.duration.table[time] = [];
					}
					t.duration.table[time].push(maxObj.id);
				}
				
				for (var i = 1; i < scaleFactor * minObj.num; i++) {
					var time = Math.floor(i * t.duration.duration * maxObj.num / (minObj.num * scaleFactor));

					if (typeof t.duration.table[time] === 'undefined') {
						t.duration.table[time] = [];
					}
					t.duration.table[time].push(minObj.id);
				}
				
				t.duration.tableIndex = t.getKeys(t.duration.table);
				t.duration.tableIndex.sort(function (a, b) {
					return a - b;
				});
				
				//console.log(t.duration.tableIndex);
			} else if (sheetNum > 0) {
				// No promo
			} else if (promoNum > 0) {
				// No sheets
			} else {
				// Nothing
			}

			return true;
		}
	},

	cycle : function () {
		var t = this;
		// Will do a single element cycle, will return true or next callback
		//  time if there are more elements to go through, false otherwise.

		var retVal = false;

		if (t.duration.current == -1) {
			t.nextTransition(t.promo);
			t.nextTransition(t.sheet);
			
			t.duration.current++;
			
			retVal = parseInt(t.duration.tableIndex[t.duration.current], 10);

			t.scrollSheetIfNecessary(t.duration.duration - 400);
		} else {
			var prev = t.duration.tableIndex[t.duration.current];
			
			console.log(prev, t.duration.table[prev],
			            $.inArray(t.id.promo, t.duration.table[prev]),
			            $.inArray(t.id.sheet, t.duration.table[prev])
			);
			
			if ($.inArray(t.id.promo, t.duration.table[prev]) >= 0) {
				t.nextTransition(t.promo);
			}
			
			if ($.inArray(t.id.sheet, t.duration.table[prev]) >= 0) {
				t.nextTransition(t.sheet);
				t.scrollSheetIfNecessary(t.duration.duration - 400);
			}
			
			if (t.duration.current < t.duration.tableIndex.length - 1) {
				retVal = parseInt(t.duration.tableIndex[t.duration.current + 1] - prev, 10);
				t.duration.current++;
			} else {
				retVal = false;
			}
		}

		console.log("retVal", retVal, typeof retVal);

		return retVal;
	},

	nextTransition : function (transObj) {
		if (transObj.current !== null) {
			transObj.current.removeAttr('aria-selected');
		}

		//console.log('t.currentPromoRef', t.currentPromoRef, 't.promoReferences.length', t.promoReferences.length);

		transObj.current = transObj.ref.eq(transObj.currentRef);

		//console.log(t.currentPromo);

		transObj.current.attr('aria-selected', true);

		if (transObj.currentRef < transObj.ref.length - 1) {
			// This will cause an eternal cycle, keep your tabs on
			// t.currentPromoRef and t.promoReferences.length
			transObj.currentRef++;
		} else {
			transObj.currentRef = 0;
		}
	},

	scrollSheetIfNecessary : function (time) {
		var t = this;

		var elem = t.sheet.current;

		console.log(elem.hasScrollBar(), elem.outerHeight(true) - elem.get(0).scrollHeight);

		if (elem.hasScrollBar()) {
			console.log('will scroll');

			elem
				.animate(
					{
						scrollTop: Math.abs(elem.outerHeight(true) - elem.get(0).scrollHeight)
					},
					(time - 1000)/2
				)
				.delay(1000)
				.animate(
					{
						scrollTop: 0
					},
					(time - 1000)/2
				)
			;
		}
	},

	unbind : function () {
		var t = this;

		if (t.promo.current !== null) {
			t.promo.current.removeAttr('aria-selected');
		}

		if (t.sheet.current !== null) {
			t.sheet.current.removeAttr('aria-selected');
		}

		t.initState();

		t.slide = null;

		console.log('module ' + t.getName() + ' unbound from slide');
	},

	setupReferences : function () {
		var t = this;
		t.promo.ref = t.slide.find('.photoElem');
		t.promo.currentRef = 0;
		
		t.sheet.ref = t.slide.find('.sheetstack > li');
		t.sheet.currentRef = 0;
	},
	
	getKeys : function(obj) {
		var keys = [];
		for(var key in obj) {
			if (obj.hasOwnProperty(key)) {
				keys.push(key);
			}
		}
		return keys;
	},
	
	initState : function () {
		var t = this;

		t.duration.table = {};
		t.duration.tableIndex = [];
		t.duration.current = -1;

		t.promo.current = null;
		t.promo.currentRef = 0;
		t.promo.ref = [];

		t.sheet.current = null;
		t.sheet.currentRef = 0;
		t.sheet.ref = [];
	},
};
