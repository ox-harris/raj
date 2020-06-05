// JavaScript Document
(function($, d) {


	// ------------------------------------------------------
	// BASE COLLECTION/ITEM
	// ------------------------------------------------------
	
	
	class CollectionComponent extends d.ui.component {
		
		init(initialStateObject) {
			var main = this;
			main.items = {/*obj*/components:{}, /*arr*/elements:[],};
			main.state.items = {};
		}
		
		/**
		 * Adopts a listitem into this listbox.
		 *
		 * @param object itemComponent
		 *
		 * @return void
		 */
		addItem(itemComponent, initialStateObject) {
			var main = this;
			
			if ((main.acceptInstances && main.acceptInstances.indexOf(itemComponent.namespace) < 0)
			|| (main.acceptImplementation && !d.obj.implementsMethods(main.acceptImplementation, itemComponent))) {
				return;
			}

			// Add to list
			// -----------------------
			// Obj
			main.items.components[itemComponent.id] = itemComponent;
			// Arr
			main.items.elements.push(itemComponent.element[0]);
			
			// Follow state...
			// Notice below that we're not going to log state using pushState().
			// Let it be one-off trigering for both event listeners and state-change-only handlers
			// -----------------------
			itemComponent.observe((stateName, stateData) => {
				//main.pushState('item.' + stateName, stateData === false ? false : itemComponent);
				if (stateData === false) {
					(main.state.items[stateName] || [])._remove(itemComponent.id);
				} else {
					// First time?
					if (!main.state.items[stateName]) {
						main.state.items[stateName] = [];
					}
					main.state.items[stateName]._pushUnique(itemComponent.id);
				}
				main.showStats();
			});
			
			itemComponent.element.observeRemoved(function() {
				// Object
				$.each(main.state.items, (name, states) => {
					states._remove(itemComponent.id);
				});
				// Obj
				delete main.items.components[itemComponent.id];
				// Arr
				main.items.elements._remove(itemComponent.element[0]);
				main.showStats();
			});
		}
		
		/**
		 * Returns an item by name,
		 * whichever way a collection decides an item name.
		 *
		 * @param string itemName
		 *
		 * @return object
		 */
		namedItem(itemName) {
			var main = this;
			var component = null;
			$.each(main.items.components, (id, comp) => {
				if (id === itemName) {
					component = comp;
				}
			});
			return component;
		}
		
		/**
		 * Takes statistcs of states.
		 *
		 * @return void
		 */
		showStats() {
			var main = this;
			main.state.items.all = main.items.elements.length;
			main.state.items.first = main.items.components[Object.keys(main.items.components)._first()].state;
			main.state.items.last = main.items.components[Object.keys(main.items.components)._last()].state;
			main.pushState('items', main.state.items);
		}
	
		/**
		 * Executes a call on the given items, or list of items, using some list-based algorythms.
		 *
		 * @param int|array|object	idsEntering
		 * @param function		 	callback
		 * @param int			 	advancement
		 * @param object		 	timing
		 *
		 * @return void
		 */
		exec(idsEntering, callback, advancement, timing) {
			var main = this;
			// TO BE ACTIVATED
			idsEntering = main._toItemIds(idsEntering);
			if (!idsEntering.length || typeof callback !== 'function') {
				return;
			}
			
			timing = $.extend(true, {}, main.params.timing, timing);
			
			// INPAIRS?
			if (timing.exec === 'paired' && idsEntering.length > 1) {
				return idsEntering._inSequence(id => {return main.exec(id, callback, advancement, timing)}, timing.btwpairs);
			}
			
			// TO BE DEACTIVATED
			var idsExiting = [];
			var current = callback() || [];
			// Is this forward or backward relative to current...
			var items = Object.keys(main.items.components);
			if (!advancement) {
				advancement = items._followingAll(current._last(), null, false/*allowLoop*/)._intersect(idsEntering).length === 0
					&& items._precedingAll(current._first(), null, false/*allowLoop*/)._intersect(idsEntering).length ? -1 : 1;
			}
			if (main.params.max && current.length + idsEntering.length > main.params.max) {
				idsExiting = (advancement === -1 ? current.slice().reverse() : current).slice(0, current.length + idsEntering.length - main.params.max);
			}
			idsEntering = idsEntering._difference(idsExiting);
			if (!idsEntering.length) {
				return;
			}
			
			// INGROUPS?
			return [0, 1]._inSequence(i => {
				if (i === 0) {
					// ALL - negative action
					return idsExiting._inSequence(id => {
						return callback(main.items.components[id], true/*negate*/, advancement, timing);
					}, timing.btwmultiples);
				} else {
					// ALL - positive action
					return idsEntering._inSequence(id => {
						return callback(main.items.components[id], false/*negate*/, advancement, timing);
					}, timing.btwmultiples);
				}
			}, timing.btwcasts);
		}
		
		_toItemIds(ids) {
			return $.isArray(ids) 
				? ids.map(id => typeof id === 'object' ? id.id : id) 
				: (typeof ids === 'object' ? [ids.id] : [ids]);
		}
	}
	
	// Add to UI
	d.ui.comp('collection', CollectionComponent, {
		// Params
		params: {
			timing: {
				btwcasts: 0, 			// {delay:..., sync:...}	|	<number>	|	<boolean>	|	'last'
				btwmultiples: 'last', 	// {delay:..., sync:...}	|	<number>	|	<boolean>	|	'last'
				btwnpairs: 'last', 		// {delay:..., sync:...}	|	<number>	|	<boolean>	|	'last'
				exec: null, 			// paired
			},
		},
	});
	
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	
	class ListComponent extends CollectionComponent {	
		init(initialStateObject) {
			super.init(initialStateObject);
			var main = this;
			main.bindTrigger(main.element, 'keydown&key.length=1&key!=` `', (e) => {
				main.goto(e.key);
			});
		}
		
		addItem(itemComponent, initialStateObject) {
			super.addItem(itemComponent, initialStateObject);
			var main = this;
			if (d.isNumeric(main.params.defaultSelected) || $.isArray(main.params.defaultSelected)) {
				initialStateObject.selected = (d.isNumeric(main.params.defaultSelected) ? [main.params.defaultSelected] : main.params.defaultSelected)
					.filter(index => index === main.items.elements.length).length;
			}
			if (d.isNumeric(main.params.defaultHighlighted) || $.isArray(main.params.defaultHighlighted)) {
				initialStateObject.highlighted = (d.isNumeric(main.params.defaultHighlighted) ? [main.params.defaultHighlighted] : main.params.defaultHighlighted)
					.filter(index => index === main.items.elements.length).length;
			}
		}
		
		/**
		 * Highlights items but dehighlights others first on a non-multiple collection.
		 *
		 * @param int|object itemComponentsOrIds
		 * @param int		 advancement
		 *
		 * @return Promise
		 */
		highlightItems(itemComponentsOrIds, advancement) {
			var main = this;
			return main.exec(itemComponentsOrIds, function(itemComponent, negate, advancement, timing) {
				if (!arguments.length) {
					// This is a call to get currently highlighted items
					return main.state.items.highlighted;
				}
				
				if (itemComponent && negate) {
					// This is a call to dehighlight some other highlighted items
					return itemComponent.dehighlight(true, {advancement:advancement,});
				}
				
				// This is a call to highlight the given item
				return itemComponent.highlight(true, {advancement:advancement,});
			}, advancement);
		}
		
		/**
		 * Dehighlights items.
		 *
		 * @param int|object itemComponentsOrIds
		 * @param int		 advancement
		 *
		 * @return Promise
		 */
		dehighlightItems(itemComponentsOrIds, advancement) {
			var main = this;
			if (main.params.min && main.state.items.highlighted && main.params.min >= main.state.items.highlighted.length) {
				return main;
			}
			return main._toItemsIds(itemComponentsOrIds)._inSequence(function(id) {
				return main.items.components[id].dehighlight(true, {advancement:advancement,});
			}, 'last');
		}
		
		/**
		 * Highlights the given number of Items that are BEFORE the currently highlighted ones.
		 *
		 * @param int qty
		 *
		 * @return Promise
		 */
		highlightPrev(qty) {
			var main = this;
			var firstOfHighlighted = (main.state.items.highlighted || [])._first();
			var prev = Object.keys(main.items.components)._precedingAll(firstOfHighlighted, qty || 1, main.params.allowLoop);
			return main.highlightItems(prev, -1/*advancement*/);
		}
		
		/**
		 * Highlights the given number of Items that are AFTER the currently highlighted ones.
		 *
		 * @param int qty
		 *
		 * @return Promise
		 */
		highlightNext(qty) {
			var main = this;
			var lastOfHighlighted = (main.state.items.highlighted || [])._last();
			var next = Object.keys(main.items.components)._followingAll(lastOfHighlighted, qty || 1, main.params.allowLoop);
			return main.highlightItems(next, 1/*advancement*/);
		}
		
		/**
		 * Selects items but deselects others first on a non-multiple collection.
		 *
		 * @param int|object itemComponentsOrIds
		 * @param int		 advancement
		 *
		 * @return Promise
		 */
		selectItems(itemComponentsOrIds, advancement) {
			var main = this;
			return main.exec(itemComponentsOrIds, function(itemComponent, negate, advancement, timing) {
				if (!arguments.length) {
					// This is a call to get currently selected items
					return main.state.items.selected;
				}
				
				if (itemComponent && negate) {
					// This is a call to "deselect" some other selected items
					return itemComponent.deselect(true, {advancement:advancement,});
				}
				
				// This is a call to select the given item
				return itemComponent.select(true, {advancement:advancement,});
			}, advancement);
		}
		
		/**
		 * Deselects items.
		 *
		 * @param int|object 	itemComponentsOrIds
		 * @param int			advancement
		 *
		 * @return Promise
		 */
		deselectItems(itemComponentsOrIds, advancement) {
			var main = this;
			if (main.params.min && main.state.items.selected && main.params.min >= main.state.items.selected.length) {
				return;
			}
			return main._toItemsIds(itemComponentsOrIds)._inSequence(function(id) {
				return main.items.components[id].deselect(true, {advancement:advancement,});
			}, 'last');
		}
		
		/**
		 * Selects the given number of Items that are BEFORE the currently selected ones.
		 *
		 * @param int qty
		 *
		 * @return Promise
		 */
		selectPrev(qty) {
			var main = this;
			var firstOfSelected = (main.state.items.selected || [])._first();
			var prev = Object.keys(main.items.components)._precedingAll(firstOfSelected, qty || 1, main.params.allowLoop);
			return main.selectItems(prev, -1/*advancement*/);
		}
		
		/**
		 * Selects the given number of Items that are AFTER the currently selected ones.
		 *
		 * @param int qty
		 *
		 * @return Promise
		 */
		selectNext(qty) {
			var main = this;
			var lastOfSelected = (main.state.items.selected || [])._last();
			var next = Object.keys(main.items.components)._followingAll(lastOfSelected, qty || 1, main.params.allowLoop);
			return main.selectItems(next, 1/*advancement*/);
		}
		
		/**
		 * Selects all the items that are currently higlighted.
		 *
		 * @return Promise
		 */
		selectHighlighted() {
			var main = this;
			return main.selectItems(main.state.items.higlighted || []);
		}
		
		/**
		 * Restores items from their selected/deselected state.
		 *
		 * @param int|object 	itemComponentsOrIds
		 * @param int			advancement
		 *
		 * @return Promise
		 */
		restoreItems(itemComponentsOrIds, advancement) {
			var main = this;
			return main._toItemsIds(itemComponentsOrIds)._inSequence(function(id) {
				return main.items.components[id].restore(true, {advancement:advancement,});
			}, 'last');
		}
		
		/**
		 * Runs through each item to match the given accessKey.
		 *
		 * @param string accessKey
		 * @param bool	 select
		 *
		 * @return void
		 */
		goto(accessKey, select) {
			var main = this;
			var textSource = function() {
				return main.items.components[id].element.text();
			};
			var last = main.state.items[select ? 'selected' : 'highlighted']._last();
			var items = last ? Object.keys(main.items.components)._followingAll(last) : Object.keys(main.items.components);
			$(items).filterByAccessKey(accessKey, textSource, (matches, failures) => {
				failures.forEach(id => {main.items.components[id][select ? 'deselected' : 'dehighlighted']()});
				matches.forEach(id => {main.items.components[id][select ? 'selected' : 'highlighted']()});
				$(matches).scrollIntoView();
			});
		}
		
		/**
		 * Runs through each item to match the given text.
		 *
		 * @param string	order
		 *
		 * @return void
		 */
		sort(order) {
			var main = this;
			var textSource = function(id, i) {
				if (!order) {
					// Here comes "sort-default"
					return Object.keys(main.items.components).indexOf(id);
				} else {
					// Sort in order
					return main.items.components[id].text();
				}
			};
			var sort = function() {
				var commonParent = $(main.items.components._first().element[0].parentNode);
				var newOrder = $(Object.keys(main.items.components)).sortList(order, textSource);
				// Clear current order
				main.items.components = {};
				$.each(newOrder, (i, id) => {
					var itm = main.items.components[id];
					// Sort our own list by appending to the end of list
					main.items.components[id] = itm;
					// Append to parent
					if (main.params.flexOrder) {
						main.cssCleanups.push(itm.element.pushCss('flex-order', i));
					} else {
						itm.element.reinsertion(() => {
							commonParent.append(itm.element);
						});
					}
				});
			};
			if (main.params.mutationTransition) {
				$(main.items.elements).playChanges(['offsets', 'size',], sort, main.params.mutationTransition, function() {
					main.pushState('sorted', order);
				});
			} else {
				sort();
				main.pushState('sorted', order);
			}
		}
		
		/**
		 * Runs through each item to match the given text.
		 *
		 * @param string 	text
		 * @param function 	callback
		 *
		 * @return void
		 */
		filter(text, callback) {
			var main = this;
			if (!d.isNumeric(text) && !text.length) {
				main.pushState('filtered', false);
			}
			var textSource = function(id, i) {
				return main.items.components[id].text();
			};
			var result = null;
			var filter = function() {
				$(Object.keys(main.items.components)).filterList(text, textSource, (matches, failures) => {
					// Failures...
					if (failures.length) {
						failures.forEach(id => {
							main.items.components[id].hide();
						});
						main.pushState('filtered');
					} else {
						main.pushState('filtered', false);
					}
					// Passes
					if (matches.length) {
						var matchedTexts = [];
						matches.forEach(id => {
							main.items.components[id].show();
							// Auto-complete...
							matchedTexts.push(textSource(id));
						});
						if (typeof callback === 'function') {
							callback(matches, /*autocomplete*/matchedTexts.sort()[0]);
						}
					}
				});
			};
			if (main.params.mutationTransition) {
				$(main.items.elements).playChanges(['offsets', 'size',], filter, main.params.mutationTransition);
			} else {
				filter();
			}
		}
	}
		
	// Add to UI
	d.ui.comp('list', ListComponent, {
		// Params
		params: {
			triggers: {
				'keydown&key=`ArrowLeft`': 'highlightPrev',
				'keydown&key=`ArrowRight`': 'highlightNext',
				'keydown&key=`enter`': 'selectHighlighted',
				//'shift+tab+keydown': 'selectPrev',
				//'tab+keydown': 'selectNext',
			},
			max: 1,
			allowLoop: true,
			flexOrder: true,
		},
		// PushPullStates
		pushPullStates: [],
		// Child interface
		acceptImplementation: ['select', 'deselect', 'restore', 'highlight', 'dehighlight', 'show', 'hide', 'text',],
	});
	
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	
	class ItemComponent extends d.ui.component {
		
		init(initialStateObject) {
			var main = this;
			if (!main.registry.owner) {
				if (main.element.is('li')) {
					main.registry.owner = main.element.closest('ul,ol');
				} else {
					throw new Error('An owner not defined for this item!');
				}
			}
			if (main.registry.owner && main.registry.owner.length) {
				// Let's add ourself to collection
				$.each(main.registry.owner.data(), function(key, component) {
					if (key.indexOf('dramatic.ui.component.') === 0 && typeof component === 'object' && component.addItem) {
						if (main.ownerComponent) {
							throw new Error('More than one owner component instance found for this item!');
						}
						main.ownerComponent = component;
						component.addItem(main, initialStateObject);
					}
				});
			}
			if (!main.ownerComponent) {
				throw new Error('Owner component instance not found for this item!');
			}
			// Lets apply wakeup states
			if (initialStateObject.restored) {
				main.pushState('restored');
			} else if (initialStateObject.selected) {
				main.pushState('selected');
			} else {
				main.pushState('deselected');
			}
			if (initialStateObject.highlighted) {
				main.pushState('highlighted');
			} else {
				main.pushState('dehighlighted');
			}
		}
			
		/**
		 * Intercedes readStates() to handle calls to external values.
		 *
		 * @inheritdoc
		 */
		readStates(query, queryCallback, valueCallback, edge = 1) {
			var main = this;
			return super.readStates(query, queryCallback, (stateObject/*current stateObject or previous stateObject*/, oprnd) => {
				if (oprnd.startsWith('#')) {
					main.handleForeignKey(oprnd);
				}
				return valueCallback ? valueCallback(stateObject, oprnd) : d.accessor.get(stateObject, oprnd.split('.'));
			}, edge);
		}
		
		/**
		 * Binds the value of a foreignKey to this component's state object.
		 *
		 * @param string foreignKey
		 */
		handleForeignKey(foreignKey) {
			var main = this;
			if (main.externalObservations.indexOf(foreignKey) > -1 || !main.ownerComponent || typeof main.ownerComponent.namedItem !== 'function') {
				return;
			}
			var componentName = foreignKey.substr(1, foreignKey.indexOf('.'));
			var queryString = foreignKey.substr(foreignKey.indexOf('.'));
			var component = main.ownerComponent.namedItem(componentName);
			if (!component) {
				return;
			}
			var pushState = function(stateData) {
				d.accessor.set(main.state, foreignKey.split('.'), stateData);
				main.pushState('#' + componentName, main.state['#' + componentName]);
			};
			// As this is our first encounter with this foreignKey,
			// we will eagerly read the referenced value.
			pushState(component.readStates(queryString));
			// -----------
			// But thats not enough! We need to observe changes of this external value.
			// We will bind once to an handler that will re-run this query and susequent queries.
			component.observe(queryString, (newStateData) => {
				// Next, we re-run the concerned queries.
				pushState(newStateData);
			});
			// Let's remember we've handled this.
			main.externalObservations.push(foreignKey);
		}
		
		/**
		 * Sets object to the "highlighted" state.
		 *
		 * @param bool force
		 *
		 * @return void
		 */
		highlight(force) {
			var main = this;
			if (!arguments.length && main.ownerComponent) {
				return main.ownerComponent.highlightItems(main);
			}
			return main._execHighlight.apply(main, arguments);
		}
		
		/**
		 * Sets object to the "dehighlighted" state.
		 *
		 * @param bool force
		 *
		 * @return void
		 */
		dehighlight() {
			var main = this;
			if (!arguments.length && main.ownerComponent) {
				return main.ownerComponent.dehighlightItems(main);
			}
			return main._execDehighlight.apply(main, arguments);
		}
	
		/**
		 * Sets object to the "selected" state.
		 *
		 * @param bool force
		 *
		 * @return void
		 */
		select(force) {
			var main = this;
			if (!arguments.length && main.ownerComponent) {
				return main.ownerComponent.selectItems(main);
			}
			return main._execSelect.apply(main, arguments);
		}
		
		/**
		 * Sets object to the "deselected" state.
		 *
		 * @param bool force
		 *
		 * @return void
		 */
		deselect(force) {
			var main = this;
			if (!arguments.length && main.ownerComponent) {
				return main.ownerComponent.deselectItems(main);
			}
			return main._execDeselect.apply(main, arguments);
		}
		
		/**
		 * Toggles an item between the selected/deselected state.
		 *
		 * @return void
		 */
		toggle() {
			var main = this;
			if (main.state.selected) {
				return main.deselect();
			} else {
				return main.select();
			}
		}
		
		/**
		 * Sets object to the "restored" state.
		 *
		 * @param bool force
		 *
		 * @return void
		 */
		restore(force) {
			var main = this;
			if (!arguments.length && main.ownerComponent) {
				return main.ownerComponent.restoreItems(main);
			}
			return main._execRestore.apply(main, arguments);
		}
		
		/**
		 * Show this
		 *
		 * @param bool force
		 *
		 * @return void
		 */
		show(force) {
			var main = this;
			return main._execShow.apply(main, arguments);
		}
		
		/**
		 * Hide this
		 *
		 * @param bool force
		 *
		 * @return void
		 */
		hide(force) {
			var main = this;
			return main._execHide.apply(main, arguments);
		}
		
		/**
		 * Returns the items text
		 *
		 * @return string
		 */
		text() {
			var main = this;
			return main.element.text();
		}
		
		/**
		 * @see select()
		 *
		 * @return void
		 */
		_execSelect() {
			var main = this;
			if (main.state.selected || main.state.selecting || main.pushState('selecting') === false) {
				return false;
			}
			main.pushState('selected');
		}
		
		/**
		 * @see highlight()
		 *
		 * @return void
		 */
		_execHighlight() {
			var main = this;
			if (main.state.highlighted || main.state.highlighting || main.pushState('highlighting') === false) {
				return false;
			}
			main.pushState('highlighted');
		}
		
		/**
		 * @see dehighlight()
		 *
		 * @return void
		 */
		_execDehighlight() {
			var main = this;
			if (main.state.dehighlighted || main.state.dehighlighting || main.pushState('dehighlighting') === false) {
				return false;
			}
			main.pushState('dehighlighted');
		}
		
		/**
		 * @see deselect()
		 *
		 * @return void
		 */
		_execDeselect() {
			var main = this;
			if (main.state.deselected || main.state.deselecting || main.pushState('deselecting') === false) {
				return false;
			}
			main.pushState('deselected');
		}
		
		/**
		 * @see restore()
		 *
		 * @return void
		 */
		_execRestore() {
			var main = this;
			if (main.state.restored || main.state.restoring || main.pushState('restoring') === false) {
				return false;
			}
			main.pushState('restored');
		}
		
		/**
		 * @see select()
		 *
		 * @return void
		 */
		_execShow() {
			var main = this;
			if (main.state.visible || main.state.showing || main.pushState('showing') === false) {
				return false;
			}
			main.pushState('visible');
		}
		
		/**
		 * @see deselect()
		 *
		 * @return void
		 */
		_execHide() {
			var main = this;
			if (main.state.hidden || main.state.hiding || main.pushState('hiding') === false) {
				return false;
			}
			main.pushState('hidden');
		}
	}
	
	// Add to UI
	d.ui.comp('item', ItemComponent, {
		// PushPullStates
		pushPullStates: [
			// Same states: before/then
			['selecting', 'selected', 'deselecting', 'deselected', 'restoring', 'restored'],
			['highlighting', 'highlighted', 'dehighlighting', 'dehighlighted'],
			['showing', 'visible'],
			['hiding', 'hidden'],
			// Opposite sates
			['visible', 'hidden',],
		],
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
	
	class NodeComponent extends d.classes(d.ui.component.item, d.ui.component.list) {
		
		/**
		 * Restores all items from their selected/deselected state.
		 *
		 * @return Promise
		 */
		restoreItems() {
			return super.restoreItems(main.items.components);
		}
		
		/**
		 * Toggles an item between the selected/restored state.
		 *
		 * @return void
		 */
		toggle() {
			var main = this;
			if (main.state.selected || main.state.deselected) {
				return main.restore();
			} else {
				return main.select();
			}
		}

		/**
		 * @override: item:_execSelect()
		 *
		 * Show this and child items "normal" state
		 */
		_execSelect(force) {
			var main = this;
			if (main.state.selected || main.state.selecting || main.pushState('selecting') === false) {
				return false;
			}
			return main.restoreItems().then(() => {
				main.pushState('selected');
			});
		}
		
		/**
		 * @override: item:_execDeselect()
		 *
		 * Deselect this and child items
		 */
		_execDeselect(force) {
			var main = this;
			if (main.state.deselected || main.state.deselecting || main.pushState('deselecting') === false) {
				return false;
			}
			return main.deselectItems(main.items.components).then(() => {
				main.pushState('deselected');
			});
		}
		
		/**
		 * @override: item:_execRestore()
		 *
		 * Show this in "normal" state, and "deselect" child items
		 */
		_execRestore(force) {
			var main = this;
			if (main.state.restored || main.state.restoring || main.pushState('restoring') === false) {
				return false;
			}
			return main.deselectItems(main.items.components).then(() => {
				main.pushState('restored');
			});
		}
	}
	
	// Add to UI
	d.ui.comp('node', NodeComponent, {});
	
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	
	class LiveListComponent extends ListComponent {
		/**
		 * Synces current states with remote datasource.
		 *
		 * @param string 	stateName
		 *
		 * @return void
		 */
		sync(stateName) {
			var main = this;
			main.request = main.registry.listbox.ui('request');
			if (!main.request || main.pushState('syncing', stateName) === false) {
				return;
			}
			// Return value(s)
			var stateData = {};
			var stateNames = typeof stateName === 'string' ? [stateName] : stateName;
			$.each(main.listbox.state.items, (state, itemsIds) => {
				if (stateName && stateNames.indexOf(state) === -1) {
					return;
				}
				stateData[state] = itemsIds.map(id => {
					var selectedItem = main.listbox.items[id];
					return {
						label: selectedItem.element.attr('label') || selectedItem.element.attr('aria-label') || selectedItem.element.attr('data-label') || selectedItem.text().trim(),
						value: selectedItem.element.attr('value') || selectedItem.element.attr('data-value'),
						id: id,
					};
				});
			});
			main.request.abort().addParam('data', {q: text, data: stateData}).exec(() => {
				// Recall stored values
				main.pushState('synced', stateName);
			});
		}
	}

	// Add to UI
	d.ui.comp('livelist', LiveListComponent, {
		// Params
		params: {
			triggers: {
				//'shift+tab+keydown': 'highlightPrev',
				'keydown&key=`ArrowLeft`': 'selectPrev',
				//'keydown&key=`tab`': 'highlightNext',
				'keydown&key=`ArrowRight`': 'selectNext',
				'keydown&key=`enter`': 'selectHighlighted',
			},
			max: null,
			allowLoop: true,
		}
	});

})(jQuery, Dramatic);
