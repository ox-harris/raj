// JavaScript Document
(function($, d) {

	
	/**
	 * Item for an accordion.
	 */

	/**
	 * Permits only one item at a time to be expanded.
	 * Items that are expanding will not respond... thus the item that initiated this will continue expanding.
	 */
	class TransitionComponent extends d.ui.component {
		getAnimation() {
			var main = this;
			var animation = main.state.animation.play || '';
			var modifiers = animation.match('/(~)?(adv|dir|Adv|Dir|ADV|DIR)/');
			if (modifiers) {
				var advancement = main.state.animation.advancement || 1;
				advancement = modifiers[1] ? advancement * -1 : advancement;
				var orientation = main.state.animation.orientation || '';
				var adv = advancement === -1 ? 'backward' : 'forward';
				var dir = orientation === 'vertical' ? (advancement === -1 ? 'up' : 'down') : (advancement === -1 ? 'left' : 'right');
				var mod = (modifiers[2] || '').toLowerCase() === 'adv' ? adv : dir;
				mod = modifiers[2] === 'Adv' || modifiers[2] === 'Dir' ? d.str.toTitleCase(mod) : (modifiers[2] === 'ADV' || modifiers[2] === 'DIR' ? mod.toUpperCase() : mod);
				return animation.replace(/\/~?(adv|dir|Adv|Dir|ADV|DIR)\//, mod);
			}
			return animation;
		}
		
		animate(animationParams, callback) {
			var main = this;
			main.pushState('animation', $.extend(true, {}, main.state.animation || {}, animationParams));
			if (main.state.animation && main.state.animation.play) {
				if (main.currentAnimation) {
					main.currentAnimation.cancel();
				}
				main.state.animation.timing.cancelForCss = main.state.animation.timing.cancelForCss || false;
				main.currentAnimation = d.animation(main.element[0], main.getAnimation(), main.state.animation.timing, callback/*onfinish*/, callback/*on setup error, oncancel*/);
				main.currentAnimation.play();
			} else {
				callback();
			}
		}
	}
	
	// Add to UI
	d.ui.comp('transition', TransitionComponent, {});

	// ------------------------------------------------------
	// BASE TRANSITION/ITEM
	// ------------------------------------------------------
	
	class TransitionGroupComponent extends d.ui.component.list {
		init(initialStateObject) {
			super.init(initialStateObject);
			var main = this;
			if (main.params.autoplay) {
				main.autoplay();
				main.observe('env.hover || env.focus', (assertion) => {
					main.autoplay(!assertion);
				});
			}
		}
		
		addItem(itemComponent, initialStateObject) {
			super.addItem(itemComponent, initialStateObject);
			var main = this;
			if (main.registry.linksContainer && itemComponent.registry.link) {
				main.registry.linksContainer.append(itemComponent.registry.link.removeClass('d-none'));
			}
		}
		
		autoplay(state = true, permanent = false) {
			var main = this;
			if (state && main.params.autoplay && !main.autoplayInterval) {
				main.autoplayInterval = setInterval(() => {
					main.selectNext();
				}, main.params.autoplay);
			}
			if (state === false && main.autoplayInterval) {
				clearInterval(main.autoplayInterval);
				main.autoplayInterval = null;
				if (permanent) {
    				main.params._set('autoplay', state);
				}
			}
		}
		
		_orientation() {
			var main = this;
			return $.isArray(main.params.orientation) ? main.params.orientation._random() : main.params.orientation;
		}
		
		/**
		 * @see selectItem()
		 *
		 * @return Promise
		 */
		selectItems(itemComponentsOrIds, advancement) {
			var main = this;
			var orientation = main._orientation();
			var transition = main.params.transitions._random();

			return main.exec(itemComponentsOrIds, function(itemWidget, negate, advancement, timing/*now this is main.params.timing + transition.timing*/) {
				if (!arguments.length) {
					// This is a call to get currently selected items
					return main.state.items.selected;
				}
				
				if (itemWidget && negate) {
					// This is a call to deselect some other selected items
					var exitAnimation = $.extend({timing: d.obj.copyPlain(timing, ['duration', 'delay', 'easing', 'fill'])}, transition.exit, {advancement: advancement, orientation: orientation,});
					return itemWidget.deselect(true, exitAnimation);
				}
				
				if (main.params.autoHeight) {
					main.element.play({height: itemWidget.element.outerHeight()}, {duration:200});
				}
				var entryAnimation = $.extend({timing: d.obj.copyPlain(timing, ['duration', 'delay', 'easing', 'fill'])}, transition.entry, {advancement: advancement, orientation: orientation,});
				// This is a call to select the given item
				return itemWidget.select(true, entryAnimation);
			}, advancement, transition.timing);
		}
	}
		
	// Add to UI
	d.ui.comp('transitionGroup', TransitionGroupComponent, {
		// Params
		params: {
			triggers: {
				'prev.click': {selectPrev:null, autoplay:[false, true]},
				'next.click': {selectNext:null, autoplay:[false, true]},
				'navsContainer.swipeleft': {selectNext:null, autoplay:[false, true]},
				'navsContainer.swiperight': {selectPrev:null, autoplay:[false, true]},
				'linksContainer.click': {autoplay:[false, true]},
			},
			selectors: {
				navsContainer:{siblings:'.navs-container'},
				prev: {'navsContainer.find': '[rel="prev"]'},
				next: {'navsContainer.find': '[rel="next"]'},
				linksContainer:{siblings:'.links-container'},
			},
			flexOrder: true,
			max: 1,
			allowLoop: true,
			orientation: ['horizontal',],
			timing: {
				duration: 400,
				easing: 'ease-out',
				btwcasts: 0,
			},
			defaultSelected: 1,
			transitions: [
				//#{entry: {play:'slide/Dir/Return'}, exit: {play:'slide/~Dir/'}, timing: {btwcasts:false},},
				//#{entry: {play:'perspective/Dir/Return'}, exit: {play:'perspective/~Dir/'}, timing: {btwcasts:false},}, // But we need backface visibility to be off
				//{entry: {play:'tin/Dir/In'}, exit: {play:'tin/~Dir/Out'},},
				//#{entry: {play:'spaceIn/Dir/'}, exit: {play:'spaceOut/~Dir/'}, timing: {btwcasts:true},},
				//#{entry: {play:'fade_in'}, exit: {play:'fade_out'}, timing: {btwcasts:true, fill:'forwards',},},
				//#{entry: {play:'scale_/adv/_entry'}, exit: {play:'scale_/adv/_exit'}, timing: {btwcasts:true},},
				{entry: {play:'slide/Dir/Return'}, exit: {play:'scale_backward_exit'}, timing: {btwcasts:false},},
			],
			behaviours: {
				'items.first.selected || items.first.deselecting':{prev:'d-none'},
				'items.last.selected || items.last.deselecting':{next:'d-none'},
			},
		},
	});
	
	/**
	 * Item for an accordion.
	 */

	/**
	 * Permits only one item at a time to be expanded.
	 * Items that are expanding will not respond... thus the item that initiated this will continue expanding.
	 */
	class TransitionItemComponent extends d.classes(d.ui.component.transition, d.ui.component.item) {

		_execSelect(force, animationParams) {
			var main = this;
			return new Promise((resolve, reject) => {
				if (main.state.selected || main.state.selecting) {
					resolve();
					return false;
				}
				if (main.state.deselecting || main.pushState('selecting') === false) {
					reject();
					return false;
				}
				main.animate(animationParams, () => {
					main.pushState('selected');
					resolve();
				});
			});
		}
		
		_execDeselect(force, animationParams) {
			var main = this;
			return new Promise((resolve, reject) => {
				if (main.state.deselected || main.state.deselecting) {
					resolve();
					return false;
				}
				if (main.state.selecting || main.pushState('deselecting') === false) {
					reject();
					return false;
				}
				main.animate(animationParams, () => {
					main.pushState('deselected');
					resolve();
				});
			});
		}
	}
	
	// Add to UI
	d.ui.comp('transitionItem', TransitionItemComponent, {
		// Params
		params: {
			triggers: {
				'link.click': 'select',
			},
			selectors:{
				owner:{closest:'*[dramatic-transition-group]'},
			},
			behaviours: {
				'deselecting || deselected': {link: 'pd-sm cursor-pointer',},
				'selecting || selected': {link: 'pd-md',},
				selecting: {element: 'z-index-10',},
				selected: {element: 'z-index-50',},
				deselecting: {element: 'z-index-0',},
				deselected: {element: 'z-index-behind',},
			},
		},
	});
	
	// ------------------------------------------------------
	// BASE TAB/ITEM
	// ------------------------------------------------------
	
	/**
	 * Item for an accordion.
	 */

	class TabsManagerComponent extends d.ui.component.list {
		
		init(initialStateObject) {
			var main = this;
			main.translator = d.ui.userTransform.translate(main.registry.container, main.element, {
				directions: main.params.orientation === 'vertical' ? ['top', 'bottom'] : ['left', 'right'],
				edgeStretching: main.params.orientation === 'vertical' ? {top: 50, bottom: 50,} : {left: 50, right: 50,},
				acceleration: true,
				snapTo: () => {
					return main.items.elements;
				},
			});
			// Lets have a way of differentiating direct select from panning
			// --------------------------------------
			main.translator.observer.observe('panning', (panning) => {
				main.pushState('panning', panning);
			});
			// Both on panning and on direct select...
			// --------------------------------------
			main.translator.observer.observe('translation', (translation) => {
				if (main.params.orientation === 'vertical') {
					var container = main.registry.container.outerHeight();
					var offset = Math.abs(parseFloat(translation.y));
				} else {
					var container = main.registry.container.innerWidth();
					var offset = Math.abs(parseFloat(translation.x));
				}
				var itemsIds = Object.keys(main.items.components);
				var itemLength = container / itemsIds.length;
				var movableLength = container - itemLength;
				var tabNumber = Math.round(offset / itemLength);
				var overallProgress = offset / movableLength;
				var component = main.items.components[itemsIds[tabNumber]];
				component.select();
				//main.pushState('progress', overallProgress);
				if (main.registry.underline && itemsIds.length > 1) {
					// The whole number
					var advA = parseInt(offset / itemLength);
					// The decimal...
					var advProgress = (offset / itemLength) - advA;
					var axis = main.params.orientation === 'vertical' ? 'y' : 'x'; 
					var linkARect = d.rect(main.items.components[itemsIds[advA]].registry.link, axis, {offsetOrigin:true,});
					if (itemsIds[advA + 1]) {
						var linkBRect = d.rect(main.items.components[itemsIds[advA + 1]].registry.link, axis, {offsetOrigin:true,});
						if (axis === 'y') {
							linkARect.top += (linkBRect.top - linkARect.top) * advProgress;
							linkARect.height += (linkBRect.height - linkARect.height) * advProgress;
						} else {
							linkARect.left += (linkBRect.left - linkARect.left) * advProgress;
							linkARect.width += (linkBRect.width - linkARect.width) * advProgress;
						}
					}
					if (translation.play) {
						main.registry.underline.play(linkARect, {duration: 200,});
					} else {
						main.registry.underline.css(linkARect);
					}
				}
			});
			super.init(initialStateObject);
		}
		
		addItem(itemComponent, initialStateObject) {
			super.addItem(itemComponent, initialStateObject);
			var main = this;
			if (main.registry.linksContainer && itemComponent.registry.link) {
				main.registry.linksContainer.append(itemComponent.registry.link.removeClass('d-none'));
			}
		}
		
		/**
		 * @inheritdoc
		 *
		 * @return Promise
		 */
		selectItems(itemComponentsOrIds, advancement) {
			var main = this;
			return main.exec(itemComponentsOrIds, function(itemWidget, negate, advancement) {
				if (!arguments.length) {
					// This is a call to get currently selected items
					return main.state.items.selected;
				}
				
				if (itemWidget && negate) {
					// This is a call to deselect some other selected items
					return itemWidget.deselect(true);
				}
				
				if (!main.state.panning) {
					// This is a call to select the given item
					var components = Object.keys(main.items.components);
					var tabIndex = components.indexOf(itemWidget.id);
					var translation = {x: 0, y: 0,};
					if (main.params.orientation === 'vertical') {
						translation.y = - (tabIndex / components.length * main.registry.container.outerHeight());
					} else {
						translation.x = - (tabIndex / components.length * main.registry.container.outerWidth());
					}
					main.translator.translate(translation, null/*callback*/, true/*play*/, false/*plusActiveTransform*/);
				}
				return itemWidget.select(true);
			}, advancement);
		}
	}
	
	// Add to UI
	d.ui.comp('tabsManager', TabsManagerComponent, {
		params: {
			selectors: {
				container: null,
				underline: null,
				linksContainer: null,
				navsContainer: null,
			},
			allowLoop: false,
		},
	});
	
	/**
	 * Item for an accordion.
	 */

	class TabComponent extends d.ui.component.item {}
	
	// Add to UI
	d.ui.comp('tab', TabComponent, {
		// Params
		params: {
			triggers: {
				'link.click': 'select',
			},
			selectors:{
				owner:{closest:'*[dramatic-tabs-manager]'},
			},
			behaviours: {
				'deselecting || deselected': {link: 'cursor-pointer',},
				'selecting || selected': {link: 'active cursor-default',},
				selecting: {element: '',},
				selected: {element: '',},
				deselecting: {element: '',},
				deselected: {element: '',},
			},
		},
	});
	
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------

	/**
	 * Permits only one item at a time to be expanded.
	 * Items that are expanding will not respond... thus the item that initiated this will continue expanding.
	 */
	class WindowComponent extends d.ui.component.node {

	}
	
	// Add to UI
	d.ui.comp('window', WindowComponent, {});

})(jQuery, Dramatic);
