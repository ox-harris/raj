(function($, d) {
	
	d.ui = {};
	
	// ---------------------------------------------------------------------------------------------------------
	// THE BASE COMPONENT
	// ---------------------------------------------------------------------------------------------------------
	
	/**
	 * Component
	 */
	d.ui.component = class extends Observable {
		/**
		 * Performs common initialization operations.
		 *
		 * @param DOMNodeList	element
		 * @param object		params
		 *
		 * @return void
		 */
		constructor(el, params) {
			super();
			var main = this;
			main.element = $(el);
			// Set to the element's data object
			main.element.data('dramatic.ui.component.' + main.namespace, main);
			main.cleanups = [];
			main.cssCleanups = [];
			// PARAMS
			// ----------
			// Params from defaults
			main.params = d.obj.proxy($.extend(true, {}, main.params || {}));
			// Params as supplied by caller
			main.params._merge(params);
			// Params as defined in element's attribute
			if (main.namespace && main.element) {
				var namespaceAttr = d.str.fromCamelCase(main.namespace, '-').toLowerCase();
				var fullNamespaceAttr = d.ui.attrNamespace + namespaceAttr;
				var attrParams = main.element.attr(fullNamespaceAttr);
				if (attrParams && attrParams.toLowerCase() !== 'false' && attrParams.toLowerCase() !== 'true') {
					main.params._merge(d.str.parseParams(attrParams));
				}
			}
			// REGISTRY
			// ----------
			var role = d.str.fromCamelCase(main.params.userole || main.namespace, '-').toLowerCase();
			main.element.addRole(role);
			main.registry = main.element.roledom(main.params.selectors, role/*roleName*/, {importer: d.view.findFile}).registry();
			// BINDINGS
			// ----------
			$.each(main.params.behaviours || {}, (query, bindings) => {
				main.observe(query, (currentValueOrAssertion) => {
					main._renderBindings(currentValueOrAssertion, bindings);
				});
			});
			// ---------------------------------------------
			// INITIAL STATES
			// ---------------------------------------------
			var initialStateObject = {};
			Object.keys(main.attrBindings).forEach((stateName) => {
				var attrName = main.attrBindings[stateName].replace('~', fullNamespaceAttr);
				if (main.element.attr(attrName)) {
					initialStateObject[stateName] = true;
				}
				main.observe(stateName, (currentValueOrAssertion) => {
					if (currentValueOrAssertion === false) {
						main.element.removeAttr(attrName);
					} else {
						var stateDataVal = currentValueOrAssertion === true || $.isArray(currentValueOrAssertion) || $.isPlainObject(currentValueOrAssertion) ? 'true' : currentValueOrAssertion;
						main.element.attr(attrName, stateDataVal);
					}
				});
			});
			// STORAGE
			// ----------
			if (main.params.sleeps && main.element.attr('id')) {
				main.storage = d.storage('#' + main.element.attr('id'), main.namespace);
				initialStateObject = $.extend(true, {}, initialStateObject, JSON.parse(d.storage.getFromLocal()) || {});
			}
			if (main.params.state && $.isPlainObject(main.params.state)) {
				initialStateObject = $.extend(true, {}, initialStateObject, main.params.state);
			}
			main.id = main.id || 'comp-' + d.uniqueKey();
			// Must come after init() as the registry may have modified by init()
			main.bindTriggers();
			if (typeof main.init === 'function') {
				main.init(initialStateObject);
			}
			// At this point, we have initialized
			main.pushState('initialized', main.id);
			// ---------------------------------------------
			// INITIAL STATES
			// ---------------------------------------------
			
			// We can use attribute to control the instance of this element.		
			// ---------------------------------------------
			main.element.observeAttr(fullNamespaceAttr, (e) => {
				var newValue = this.attr(fullNamespaceAttr) || '';
				if (!newValue || newValue.toLowerCase() === 'false') {
					main.destroy();
				}
			});
			// Destroy instance when this element is removed.
			// ---------------------------------------------
			main.element.observeRemoved((e) => {
				if (!main.element.attr('reinsertion')) {
					main.destroy();
				}
			});
			var env = {};
			main.onEvent('focusin focusout', (e) => {
				env.focus = e.type === 'focusin';
				main.pushState('env', env);
			});
			main.onEvent('mouseenter mouseleave', (e) => {
				env.hover = e.type === 'mouseenter';
				main.pushState('env', env);
			});
			main.onEvent('mousedown mouseup pointerdown pointerup', (e) => {
				env.active = e.type === 'mousedown' || e.type === 'pointerdown';
				main.pushState('env', env);
			});
			main.bindTrigger($('body'), 'hashchange', (e) => {
				env.target = main.element.is(window.location.hash) || main.element.find(window.location.hash);
				main.pushState('env', env);
			})
		}
		
		/**
		 * Custom "instanceOf" implementation
		 *
		 * @param function|class	component
		 *
		 * @return bool
		 */
		instanceOf(component) {
			if (!component) {
				return false;
			}
			return this instanceof component || d.classes.isImplementation(this.constructor, component);
		}
		
		/**
		 * Saves widget states to local storage.
		 *
		 * @return object
		 */
		sleep() {
			var main = this;
			if (main.storage) {
				main.storage.setVal(main.state).setToLocal();
			}
		}
		
		/**
		 * Makes the component ignore triggers.
		 *
		 * @param string key
		 */
		disable(key) {
			var main = this;
			if (main.state.disabled) {
				main.state.disabled.push(key);
			} else {
				main.pushState('disabled', [key]);
			}
		}
		
		/**
		 * Makes the component listen to triggers again.
		 *
		 * @param string key
		 */
		enable(key) {
			var main = this;
			if (main.state.disabled && main.state.disabled._last() === key) {
				main.state.disabled.pop();
				if (!main.state.disabled.length) {
					main.pushState('disabled', false);
				}
			}
		}
		
		/**
		 * Binds functions to the control element's events - trigger.
		 *
		 * @return DOMNodeList
		 */
		bindTriggers() {
			var main = this;
			if (!main.params.triggers) {
				return;
			}
			$.each(main.params.triggers, (elementNameDotEvent, bindings) => {
				elementNameDotEvent = elementNameDotEvent.split('.');
				var element = elementNameDotEvent.length === 1 ? main.element : main.registry[elementNameDotEvent[0]];
				if (element) {
					var events = elementNameDotEvent.length === 1 ? elementNameDotEvent[0] : elementNameDotEvent[1];
					main.bindTrigger(element, events, bindings);
				}
			});
		}
		
		/**
		 * Binds functions to the control element's events - trigger.
		 *
		 * @param DOMNodeList	anchorElement
		 * @param string		originalEventString
		 * @param closure		bindings
		 * @param string|JQuery	target
		 *
		 * @return DOMNodeList
		 */
		bindTrigger(anchorElement, originalEventString, bindings, target) {
			var main = this;
			if (!anchorElement) {
				return;
			}
			// We accept multiple bindings
			if (!$.isFunction(bindings) && !$.isPlainObject(bindings)) {
				var _bindings = {};
				_bindings[bindings] = null;
				bindings = _bindings;
			}
			var filteredEventString = '';
			// We can handle multiple types
			$.each(originalEventString.split(' '), (i, eventName) => {
				// Component-bound ----------------------------
				if (eventName.startsWith(':')) {
					eventName = eventName.substr(1);
					var handler = (state) => {
						if (state) {
							return main._execTrigger(bindings, originalEventString);
						}
					};
					// Bind...
					main.observe(eventName, handler);
					// Cleanup code
					main.cleanups.push(() => {
						main.unobserve(eventName, handler);
					});
					return;
				}
				filteredEventString += ' ' + eventName;
			});
			filteredEventString = filteredEventString.trim();
			if (filteredEventString) {
				// Element-bound ----------------------------
				var handler = function(e) {
					if (main.state.disabled) {
						return;
					}
					// Actions on subject element
					var shouldPreventDefault = false;
					if (e.type === 'click' && e.target) {
						var clicked = $(e.target);
						shouldPreventDefault = clicked.is('a') || clicked.parents('a').length || (clicked.is('button') && clicked.parents('form').length)
							|| (clicked.is('label') && clicked.parents('form').length && (clicked.find('button, [type="submit"]').length || $(clicked.attr('for')).length));
					}
					// Over to main...
					main.e = e;
					var callbackReturn = null;
					if ($.isFunction(bindings)) {
						callbackReturn = bindings.call($(e.target), e);
					} else {
						callbackReturn = main._execTrigger(bindings, filteredEventString);
					}
					delete main.e;
					// Return value...
					if (shouldPreventDefault) {
						e.preventDefault();
					}
					return callbackReturn;
				}
				// Bind...
				anchorElement.on(filteredEventString, target, main.state, handler);
				// Cleanup code
				main.cleanups.push(() => {
					anchorElement.off(filteredEventString, target, main.state, handler);
				});
			}
		}
			
		/**
		 * Runs callbacks/bindings.
		 *
		 * @param function|string		bindings
		 * @param string				originalEventString
		 *
		 * @return bool|void
		 */
		_execTrigger(bindings, originalEventString) {
			var main = this;
			// Run bindings...
			var callbackReturn = true;
			if ($.isPlainObject(bindings)) {
				$.each(bindings, (fnName, args) => {
					if (/*last*/callbackReturn === false) {
						return;
					}
					var method = d.accessor.get(main, fnName.split('.'));
					if (!method) {
						console.log('Action (' + main.namespace + '.' + fnName + ') not defined for events (' + originalEventString + ').');
						return;
					}
					callbackReturn = method.apply(main, args ? ($.isArray(args) ? args : [args]) : []);
				});
			} else {
				console.log('Action (' + main.namespace + '.' + bindings + ') for events (' + originalEventString + ') not understood.');
			}
			return callbackReturn;
		}
	
		/**
		 * Handles event listening from outside.
		 *
		 * @param string		eventName
		 * @param function		handler
		 * @param bool			allowBubblers
		 *
		 * @return void
		 */
		onEvent(eventName, handler, noBubblers) {
			if (typeof handler !== 'function') {
				throw new Error('Event handler not a function!');
			}
			var main = this;
			var fn = function(e, d) {
				if (!noBubblers/*Also respond if bubbling from child*/ || e.currentTarget === e.target) {
					handler(e, d);
				}
			};
			var qualifiedState = eventName.replace(/ \./g, ' ' + main.namespace + '.');
			main.element.on(qualifiedState, fn);
			// Cleanup code
			main.cleanups.push(() => {
				main.element.off(qualifiedState, fn);
			});
		}
			
		/**
		 * Triggers native events.
		 *
		 * @param string		eventName
		 * @param object		eventData
		 *
		 * @return mixed
		 */
		fireEvent(eventName, eventData) {
			var main = this;
			eventData = eventData || {};
			// Fire Event on the element
			return main.element.trigger((eventName.substr(0, 1) === '.' ? main.namespace : '') + eventName, eventData);
		}
		
		/**
		 * Adds a callback to run on every pushState event.
		 *
		 * @param function	handler
		 *
		 * @return void
		 */
		onPushState(handler) {
			if (typeof handler !== 'function') {
				throw new Error('PushState handler not a function!');
			}
			var main = this;
			return main.observe(handler, 1/*edgep*/);
		}
		
		/**
		 * Publishes current state to elements, handles callbacks and event firing.
		 *
		 * @param string|object		stateName
		 * @param object			stateData
		 * @param bool|array		runBindings
		 *
		 * @return mixed
		 */
		pushState(stateName, stateData = true, runBindings = true) {
			var callbacksReturn = super.pushState(stateName, stateData, runBindings);
			if (callbacksReturn === false || !runBindings) {
				return false;
			}
			var main = this;
			var returnToken = null;
			if ((main.eventBindings === true || (main.eventBindings || []).indexOf(stateName) > -1) && stateData !== false) {
				returnToken = this.fireEvent('.' + stateName, stateData) === false ? false : returnToken;
			}
			// ------------------------------------------------
			return returnToken;
		}
			
		/**
		 * @param mixed	 	currentValueOrAssertion
		 * @param object 	bindings
		 *
		 * @return void
		 */
		_renderBindings(currentValueOrAssertion, bindings) {
			var main = this;
			if (!$.isPlainObject(bindings)) {
				throw new Error('Object expected. Got ' + bindings);
			}
			$.each(bindings, (elementName, args) => {
				// Run through all elements and perform the specified action:
				// add a class name or call a function
				var elementNameParts = elementName.split('.');
				var baseName = elementNameParts.shift();
				var methodName = elementNameParts.pop();
				var target = baseName === 'this' ? (elementNameParts.length ? d.accessor.get(elementNameParts, main) : main)
					: (elementNameParts.length ? d.accessor.get(elementNameParts, main.registry[baseName]) : main.registry[baseName]);
				if (!target || (methodName && !target[methodName])) {
					console.log('Invalid UI binding: ' + elementName + '!');
					return;
				}
				args = args === '$' ? currentValueOrAssertion : args;
				if (methodName) {
					if (methodName === 'attr' || methodName === 'css') {
						if ($.isArray(args) && args.length > 1) {
							var _args = {};
							_args[args[0]] = args[1];
							args = _args;
						} else if (!$.isPlainObject(args)) {
							return;
						}
						$.each(args, (key, val) => {
							val = val === '$' ? currentValueOrAssertion : val;
							if (currentValueOrAssertion) {
								target[methodName](key, val);
							} else if (target[methodName](key) === val) {
								if (methodName === 'attr') {
									target.removeAttr(key);
								} else {
									target.css(key, '');
								}
							}
						});
					} else {
						target[methodName](args);
					}
				} else {
					if (currentValueOrAssertion) {
						target.addClass(args);
					} else {
						target.removeClass(args);
					}
				}
			});
		}
		
		/**
		 * Adds prefix/suffix to state names for use as attributes.
		 *
		 * @return mixed 	target
		 * @return mixed 	value
		 *
		 * @return mixed
		 */
		_renderValue(target, value) {
			var main = this;
			if ($.isArray(target)) {
				target = target.map(t => {return main._renderValue(t, value)});
			} else if ($.isPlainObject(target)) {
				Object.keys(target).forEach(key => {
					target[key] = main._renderValue(target[key], value);
				});
			} else if (typeof target === 'string') {
				if (typeof value !== 'undefined') {
					target.replace(/\(\)/g, value);
				}
			}
			return target;
		}
		
		/**
		 * Sets the "disabled" state.
		 *
		 * @return this
		 */
		disable() {
			var main = this;
			main.pushState('disabled');
			return main;
		}
		
		/**
		 * Undos the "disabled" state.
		 *
		 * @return this
		 */
		enable() {
			var main = this;
			main.pushState('disabled', false);
			return main;
		}
		
		/**
		 * Runs cleanup functions.
		 *
		 * @return void
		 */
		destroy() {
			var main = this;
			main.sleep();
			// Then clear...
			main.state = {};
			main.prevState = {};
			main.stateObservers = [];
			// If states are currently active, call immediately
			main.cleanups.forEach((callback) => {
				callback.call(main);
			});
			main.element.removeData('dramatic.ui.' + main.namespace);
		}
	}
	
	/**
	 * States that fire events
	 *
	 * @var array
	 */
	d.ui.component.prototype.eventBindings = ['initialized',];
	
	/**
	 * States that map to DOM attributes
	 *
	 * @var object
	 */
	d.ui.component.prototype.attrBindings = {
		initialized: '~-initialized',
	};
	
	/**
	 * State aliases
	 *
	 * @var object
	 */
	d.ui.component.prototype.statesAliases = {};
	
	/**
	 * The convention for [data-namespace-][componentName].
	 *
	 * @var string
	 */
	d.ui.attrNamespace = 'dramatic-';
		
	d.ui.comp = function(name, Component, prototypeProps) {
		if (arguments.length === 1) {
			return d.ui.component[name];
		}
		// Add properties
		$.each(prototypeProps || {}, (key, val) => {
			if (typeof val === 'string' || typeof val === 'number') {
				Component.prototype[key] = val;
			} else {
				d.classes.concat(Component.prototype, prototypeProps, key);
			}
		});
		Component.prototype.namespace = name;
		// Add to d
		d.ui.component[name] = Component;
		// Add to JQUERY
		$.fn[name] = function(params) {
			this.each((i, el) => {
				new d.ui.component[name](el, params);
			});
			return this.componentInstance(name);
		};
	};
	
	d.ui.component.ripples = true;
	$.fn.ripples = function() {
		this.each((i, el) => {
			var element = $(el);
			var params = d.str.parseParams(element.attr('dramatic-ripples'));
			var target = $.isPlainObject(params) && params.target ? element.find(params.target) : element;
			element.on('click', function(e) {
			   target.ripple(e, params);
			});
		});
		return this;
	};
	
	/**
	 * Observes the DOM to dynamically instantiate components on elements.
	 *
	 * @param bool		observeAttrs
	 *
	 * @return object
	 */
	d.ui.begin = function(observeAttrs) {
		// ALL AVAILABLE COMPONENTS
		// --------------------------	
		var componentsAttr = (d.ui.attrNamespace + Object.keys(d.ui.component)._remove('prototype').map(itm => {
			return d.str.fromCamelCase(itm, '-').toLowerCase();
		}).join(' ' + d.ui.attrNamespace)).split(' ');
		// INITIALIZER
		// --------------------------	
		var initializeNodes = function(nodes) {
			$.each(nodes, (i, el) => {
				if (!$(el).attr('reinsertion')) {
					var attrs = el.attributes || [];
					for (k = 0; k < attrs.length; k ++) {
						if (componentsAttr.indexOf(attrs[k].name) > -1 && attrs[k].value.toLowerCase() !== 'false') {
							var component = d.str.toCamelCase(attrs[k].name.substr(d.ui.attrNamespace.length));
							$(el)[component]();
						}
					}
				}
			});
		};
		// WE INITIALIZE ALL CURRENT ELEMENTS
		// --------------------------
		var componentsAttrStr = componentsAttr.map((attr) => {
			return '[' + d.str.fromCamelCase(attr, '-').toLowerCase() + ']';
		}).join(',');
		initializeNodes(document.querySelectorAll(componentsAttrStr));
		// WE INITIALIZE ALL FUTURE ELEMENTS
		// --------------------------	
		var opts = observeAttrs ? {childList: true, attributes: true, attributeOldValue: true} : {childList: true,};
		$('body').observeTree(opts, (e) => {
			if (e.type === 'childList') {
				var nodes = [];
				$.each(e.addedNodes, (i, el) => {
					nodes = nodes.concat([el], Array.prototype.slice.call($(el).find(componentsAttrStr)));
				});
				initializeNodes(nodes);
			} else if (e.type === 'attributes' && componentsAttr.startsWith(e.attributeName)) {
				var newValue = e.target.attributes.getNamedItem(e.attributeName);
				if ((!e.oldValue || (e.oldValue || '').toLowerCase() === 'false') && newValue && newValue.value.toLowerCase() !== 'false') {
					var component = d.str.toCamelCase(e.attributeName.substr(d.ui.attrNamespace.length));
					$(e.target)[component]();
				}
			}
		});
	};

	/**
	 * -------------
	 * jQuery helpers
	 * -------------
	 */
		
	/**
	 * Retrieves a component instance from the element.
	 *
	 * @param string		name
	 *
	 * @return object
	 */
	$.fn.componentInstance = function(name) {
		return this.data('dramatic.ui.component.' + name);
	};

	/**
	 * Adds/sets an item into params.
	 *
	 * @param string	path
	 * @param mixed		val
	 * @param bool		merge
	 *
	 * @return this
	 */
	$.fn.param = function(path, val, merge) {
		var keys = Array.isArray(path) ? path : path.split('.');
		var attrName = keys.shift();
		var componentNameIf = attrName.startsWith(d.ui.attrNamespace) 
			? d.str.toCamelCase(attrName.substr(d.ui.attrNamespace.length))
			: null;
		if (arguments.length > 1) {
			return this.each((i, el) => {
				var element = $(el);
				var entireParams = d.str.parseParams(element.attr(attrName) || '');
				if ($.isPlainObject(val) && merge) {
					var currentVal = keys.length ? d.accessor.get(entireParams, keys) : entireParams;
					val = $.extend(true, {}, currentVal, val);
				}
				if (keys.length) {
					d.accessor.set(entireParams, keys, val);
				} else {
					entireParams = val;
				}
				if ($.isPlainObject(entireParams)) {
					entireParams = d.str.stringifyParams(entireParams, ':', '; ');
				}
				element.attr(attrName, entireParams);
				if (componentNameIf && element.componentInstance(componentNameIf)) {
					element.componentInstance(componentNameIf).params[merge ? '_merge' : '_set'](keys, val);
				}
			});
		} else {
			if (componentNameIf && element.componentInstance(componentNameIf)) {
				var entireParams = element.componentInstance(componentNameIf).params;
				return keys.length ? entireParams._get(keys) : entireParams;
			} else {
				var entireParams = d.str.parseParams(this.attr(attrName) || '');
				return keys.length ? d.accessor.get(entireParams, keys) : entireParams;
			}
		}
	};
	
	/**
	 * Removes an existing item from params.
	 *
	 * @param string	path
	 *
	 * @return this
	 */
	$.fn.removeParam = function(path) {
		var keys = Array.isArray(path) ? path : path.split('.');
		var attrName = keys.shift();
		var componentNameIf = attrName.startsWith(d.ui.attrNamespace) 
			? d.str.toCamelCase(attrName.substr(d.ui.attrNamespace.length))
			: null;
		return this.each((i, el) => {
			var element = $(el);
			var entireParams = d.str.parseParams(element.attr(attrName) || '');
			if (keys.length) {
				d.accessor.unset(entireParams, keys);
				element.attr(attrName, d.str.stringifyParams(entireParams, ':', '; '));
			} else {
				element.removeAttr(attrName);
			}
			if (componentNameIf && element.data('dramatic.ui.component.' + componentNameIf)) {
				element.data('dramatic.ui.component.' + componentNameIf).deleteParam(keys);
			}
		});
	};

	// -------------------------------------------------------------------
	// UI MISCELLENIOUS
	// -------------------------------------------------------------------
	
	class ProgressComponent extends d.ui.component {

		// Constructor
		init(initialStateObject) {
			var main = this;
			// Before init()
			main.observe('valuenow + valuemin + valuemax', () => {
				if (d.isNumeric(main.state.valuenow) && d.isNumeric(main.state.valuemin) && d.isNumeric(main.state.valuemax)) {
					var progress = (main.state.valuenow - main.state.valuemin) / (main.state.valuemax - main.state.valuemin);
					main.pushState('indeterminate', false);
					main.pushState('progress', progress);
				} else {
					main.pushState('progress', false);
					main.pushState('indeterminate');
				}
			});
			main.observe('indeterminate || progress', () => {
				main.renderIndicator();
			});
			if (d.isNumeric(initialStateObject.valuemin)) {
				main.valuenow(initialStateObject.valuemin);
			}
			if (d.isNumeric(initialStateObject.valuemax)) {
				main.valuenow(initialStateObject.valuemax);
			}
			if (d.isNumeric(initialStateObject.valuenow)) {
				main.valuenow(initialStateObject.valuenow);
			}
			if (initialStateObject.indeterminate) {
				main.indeterminate();
			}
		}
		
		indeterminate() {
			var main = this;
			main.pushState('indeterminate');
			return main;
		}
		
		valuemin(val) {
			var main = this;
			if (!arguments.length) {
				return main.state.valuemin;
			}
			if (d.isNumeric(val)) {
				main.pushState('valuemin', val);
			}
			return main;
		}
		
		valuemax(val) {
			var main = this;
			if (!arguments.length) {
				return main.state.valuemax;
			}
			if (d.isNumeric(val)) {
				main.pushState('valuemax', val);
			}
			return main;
		}
		
		valuenow(val) {
			var main = this;
			if (!arguments.length) {
				return main.state.valuenow;
			}
			if (d.isNumeric(val)) {
				main.pushState('valuenow', val);
			}
			return main;
		}
	}
	
	// Add to UI
	d.ui.comp('progress', ProgressComponent, {
		params:{
			userole: 'progressbar',
			selectors: {},
		},
		attrBindings: {
			valuemin: 'aria-valuemin',
			valuemax: 'aria-valuemax',
			valuenow: 'aria-valuenow',
			indeterminate: 'indeterminate',
		},
	});

	// -------------------------------------------------------------------
	
	class LinearProgressComponent extends d.ui.component.progress {

		renderIndicator() {
			var main = this;
			if (!main.registry.indicator) {
				return;
			}
			if (!main.state.progress) {
				main.registry.trail.css({left:'', right:'', top:'', bottom:'',});
				return;
			}
			var percentageValue = (main.state.progress * 100) + '%';
			if (main.params.direction === 'right') {
				main.registry.trail.css({left: 0, right: percentageValue, top: 0, bottom: 0,});
			} else if (main.params.direction === 'left') {
				main.registry.trail.css({left: percentageValue, right: 0, top: 0, bottom: 0,});
			} else if (main.params.direction === 'bottom') {
				main.registry.trail.css({left: 0, right: 0, top: 0, bottom: percentageValue,});
			} else {
				main.registry.trail.css({left: 0, right: 0, top: percentageValue, bottom: 0,});
			}
		}
	};
	
	// Add to UI
	d.ui.comp('linearProgress', LinearProgressComponent, {});

	// -------------------------------------------------------------------
	
	class CircularProgressComponent extends d.ui.component.progress {

		renderIndicator() {
			var main = this;
			if (!main.registry.indicator) {
				return;
			}
			if (!main.state.progress) {
				main.registry.indicator
					.css('stroke-dasharray', '')
					.css('stroke-dashoffset', '');
				main.registry.element.css('transform', '');
				return;
			}
			var diameter = main.registry.indicator[0].getBoundingClientRect().width;
			var circumference = Math.PI * diameter;
			var percentageValue = circumference - (main.state.progress * circumference);
			main.registry.indicator
				.css('stroke-dasharray', circumference)
				.css('stroke-dashoffset', percentageValue);
			if (main.params.direction === 'right') {
				main.registry.element.css({transform: 'rotate(-45deg)'});
			} else if (main.params.direction === 'left') {
				main.registry.element.css({transform: 'rotate(45deg)'});
			} else if (main.params.direction === 'bottom') {
				main.registry.element.css({transform: 'rotate(90deg)'});
			} else {
				main.registry.element.css({transform: 'rotate(-90deg)'});
			}
		}
	};
	
	// Add to UI
	d.ui.comp('circularProgress', CircularProgressComponent, {});

	// -------------------------------------------------------------------
	// CONTROLS
	// -------------------------------------------------------------------

	class SliderComponent extends d.ui.component.linearProgress {

		// Constructor
		init(initialStateObject) {
			var main = this;
			// Before init()
			var snapTo = null;
			if (d.isNumeric(main.params.points)) {
				// Up to such number of points
				var ratio = 100 / (main.params.points + 1);
				snapTo = main.params.direction === 'top' || main.params.direction === 'bottom'
					? {top: 'auto', bottom: 'auto', height: ratio + '%', width: '100%', repeat_y: main.params.points,}
					: {left: 'auto', right: 'auto', width: ratio + '%', height: '100%', repeat_x: main.params.points,};
			} else if ($.isArray(main.params.points)) {
				snapTo = [];
				main.params.points.forEach((point) => {
					var rect = main.params.direction === 'top' || main.params.direction === 'bottom'
						? {top: 'auto', bottom: 'auto', height: point, width: '100%',}
						: {left: 'auto', right: 'auto', width: point, height: '100%',};
					snapTo.push(rect);
				});
			}
			// Initiate translation
			// --------------------------------------
			main.translator = d.ui.userTransform.translate(main.registry.thumb, main.registry.track, {
				directions: main.params.direction === 'top' || main.params.direction === 'bottom' ? ['top', 'bottom'] : ['left', 'right'],
				snapTo: snapTo,
			});
			// Lets have a way of differentiating direct select from panning
			// --------------------------------------
			main.translator.observer.observe('panning', (panning) => {
				main.pushState('panning', panning);
			});
			// Both on panning and on direct select...
			// --------------------------------------
			main.translator.observer.observe('translation', (translation) => {
				if (main.params.direction === 'top' || main.params.direction === 'bottom') {
					var trackLength = main.registry.track.outerHeight();
					var distanceMoved = main.params.direction === 'top' ? trackLength - parseFloat(translation.y) : parseFloat(translation.y);
				} else {
					var trackLength = main.registry.track.outerWidth();
					var distanceMoved = main.params.direction === 'left' ? trackLength - parseFloat(translation.x) : parseFloat(translation.x);
				}
				main.panAction = true;
				main.pushState('progress', progress);
				main.panAction = false;
			});
			// Anytime progress/valuenow/valuemin/valuemax changes,
			// we need to position the thumb accordingly
			// --------------------------------------
			main.observe('progress', (progress) => {
				if (!main.states.panAction) {
					if (main.params.direction === 'top' || main.params.direction === 'bottom') {
						var totalLength = main.registry.track.height();
						var currentLength = progress / 100 * totalLength;
						main.translator.translate(main.params.direction === 'top' ? {x:0, y:totalLength - currentLength,} : {x:0, y:currentLength,}, true/*play*/);
					} else {
						var totalLength = main.registry.track.width();
						var currentLength = progress / 100 * totalLength;
						main.translator.translate(main.params.direction === 'left' ? {x:totalLength - currentLength, y:0,} : {x:currentLength, y:0,}, true/*play*/);
					}
				}
			});
			super.init(initialStateObject);
		}
	};
	
	// Add to UI
	d.ui.comp('slider', SliderComponent, {
		// Params
		params: {
			direction: 'right',
		},
	});

	// -------------------------------------------------------------------
	
	class ToggleComponent extends d.ui.component {

		// Constructor
		init(initialStateObject) {
			var main = this;
			super.init(initialStateObject);
			// After init()
			if (initialStateObject.mixed) {
				main.mixed();
			} else if (initialStateObject.checked) {
				main.check();
			} else {
				main.uncheck();
			}
		}

		mixed() {
			var main = this;
			main.pushState('mixed');
			return main;
		}

		check() {
			var main = this;
			main.pushState('checked');
			return main;
		}

		uncheck() {
			var main = this;
			main.pushState('checked', false);
			return main;
		}

		toggle() {
			var main = this;
			return main.state.checked ? main.uncheck() : main.check();
		}
	};
	
	// Add to UI
	d.ui.comp('toggle', ToggleComponent, {
		// Params
		params: {
			selectors: {
				label: {closest: 'label',},
			},
		},
	});
	
	// -------------------------------------------------------------------

	class CheckboxComponent extends d.ui.component.toggle {};
	
	// Add to UI
	d.ui.comp('checkbox', CheckboxComponent, {
		// Params
		params: {
			triggers: {
				'click': 'toggle',
				'label.click': 'toggle',
			},
			behaviours: {
				checked: {icon: 'fa-checked-square',},
				'!checked': {icon: 'fa-checked-square-o',},
			},
		},
	});
	
	// -------------------------------------------------------------------

	class RadioButtonComponent extends d.ui.component.toggle {};
	
	// Add to UI
	d.ui.comp('radioButton', RadioButtonComponent, {
		// Params
		params: {
			triggers: {
				'click': 'check',
				'label.click': 'check',
				'shift+click': 'uncheck',
				'label.shift+click': 'uncheck',
			},
			behaviours: {
				checked: {icon: 'fa-checked-circle',},
				'!checked': {icon: 'fa-checked-circle-o',},
			},
		},
	});
	
	// -------------------------------------------------------------------

	class SwitchComponent extends d.ui.component.toggle {};
	
	// Add to UI
	d.ui.comp('switch', SwitchComponent, {
		// Params
		params: {
			triggers: {
				'click': 'toggle',
				'label.click': 'toggle',
			},
			behaviours: {
				checked: {thumb: 'pos-abs-rt',},
				'!checked': {thumb: 'pos-abs-lft',},
			},
		},
	});

	// -------------------------------------------------------------------
	// UI TRANSFORM
	// -------------------------------------------------------------------
	
	d.ui.userTransform = function() {};
	
	// Use the operator type to compare operands		
	d.ui.userTransform.translate = function(el1, el2, options) {
		el2 = el2 || window;
		options = options || {};
		options.directions = typeof options.directions === 'string' 
			? [options.directions] : (options.directions || []);
		var instance = {};
		var el1OffsetParent = $(el1).offsetParent();
		// Initialization
		// ----------------------------
		var length = {x:'width', y:'height'};
		var start = {x:'left', y:'top'};
		var end = {x:'right', y:'bottom'};
		var uc = {x:'X', y:'Y'};
		var rect1, rect2, largerLengths, shorterLengths, elementIsLonger, gridCanvas, gridMargin, cellSize, edgeStretching;
		instance.init = function() {
			rect1 = d.rect(el1);
			rect2 = d.rect(el2);
			instance.observer = d.rect.proximity.observer(el1, el2, instance);
			largerLengths = {};
			shorterLengths = {};
			elementIsLonger = {};
			gridCanvas = {};
			gridMargin = {x: 0, y: 0,};
			cellSize = {};
			edgeStretching = {left: 0, top: 0, right: 0, bottom: 0,};
			['x', 'y'].forEach((axis) => {
				// Element is longer than anchor on this axis?
				largerLengths[axis] = Math.max(rect1[length[axis]], rect2[length[axis]]);
				shorterLengths[axis] = Math.min(rect1[length[axis]], rect2[length[axis]]);
				elementIsLonger[axis] = rect1[length[axis]] > rect2[length[axis]];
				// Grid
				if (options.snapTo) {
					// Grid Canvas
					gridCanvas[axis] = rect2[start[axis]] + (rect2[length[axis]] / 2)
					gridCanvas[start[axis]] = gridCanvas[axis] - (largerLengths[axis] / 2)
					gridCanvas[length[axis]] = largerLengths[axis];
					// Grid Cell
					cellSize[axis] = shorterLengths[axis];
					if ($.isPlainObject(options.snapTo)) {
						cellSize[axis] = options.snapTo[length[axis]];
						if (typeof cellSize[axis] === 'string' && cellSize[axis].substr(cellSize[axis].length - 1) === '%') {
							cellSize[axis] = parseFloat(cellSize[axis]) / 100 * largerLengths[axis];
						}
					}
					// Grid Margin
					gridMargin[axis] = 0;
					if ($.isPlainObject(options.snapTo) && typeof options.snapTo[start[axis]] === 'string') {
						gridMargin[axis] = options.snapTo[start[axis]] === 'auto' 
							? (largerLengths[axis] % cellSize[axis]) / 2 : (options.snapTo[start[axis]].substr(options.snapTo[start[axis]].length - 1) === '%' 
								? parseFloat(options.snapTo[start[axis]]) / 100 * largerLengths[axis] : 0);
					}
				}
				// Edge offsets
				if (options.edgeStretching) {
					edgeStretching[start[axis]] = typeof options.edgeStretching[start[axis]] !== 'undefined' ? options.edgeStretching[start[axis]] : 0;
					edgeStretching[end[axis]] = typeof options.edgeStretching[end[axis]] !== 'undefined' ? options.edgeStretching[end[axis]] : 0;
				}
			});
		};
		
		// Get snap target
		// -------------
		instance.getSnapTarget = function() {
			var snapTo = options.snapTo;
			if (!snapTo) {
				return;
			}
			if (typeof snapTo === 'function') {
				snapTo = snapTo.call(instance, currentIntersection);
			}
			var inSnapRange = function(candidateObj) {
				return (options.directions._intersect(['left', 'right']).length ? Math.abs(candidateObj.delta.x) < (candidateObj.rect.width / 2) : true) 
					&& (options.directions._intersect(['top', 'bottom']).length ? Math.abs(candidateObj.delta.y) < (candidateObj.rect.height / 2) : true);
			};
			var snapCandidates = [];
			if ($.isArray(snapTo)) {
				snapTo.forEach(snapCandidate => {
					var candidateRect = d.rect(snapCandidate);
					if (elementIsLonger.x || elementIsLonger.y) {
						var candidateObj = {target:snapCandidate, rect:candidateRect, delta: d.rect.delta(candidateRect, currentIntersection.rect2),};
					} else {
						var candidateObj = {target:snapCandidate, rect:candidateRect, delta: d.rect.delta(currentIntersection.rect1, candidateRect),};
					}
					if (inSnapRange(candidateObj)) {
						snapCandidates.push(candidateObj);
					}
				});
			} else if (snapTo === true || $.isPlainObject(snapTo)) {
				var repeat_x = d.isNumeric(snapTo.repeat_x) ? Math.abs(snapTo.repeat_x) + 1 : parseFloat((gridCanvas.width - gridMargin.x) / cellSize.x);
				var repeat_y = d.isNumeric(snapTo.repeat_y) ? Math.abs(snapTo.repeat_y) + 1 : parseFloat((gridCanvas.height - gridMargin.y) / cellSize.y);
				for (var x = 0; x < repeat_x; x ++) {
					for (var y = 0; y < repeat_y; y ++) {
						var candidateRect = {
							left: gridCanvas.left + gridMargin.x + (cellSize.x * x),
							top: gridCanvas.top + gridMargin.y + (cellSize.y * y),
							width: cellSize.x,
							height: cellSize.y,
						};
						var candidateObj = {target:{x:x, y:y,}, rect:candidateRect, delta: d.rect.delta(currentIntersection.rect1, candidateRect),};
						if (inSnapRange(candidateObj)) {
							snapCandidates.push(candidateObj);
						}
					}
				}
			}
			snapCandidates.sort((a, b) => a.delta.z === b.delta.z ? 0 : a.delta.z > b.delta.z ? 1 : -1);
			return snapCandidates[0];
		};
		
		// Read current position
		// ----------------------------
		instance.read = function(handler, allowEdgeStretching) {
			['x', 'y'].forEach((axis) => {
				if (options.directions.length && options.directions.indexOf(panMove[axis].to) === -1) {
					return;
				}
				if (allowEdgeStretching) {
					var distanceBeforeEdge = elementIsLonger[axis] 
						? Math.abs(Math.min(currentIntersection[panMove[axis].from] - edgeStretching[panMove[axis].from], 0))
						: Math.max(currentIntersection[panMove[axis].to] + edgeStretching[panMove[axis].to], 0);
					var distanceBeforeOppositeEdge = elementIsLonger[axis] 
						? Math.abs(Math.min(currentIntersection[panMove[axis].to] - edgeStretching[panMove[axis].to], 0))
						: Math.max(currentIntersection[panMove[axis].from] + edgeStretching[panMove[axis].from], 0);
				} else {
					var distanceBeforeEdge = elementIsLonger[axis] ? currentIntersection[panMove[axis].from] : currentIntersection[panMove[axis].to];
					var distanceBeforeOppositeEdge = elementIsLonger[axis] ? currentIntersection[panMove[axis].to] : currentIntersection[panMove[axis].from];
				}
				handler(axis, panMove, distanceBeforeEdge, distanceBeforeOppositeEdge);
			});
		};
		
		// Apply new position
		// ----------------------------
		var currentAnimation = null;
		var working = false;
		instance.translate = function(translation, callback, play, plusActiveTransform = true) {
			if (working) {return};
			var done = function() {
				if (typeof callback === 'function') {callback.call(el1, translation)}
			};
			if (translation.x === 0 && translation.y === 0 && plusActiveTransform) {done(); return;}
			// -------
			if (currentAnimation) {currentAnimation.cancel();}
			if (activeTransform.translate && plusActiveTransform) {
				translation.x += parseFloat(activeTransform.translate[0]);
				translation.y += parseFloat(activeTransform.translate._last());
			}
			// -------
			var tx = translation.x + 'px';
			var ty = translation.y + 'px';
			if (options.percentageTranslation) {
				tx = translation.x === 0 ? '0%' : (translation.x / el1OffsetParent.width() * 100) + '%';
				ty = translation.y === 0 ? '0%' : (translation.y / el1OffsetParent.height() * 100) + '%';
			}
			// -------
			instance.observer.pushState('translation', {x:tx, y:ty, play:play,});
			// -------
			if (play) {
				working = true;
				currentAnimation = d.animation(el1[0], {transform: 'translate(' + tx + ', ' + ty + ')'}, {
					duration: 200,
					easing: 'ease-out',
				}, () => {
					working = false;
					done();
				});
				currentAnimation.play();
			} else {
				el1.css({transform: 'translate(' + tx + ', ' + ty + ')'});
				done();
			}
		};
		
		// -------------
		// Dynamic values	
		// -------------
		
		var currentIntersection = {};
		var activeTransform = {};
		
		// Calc drag
		// -------------
		var calcDrag = function() {
			var coords = {x: 0, y: 0};
			instance.read((axis, panMove, distanceBeforeEdge, distanceBeforeOppositeEdge) => {
				coords[axis] = Math.min(Math.abs(panMove[axis].delta), distanceBeforeEdge);
				coords[axis] *= /* Delta is minus */panMove[axis].to === start[axis] ? -1 : 1;
			}, true/*allowEdgeStretching*/);
			return coords;
		};
		
		// Calc acceleration
		// -------------
		var calcAcceleration = function() {
			var coords = {x: 0, y: 0};
			instance.read((axis, panMove, distanceBeforeEdge, distanceBeforeOppositeEdge) => {
				if (options.acceleration && (Math.abs(panMove.event.velocity) >= (d.isNumeric(options.acceleration) ? options.acceleration : 2))) {
					distanceBeforeEdge = Math.abs(distanceBeforeEdge);
					coords[axis] = Math.min(distanceBeforeEdge, distanceBeforeEdge * Math.abs(panMove.event.velocity) / 5);
					coords[axis] *= /* Delta is minus */panMove[axis].to === start[axis] ? -1 : 1;
				}
			}, true/*allowEdgeStretching*/);
			return coords;
		};
		
		// Calc snap to edge
		// -------------
		var calcSnapback = function() {
			var coords = {x: 0, y: 0};
			instance.read((axis, panMove, distanceBeforeEdge, distanceBeforeOppositeEdge) => {
				if ((elementIsLonger[axis] && distanceBeforeEdge > 0) || (!elementIsLonger[axis] && distanceBeforeEdge < 0)) {
					coords[axis] = Math.abs(distanceBeforeEdge);
					coords[axis] *= /* Delta is minus */panMove[axis].to === start[axis] ? 1 : -1;
				}
			});
			return coords;
		};
		
		// Calc snap to grid
		// -------------
		var lastSnapTarget = null;
		var isSameSnapTarget = function(target1, target2) {
			return !target1 || !target2 
				? false 
				: ($.isPlainObject(target1.target) && $.isPlainObject(target2.target) 
					? target1.target.x === target2.target.x && target1.target.y === target2.target.y
					: target1.target === target2.target);
		}
		var calcSnapping = function() {
			var snapTarget = instance.getSnapTarget();
			if (lastSnapTarget && !isSameSnapTarget(snapTarget, lastSnapTarget)) {
				instance.observer.pushState('snapfromtarget', lastSnapTarget);
			}
			var coords = {x: 0, y: 0};
			if (snapTarget) {
				instance.read((axis, panMove, distanceBeforeEdge, distanceBeforeOppositeEdge) => {
					var sign = snapTarget.delta[axis] < 0 ? -1 : 1;
					coords[axis] = Math.min(Math.abs(snapTarget.delta[axis]), Math.abs(distanceBeforeEdge));
					coords[axis] *= sign;
				});
				if ((coords.x === snapTarget.delta.x || coords.y === snapTarget.delta.y) 
				&& !isSameSnapTarget(snapTarget, lastSnapTarget)) {
					instance.observer.pushState('snaptotarget', snapTarget);
				}
			}
			lastSnapTarget = snapTarget;
			return coords;
		};
		
		// Handle pan start
		// -----------------
		var onPanStart = function(e) {
			instance.observer.driver.start();
			currentIntersection = d.rect.intersection(d.rect(el1), d.rect(el2));
			activeTransform = el1.transformRule();
			instance.observer.pushState('panning');
		};

		// Handle pan move
		// -----------------
		var panMove = {x:{}, y:{}, delta:{x:0, y:0,}};
		var onPanMove = function(e) {
			['x', 'y'].forEach((axis) => {
				// Decode movement
				panMove.event = e;
				panMove[axis].delta = e['delta' + axis.toUpperCase()];
				panMove[axis].to = panMove[axis].delta < 0 ? start[axis] : end[axis];
				panMove[axis].from = panMove[axis].to === start[axis] ? end[axis] : start[axis];
			});
			instance.translate(calcDrag());
		};

		// Handle pan end
		// -----------------
		var onPanEnd = function(e) {
			currentIntersection = d.rect.intersection(d.rect(el1), d.rect(el2));
			instance.observer.pushState('panend', currentIntersection);
			activeTransform = el1.transformRule();
			instance.translate(calcAcceleration(), () => {
				currentIntersection = d.rect.intersection(d.rect(el1), d.rect(el2));
				activeTransform = el1.transformRule();
				var snaping = calcSnapback();
				if (snaping.x === 0 || snaping.y === 0) {
					var snapTo = calcSnapping();
					snaping.x = snaping.x === 0 && snapTo.x !== 0 ? snapTo.x : snaping.x;
					snaping.y = snaping.y === 0 && snapTo.y !== 0 ? snapTo.y : snaping.y;
				}
				instance.translate(snaping, () => {
					instance.observer.pushState('panning', false);
				}, true/*play*/);
			}, true/*play*/);
		};
		
		// -----------------
		// Move controls
		// -----------------
		
		instance.bind = function() {
			// Move works with DRAG, PAN, SWIPE
			el1.on('panstart', onPanStart);
			el1.on('panmove', onPanMove);
			el1.on('panend pancancel', onPanEnd);
		};
		instance.unbind = function() {
			el1.off('panstart', onPanStart);
			el1.off('panmove', onPanMove);
			el1.off('panend pancancel', onPanEnd);
		};
		
		if (!el1 || (el2 instanceof $ && !el2.length)) {
			return;
		}
		
		instance.bind();
		instance.init();
		
		return instance;
	};

})(jQuery, Dramatic)
