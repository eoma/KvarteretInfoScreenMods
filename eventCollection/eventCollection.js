var eventCollection = {
	currentEvent : null,
	currentEventRef : 0,
	eventReferences : [],
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

			eventApp.init();

			/*eventApp.state.limit = 10;*/
			/*eventApp.state.filter.dayspan = 7;*/
			eventApp.state.filter.onlySummaries = 1;

			if ($('.eventSlideTrigger').length > 0) {
				eventApp.refresh(callbackWhenFinished, true);
				triggerCallbackManually = false;
				
				t.eventSlideTriggerExists = true;
			}
		} else {

			console.log("t.eventSlideTriggerExists", t.eventSlideTriggerExists);

			if ( t.eventSlideTriggerExists ) {

				if (t.slideRuns > 1) {
					t.slideRuns = 0;

					console.log("Will refresh events");
					eventApp.refresh(callbackWhenFinished, true);
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
		return "eventCollection";
	},

	identifySlide : function (slide) {
		var t = this,
		    x,
		    ribbon,
		    childHeight;
		// Return true or false
		// will take control if true
		if (slide.hasClass('eventCollection')) {
			t.slide = slide;

			t.setupEventReferences();


			if ( ! t.slide.data("padded") && t.slide.find('ul.eventRibbon').hasClass('centerPadMe') ) {
				childHeight = 0;

				for (x = 0; x < t.eventReferences.length; x++) {
					childHeight += t.eventReferences[x].ribbon.outerHeight();
				}

				ribbon = t.slide.find("ul.eventRibbon");

				ribbon.css({
					paddingTop: (ribbon.height() - childHeight) / 2,
					paddingBottom: (ribbon.height() - childHeight) / 2
				});

				t.slide.data("padded", '1');
				console.log("padded");

			}

			return true;
		}
	},

	cycle : function () {
		var t = this;
		// Will do a single element cycle, will return true or next callback
		//  time if there are more elements to go through, false otherwise.

		t.nextEvent();

		if (t.currentEventRef <= (t.eventReferences.length - 1)) {
			return true;
		} else {
			return false;
		}
	},

	unbind : function () {
		var t = this;

		t.currentEvent.article.removeAttr('aria-selected', true);
		t.currentEvent.ribbon.removeAttr('aria-selected', true);

		t.slide = null;
		t.currentEvent = null;
		t.currentEventRef = 0;
		t.eventReferences = [];

		console.log('module ' + t.getName() + ' unbound from slide');
	},

	nextEvent : function () {
		// Will fade out previous event, fade in new event
		var t = this,
		    previousEvent = null;

		if (t.currentEvent != null) {
			previousEvent = t.currentEvent;
		}

		//console.log('t.currentEventRef', t.currentEventRef, 't.eventReferences.length', t.eventReferences.length);

		t.currentEvent = t.eventReferences[t.currentEventRef];

		if (t.currentEventRef >= t.eventReferences.length) {
			// This will cause an eternal cycle, keep your tabs on
			// t.currentEventRef and t.eventReferences.length
			t.currentEventRef = 0;
		} else {
			t.currentEventRef++;
		}

		//console.log(t.currentEvent);

		if (previousEvent === null) {
			//console.log('no previous event');
			t.currentEvent.article.attr('aria-selected', true);
			t.currentEvent.ribbon.attr('aria-selected', true);
		} else {
			//console.log('have previous event');
			previousEvent.article.removeAttr('aria-selected');
			previousEvent.ribbon.removeAttr('aria-selected');

			t.currentEvent.article.attr('aria-selected', true);
			t.currentEvent.ribbon.attr('aria-selected', true);
		}

		previousEvent = null;
	},

	setupEventReferences : function () {
		var t = this,
		    articleElements,
		    ribbonElements,
		    i;
		t.eventReferences = [];

		articleElements = t.slide.find('article');
		ribbonElements = t.slide.find('li');

		//console.log('will add ' + articleElements.length + ' objects to t.eventReferences');

		for (i = 0; i < articleElements.length; i++) {
			t.eventReferences.push({
				ribbon : ribbonElements.eq(i),
				article : articleElements.eq(i)
			});
		}

		//console.log('t.eventReferences now has ' + t.eventReferences.length + ' elements');

		t.currentEventRef = 0;

		articleElements = null;
		ribbonElements = null;
	}
};
