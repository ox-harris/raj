// JavaScript Document
// main\.elements\.([a-zA-Z_]+)				main.registry.get('$1')
(function($, d) {
	
	class CollapsibleComponent extends d.ui.component {
		// Constructor
		init(initialStateObject) {
			var main = this;
			if (main.params.preferredState.key) {
				main.preferredState = d.ask(main.params.preferredState.key);
				initialStateObject[main.preferredState.answer] = true;
			}
			main.body = main.registry.body || main.element;
			// Lets apply wakeup states
			main.pushState('animation', main.params.animation);
			if (initialStateObject.expanded) {
				main.pushState('expanded');
			} else {
				main.pushState('collapsed');
			}
		}
		
		// Wakeup
		makeProps(state, animationParams) {
			var main = this;
			if (animationParams.props && animationParams.props[state/*expand|collapse*/]) {
				return d.obj.copyPlain(animationParams.props[state]);
			}
			var props = {};
			if (animationParams.orientation === 'horizontal' || animationParams.orientation === 'both') {
				props.width = state === 'expand' ? '100%' : 0;
			}
			if (animationParams.orientation === 'vertical' || animationParams.orientation === 'both') {
				props.height = state === 'expand' ? 'auto' : 0;
			}
			return props;
		}
		
		// Expand
		expand(force, animationParams) {
			var main = this;
			return new Promise((resolve, reject) => {
				if (!(main.state.collapsed || typeof main.state.collapsed === 'undefined')) {
					resolve();
					return;
				}
				
				animationParams = $.extend(true, {}, main.params.animation, animationParams);
				if (animationParams.expandDelay && !force) {
					clearTimeout(main.expandDelay);
					main.expandDelay = setTimeout(function() {
						main.expand(true/*force*/).then(resolve);
					}, animationParams.expandDelay);
					
					return;
				}
		
				// Must be available in state as "expanding" and "expanded" are pushed
				main.pushState('animation', animationParams);
				// Ask permission
				if (main.pushState('expanding') === false) {
					reject();
					return;
				}
				
				var expansionPropsOriginal = main.makeProps('expand', animationParams);
				var expansionProps = d.obj.copyPlain(expansionPropsOriginal);
				var axes = [];
				if (expansionProps.width === 'auto') {
					axes.push('width');
				}
				if (expansionProps.height === 'auto') {
					axes.push('height');
				}
				if (axes.length) {
					expansionProps = $.extend(expansionProps, d.rect.size.atMax(main.body[0], axes));
				}
				// Kind of important
				main.body.css(d.rect.size.atMin(main.body[0], axes));
				main._exec(expansionProps, d.obj.copyPlain(animationParams, ['duration', 'easing']), () => {
					main.body.css(expansionPropsOriginal);
					if (main.scroll_seizure) {
						main.scroll_seizure.seizeScrolling();
					}
					// Update state				
					main.pushState('expanded');
					main.saveState();
					resolve();
				}, true/*backwardsState*/);
			});
		}
		
		// Collapse
		collapse(force, animationParams) {
			var main = this;
			return new Promise((resolve, reject) => {
				if (!(main.state.expanded || typeof main.state.expanded === 'undefined')) {
					resolve();
					return;
				}
	
				animationParams = $.extend(true, {}, main.params.animation, animationParams);
				if (animationParams.collapseDelay && !force) {
					clearTimeout(main.collapseDelay);
					main.collapseDelay = setTimeout(function() {
						main.collapse(true/*force*/).then(resolve);
					}, animationParams.collapseDelay);
					return;
				}
				
				// Must be available in state as "collapsing" and "collapsed" are pushed
				main.pushState('animation', animationParams);
				// Ask permission
				if (main.pushState('collapsing') === false) {
					reject();
					return;
				}

				if (main.scroll_seizure) {
					main.scroll_seizure.seizeScrolling();
				}
				
				var collapsingPropsOriginal = main.makeProps('collapse', animationParams);
				var collapsingProps = d.obj.copyPlain(collapsingPropsOriginal);
				var axes = [];
				if (collapsingProps.width === 'auto') {
					axes.push('width');
				}
				if (collapsingProps.height === 'auto') {
					axes.push('height');
				}
				if (axes.length) {
					collapsingProps = $.extend(collapsingProps, d.rect.size.atMin(main.body[0], axes));
				}
				main._exec(collapsingProps, d.obj.copyPlain(animationParams, ['duration', 'easing']), () => {
					main.body.css(collapsingPropsOriginal);
					// Update state				
					main.pushState('collapsed');
					main.saveState();
					resolve();
				});
			});
		}
		
		// Internal
		_exec(props, timing, callback) {
			var main = this;
			if (Object.keys(props).length) {
				main.currentAnimation = d.animation(main.body[0], props, timing, callback);
				main.currentAnimation.play();
			} else {
				setTimeout(function() {
					callback();
				}, timing.duration)
			}
		}
		
		// Toggle
		toggle() {
			var main = this;
			if(main.state.expanded) {
				return main.collapse();
			} else {
				return main.expand();
			}
		}
		
		// Save state
		saveState() {
			var main = this;
			// Save response	
			if (main.preferredState && typeof main.preferredState.answer === 'undefined') {
				var currentOpenState = main.state.expanded ? 'expanded' : 'collapsed';
				// No response since this session. Prompt user for response.
				main.element.confirm('Should this always be ' + currentOpenState + '?', function(user_response) {
					main.preferredState.save(currentOpenState, main.params.preferredState.validity || 'always');
				}, {btn1:'Yes', btn2:'No'}, {popup_name:main.params.preferredState.key, ask_preferred_recurrence:true/*'next-session'*/});
			}
		}
	}
	
	// Add to UI
	d.ui.comp('collapsible', CollapsibleComponent, {
		// Params
		params: {
			triggers: {
				'control.click': 'toggle',
			},
			selectors: {
				control: '',
				controlIcon: '',
			},
			behaviours: {
				'expanding || expanded': {
					control: 'active',
					controlIcon: 'active',
				},
				'collapsed && animation ? (animation.orientation != "horizontal" ? "ht-0" : "") + (animation.orientation != "vertical" ? " wt-0" : "") : ""': {
					'body.addClass': '$',
				},
				'!collapsed && animation ? (animation.orientation != "horizontal" ? "ht-0" : "") + (animation.orientation != "vertical" ? " wt-0" : "") : ""': {
					'body.removeClass': '$',
				},
			},
			animation: {
				orientation: 'vertical',
				delay: 0,
				duration: 400,
				props: {},
			},
			preferredState: {key:null,},
		},
		// PushPullStates
		pushPullStates: [
			['expanding', 'expanded', 'collapsing', 'collapsed'],
		],
		attrBindings: {
			expanded: 'aria-expanded',
		},
	});
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	
	/**
	 * Permits only one item at a time to be expanded.
	 * Items that are expanding will not respond... thus the item that initiated this will continue expanding.
	 */
	class AccordionComponent extends d.ui.component.list {
		
		addItem(itemComponent, initialStateObject) {
			super.addItem(itemComponent, initialStateObject);
			var main = this;
			if (main.registry.linksContainer && itemComponent.registry.link) {
				main.registry.linksContainer.append(itemComponent.registry.link.removeClass('d-none'));
			}
			if (main.params.animation) {
				itemComponent.params._merge({animation: main.params.animation});
			}
		}
	}
	
	// Add to UI
	d.ui.comp('accordion', AccordionComponent, {
		// Accept
		accept: ['collapsibleItem'],
		// Params
		params: {
			max:1,
			defaultSelected: 1,
			animation: {
				duration: 200,
			},
		},
	});
	
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	
	/**
	 * Item for an accordion.
	 */

	/**
	 * Permits only one item at a time to be expanded.
	 * Items that are expanding will not respond... thus the item that initiated this will continue expanding.
	 */
	class CollapsibleItemComponent extends d.classes(d.ui.component.item, d.ui.component.collapsible) {
		
		init(initialStateObject) {
			super.init(initialStateObject);
			var main = this;
			if (initialStateObject.selected) {
				main.pushState('expanded');
			} else {
				main.pushState('collapsed');
			}
		}
		
		_execSelect(force, animationParams) {
			var main = this;
			return this.expand(force, animationParams);
		}
		
		_execDeselect(force, animationParams) {
			var main = this;
			return main.collapse(force, animationParams);
		}
	}
	
	// Add to UI
	d.ui.comp('collapsibleItem', CollapsibleItemComponent, {
		// Params
		params: {
			triggers: {
				'control.click': 'toggle',
			},
			behaviours: {
				'selecting ? (animation.advancement > -1 ? "flex-y-start" : "flex-y-end") : (deselecting ? (animation.advancement > -1 ? "flex-y-end" : "flex-y-start") : "")': {
					'body.addClass': '$',
				},
				'selecting ? (animation.advancement > -1 ? "flex-y-end" : "flex-y-start") : (deselecting ? (animation.advancement > -1 ? "flex-y-start" : "flex-y-end") : "")': {
					'body.removeClass': '$',
				},
			},
		},
		// State Aliases
		statesAliases: {
			expanding: 'selecting',
			expanded: 'selected',
			collapsing: 'deselecting',
			collapsed: 'deselected',
		},
		attrBindings: {
			highlighted: 'aria-highlighted',
			selected: 'aria-selected',
			restored: 'aria-restored',
			hidden: 'aria-hidden',
		},
	});
	
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	
	/**
	 * Functions as both collection and collapsible.
	 */
	class CollapsibleNodeComponent extends d.classes(d.ui.component.node, d.ui.component.collapsible) {

		_execSelect() {
			var main = this;
			var expand = main.expand();
			if (expand) {
				return Promise.all(expand, main.restoreItems());
			}
		}
		
		_execDeselect() {
			var main = this;
			var collapse = main.collapse();
			if (collapse) {
				return Promise.all(collapse, main.deselectItems(main.items.components));
			}
		}
		
		_execRestore() {
			var main = this;
			if (main.state.restored || main.state.restoring || main.pushState('restoring') === false) {
				return false;
			}
			var expand = main.expand();
			if (expand) {
				return Promise.all(expand, main.deselectItems(main.items.components)).then(() => {
					main.pushState('restored');
				});
			}
		}
	}
	
	// Add to UI
	d.ui.comp('collapsibleNode', CollapsibleNodeComponent, {
		// Params
		params: {
			behaviours: {
				// Untie "control" & "icon" from expand/collapse...
				'expanding || expanded': null,
				// Tie to maximiz(ing|ed)...
				'selecting || selected': {
					control: 'active',
					controlIcon: 'active',
				},
			},
		},
		// States Aliases
		statesAliases: {
			expanding: 'selecting',
			expanded: 'selected',
			collapsing: 'deselecting',
			collapsed: 'deselected',
		},
		attrBindings: {
			highlighted: 'aria-highlighted',
			selected: 'aria-selected',
			restored: 'aria-restored',
			hidden: 'aria-hidden',
		},
	});

})(jQuery, Dramatic);
