// JavaScript Document

// POPUP, TOUR, TABS, CAROUSEL
// COMBOBOX, DATALIST, CHECKRADIO, FILE/DROP AREA
// REQUEST, SCROLL-TRIGGER, FORM

(function($, d) {
	/**
	 * Permits only one item at a time to be expanded.
	 * Items that are expanding will not respond... thus the item that initiated this will continue expanding.
	 */
	class PopupComponent extends d.ui.component {
		// Determines the best placement
		toWindow() {
			var main = this;
			var bestModalPlacement = null;
			for (var i = 0; i < main.params.placements.length; i ++) {
				if (!bestModalPlacement
				&& (main.params.placements[i].x || '').indexOf('before') == -1 && (main.params.placements[i].x || '').indexOf('after') == -1
				&& (main.params.placements[i].y || '').indexOf('before') == -1 && (main.params.placements[i].y || '').indexOf('after') == -1) {
					bestModalPlacement = main.params.placements[i];
				}
			}
			main.overlay = $(window).overlay(bestModalPlacement);
			// Save this before append to overlay
			var from = main.element.rect();
			var promise = main.element
				.appendTo(main.overlay)
				.playTranslateFrom(from, bestModalPlacement, main.params.timing);
			promise.then(() => {
				main.pushState('placement', {
					subject:0,
					target:window,
					x:bestModalPlacement.x.split('+')[0], 
					y:bestModalPlacement.y.split('+')[0],
				});
			});
			return promise;
		}
			
		// Determines the best placement
		toSubject(subject) {
			var main = this;
			subject = $(subject);
			var oldBackdrop = main.backdrop;
			if (main.params.backdrop) {
				main.backdrop = subject.backdrop();
				var elementZindex = parseInt(main.element.css('z-index').replace('auto', '') || 0);
				var subjectZindex = parseInt(main.registry.subject.css('z-index').replace('auto', '') || 0);
				if (elementZindex < subjectZindex) {
					main.element.css('z-index', subjectZindex + 500);
				}
				if (oldBackdrop !== main.backdrop) {
					main.backdrop.play({opacity: 1}, main.params.timing);
				}
			}
			if (oldBackdrop && (oldBackdrop !== main.backdrop || !main.params.backdrop)) {
				oldBackdrop.play({opacity: 0}, main.params.timing).then(oldBackdrop.remove);
			}
			// ----------------------------------------------------
			var bestPlacement = {};
			for (var i = 0; i < main.params.placements.length; i ++) {
				if (bestPlacement.perfect) {
					continue;
				}
				var placement = $.extend({}, main.params.placements[i]);
				var arrow = main._setArrow(placement, subject);
				var intersection = {};
				// We won't really snap just yet... We want to validate the offset first
				main.element.offsetTo(subject, placement, (calculatedOffsets) => {
					intersection = d.rect.intersection($(this).rectAtPosition(calculatedOffsets), d.rect(window));
				});
				// Is ghost perfectly fitting within window?
				if (intersection.width === intersection.rect1.width && intersection.height === intersection.rect1.height) {
					bestPlacement.perfect = true;
					bestPlacement.placement = placement;
					bestPlacement.arrow = arrow;
					continue;
				}
				var totalInacuracy = intersection.rect1.width - intersection.width + intersection.rect1.height - intersection.height;
				// Is this placement more accurate than previous ones?
				if ((bestPlacement.placement && totalInacuracy < bestPlacement.inacuracy)
				// Or first time?
				|| (!bestPlacement.placement)) {
					bestPlacement.inacuracy = totalInacuracy;
					bestPlacement.placement = placement;
					bestPlacement.arrow = arrow;
				}
			}
			if (bestPlacement.arrow && main.registry.arrow) {
				bestPlacement.arrow.alternateAnchor = true;
				main.registry.arrow
					.addClass('fa-arrow-' + bestPlacement.arrow.dir)
					.offsetTo(main.element, bestPlacement.arrow);
			}
			if (main.params.useTranslate) {
				var props = d.rect.translateTo(subject[0], bestPlacement.placement)
			} else {
				var props = d.rect.offsetTo(subject[0], bestPlacement.placement)
			}
			props.opacity = 1;
			var promise = $(this).play(props, main.params.timing);
			promise.then(() => {
				main.pushState('placement', {
					subject:1,
					target:subject,
					x:bestPlacement.placement.x.split('+')[0], 
					y:bestPlacement.placement.y.split('+')[0],
				});
			});
			return promise;
		}
		
		// With arrow
		_setArrow(popupPlacement, subject) {
			var main = this;
			if (!main.params.arrow.show) {
				return;
			}
			var arrow = {};
			var x = ((popupPlacement.x || '').match('before|after|start|end|center') || [])[0];
			var y = ((popupPlacement.y || '').match('before|after|start|end|center') || [])[0];
			if ((x === 'before' || x === 'after') && !(y === 'before' || y === 'after')) {
				arrow.dir = y === 'before' ? 'right' : 'left';
				var elementHeight = main.element.outerHeight();
				var indentation = Math.min(main.params.arrow.indentation, elementHeight/2);
				var isStartOrEnd = (x.match('start|end') || [])[0];
				arrow.y = isStartOrEnd ? isStartOrEnd + '+' + (indentation - main.params.arrow.width/2) : 'center';
				arrow.x = x === 'before' ? 'after' : 'before';
				var subjecHeight = subject.outerHeight();
				if (indentation > subjecHeight/2) {
					popupPlacement.y += '-' + (indentation - subjecHeight/2);
				}
				popupPlacement.x += '+' + main.params.arrow.width;
			} else if ((y === 'before' || y === 'after') && !(x === 'before' || x === 'after')) {
				arrow.dir = y === 'before' ? 'down' : 'up';
				var elementWidth = main.element.outerWidth();
				var indentation = Math.min(main.params.arrow.indentation, elementWidth/2);
				var isStartOrEnd = (x.match('start|end') || [])[0];
				arrow.x = isStartOrEnd ? isStartOrEnd + '+' + (indentation - main.params.arrow.width/2) : 'center';
				arrow.y = y === 'before' ? 'after' : 'before';
				var subjecWidth = subject.outerWidth();
				if (indentation > subjecWidth/2) {
					popupPlacement.x += '-' + (indentation - subjecWidth/2);
				}
				popupPlacement.y += '+' + main.params.arrow.width;
			} else {
				return;
			}
			return arrow;
		}
		
		// Open
		show(force) {
			var main = this;
			return new Promise((resolve, reject) => {
				if (!(main.state.hidden || typeof main.state.hidden === 'undefined')) {
					resolve();
					return;
				}
				if (!main.pushState('showing')) {
					reject();
					return;
				}
				// Let's save these so as to have the freedom to alter them	
				main.styleRestore = main.element.inlineRules(['position', 'display', 'opacity', 'left', 'right', 'top', 'bottom', 'z-index']);
				// Ensure it is now being rendered
				if (main.element.css('display') === 'none') {
					main.element.css('display', 'block');
				}
				if (main.element.css('position') === 'static') {
					main.element.css('position', 'relative');
				}
				if ((main.registry.subject || []).length) {
					main.toSubject(main.registry.subject).then(() => {main.pushState('shown'); resolve()}).catch(reject);
				} else {
					main.toWindow().then(() => {main.pushState('shown'); resolve()}).catch(reject);
				}
			});
		}
		
		// Open
		hide() {
			var main = this;
			return new Promise((resolve, reject) => {
				if (!(main.state.shown || typeof main.state.shown === 'undefined')) {
					resolve();
					return;
				}
				if (!main.pushState('hiding')) {
					reject();
					return;
				}
				var hideCalled = false;
				var hidden = function() {
					if (hideCalled) {
						return;
					}
					hideCalled = true;
					if (main.styleRestore) {
						main.element.css(main.styleRestore);
					}
					(main.backdrop || main.overlay || $()).remove();
					main.pushState('hidden');
					resolve();
				};
				if (main.styleRestore.opacity < 1 || main.backdrop || main.overlay) {
					if (main.styleRestore.opacity < 1) {
						main.element.play({opacity: main.styleRestore.opacity}, main.params.timing).then(hidden);
					}
					if (main.backdrop || main.overlay) {
						(main.backdrop || main.overlay).play({opacity: 0}, main.params.timing).then(hidden);
					}
				} else {
					hidden();
				}
			});
		}
	}
	
	// Add to UI
	d.ui.comp('popup', PopupComponent, {
		params: {
			selectors: {
				subject: '',
				arrow: {children: '.arrow'},
			},
			timing: {
				duration: 600,
			},
			useTranslate: false,
			placements: [
				{x: 'before', y: 'after',},
				{x: 'start', y: 'before',},
				{x: 'center', y: 'after',},
			],
			arrow: {
				indentation: 50,
				width: 12.5,
				show: 'auto',
			},
			backdrop: true,
		},
		// PushPullStates
		pushPullStates: [
			['showing', 'shown', 'hiding', 'hidden'],
			['onwindow', 'onsubject'],
		],
	});


	// -------------------------------------------------------------------
	// -------------------------------------------------------------------

	
	d.ui.alert = function(msg) {
		return new Promise((resolve, reject) => {
		});
	};
	
	d.ui.confirm = function(msg) {
		return new Promise((resolve, reject) => {
		});
	};
	
	d.ui.prompt = function(msg, defaultValue) {
		return new Promise((resolve, reject) => {
		});
	};
	
	d.ui.tour = function(msg, defaultValue) {
		return new Promise((resolve, reject) => {
		});
	};
	
})(jQuery, Dramatic);
