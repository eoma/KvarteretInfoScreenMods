jQuery(document).ready(function() {

	$.getScript(moduleUrl.resepsjon + '/jquery.jcarousel.min.js');

	$.get(moduleUrl.resepsjon + '/templates/_section.tmpl.html', function(templates) {
		// Inject all those templates at the end of the document.
		$('body').append(templates);
	});
});

var resepsjon = {
	currentPromo : null,
	currentPromoRef : 0,
	promoReferences : [],
	slide : null,

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

			t.setupPromoReferences();

			//if (t.slide.find('')

			/*t.slide.find('.events').jcarousel({
				vertical: true,
				scroll: 1,
				auto: 2,
				wrap: 'circular',
				visible: 2,
			});*/

			return true;
		}
	},

	cycle : function () {
		var t = this;
		// Will do a single element cycle, will return true or next callback
		//  time if there are more elements to go through, false otherwise.

		t.nextPromo();

		if (t.currentPromoRef <= (t.promoReferences.length - 1)) {
			return true;
		} else {
			return false;
		}
	},

	nextPromo : function () {
		// Will fade out previous event, fade in new event
		var t = this;

		if (t.currentPromo !== null) {
			t.currentPromo.removeAttr('aria-selected');
		}

		//console.log('t.currentPromoRef', t.currentPromoRef, 't.promoReferences.length', t.promoReferences.length);

		t.currentPromo = t.promoReferences.eq(t.currentPromoRef);

		if (t.currentPromoRef >= t.promoReferences.length) {
			// This will cause an eternal cycle, keep your tabs on
			// t.currentPromoRef and t.promoReferences.length
			t.currentPromoRef = 0;
		} else {
			t.currentPromoRef++;
		}

		//console.log(t.currentPromo);

		t.currentPromo.attr('aria-selected', true);
	},


	unbind : function () {
		var t = this;

		if (t.currentPromo !== null) {
			t.currentPromo.removeAttr('aria-selected');
		}

		//t.slide.find('.events').jcarousel('destroy');

		t.slide = null;
		t.currentPromo = null;
		t.currentPromoRef = 0;
		t.promoReferences = [];

		console.log('module ' + t.getName() + ' unbound from slide');
	},

	setupPromoReferences : function () {
		var t = this;
		t.promoReferences = t.slide.find('.photoElem');
		t.currentPromoRef = 0;
	}
};
