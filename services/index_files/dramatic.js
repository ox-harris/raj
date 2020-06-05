
// JavaScript Document
 'use strict';

window.Dramatic = {};

(function($, d) {
	
	/**
	 * Incremental index generator.
	 *
	 * @return int
	 */
	var __uniqueKeyCount = 0;
	d.uniqueKey = function() {
		return ++ __uniqueKeyCount;
	};
	
	/**
	 * The vendor prefix for certain CSS values.
	 *
	 * @param object
	 */
	d.vendorPrefix = (function() {
		var styles = window.getComputedStyle(document.documentElement, '');
		var prefix = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || styles.Olink === '' && ['', 'o'])[1];
		var api = ('WebKit|Moz|Ms|O').match(new RegExp('(' + prefix + ')', 'i'))[1];
		return {prefix:prefix, css:'-' + prefix + '-', api:api,};
	})();
	d.VENDOR_PREFIX = d.vendorPrefix.api.toUpperCase();

	/**
	 * ------------------------------------------------------------
	 * DOM EXTENSIONS
	 * ------------------------------------------------------------
	 */
	
	
	(function() {
		// Resolves the text to use for comparison
		var getResolvedText = function(itm, textSource, i) {
			if (typeof textSource == 'function') {
				// Use the callback instead
				return textSource(itm, i);
			}
			
			var reslovedElement = $(itm);
			if (d.isNumeric(textSource)) {
				// Find the Nth child
				reslovedElement = $(reslovedElement.children()[textSource]);
			} else if (textSource) {
				// Find a named child
				reslovedElement = $(reslovedElement.find(textSource));
			}
			
			return reslovedElement.text().toLowerCase();
		};	

		$.fn.extend(
		{
			/**
			 * ================
			 * TRAVERSAL
			 * ================
			 */
				
			/**
			 * Gets the matched descendants on the closest level in heirachy.
			 *
			 * @param string 	selector		The descendant selector
			 * @param string 	stopSelector	The descendant at which no search should continue
			 * @param bool	 	returnSelf		Whether to return the base element by default
			 *
			 * @return jQuery
			 */
			closestDesc: function(selector, stopSelector, returnSelf) {
				var children = this.children();
				while(children.length) {
					// The children that match the selector
					var found = children.filter(selector);
					if (found.length) {
						return found;
					}
					
					if (stopSelector && children.filter(stopSelector).length) {
						// Don't pass this level
						return returnSelf ? this : $();
					}
					
					// Dig deeper
					children = children.children();
				}
				
				return returnSelf ? this : $();
			},
			
			/**
			 * ================
			 * TEXT-BASED MANIPULATION
			 * ================
			 */
				
			/**
			 * Sorts a list of HTML elements alphabetically or using a custom algorithm.
			 *
			 * When order is not given, items are sorted back to their original order before the previous sorting.
			 *
			 * @param string	 				order			ASC|DESC 
			 * @param string|number|function	textSource		A query to run for each list item to obtain the text for the intersection.
			 * @param function					compareFunction	A custom sort function
			 * @param object					options			Additional parameters for the function:
			 *
			 * @return jQuery
			 */
			sortList: function(order, textSource, compareFunction, options) {
				// Run...
				var list = this;
				var map = [];
				// Make a shallow copy
				for (var i = 0; i < list.length; i++) {
					map.push({index: i, value: getResolvedText(list[i], textSource, i)});
				}
				
				// Sort the map - the shadow
				order = order.toLowerCase();
				map.sort(function(a, b) {
					if (compareFunction) {
						return compareFunction(a, b, order, textSource);
					}
					
					var operand_a = order == 'desc' ? b.value : a.value;
					var operand_b = order == 'desc' ? a.value : b.value;
					// Using localeCompare if possible
					if (typeof operand_a === "string" && "".localeCompare) {
						return operand_a.localeCompare(operand_b);
					}
					
					return operand_a === operand_b ? 0 : operand_a > operand_b ? 1 : -1;
				});
				
				// Back to container in the sorted order
				var newOrder = [];
				for (i = 0; i < list.length; i ++) {
					// We could even just use this.appendChild - plain js
					newOrder.push(rows[map[i].index]);
				}
				
				return $(newOrder);
			},
		
			/**
			 * Captures the elements that contain a text value.
			 *
			 * @param string	 				str
			 * @param string|number|function	textSource		A child index or subselector
			 * @param closure					callback		A custom function that recieves passes and failures
			 * @param object					options			Additional parameters for the function:
			 *													-asAccessKey	Rather find item that begins with the given letter.
			 *													-multiple:		If to return multiple matches. This is true by default. If asAccessKey, this is false by default.
			 *
			 * @return jQuery
			 */
			filterList: function(str, textSource, callback, options) {
				// Default to true
				var length = this.length;
				var passes = [];
				var failures = [];
				for (i = 0; i < length; i++) {
					var itm = this[i];
					// Match text
					var resolvedText = getResolvedText(itm, textSource, i);
					if (options.asAccessKey) {
						if ((options.multiple || !passes.length) 
						&& resolvedText.trim().substr(0, str.length) === str.toLowerCase()) {
							passes.push(itm);
						} else {
							failures.push(itm);
						}
					} else {
						if((!passes.length || options.multiple !== false/*true by default here*/) 
						&& resolvedText.trim().indexOf(str.toLowerCase()) > -1) {
							passes.push(itm);
						} else {
							failures.push(itm);
						}
					}
				}
				
				if (callback) {
					callback(passes, failures);
				}
				
				return $(passes);
			},
		
			/**
			 * Captures the item that begins with the given letter
			 *
			 * @uses filterList
			 * @inheritdoc
			 *
			 * @return jQuery
			 */
			filterByAccessKey: function(key, textSource, callback, options) {
				options = options || {};
				options.asAccessKey = true;
				return this.filterList(key, textSource, callback, options);
			},
		
			/**
			 * Replaces an element's consecutive series of text with a new text.
			 *
			 * @param string	 				text
			 * @param string					replacement
			 * @param bool						caseSensitive
			 * @param bool						fromStart
			 * @param bool						once
			 *
			 * @return jQuery
			 */
			replaceText: function(text, replacement, caseSensitive = false, fromStart = false, once = false) {
				var matches = function(a, b) {
					a = !caseSensitive ? a.toLowerCase() : a;
					b = !caseSensitive ? b.toLowerCase() : b;
					return fromStart ? b.trim().substr(0, a.length) === a : b.indexOf(a) > -1;
				}
				
				return this.each(function(i, el) {
					var replaces = $(el).data('dramatic.replaces') || [];
					var alreadyReplaced = false;
					replaces.forEach(function(replacementObj) {
						if ((caseSensitive && replacementObj.original === text) || (!caseSensitive && replacementObj.original.toLowerCase() === text.toLowerCase())) {
							alreadyReplaced = true;
						}
					});
					
					if (alreadyReplaced) {
						return;
					}
					
					var textContent = el.textContent.trim();
					if (!matches(text, textContent)) {
						return;
					}
					
					var buffer = '';
					var openedBrackets = 0;
					var innerHTML = el.innerHTML;
					var innerHtmlLength = innerHTML.length;
					var replacementText = replacement;
					for (var i = 0; i < innerHtmlLength; i ++) {
						if (innerHTML[i] === '<') {
							openedBrackets ++;
						} else if (innerHTML[i] === '>' && openedBrackets) {
							openedBrackets --;
							continue;
						}
						
						if (openedBrackets) {
							continue;
						}
						
						// Append...
						buffer += innerHTML[i];
						
						// Match found...
						if (matches(text, buffer)) {
							buffer = '';
							var cursor = i + 1 - text.length;
							var originalText = innerHTML.substr(cursor, text.length);
							if (originalText.indexOf('<') < 0 && originalText.indexOf('>') < 0) {
								if (typeof replacement === 'function') {
									replacementText = replacement(originalText);
								}
								
								// Replace...
								var part1 = innerHTML.substr(0, cursor) + replacementText;
								var part2 = innerHTML.substr(i + 1);
								innerHTML = part1 + part2;
								
								// Establish new cursor value and update total length
								innerHtmlLength = innerHTML.length;
								i = part1.length;
								
								// Record this alteration...
								replaces.push({cursor: cursor, original: originalText, inserted: replacementText});
								
								// Once?
								if (once) {
									alreadyReplaced = true;
								}
							}
						}
					}
					
					$(el).data('dramatic.replaces', replaces)
					el.innerHTML = innerHTML;
				});
			},
		
			/**
			 * Undos replace text.
			 *
			 * @return jQuery
			 */
			undoReplaceText: function() {
				return this.each(function(i, el) {
					var replaces = $(el).data('dramatic.replaces') || [];
					// Reverse record...
					replaces.slice().reverse().forEach(function(replacementObj) {
						var original = replacementObj.original;
						var inserted = replacementObj.inserted;
						var currentText = el.innerHTML.substr(replacementObj.cursor, inserted.length);
						if (1)// ATTN
						{
							var part1 = el.innerHTML.substr(0, replacementObj.cursor);
							var part2 = el.innerHTML.substr(replacementObj.cursor + inserted.length);
							el.innerHTML = part1 + original + part2;
						}
					});
					
					$(el).removeData('dramatic.replaces');
				});
			},

			/**
			 * ================
			 * FORM-RELATED MANIPULATION
			 * ================
			 */
				
			/**
			 * Disables each input element in the matched container.
			 *
			 * @return jQuery
			 */
			disableForm: function() {
				this.find(':input:not(:button, :submit, :reset)').each(function(i, el) {
					$(el).attr('disabled', 'disabled');
				});
			},
			
			/**
			 * Enables each input element in the matched container.
			 *
			 * @return jQuery
			 */
			enableForm: function() {
				this.find(':input:not(:button, :submit, :reset)').each(function(i, el) {
					$(el).removeAttr('disabled');
				});
			},
			
			/**
			 * Resets each input element in the matched container to their initial values.
			 *
			 * @param bool	 	forceClear		Passed-on to the call to an item's resetInput() 
			 *									and used as described with resetInput().
			 *
			 * @return jQuery
			 */
			resetForm: function(forceClear) {
				return this.each(function(i, el) {
					var form = $(el);
					if (form.is('form')) {
						// Leverage on the native reset() function
						form[0].reset();
					} else {
						// Manually clear individual form elements
						form.find(':input:not(:button, :submit, :reset, :file)').resetInput(forceClear);
					}
				});
			},
			
			/**
			 * Resets the matched inputs to their initial values.
			 *
			 * @param bool		 	forceClear		Whether resetting should rather be to clear the input of any value.
			 *
			 * @return jQuery
			 */
			resetInput: function(forceClear) {
				if (this.is('select')) {
					var options = this.find('options').prop('selected', false);
					if (!forceClear) {
						// Get the options that were defaultSelected
						// Works also for when in select[multiple]
						options.filter(function() {
							return this.defaultSelected;
						}).prop('selected', true);
					}
				} else if (this.is(':checkbox, :radio')) {
					// If a default element has been checked in the radio group,
					// ignore this checked state of this new element - maybe it came into the group late
					if (forceClear || (this.is(':radio') && $(':radio[name="' + this.attr('name') + '"]').prop('checked'))) {
						this.prop('checked', false);
					} else if (this.get(0).defaultChecked) {
						this.prop('checked', true);
					}
				} else {
					// The regular textfield, textarea and the likes
					// Clear or restore default
					var nullValue = this.attr('type') == 'number' ? 0 : '';
					this.val(forceClear ? '' : this.get(0).defaultValue);
				}
				return this;
			},
			
			/**
			 * Replaces an input's name, or part of it, starting from the beginning.
			 *
			 * @param string	 	from
			 * @param string	 	to
			 * @param function	 	nameCallback
			 *
			 * @return jQuery
			 */
			renameInput: function(from, to, nameCallback) {
				if (arguments.length < 3 && typeof to === 'function') {
					nameCallback = to;
					to = from;
					from = '';
				}
				// Change "name" attributes begining with user[names][2]... to user[names][3]...
				var oldName = this.attr('name');
				if (oldName && oldName.substr(0, from.length).toLowerCase() === from.toLowerCase()) {
					// Update the name
					var newName = to + oldName.substr(from.length);
					this.attr('name', newName);
					// Update the id
					var oldId = this.attr('id');
					// We derive the new ID from the name
					var newId = newName.replace(/\[/g, '-').replace(/\]/g, '');
					this.attr('id', newId);
					if (nameCallback) {
						changeCallback.call(this, newName, oldName, newId, oldId);
					}
				}
				// Change "data-name" attributes begining with user[names][2]... to user[names][3]...
				var dataName = this.attr('data-name');
				if (dataName && dataName.substr(0, from.length).toLowerCase() === from.toLowerCase()) {
					var newDataName = to + dataName.substr(from.length);
					this.attr('data-name', newDataName);
				}
				return this;
			},
		});
	})();
	
				
	/**
	 * ------------------------------------------------------------
	 * CSS & RECTANGLE
	 * ------------------------------------------------------------
	 */
	
	
	(function() {
		/**
		 * Returns computed CSS properties.
		 *
		 * @param DOMNode			el
		 * @param string|array		props
		 * @param string			psuedo
		 *
		 * @return object|string
		 */
		d.css = function(el, props, psuedo) {
			var style = window.getComputedStyle(el, psuedo);
			return d.css.ruleCallback(props, (prop) => {
				return style.getPropertyValue(d.css.vendorize(prop) || prop);
			});
		};
				
		d.css.isAutoWidth = function(el) {
		};
		
		d.css.isAutoHeight = function(el) {
		};
		
		d.css.maxZIndex = function(el) {
			var zIndex = 0;
			$(el).children().each((i, el) => {
				zIndex = Math.max(zIndex, parseInt($(el).css('z-index')) || 0);
			});
			return zIndex;
		};
		
		d.css.borderWidth = function(el) {
			var borderWidth = 0;
			borderWidth += parseInt(d.css(el, 'border-left-width'));
			borderWidth += parseInt(d.css(el, 'border-right-width'));
			return borderWidth;
		};
		
		d.css.borderHeight = function(el) {
			var borderHeight = 0;
			borderHeight += parseInt(d.css(el, 'border-top-width'));
			borderHeight += parseInt(d.css(el, 'border-bottom-width'));
			return borderHeight;
		};
				
		/**
		 * Gets an accurate width of the device scrollbar by running a test.
		 * (Adapted from bootstrap.js)
		 *
		 * @return int
		 */
		d.css.standardScrollbarWidth = function() {
			var style = 'position:absolute;top:-9999px;width:50px;height:50px;overflow:scroll';
			var d = $('<div style="' + style + '"></div>');
			$('body').append(d);
			// Answer 2
			c = d[0].offsetWidth - d[0].clientWidth;
			d.remove();
			return c;
		};
		
		d.css.autopx = ['width', 'height', 'top', 'left', 'right', 'bottom',
		'padding', 'padding-top', 'padding-left', 'padding-right', 'padding-bottom',
		'margin', 'margin-top', 'margin-left', 'margin-right', 'margin-bottom',
		'border-width', 'border-top-width', 'border-left-width', 'border-right-width', 'border-bottom-width',
		'outline-width', 'outline-top-width', 'outline-left-width', 'outline-right-width', 'outline-bottom-width',
		];
		
		/**
		 * Returns the vendor-specific css property if supported. NULL if not.
		 *
		 * @param string 	prop
		 *
		 * @return string|NULL
		 */
		d.css.vendorize = function(prop) {
			var camelCasedProp = d.str.toCamelCase(prop, true);
			if (d.vendorPrefix && d.vendorPrefix.api + camelCasedProp in document.body.style) {
				return d.vendorPrefix.css + d.str.fromCamelCase(prop, '-');
			}
		};

		/**
		 * Loops thru all keys in props calls callback to obtain their value.
		 *
		 * @param string|array		props
		 * @param function			callback
		 * @param bool				withVendorVersion
		 *
		 * @return NULL|bool
		 */
		d.css.ruleCallback = function(props, callback, withVendorVersion) {
			var valsList = {};
			var propsList = typeof props === 'string' ? [props] : props;
			$.each(propsList, (i, prop) => {
				// We use the key as given, but we obtain value with
				// We support camel cases, but return their normalized versions
				var normalProp = d.str.fromCamelCase(prop, '-').toLowerCase();
				// With vendor verison?
				// We set the vendor version first if support for this property
				if (withVendorVersion === 'auto') {
					valsList[normalProp] = callback(d.css.vendorize(normalProp) || normalProp);
				} else {
					if (withVendorVersion) {
						var vendorizedProp = d.css.vendorize(normalProp);
						if (vendorizedProp) {
							valsList[vendorizedProp] = callback(vendorizedProp);
						}
					}
					valsList[normalProp] = callback(normalProp);
				}
			});
			return $.isArray(props) || withVendorVersion ? valsList : valsList[props];
		};
		
		/**
		 * Unmatrix: parse the values of the matrix
		 *
		 * Algorithm from:
		 *
		 * https://github.com/matthewmueller/unmatrix/blob/master/index.js
		 * @see http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp
		 *
		 * @param DOMNode el
		 *
		 * @return {Object}
		 */
		d.css.transformRule = function(el) {
			// String to matrix
			var stom = function(transformStr) {
				var m = [];
				if (window.WebKitCSSMatrix) {
					m = new window.WebKitCSSMatrix(transformStr);
					return [m.a, m.b, m.c, m.d, m.e, m.f];
				}
				var rdigit = /[\d\.\-]+/g;
				var n;
				while(n = rdigit.exec(transformStr)) {
					m.push(+n);
				}
				return m;
			};
		 	// Round to the nearest hundredth
			var round = function(n) {
				return Math.round(n * 100) / 100;
			};
			// Radians to degrees
			var r2d = function(radians) {
				var deg = radians * 180 / Math.PI;
				return round(deg);
			};
			// ---------------------------------
			var currentTransform = d.css(el, 'transform');
			var m = stom(currentTransform);
			var A = m[0];
			var B = m[1];
			var C = m[2];
			var D = m[3];
			if (A * D == B * C) throw new Error('Dramatic.parseTransform: matrix is singular');
			// step (3)
			var scaleX = Math.sqrt(A * A + B * B);
			A /= scaleX;
			B /= scaleX;
			// step (4)
			var skew = A * C + B * D;
			C -= A * skew;
			D -= B * skew;
			// step (5)
			var scaleY = Math.sqrt(C * C + D * D);
			C /= scaleY;
			D /= scaleY;
			skew /= scaleY;
			// step (6)
			if ( A * D < B * C ) {
				A = -A;
				B = -B;
				skew = -skew;
				scaleX = -scaleX;
			}
			return {
				translate: [/*x*/m[4], /*y*/m[5],],
				scale: [/*x*/round(scaleX), /*y*/round(scaleY),],
				rotate: r2d(Math.atan2(B, A)),
				skew: r2d(Math.atan(skew)),
			};
		};
	
		/**
		 * Returns inline-only CSS properties.
		 *
		 * @param DOMNode			el
		 * @param string|object		prop
		 * @param bool|string		withVendorVersions
		 *
		 * @return jQuery|object|string
		 */
		d.css.inline = function(el, props, withVendorVersion = 'auto') {
			var style = $(el).attr('style');
			if (props === 'all') {
				props = style.split(';').map(str => str.split(':')[0]);
			}
			return d.css.ruleCallback(props, (prop) => {
				var regex = new RegExp(';[ ]*?' + prop + ':([^;]+);?', 'g');
				return (regex.exec(';' + style) || ['', ''])[1];
			}, withVendorVersion);
		};

		d.css.inline.histories = {};
		
		/**
		 * Sets a reversible CSS property or list of properties.
		 *
		 * @param DOMNode			el
		 * @param string|object		prop
		 * @param string|int		val
		 * @param string|int		key
		 *
		 * @return string|int
		 */
		d.css.inline.push = function(el, propOrProps, val, key) {
			if ($.isPlainObject(propOrProps)) {
				key = val;
				val = undefined;
			} else {
				var p = {};
				p[propOrProps] = val;
				propOrProps = p;
			}
			var _key = key || d.uniqueKey();
			if (!$.isArray(d.css.inline.histories[_key])) {
				d.css.inline.histories[_key] = [];
			}
			d.css.inline.histories[_key].forEach(entry => {
				if (entry.el === el) {
					throw new Error('Can\'nt push styles with key "' + key + '"; already exists for the element.');
				}
			});
			d.css.inline.histories[_key].push({el:el, props:propOrProps, replaced:d.css.inline(el, Object.keys(propOrProps), true),});
			$(el).css(propOrProps);
			return _key;
		};
		
		/**
		 * Reverses CSS property or list of properties set with pushCss().
		 *
		 * @param string|int		key
		 *
		 * @return bool|void
		 */
		d.css.inline.pop = function(el, key, forvePopAll) {
			if (!$.isArray(d.css.inline.histories[key])) {
				return;
			}
			var applicableEntry = null;
			d.css.inline.histories[key].forEach(entry => {
				if (!applicableEntry && entry.el === el) {
					applicableEntry = entry;
				}
			});
			if (applicableEntry) {
				var element = $(el);
				$.each(applicableEntry.props, (prop, val) => {
					if (element.css(prop) === val) {
						element.css(prop, applicableEntry.replaced[prop]);
					} else if (forvePopAll) {
						element.css(prop, '');
					}
				});
				d.css.inline.histories[key]._remove(applicableEntry);
				return true;
			}
		};
	
		/**
		 * Returns inline-only CSS properties.
		 *
		 * @param DOMNode			el
		 * @param string|object		prop
		 * @param bool				noCache
		 * @param bool				withVendorVersions
		 *
		 * @return jQuery|object|string
		 */
		d.css.stylesheet = function(el, props, noCache, withVendorVersion = 'auto') {
			// Ask cache first...
			var cacheKey = $.isArray(props) ? props.join('|') : props;
			if (!noCache && d.css.stylesheet.cache[cacheKey] && d.css.stylesheet.cache[cacheKey].el === el) {
				return d.css.stylesheet.cache[cacheKey]._remove(el);
			}
			// Find rules
			var allRules = [];
			d.css.stylesheet.ruleCallback(function(ruleDefinition) {
				if (ruleDefinition.type === window.CSSRule.STYLE_RULE && $(el).is(ruleDefinition.selectorText)) {
					var propsList = props;
					if (!props/*original*/) {
						propsList = [];
						for (var i = 0; i < ruleDefinition.style.length; i ++) {
							propsList.push(ruleDefinition.style[i]);
						}
					}
					allRules.push(d.css.ruleCallback(propsList, (prop) => {
						return ruleDefinition.style[prop];
					}, withVendorVersion));
				}
			});
			// Handle priority
			allRules.forEach(rules => {});
			// Save
			d.css.stylesheet.cache[cacheKey] = allRules.slice();
			d.css.stylesheet.cache[cacheKey].el = el;
			return allRules;
		};
		d.css.stylesheet.cache = {};
		
		/**
		 * Loops thru all rules in all stylesheets (in reverse order possible).
		 *
		 * @param function			callback
		 * @param bool				reversed
		 *
		 * @return NULL|bool
		 */
		d.css.stylesheet.ruleCallback = function(callback, reversed) {
			var stylesheets = document.styleSheets;
			var stylesheetCallback = function(stylesheet) {
				try {
					for (var k = 0; k < stylesheet.cssRules.length; k ++) {
						var ruleDefinition = stylesheet.cssRules[k];
						if (callback(ruleDefinition) === true) {
							return true;
						}
					}
				} catch (e) {}
			}
			if (reversed) {
				for (var i = stylesheets.length - 1; i >= 0; i --) {
					if (stylesheetCallback(stylesheets[i]) === true) {
						return true;
					}
				}
			} else {
				for (var i = 0; i < stylesheets.length; i ++) {
					if (stylesheetCallback(stylesheets[i]) === true) {
						return true;
					}
				}
			}
		};
		
		/**
		 * FInds the keyframes of the given animation name(s) across all stylesheets.
		 *
		 * @param string|array		name
		 * @param bool				noCache
		 * @param bool				normalize
		 *
		 * @return NULL|bool
		 */
		d.css.stylesheet.keyframes = function(name, noCache, normalize = true) {
			// Ask cache first...
			var cacheKey = $.isArray(name) ? name.join('|') : name;
			if (!noCache && d.css.stylesheet.keyframes.cache[cacheKey]) {
				return d.css.stylesheet.keyframes.cache[cacheKey];
			}
			// Parse keyframes rule
			var parseKeyframes = function(ruleDefinition) {
				var keyframes = [];
				for (var i = 0; i < ruleDefinition.cssRules.length; i ++) {
					var keyframeRule = ruleDefinition.cssRules[i];
					var keyframe = d.str.parseParams(keyframeRule.cssText
						.replace(keyframeRule.keyText, '').replace('{', '').replace('}', '').trim()
					);
					var offsets = (keyframeRule.keyText || ' ').split(',').map(key => key === 'from' ? 0 : (key === 'to' ? 1 : (parseInt(key) / 100)));
					if (normalize) {
						d.css.stylesheet.normalizeToWAAPI(keyframe, ['animation-', 'transition-']);
						while(offsets.length) {
							var _keyframe = $.extend(true, {}, keyframe);
							_keyframe.offset = offsets.shift();
							keyframes.push(_keyframe);
						}
					} else {
						keyframe.offset = offsets.length > 1 ? offsets : offsets[0];
						keyframes.push(keyframe);
					}
				}
				return keyframes.sort((a, b) => a.offset === b.offset ? 0 : a.offset > b.offset ? 1 : -1);
			};
			// Find keyframes
			var allKeyframes = [];
			d.css.stylesheet.ruleCallback((ruleDefinition) => {
				if ((ruleDefinition.type === window.CSSRule.KEYFRAMES_RULE || ruleDefinition.type === window.CSSRule[d.VENDOR_PREFIX + '_KEYFRAMES_RULE'])
				&& ($.isArray(name) ? name : [name]).indexOf(ruleDefinition.name) > -1) {
					allKeyframes = allKeyframes.concat(allKeyframes, parseKeyframes(ruleDefinition));
					return true;
				}
			}, true/*reversed*/);
			// Save
			d.css.stylesheet.keyframes.cache[cacheKey] = allKeyframes;
			return allKeyframes;
		};
		d.css.stylesheet.keyframes.cache = {};
		
		/**
		 * Normalizes CSS animation properties to WAAPI compatible properties
		 *
		 * @param object			animationProps
		 * @param string|arrau		prefix
		 * @param string|arrau		offset
		 *
		 * @return null
		 */
		d.css.stylesheet.normalizeToWAAPI = function(animationProps, offset, prefix = '') {
			if ($.isArray(prefix)) {
				prefix.forEach(pref => {d.css.stylesheet.normalizeToWAAPI(animationProps, pref)});
				return;
			}
			if (animationProps[prefix + 'timing-function']) {
				animationProps.easing = animationProps[prefix + 'timing-function'];
				delete animationProps[prefix + 'timing-function'];
			}
			if (animationProps[prefix + 'fill-mode']) {
				animationProps.fill = animationProps[prefix + 'fill-mode'];
				delete animationProps[prefix + 'fill-mode'];
			}
			if (animationProps[prefix + 'iteration-count']) {
				animationProps.iterations = animationProps[prefix + 'iteration-count'];
				delete animationProps[prefix + 'iteration-count'];
				if (animationProps.iterations === 'infinite') {
					animationProps.iterations = Infinity;
				}
			}
		};
		
		/**
		 * Parses/decodes the element's transform rule
		 *
		 * @param DOMNode element
		 *
		 * @return object
		 */
		d.css.stylesheet.transformRule = function(el) {};
		
		/**
		 * Parses/decodes transform rule
		 *
		 * @param string str
		 *
		 * @return object
		 */
		d.css.stylesheet.transformRule.parse = function(str) {
			var transform = {};
			var regex = /(\w+)\((.+?)\)/g;
			var match = null;
			while(match = regex.exec(str)) {
				transform[match[1]] = (match[2].indexOf(',') > -1 ? match[2].replace(' ', '').split(',') : match[2]);
			}
			return transform;
		};
					
		/**
		 * ------------
		 * RECTANGLE
		 * ------------
		 */

		d.rect = function(el, axis, origins) {
			if ($.isPlainObject(el)) {
				return el;
			}
			origins = origins || {};
			return $.extend({}, 
				d.rect.offsets(el, axis, origins.offsetOrigin), 
				d.rect.size(el, axis, origins.boxOrigin)
			);
		};

		/**
		 * Gets the left/right/width/height of the element.
		 *
		 * @param DOMNode		el 
		 * @param object 		position
		 *
		 * @return object
		 */
		d.rect.atPosition = function(el, position) {
			var element = $(el);
			var rect = d.rect(el);
			var currentPosition = element.css('position');
			if (currentPosition !== 'static') {
				if (currentPosition === 'absolute') {
					var offsetParentRect = d.rect(element.offsetParent()[0]);
					rect.top = offsetParentRect.top;
					rect.left = offsetParentRect.left;
				} else if (currentPosition === 'fixed') {
					var offsetParentRect = d.rect(window);
					rect.top = 0;
					rect.left = 0;
				}
				rect.top = typeof position.top === 'number' ? rect.top + position.top 
					: (typeof position.bottom === 'number' ? (offsetParentRect 
						? (offsetParentRect.top + offsetParentRect.height) - (rect.height + position.bottom)
						: rect.top - position.bottom
					) : 0);
				rect.left = typeof position.left === 'number' ? rect.left + position.left 
					: (typeof position.right === 'number' ? (offsetParentRect 
						? (offsetParentRect.left + offsetParentRect.width) - (rect.width + position.right)
						: rect.left - position.right
					) : 0);
			}
			return rect;
		};

		/**
		 * Returns an object containing the element's x/y ofsets.
		 *
		 * @param DOMNode		el 
		 * @param object		axis 
		 * @param string|bool	offsetOrigin 
		 *
		 * @return object
		 */
		d.rect.offsets = function(el, axis, offsetOrigin) {
			var element = $(el);
			var offset = {};
			var axes = d.utils.makeList(axis, ['x', 'y'], true);
			var isEvent = el instanceof window.Event || el instanceof $.Event;
			var isWindow = el === window || el[0] === window;
			var originOffset = {left: 0, top: 0};
			var elementOffset = element.offset();
			if (offsetOrigin && !(offsetOrigin === true && isEvent)) {
				originOffset = (offsetOrigin !== true ? $(offsetOrigin) : element.offsetParent()).offset();
			}
			if (axes.indexOf('x') > -1) {
				offset.left = isEvent ? (offsetOrigin === true ? el.offsetX : el.pageX) 
					: (isWindow ? element.scrollLeft()
						: (elementOffset ? elementOffset.left - originOffset.left : 0));
			}
			if (axes.indexOf('y') > -1) {
				offset.top = isEvent ? (offsetOrigin === true ? el.offsetY : el.pageY) 
					: (isWindow ? element.scrollTop()
						: (elementOffset ? elementOffset.top - originOffset.top : 0));
			}
			return offset;
		};

		/**
		 * Returns an object containing the element's (inner)height and (inner)width values.
		 *
		 * @param DOMNode		el 
		 * @param string		axis 
		 * @param string		boxOrigin 
		 *
		 * @return object
		 */
		d.rect.size = function(el, axis, boxOrigin) {
			var element = $(el);
			var size = {};
			var axes = d.utils.makeList(axis, ['x', 'y'], true);
			var isEvent = el instanceof window.Event || el instanceof $.Event;
			var isWindow = el === window || el[0] === window;
			if (axes.indexOf('x') > -1) {
				size.width = isEvent ? 0 : ((boxOrigin === 'border-box' || (!boxOrigin && !isWindow)) ? element.outerWidth() : element.innerWidth());
			}
			if (axes.indexOf('y') > -1) {
				size.height = isEvent ? 0 : ((boxOrigin === 'border-box' || (!boxOrigin && !isWindow)) ? element.outerHeight() : element.innerHeight());
			}
			return size;
		};
		
		/**
		 * Returns an object containing the element's CSS min-height if set, otherwise 0; and its CSS min-width if set, otherwise 0.
		 *
		 * @param DOMNode		el 
		 * @param string|array	dimensions 
		 * @param string		boxOrigin
		 *
		 * @return object
		 */
		d.rect.size.atMin = function(el, dimensions, boxOrigin) {
			var element = $(el);
			var minNaturalSize = {};
			dimensions = d.utils.makeList(dimensions, ['width', 'height'], true);
			var valsBefore = element.css(dimensions);
			dimensions.forEach((prop) => {
				element.css(prop, '0px');
				minNaturalSize[prop] = element[0]['offset' + d.str.toTitleCase(prop)];
			});
			element.css(valsBefore);
			return minNaturalSize;
		};

		/**
		 * Returns an object containing the element's natural height and width values as though there were no CSS height and width set.
		 * The natural height and width is never more than its max-hieght or max-width nor less than its min-heigth or min-width CSS settings.
		 *
		 * @param DOMNode		el 
		 * @param string|array	dimensions 
		 * @param string		boxOrigin
		 *
		 * @return object
		 */
		d.rect.size.atMax = function(el, dimensions, boxOrigin) {
			var element = $(el);
			var maxNaturalSize = {};
			dimensions = d.utils.makeList(dimensions, ['width', 'height'], true);
			var valsBefore = element.css(dimensions);
			dimensions.forEach((prop) => {
				element.css(prop, 'auto');
				maxNaturalSize[prop] = element[0]['offset' + d.str.toTitleCase(prop)];
			});
			element.css(valsBefore);
			return maxNaturalSize;
		},
		
		/**
		 * Returns distances in x, y, and z between the centers of two rects.
		 *
		 * @param object		rect1
		 * @param object		rect2
		 * @param bool			withAngle
		 *
		 * @return object
		 */
		d.rect.delta = function(rect1, rect2, withAngle) {
			var delta = {};
			delta.x = (rect2.left + (rect2.width / 2)) - (rect1.left + (rect1.width / 2));
			delta.y = (rect2.top + (rect2.height / 2)) - (rect1.top + (rect1.height / 2));
			delta.z = Math.sqrt(Math.pow(delta.x, 2) + Math.pow(delta.y, 2));
			if (withAngle) {
				$.extend(delta, d.rect.delta.angle(delta));
			}
			return delta;
		};
		
		/**
		 * Returns distances in x, y, and z between the centers of two rects.
		 *
		 * @param object		delta
		 *
		 * @return object
		 */
		d.rect.delta.angle = function(delta) {
			if (d.isNumeric(delta.y) && d.isNumeric(delta.x)) {
				var angleOfElevation = Math.atan(delta.y/delta.x);
			} else if (d.isNumeric(delta.x) && d.isNumeric(delta.z)) {
				var angleOfElevation = Math.acos(delta.x/delta.z);
			} else if (d.isNumeric(delta.y) && d.isNumeric(delta.z)) {
				var angleOfElevation = Math.asin(delta.y/delta.z);
			}
			var angleOfDepression = 180 - 90 - angleOfElevation;
			return {
				angle:angleOfElevation, 
				angle2:angleOfDepression, 
				isHorizontal:angleOfElevation < 45, 
				isVertical:angleOfDepression < 45,
			};
		};
		
		/**
		 * Returns coordinates of two rects as one.
		 *
		 * @param object		rect1
		 * @param object		rect2
		 *
		 * @return object
		 */
		d.rect.union = function(rect1, rect2) {
			var union = {
				left: Math.min(rect1.left, rect2.left),
				top: Math.min(rect1.top, rect2.top),
				right: Math.max((rect1.left + rect1.width), (rect2.left + rect2.width)),
				bottom: Math.max((rect1.top + rect1.height), (rect2.top + rect2.height)),
			};
			// More offsets
			union.width = union.right - union.left;
			union.height = union.bottom - union.top;
			// The raw values
			union.rect1 = rect1;
			union.rect2 = rect2;
			union.delta = d.rect.delta(rect1, rect2);
			return union;
		};
		
		/**
		 * Returns coordinates of the intersection between two rects.
		 *
		 * @param object		rect1
		 * @param object		rect2
		 *
		 * @return object
		 */
		d.rect.intersection = function(rect1, rect2) {
			var intersection = {
				left: rect1.left - rect2.left,
				top: rect1.top - rect2.top,
				right: (rect2.left + rect2.width) - (rect1.left + rect1.width),
				bottom: (rect2.top + rect2.height) - (rect1.top + rect1.height),
			};
			// More offsets
			var leftline = Math.max(rect1.left, rect2.left);
			var rightline = Math.min(rect1.left + rect1.width, rect2.left + rect2.width);
			var topline = Math.max(rect1.top, rect2.top);
			var bottomline = Math.min(rect1.top + rect1.height, rect2.top + rect2.height);
			intersection.width = rightline > leftline ? rightline - leftline : 0;
			intersection.height = bottomline > topline ? bottomline - topline : 0;
			// The raw values
			intersection.rect1 = rect1;
			intersection.rect2 = rect2;
			intersection.delta = d.rect.delta(rect1, rect2);
			return intersection;
		};
		
		/**
		 * Computes the percentage proximity between two rects.
		 *
		 * @param object		rect1
		 * @param object		rect2
		 * @param string|array	axis
		 * @param object		previousProximity
		 *
		 * @return object
		 */
		d.rect.proximity = function(rect1, rect2, axis, previousProximity) {
			var proximity = {intersection: d.rect.intersection(rect1, rect2)};				
			proximity.x = proximity.x || {};
			proximity.y = proximity.y || {};
			previousProximity = $.extend(true, {}, previousProximity);
			// X,Y processing...
			d.utils.makeList(axis, ['x', 'y'], true).forEach(axis => {
				// In the context of the given axis...
				var distanceBefore = axis === 'x' ? 'left' : 'top';
				var distanceAfter = axis === 'x' ? 'right' : 'bottom';
				var rect1Length = rect1[axis === 'x' ? 'width' : 'height'];
				var rect2Length = rect2[axis === 'x' ? 'width' : 'height'];
				// ----- In which direction are we moving
				proximity[axis].moving = 'positive';
				if (previousProximity.intersection) {
					proximity[axis].moving = previousProximity.intersection[distanceBefore] > proximity.intersection[distanceBefore] 
						? 'negative' : (previousProximity.intersection[distanceBefore] < proximity.intersection[distanceBefore] 
							? 'positive' : previousProximity[axis].moving);
				}
				// ----- Cross-in percentage
				var percentageIn = 0;
				// Element topline touches or passes Anchor bottom line
				if (proximity.intersection[distanceBefore] <= rect2Length
				// Element bottom line is yet to touch, or is just touches Anchor bottom line
				&& proximity.intersection[distanceAfter] <= 0) {
					percentageIn = (rect1Length - Math.abs(proximity.intersection[distanceAfter])) / rect1Length;
				} else if (proximity.intersection[distanceAfter] > 0) {
					percentageIn = 1;
				}
				// ----- Cross-out percentage
				var percentageOut = 0;
				// Element topline touches or passes Anchor top line
				if (proximity.intersection[distanceBefore] <= 0
				// Element bottom line is yet to touch, or is just touches Anchor top line
				&& proximity.intersection[distanceAfter] <= rect2Length) {
					percentageOut = Math.abs(proximity.intersection[distanceBefore]) / rect1Length;
				} else if (proximity.intersection[distanceAfter] > rect2Length) {
					percentageOut = 1;
				}
				// ----- Cross-pass percentage
				var percentagePass = 0;
				// Element topline touches or passes Anchor bottom line
				if (proximity.intersection[distanceBefore] <= rect2Length
				// Element bottom line is yet to touch, or is just touches Anchor top line
				&& proximity.intersection[distanceAfter] <= rect2Length) {
					var totalDistance = rect2Length + rect1Length;
					var currentPass = proximity.intersection[distanceBefore] + rect1Length;
					percentagePass = (totalDistance - currentPass) / totalDistance;
				} else if (proximity.intersection[distanceAfter] > rect2Length) {
					percentagePass = 1;
				}
				// ----- Cross-overflow percentage
				var percentageContained = 0;
				if (rect1Length > rect2Length) {
					// Element is larger than, and covering Anchor top/bottom lines
					if (proximity.intersection[distanceBefore] <= 0
					&& proximity.intersection[distanceAfter] <= 0) {
						var lengthDifference = rect1Length - rect2Length;
						percentageContained = Math.abs(proximity.intersection[distanceBefore]) / lengthDifference;
					} else if (proximity.intersection[distanceAfter] > 0) {
						percentageContained = 1;
					}
				} else {
					// Element is smaller than, and within Anchor top/bottom lines
					if (proximity.intersection[distanceBefore] >= 0
					&& proximity.intersection[distanceAfter] >= 0) {
						var lengthDifference = rect2Length - rect1Length;
						percentageContained = proximity.intersection[distanceAfter] / lengthDifference;
					} else if (proximity.intersection[distanceBefore] < 0) {
						percentageContained = 1;
					}
				}
				// ------ Bind the values to the instance object
				if (proximity[axis].moving === 'negative') {
					proximity[axis].percentageIn = percentageIn;
					proximity[axis].percentageOut = percentageOut;
					proximity[axis].percentagePass = percentagePass;
					proximity[axis].percentageContained = percentageContained;
				} else {
					proximity[axis].percentageIn = 1 - percentageOut;
					proximity[axis].percentageOut = 1 - percentageIn;
					proximity[axis].percentagePass = 1 - percentagePass;
					proximity[axis].percentageContained = 1 - percentageContained;
				}
				if (rect1Length > rect2Length) {
					proximity[axis].percentageContained *= -1;
				}
			});
			return proximity;
		};
		
		/**
		 * Obseves the percentage proximity between two rects.
		 *
		 * @param DOMNode|Event|window		el1
		 * @param DOMNode|Event|window		el2
		 * @param string|array				axis
		 * @param number|bool				freq
		 *
		 * @return Observable
		 */
		d.rect.proximity.observer = function(el1, el2, axis, freq) {
			var previousProximity = null;
			var observable = new Observable;
			observable.driver = d.animation.framerate(() => {
				var proximity = previousProximity = d.rect.proximity(d.rect(el1), d.rect(el2), axis, previousProximity);
				$.each(proximity, observable.pushState);
			}, freq);
			return observable;
		};
		
		/**
		 * Manipulates an element's offset to place it with another element.
		 *
		 * @param DOMNode			 	el
		 * @param DOMNode|Event|window 	el2
		 * @param object 				options
		 * @param function 				handler
		 *
		 * @return object
		 */
		d.rect.offsetTo = function(el, el2, options, handler) {
			options = options || {};
			var length = {x:'width', y:'height'};
			var start = {x:'left', y:'top'};
			var end = {x:'right', y:'bottom'};
			var offsetAnchors = {};
			var intersection = d.rect.intersection(d.rect(options.using || el), d.rect(el2));
			intersection.left -= parseFloat(d.css(el, 'left'));
			intersection.right -= parseFloat(d.css(el, 'right'));
			intersection.top -= parseFloat(d.css(el, 'top'));
			intersection.bottom -= parseFloat(d.css(el, 'bottom'));
			// NOW, ASSUMING axis IS Y, THEN... 
			var makeOffsets = function(axis, offsets) {
				var rect1Length = intersection.rect1[length[axis]/*height*/];
				var rect2Length = intersection.rect2[length[axis]/*height*/];
				// Distinguish and predicate
				var alignment = d.str.splitOperands(options[axis] || '', ['-', '+']);
				offsets[start[axis]/*top*/] = 'auto';
				offsets[end[axis]/*bottom*/] = 'auto';
				switch(alignment.operand1) {
					case 'before':
						if (options.alternateAnchor) {
							offsets[start[axis]/*top*/] = - (intersection[start[axis]/*top*/] + rect1Length);
							offsetAnchors[axis] = start[axis]/*top*/;
						} else {
							// Anchor at bottom... with the body upwards
							offsets[end[axis]/*bottom*/] = - (intersection[end[axis]/*.bottom*/] - rect2Length);
							offsetAnchors[axis] = end[axis]/*bottom*/;
						}
					break;
					case 'start':
						// Anchor at top... with the body downwards
						offsets[start[axis]/*top*/] = - intersection[start[axis]/*.top*/];
						offsetAnchors[axis] = start[axis]/*top*/;
					break;
					case 'after':
						if (options.alternateAnchor) {
							offsets[end[axis]/*bottom*/] = - (intersection[end[axis]/*bottom*/] + rect1Length);
							offsetAnchors[axis] = end[axis]/*bottom*/;
						} else {
							// Anchor at top... with the body downwards
							offsets[start[axis]/*top*/] = - (intersection[start[axis]/*.top*/] - rect2Length);
							offsetAnchors[axis] = start[axis]/*top*/;
						}
					break;
					case 'end':
						// Anchor at bottom... with the body upwards
						offsets[end[axis]/*bottom*/] = - intersection[end[axis]/*.bottom*/];
						offsetAnchors[axis] = end[axis]/*bottom*/;
					break;
					default: // middle
						// Center between start and end - but anchor at top
						var lengthDifference = rect1Length - intersection.rect2[length[axis]/*.height*/];
						offsets[start[axis]/*top*/] = - (intersection[start[axis]/*.top*/] + (lengthDifference / 2));
						offsetAnchors[axis] = start[axis]/*top*/;
				}
				// Process predicate
				if (alignment.operator) {
					var alignmentMath = function(oprnd) {
						return oprnd.endsWith('%') ? (parseFloat(oprnd) / 100) * rect1Length : oprnd;
					};
					offsets[offsetAnchors[axis]] += d.str.sumExpr(alignment.operand2, alignmentMath) * (alignment.operator == '-' ? -1 : 1);
				}
			};
			var offsets = {};
			if (options.x !== false) {
				makeOffsets('x', offsets);
			}
			if (options.y !== false) {
				makeOffsets('y', offsets);
			}
			// Execute...
			if (handler) {
				handler.call(el, offsets, offsetAnchors);
			} else {
				return offsets;
			}
		};
		
		/**
		 * Manipulates an element's translate.translate to place it with another element.
		 *
		 * @param DOMNode			 	el
		 * @param DOMNode|Event|window 	el2
		 * @param object 				options
		 * @param function 				handler
		 *
		 * @return object
		 */
		d.rect.translateTo = function(el, el2, options, handler) {
			options = options || {};
			var length = {x:'width', y:'height'};
			var start = {x:'left', y:'top'};
			var end = {x:'right', y:'bottom'};
			var offsetAnchors = {};
			var intersection = d.rect.intersection(d.rect(options.using || el), d.rect(el2));
			// Wee'll need this too to resolve the final distances
			var activeTransform = d.css.transformRule(el);
			// ASSUMING axis IS Y, THEN... 
			var getCoord = function(axis) {
				var rect1Length = intersection[options.scale ? 'rect2' : 'rect1'][length[axis]/*height*/];
				// Distinguish and predicate
				var alignment = d.str.splitOperands(options[axis] || '', ['-', '+']);
				switch(alignment.operand1) {
					case 'before':
						// Pull beyond start
						var coord = - (intersection[start[axis]/*top*/] + rect1Length);
					break;
					case 'start':
						// Pull to start
						var coord = - intersection[start[axis]/*top*/];
					break;
					case 'after':
						// Push beyond end
						var coord = intersection[end[axis]/*bottom*/] + rect1Length;
					break;
					case 'end':
						// Push to end
						var coord = intersection[end[axis]/*bottom*/];
					break;
					default:
						// Align to center
						var coord = intersection.delta[axis];
				}
				// Values are relative to its current transform coordinates
				if (activeTransform.translate) {
					coord += parseFloat(axis == 'x' ? activeTransform.translate[0] : activeTransform.translate._last());
				}
				// Process predicate
				if (alignment.operator) {
					var alignmentMath = function(oprnd) {
						return oprnd.endsWith('%') ? (parseFloat(oprnd) / 100) * rect1Length : oprnd;
					};
					coord += d.str.sumExpr(alignment.operand2, alignmentMath) * (alignment.operator == '-' ? -1 : 1);
				}
				return coord;
			};
			var transformStart = 'translate(0, 0)';
			var transformEnd = 'translate(' + (options.x !== false ? getCoord('x') : 0) + 'px, ' + (options.y !== false ? getCoord('y') : 0) + 'px)';
			if (options.scale) {
				transformStart += ' scale(1, 1)';
				transformEnd += ' scale(' + (offsets.rect1.width / offsets.rect2.width) + ', ' + (offsets.rect1.height / offsets.rect2.height) + ')';
			}
			var from = {transform: transformStart,};
			var to = {transform: transformEnd,};
			// Execute...
			if (handler) {
				handler.call(el, to, from);
			} else {
				return to;
			}
		};
	})();
	
	/**
	 * ------------------------------------------------------------
	 * ANIMATION
	 * ------------------------------------------------------------
	 */
	
	(function() {
		/**
		 * Plays out a preset animation
		 * or a set of CSS properties using CSS transition
		 * then optionally runs a function when done.
		 *
		 * @param DOMNode				el
		 * @param array|object|string	effect
		 * @param object				params
		 * @param function				complete
		 * @param function				failure
		 *
		 * @return Animation
		 */
		d.animation = function(el, effect, params, complete, failure) {
			params = params || {};
			params.duration = params.duration || 800;
			// Convert transitions to animations
			var animationName = null;
			if ($.isPlainObject(effect) && Object.keys(effect).length && !$.isArray(effect[Object.keys(effect)[0]])) {
				effect = [$(el).css(Object.keys(effect)), effect];
			} else if (typeof effect === 'string') {
				// Retrieve keyframes of the given animation name from css
				var animationName = effect;
				effect = d.css.stylesheet.keyframes(animationName);
				if (!effect.length) {
					var msg = 'Animation name "' + animationName + '" not found in any stylesheet!';
					console.log(msg);
					if (failure) {
						failure(msg);
					}
				}
			}
			if (!params.fill) {
				params.fill = 'both';
			}
			// Convert certain easing strings to beizier curves
			if (params.easing && ['ease-in', 'ease-out', 'ease-in-out'].indexOf(params.easing) === -1 && !params.easing.indexOf('(')) {
				// Native easings, custom cubic-beziers, or Dramatic's cubic-beziers
				params.easing = d.animation.easing(params.easing) || params.easing;
			}
			// Maintian a record the properties affected
			var finalProps = {};
			effect.forEach(keyframe => {
				// Marshal out its properties
				Object.keys(keyframe)._remove('offset')._remove('easing').forEach(prop => {
					// Save last seen value of this property
					// across all keyframes...
					finalProps[prop] = keyframe[prop];
					// We can animate to auto height
					if (keyframe.height === 'auto') {
						keyframe.height = d.rect.size.atMax(el, 'height').height + 'px';
					}
					// Auto-px
					if (d.css.autopx.indexOf(prop) > -1 && d.isNumeric(keyframe[prop])) {
						keyframe[prop] += 'px';
					}
				});
			});
			// Create now...
			try {
				var animation = el.animate(effect, params);
				var setupSuccess = true;
			} catch (e) {
				var msg = (animationName ? '[' + animationName + '] ' : '') + e.toString();
				console.log(msg);
				if (failure) {
					failure(msg);
				}
				var setupSuccess = false;
				var animation = el.animate([]);
			}
			// Pause
			animation.pause();
			// onfinish manager
			var onfinish = typeof complete === 'function' ? [complete] : [];
			animation.onfinish = function(newCallback) {
				// As setter...
				if (typeof newCallback === 'function') {
					onfinish.push(newCallback);
					return;
				}
				// As getter, as it were
				if (params.cancelForCss !== false && setupSuccess) {
					if (params.fill === 'forwards' || params.fill === 'both') {
						$(el).css(finalProps);
					}
					animation.cancel();
				}
				onfinish.forEach(callback => {
					callback.call(el);
				});
			}
			// oncancel manager
			var oncancel = typeof failure === 'function' ? [failure] : [];
			animation.oncancel = function(newCallback) {
				// As setter...
				if (newCallback) {
					oncancel.push(newCallback);
					return;
				}
				// As getter, as it were
				oncancel.forEach(callback => {
					if (typeof callback === 'function') {
						callback.call(element);
					}
				});
			}
			// For further access by DramaticUi...
			// this is non-standard and we;re only begging for a property
			animation.__dramatic = {
				from: $(el).css(Object.keys(finalProps)),
				to: finalProps,
				params: $.extend({}, params),
			};
			// Like a polifyll
			if (!animation.effect) {
				animation.effect = {};
			}
			if (!animation.effect.duration) {
				animation.effect.duration = params.duration;
			}
			// Reverse
			if (params.reverse) {
				animation.reverse();
			}
			return animation;
		};
			
		/**
		 * Returns preset easing functions from CSS variables.
		 *
		 * @param string 	name
		 *
		 * @return string|NULL
		 */
		d.animation.easing = function(name) {
			 var name = !name.indexOf('-') ? d.str.fromCamelCase(name, '-') : name;
			return window.getComputedStyle(document.body).getPropertyValue('--' + name);
		};

		/**
		 * Wraps an element's effects queue for manipulation.
		 *
		 * @param array 	animations
		 *
		 * @return object
		 */
		d.animation.playback = function(animations) {
			var playback = {};
			playback.animations = animations instanceof Animation ? [animations] 
				: ($.isArray(animations) ? animations : []);
			// Pauses all effects in the queue
			playback.pause = function() {
				playback.animations.forEach(animation => {
					animation.pause();
				});
				return playback;
			};
			// Plays all effects in the queue
			playback.play = function() {
				playback.animations.forEach(animation => {
					animation.play();
				});
				return playback;
			};
			// Finishes all effects in the queue
			playback.finish = function() {
				playback.animations.forEach(animation => {
					animation.finish();
				});
				return playback;
			};
			// Cancels all effects in the queue
			playback.cancel = function() {
				playback.animations.forEach(animation => {
					animation.cancel();
				});
				return playback;
			};
			// Empty queue in-place
			// While we leave the current running effect
			playback.clear = function() {
				playback.animations.splice(1);
				return playback;
			};
			// Seek all to a specific frame
			playback.seek = function(to) {
				if (typeof to !== 'number') {
					return playback;
				}
				playback.animations.forEach(animation => {
					animation.currentTime = Math.min(to * animation.effect.duration, animation.effect.duration);
				});
				return playback;
			};
			// The average progress
			playback.progress = function(props) {
				if (!props) {
					var averageProgress = 0;
					playback.animations.forEach(animation => {
						averageProgress += animation.currentTime / animation.effect.duration;
					});
					return averageProgress / playback.animations.length;
				} else {
					var propsList = !$.isArray(props) && props ? [props] : props;
					var propsAverageProgress = {};
					playback.animations.forEach(animation => {
						var propsProgress = d.animation.playback.progress(animation, propsList);
						$.each(propsProgress, (prop, percentage) => {
							if (!propsAverageProgress[prop]) {
								propsAverageProgress[prop] = [];
							}
							propsAverageProgress[prop].push(percentage);
						});
					});
					$.each(propsAverageProgress, (prop, percentages) => {
						propsAverageProgress[prop] = percentages.length ? Array.sum(percentages) / percentages.length : false;
					});
					return !$.isArray(props) ? propsAverageProgress[props] : propsAverageProgress;
				}
			};
			// The observer object
			playback.observer = function(freq) {
				var observable = new Observable;
				d.animation.framerate(() => {
					var observedProps = observable.observedStates();
					if (observedProps.indexOf('progress') > -1) {
						observable.pushState('progress', playback.progress());
					}
					var otherProgresses = playback.progress(observedProps._remove('progress'));
					$.each(otherProgresses, observable.pushState);
				}, freq);
				return observable;
			};
			return playback;
		};
		
		/**
		 * Determines the percentage progregress of the animated properties.
		 *
		 * @param Animation		animation
		 * @param array	props
		 *
		 * @return object|number
		 */
		d.animation.playback.progress = function(animation, props) {
			var percentages = {};
			var propsList = !$.isArray(props) && props ? [props] : props;
			var element = $(animation.target);
			if (animation.__dramatic && propsList.lemgth) {
				propsList = Object.keys(animation.__dramatic.from)._intersect(propsList);
				propsList.forEach(prop => {
					var from = parseFloat(animation.__dramatic.from[prop]);
					var to = parseFloat(animation.__dramatic.to[prop]);
					var current = parseFloat(element.css(prop));
					// Only numeric values like opacity and  supported
					if (d.isNumeric(from) && d.isNumeric(to) && d.isNumeric(current)) {
						percentages[prop] = Math.abs(current - from) / Math.abs(to - from);
					} else {
						// Not applicable
						percentages[prop] = false;
					}
				});
			}
			return !$.isArray(props) ? percentages[props] : percentages;
		};

		/**
		 * Initiates a loop that calls callback at window.requestAnimationFrame()'s rate
		 * or the given frequency.
		 *
		 * @param function 		callback
		 * @param number		freq
		 *
		 * @return object
		 */
		d.animation.framerate = function(callback, freq) {
			if (!(this instanceof d.animation.framerate)) {
				return new d.animation.framerate(callback, freq);
			}
			var framerate = this;
			// Start...
			// ------------------------
			var interval = null;
			framerate.start = function() {
				if (!framerate.stopped) {
					return;
				}
				framerate.stopped = false;
				// The observer loop
				if (typeof freq === 'number' && freq) {
					interval = setInterval(callback, freq);
				} else {
					var loop = function() {
						requestAnimationFrame(() => {
							callback();
							if (!framerate.stopped) {
								loop();
							}
						});
					};
					loop();
				}
			};
			// Stop...
			// ------------------------
			framerate.stop = function() {
				clearInterval(interval);
				framerate.stopped = true;
			};
			framerate.start();
			return framerate;
		};
	})();
	
	/**
	 * ------------------------------------------------------------
	 * EVENTS & GESTURES
	 * ------------------------------------------------------------
	 */
	
	(function() {
		// -------------
		d.event = {rewrites: {}, hooks: {},};
		// -------------
		// The keyboard event.
		// -------------
		d.event.hooks.keyup = d.event.hooks.keydown = d.event.hooks.keypress = function(e) {
			e.is = {editKey: (e.key && (e.key.length === 1 || e.key === 'Backspace')),};
		};
		// -------------
		// The 'change' event.
		// -------------
		d.event.hooks.change = function(e) {
			// ---------
			e.is = d.utils.input.getStates(e.target);
			e.value = d.utils.input.value(e.target);
			e.maxValue = d.utils.input.maxValue(e.target);
			// ---------
		};
		// -------------
		d.event.parseStr = function(str, target) {
			var parts = {keyword: str};
			// The first occurence of "&" is the boundary...
			var conditionsStart = str.indexOf('&');
			if (conditionsStart > -1) {
				parts.keyword = str.substr(0, conditionsStart);
				parts.conditions = str.substr(conditionsStart + 1);
			}
			var keydownsPlusKeyword = parts.keyword.split('+');
			parts.keydowns = keydownsPlusKeyword;
			parts.keyword = keydownsPlusKeyword.pop();
			return parts;
		};
		// -------------
		// Special event hooks binder
		// -------------
		d.event.bind = function(target, str) {
			var strParse = d.event.parseStr(str);
			if ((strParse.keydowns.length || strParse.conditions || d.event.hooks[strParse.keyword]) && !d.event.rewrites[str]) {
				var strRewrite = 'dramatic-' + strParse.keyword + '-rewrite' + Object.keys(d.event.rewrites).length;
				d.event.rewrites[str] = strRewrite;
				// Hook up with a general handler
				$.event.special[strRewrite] = {
					bindType: strParse.keyword,
					deligateType: strParse.keyword,
					handle: function(e) {
						// Any set qualifier?
						if (d.event.hooks[strParse.keyword]) {
							d.event.hooks[strParse.keyword](e);
						}
						// Does the keyboard event meet the condition in predicate?
						var interpreter = new d.interpreter(e, {and:'&', or:'|', quote:'`'});
						if ((!strParse.conditions || interpreter.eval(strParse.conditions)) && (!strParse.keydowns || d.utils.event.matchKeydowns(strParse.keydowns, e))) {
							return e.handleObj.handler === false ? false : e.handleObj.handler.apply(this, arguments);
						}
					},
				};
			}
			// This is what JQuery sees now
			// Which is the string we created the hook for.
			// @see $.event.special[strRewrite] above.
			// Subsequent calls to bind() will now simply return the rewritten string
			return d.event.rewrites[str] || str;
		};

		// -------------
		d.gesture = {active: [], hooks: {},};
		// -------------
		
		// Index of all touch events we support
		d.gesture.types = {
			press: 	['press', 'pressup',], 
			rotate:	['rotate', 'rotatestart', 'rotatemove', 'rotateend', 'rotatecancel',],
			pinch: 	['pinch', 'pinchstart', 'pinchmove', 'pinchend', 'pinchcancel', 'pinchin', 'pinchout',], 
			pan: 	['pan', 'panstart', 'panmove', 'panend', 'pancancel', 'panleft', 'panright', 'panup', 'pandown',],
			swipe: 	['swipe', 'swipeleft', 'swiperight', 'swipeup', 'swipedown',],
			tap: 	['tap',],
		};
		// -------------
		d.gesture.type = function(str) {
			var types = Object.keys(d.gesture.types);
			for (var i = 0; i < types.length; i++) {
				if (d.gesture.types[types[i]].indexOf(str) > -1) {
					return types[i];
				}
			}
		};
		// -------------
		d.gesture.parse = function(str, target) {
			var strParse = d.event.parseStr(str);
			strParse.recognizer = d.gesture.type(strParse.keyword);
			// #1: Could be a recognized gesture keyword or 
			// #2: Could be a gesture HOOK with its bindType being a recognized gesture keyword
			if (strParse.recognizer || d.gesture.hooks[strParse.keyword]) {
				strParse.hook = d.gesture.hooks[strParse.keyword] 
					? d.gesture.hooks[strParse.keyword].call(target, strParse) : null;
				// If #2 above...
				if (!strParse.recognizer && strParse.hook.bindType) {
					strParse.recognizer = d.gesture.type(strParse.hook.bindType);
				}
				return strParse;
			}
		};
		// -------------
		// Gestures binder
		// -------------
		d.gesture.bind = function(target, str, selector, data, handler, hammertime, originalStr) {
			// If a special event, create its hook as this is about the last chance to do so.
			// We'll help the hook creator to distinguish the realType and any predicate that may be added.
			var strs = str.split('~');
			var strParses = [];
			for (var i = 0; i < strs.length; i ++) {
				var strParse = d.gesture.parse(strs[i]);
				if (!strParse || !strParse.recognizer) {
					// One false part spoils the entire str
					return;
				}
				strParses.push(strParse);
			}
			// One Hammer instance
			if (!hammertime) {
				hammertime = new Hammer.Manager(target[0]);
				// Save into the element itself...
				var hammerInstances = target.data('---dramatic-hammerInstances') || [];
				hammerInstances.push({str: originalStr, handler: handler, hammer: hammertime});
				target.data('---dramatic-hammerInstances', hammerInstances);
				// A quicker way for the .off() method to identify gestures
				d.gesture.active._pushUnique(originalStr);
			}
			// Lets work as if if always a list
			var recognizers = strParses.map(strParse => {
				var options = strParse.hook ? (strParse.hook.options || {}) : {};
				var recognizer = new Hammer[d.str.toTitleCase(strParse.recognizer)](options);
				hammertime.add(recognizer);
				return recognizer;
			});
			// From right to left, recognizeWith all others ahead
			$.each(recognizers, (i, recognizer) => {
				recognizer.recognizeWith(recognizers.slice(i + 1));
			});
			// Listen now...
			$.each(strParses, (i, strParse) => {
				var eventName = strParse.hook ? strParse.hook.bindType : strParse.keyword;
				hammertime.on(eventName, function(e) {
					if (!selector || $(selector).is(e.target)) {
						e.data = data;
						if (strParse.hook && strParse.hook.handle) {
							strParse.hook.handle.call(target, e, handler)
						} else {
							// Does the keyboard event meet the condition in predicate?
							if ((!strParse.conditions || d.interpreter.conditionals.eval(strParse.conditions, (key) => {
								return d.accessor.get(e, key.split('.'));
							})) && (!strParse.keydowns || d.utils.event.matchKeydowns(strParse.keydowns, e))) {
								return handler === false ? false : handler.call(target, e);
							}
						}
					}
				});
			});
			return hammertime;
		};
		// -------------
		// The zoomin/zoomout gesture.
		// -------------
		d.gesture.hooks.zoomin = function(strParse) {
			var zoomin = {
				bindType: 'pinchin',
				options: {},
			};
			if (strParse.operator) {
				zoomin.handle = function(e, originalHandler) {
					if (matchZoomGesture(e, strParse)) {
						originalHandler.call(this, e);
					}
				};
			}
			return zoomin;
		};
	})();
	
	
				
	/**
	 * ------------------------------------------------------------
	 * JQUERY WRAPPERS
	 * ------------------------------------------------------------
	 */
	
	
	(function() {
		$.fn.extend({

			/**
			 * -------------
			 * CSS
			 * -------------
			 */
	
			/**
			 * @see d.css.inline
			 */
			inlineRules: function(props, withVendorVersion) {
				return d.css.inline(this[0], props, withVendorVersion);
			},

			/**
			 * @see d.css.inline.push
			 */
			pushCss: function(prop, val, key) {
				var _key = d.css.inline.push(this[0], prop, val, key);
				if (key) {
					return this;
				} else {
					return _key;
				}
			},
			
			/**
			 * @see d.css.inline.pop
			 */
			popCss: function(key, forvePopAll) {
				d.css.inline.pop(this[0], key, forvePopAll);
				return this;
			},
			
			/**
			 * @see d.css.stylesheet
			 */
			stylesheetRules: function(props, withVendorVersion) {
				return d.css.stylesheet(this[0], props, withVendorVersion);
			},

			/**
			 * @see d.css.transformRule
			 */
			transformRule: function() {
				return d.css.transformRule(this[0]);
			},
						
			/**
			 * -------------
			 * RECTANGLE
			 * -------------
			 */
	
			/**
			 * @see d.rect
			 */
			rect: function(axis, origins) {
				return d.rect(this, axis, origins);
			},

			/**
			 * @see d.rect.intersection
			 */
			rectAtPosition: function(position) {
				return d.rect.atPosition(this[0], position);
			},

			/**
			 * @see d.rect.size
			 */
			size: function(axis, boxOrigin) {
				return d.rect.size(this[0], axis, boxOrigin);
			},

			/**
			 * @see d.rect.size.atAuto
			 */
			naturalSize: function(axis, callback, boxOrigin) {
				return d.rect.size.atAuto(this[0], axis, callback, boxOrigin);
			},
			
			/**
			 * @see d.rect.size.atMin
			 */
			minNaturalSize: function(dimensions, outer) {
				return d.rect.size.atMin(this[0], dimensions, outer);
			},

			/**
			 * @see d.rect.size.atMax
			 */
			maxNaturalSize: function(dimensions, outer) {
				return d.rect.size.atMax(this[0], dimensions, outer);
			},

			/**
			 * @see d.rect.union
			 */
			unionWith: function(element2) {
				var element2 = typeof element2 === 'string' ? $(element2) : element2/*jQuery|Event|object*/;
				return d.rect.union(d.rect($(this[0])), d.rect(element2));
			},

			/**
			 * @see d.rect.intersection
			 */
			intersectionWith: function(element2) {
				var element2 = typeof element2 === 'string' ? $(element2) : element2/*jQuery|Event|object*/;
				return d.rect.intersection(d.rect($(this[0])), d.rect(element2));
			},
			
			/**
			 * @see d.rect.offsetTo
			 */
			offsetTo: function(target, options, handler) {
				var target = typeof target === 'string' ? $(target)[0] : target;
				return this.each((i, el) => {
					var offsets = d.rect.offsetTo(el, target, options, handler);
					// Execute?
					if (offsets) {
						$(el).css(offsets);
					}
				});
			},
			
			/**
			 * @see d.rect.translateTo
			 */
			translateTo: function(target, params, handler) {
				var target = typeof target === 'string' ? $(target)[0] : target;
				return this.each((i, el) => {
					var translate = d.rect.translateTo(el, target, options, handler);
					// Execute?
					if (translate) {
						$(el).css(translate);
					}
				});
			},
						
			/**
			 * -------------
			 * ANIMATION
			 * -------------
			 */
	
			/**
			 * Plays out a preset animation
			 * or a set of CSS properties using CSS transition
			 * then optionally runs a function when done.
			 *
			 * @param string|object		effect
			 * @param object			params
			 *
			 * @return new Promise
			 */
			play: function(effect, params) {
				var elements = this;
				return new Promise((resolve, reject) => {
					elements.each((i, el) => {
						var element = $(el);
						var queue = element.data('dramatic.animation.queue') || [];
						// To the begining of the array
						var animation = d.animation(el, effect, params, () => {
							if (i === elements.length - 1) {
								resolve();
							}
						}/*omfinish*/, reject/*on setup error, oncancel*/);
						// Another onfinish
						animation.onfinish(() => {
							queue._remove(animation);
							if (queue._last()) {
								queue._last().play();
							}
						});
						queue.unshift(animation);
						element.data('dramatic.animation.queue', queue);
						// Is it just the set item? Call immediately
						if (queue.length === 1) {
							queue._last().play();
						}
					});
				});
			},
			
			/**
			 * Returns all effects in the queue for manipulation.
			 *
			 * @param function callback
			 *
			 * @return object
			 */
			playback: function(callback) {
				if (callback) {
					// Maps all effects in the queue to a callback for manipulation.
					return this.each((i, el) => {
						var element = $(el);
						var queue = element.data('dramatic.animation.queue') || [];
						queue.map(callback);
					});
				}
				return d.animation.playback(this.data('dramatic.animation.queue'));
			},
			
			/**
			 * Nicely animates an element to its new height and width after content insertion.
			 *
			 * @param array			changeHandler
			 * @param function		changeHandler
			 * @param int			duration
			 *
			 * @return new Promise
			 */
			playChanges: function(props, changeHandler, duration) {
				var elements = this;
				return new Promise((resolve, reject) => {
					props = typeof props === 'string' ? [props] : props;
					changeHandler = changeHandler || function() {};
					duration = duration || 400;
					complete = complete || function() {};
					var propsRegular = props._difference(['offsets', 'size', 'height', 'width']);
					var setProps = function(when, entry) {
						entry[when] = when === 'initial' 
							? entry.element.inlineRules(propsRegular) : entry.element.css(propsRegular);
						if (props.indexOf('width') > -1 || props.indexOf('size') > -1) {
							entry[when].width = when === 'initial' 
								? entry.element.inlineRules('width') : entry.element.outerWidth();
						}
						if (props.indexOf('height') > -1 || props.indexOf('size') > -1) {
							entry[when].height = when === 'initial' 
								? entry.element.inlineRules('height') : entry.element.outerHeight();
						}
						if (props.indexOf('offsets') > -1) {
							if (when === 'start') {
								entry.rect = entry.element.rect();
							} else if (when === 'end') {
								entry.element.translateFrom(entry.rect, {scale: true}, function(startProps, endProps) {
									// Now we know start and end
									entry.start.transform = startProps.transform;
									entry.end.transform = endProps.transform;
								});
							} else {
								entry[when].transform = entry.element.inlineRules('transform');
							}
						}
					};
					var restore = [];
					elements.each((i, el) => {
						var element = $(el);
						var entry = {element: element};
						setProps('initial', entry);
						setProps('start', entry);
						restore.push(entry);
					});
					changeHandler.call(elements);
					$.each(restore, (i, entry) => {
						setProps('end', entry);
						var promise = entry.element.css(entry.start).play(entry.end, {duration: duration});
						promise.then(() => {
							// Return back to original
							entry.element.css(entry.initial);
							if (i === elements.length - 1) {
								resolve();
							}
						});
						promise.catch(reject);
					});
				});
			},
			
			/**
			 * Nicely animates an element to its new height and width after content insertion.
			 *
			 * @param function			changeHandler
			 * @param array|string		sizeProps
			 * @param int|object		timing
			 *
			 * @return new Promise
			 */
			playResize: function(changeHandler, sizeProps, timing) {
				var elements = this;
				return new Promise((resolve, reject) => {
					sizeProps = sizeProps || 'height';
					sizeProps = typeof sizeProps === 'string' ? [sizeProps] : sizeProps;
					return elements.each((i, el) => {
						var element = $(el);
						// RESTORABLE...
						var restorableProps = element.inlineRules(sizeProps);
						var restoreDefaults = function() {
							// Return back to original
							element.css(restorableProps);
							if (i === elements.length - 1) {
								resolve();
							}
						};
						// FREEZE while the changes occur
						element.css(element.css(sizeProps));
						// Let the content be set now...
						changeHandler.call(element);
						// Apply now...
						var promise = element.play(element.maxNaturalSize(sizeProps), timing)
						promise.then(restoreDefaults);
						promise.catch(reject);
					});
				});
			},
				
			/**
			 * Fades out an element, manipulates the element and fades it in again.
			 *
			 * @param function			changeHandler
			 * @param array				keyframes
			 * @param int|number		timing
			 *
			 * @return new Promise
			 */
			playRefresh: function(changeHandler, keyframes, timing) {
				var elements = this;
				return new Promise((resolve, reject) => {
					var _duration = 400;
					if (typeof timing === 'object' && timing.duration) {
						_duration = timing.duration;
					} else if (typeof timing === 'number') {
						_duration = timing;
					}
					keyframes = keyframes || [{opacity:0,}, {opacity:1,},];
					if (!$.isArray(keyframes) || keyframes.length !== 2) {
						return;
					}
					return elements.each((i, el) => {
						var element = $(el);
						var propsBefore = element.inlineRules(Object.keys(keyframes[0]));
						var restore = function() {
							var promise = element.play(keyframes[1], {duration: _duration/2});
							promise.then(() => {
								element.css(propsBefore);
								if (i === elements.length - 1) {
									resolve();
								}
							});
							promise.catch(reject);
						};
						var promise = element.play(keyframes[0], {duration: _duration/2});
						promise.then(() => {
							var ret = changeHandler.call(element);
							if (ret instanceof window.Promise) {
								ret.then(restore);
								ret.catch(reject);
							} else {
								restore();
							}
						});
						promise.catch(reject);
					});
				});
			},
			
			/**
			 * Offsets an element to a target with animation.
			 *
			 * @param DOMNode		target
			 * @param object		offsetParams
			 * @param object		timing
			 *
			 * @return new Promise
			 */
			playOffsetTo: function(target, offsetParams, timing) {
				var elements = this;
				return new Promise((resolve, reject) => {
					elements.each((i, el) => {
						var offsets = d.rect.offsetTo(el, target, offsetParams);
						var promise = $(el).play(offsets, timing);
						promise.then(() => {
							if (i === elements.length - 1) {
								resolve();
							}
						});
						promise.catch(reject);
					});
				});
			},
			
			/**
			 * Offsets an element from a target with animation.
			 *
			 * @param DOMNode		target
			 * @param object		offsetParams
			 * @param object		timing
			 *
			 * @return new Promise
			 */
			playOffsetFrom: function(target, offsetParams, timing) {
				timing = timing || {};
				timing.reverse = true;
				return this.playOffsetTo(target, offsetParams, timing);
			},
			
			/**
			 * Translates an element to a target with animation.
			 *
			 * @param DOMNode		target
			 * @param object		translationParams
			 * @param object		timing
			 *
			 * @return new Promise
			 */
			playTranslateTo: function(target, translationParams, timing) {
				var elements = this;
				return new Promise((resolve, reject) => {
					elements.each((i, el) => {
						var to = d.rect.translateTo(el, target, translationParams);
						var promise = $(el).play(to, timing);
						promise.then(() => {
							if (i === elements.length - 1) {
								resolve();
							}
						});
						promise.catch(reject);
					});
				});
			},
			
			/**
			 * Translates an element from a target with animation.
			 *
			 * @param DOMNode		target
			 * @param object		translationParams
			 * @param object		timing
			 *
			 * @return new Promise
			 */
			playTranslateFrom: function(target, translationParams, timing) {
				timing = timing || {};
				timing.reverse = true;
				return this.playTranslateTo(target, translationParams, timing);
			},
			
			/**
			 * Nicely animates an element to its new height and width after content insertion.
			 *
			 * @param Event			evt
			 * @param object		params
			 *
			 * @return Promise
			 */
			ripple: function(evt, params) {
				params = params || {};
				var element = this;
				if (element.find('.ripple-container').length) {
					return;
				}
				var rippleContainer = $('<div class="ripple-container overlay pointer-events-none overflow-hidden radius-inherit z-index-10"></div>')
					.appendTo(element);
				var ripple = $('<span class="ripple-object pos-abs radius-full d-inline-block apply-color" style="width:1px; height:1px;"></span>')
					.css('transform', 'translate(-50%, -50%)')
					.appendTo(rippleContainer);
				var props = {position: 'absolute', backgroundColor: params.color || 'currentColor'};
				if ((evt instanceof window.Event || evt instanceof $.Event) && params.orientation !== false) {
					var elementOffset = element.offset(); 
					if (params.orientation !== 'y') {
						props.left = (evt.pageX - elementOffset.left) - (ripple.outerWidth() / 2);
					}
					if (params.orientation !== 'x') {
						props.top = (evt.pageY - elementOffset.top) - (ripple.outerHeight() / 2);
					}
				}
				ripple.css(props);
				var positionPush = -1;
				if (element.css('position') === 'static') {
					positionPush = element.pushCss('position', 'relative');
				}
				var elementSqr = Math.max(element.outerWidth(), element.outerHeight());
				var animationPromise = ripple.play(params.animation || [
					{width: '0%', height: '0%', opacity: 0, offset: 0,},
					{width: elementSqr + 'px', height: elementSqr + 'px', opacity: params.opacity || 0.25, offset: 0.25,},
					{width: (elementSqr * 3.5) + 'px', height: (elementSqr * 3.5) + 'px', opacity: 0, offset: 1,},
				], {duration: params.duration || 1200});
				animationPromise.then(() => {
					element.popCss(positionPush);
					rippleContainer.remove();
				});
				return animationPromise;
			},
						
			/**
			 * -------------
			 * UI
			 * -------------
			 */
	
			/**
			 * Covers an element with an overlay element.
			 * It ensures (if not specified) that the overlay's z-index is higher than other elements in the context.
			 *
			 * It sets the flex-align-*, flex-justify-* classes using the values provided in params.x and params.y
			 * for algning the content that it may eventually have.
			 *
			 * All of this is undone when the overlay is removed from the DOM.
			 *
			 * @param object params
			 * @param bool	 autoFix
			 *
			 * @return jQuery
			 */
			overlay: function(params, autoFix = true) {
				params = params || {};
				var element = this[0] === window ? $('body') : this;
				var overlay = $('<div class="overlay modal overflow-auto"></div>');
				overlay.addClass(params.classes || '')
					.addClass(this[0] === window ? 'pos-fxd-top-lft' : 'pos-abs-top-lft')
					.addClass('flex-align-' + (params.x || 'center'))
					.addClass('flex-justify-' + (params.y || 'center'))
					.appendTo(element);
				var cssKey = null;
				if (autoFix) {
					if (this[0] === window || params.modal) {
						element.seizeScrolling();
					}
					params.zIndex = params.zIndex || d.css.maxZIndex(element[0]);
					overlay.css('z-index', params.zIndex + 1);
					if (element.css('position') === 'static') {
						cssKey = element.pushCss('position', 'relative');
					}
				}
				element.data('dramatic.overlays', (element.data('dramatic.overlays') || []).push(overlay[0]));
				overlay.observeRemoved(() => {
					(element.data('dramatic.overlays') || [])._remove(overlay[0]);
					if (autoFix) {
						if (this[0] === window || params.modal) {
							element.resumeScrolling();
						}
						if (cssKey) {
							element.popCss(cssKey);
						}
					}
				});
				return overlay;
			},
			
			/**
			 * Returns the element's list of overlays.
			 *
			 * @return array|undefined
			 */
			overlays: function() {
				return this.data('dramatic.overlays');
			},
			
			/**
			 * Places a backdrop behind an element.
			 * It ensures (if not specified) that the overlay's z-index is higher than other elements in the context
			 * and likewise raises the element's z-index to just above that of the overlay.
			 *
			 * All of this is undone when the backdrop is removed from the DOM.
			 *
			 * @param object params
			 * @param bool	 autoFix
			 *
			 * @return jQuery
			 */
			backdrop: function(params, autoFix = true) {
				params = params || {};
				var backdrop = this.data('dramatic.backdrop');
				if (!backdrop) {
					var element = this;
					var parent = element.parent();
					var backdrop = $('<div class="overlay modal pos-abs-top-lft"></div>');
					parent.append(backdrop.addClass(params.classes || ''));
					params.zIndex = d.isNumeric(params.zIndex) ? params.zIndex : d.css.maxZIndex(parent[0]);
					backdrop.css('z-index', params.zIndex + 1).css('opacity', d.isNumeric(params.opacity) ? params.opacity : 0);
					element.data('dramatic.backdrop', backdrop[0]);
					var cssKey, cssKey2 = null;
					if (autoFix) {
						if (parent.css('position') === 'static') {
							cssKey = parent.pushCss('position', 'relative');
						}
						cssKey2 = element.pushCss('z-index', params.zIndex + 2);
					}
					backdrop.observeRemoved(() => {
						element.removeData('dramatic.backdrop');
						if (autoFix && (cssKey || cssKey2)) {
							parent.popCss(cssKey).popCss(cssKey2);
						}
					});
				}
				return $/*incase retreived from data*/(backdrop);
			},
			
			/**
			 * Overlays an element with a ghost (a faded copy of itself) and returns it for use.
			 *
			 * @param number fadeAmount
			 *
			 * @return jQuery
			 */
			ghost: function(fadeAmount) {
				var original = this;
				var ghost = original.clone();
				return ghost.css({position:'absolute', opacity:fadeAmount || 0}).disableForm().reinsertion(() => {
					this.after(original);
				}).offsetTo(original);
			},
			
			/**
			 * Overlays an element with a ghost (a faded copy of itself) and returns it for use.
			 *
			 * @param number fadeAmount
			 * @param bool	 autoFix
			 *
			 * @return jQuery
			 */
			anchor: function(fadeAmount, autoFix = true) {
				var original = this;
				var anchor = this.clone().css('opacity', fadeAmount || 0).disableForm().reinsertion(() => {
					this.before(original);
				});
				var cssKey = null;
				original.offsetTo(anchor, {}, (offsets) => {
					offsets.position = 'absolute';
					cssKey = original.pushCss(offsets);
				});
				return anchor.observeRemoved((e) => {
					original.popCss(cssKey);
					if (autoFix) {
						original.reinsertion(() => {
							if (e.followingSibling) {
								this.after(e.followingSibling);
							} else if (e.previousSibling) {
								this.before(e.previousSibling);
							}
						});
					}
				});
			},
						
			/**
			 * -------------
			 * SCROLLING
			 * -------------
			 */
	
			/**
			 * Tells if an element is scrollable due to overflowing content.
			 *
			 * @return bool
			 */
			scrolls: function() {
				//return this.length && this[0].scrollHeight - this[0].clientWidth;
				return this.length && this[0].scrollHeight > this[0].clientHeight;
			},
			
			/**
			 * Initiates a mechanism that seizes scrolling.
			 *
			 * @param string containerSelector
			 *
			 * @return jQuery
			 */
			seizeScrolling: function(containerSelector) {
				var viewport = this;
				var seizureData = viewport.data('scroll-seizure');
				if (!seizureData) {
					seizureData = {};
					viewport.data('scroll-seizure', seizureData);
				}
				if (typeof seizureData.seizedAt !== 'number') {
					seizureData.containerSelector = containerSelector;
					var subViewport = $(viewport.children(containerSelector)[0]);
					var scrollAnchor = viewport.is('body') ? $(window) : viewport;
					var hasScrollbars = viewport.scrolls();
					var currentScroll = scrollAnchor.scrollTop();
					if (!subViewport.length) {
						return this;
					}
					if (viewport.is('body')) {
						viewport.addClass('overlay pos-fxd');
					}
					if (hasScrollbars) {
						viewport.addClass('overflow-y-scroll');
					}
					subViewport
						.addClass('overlay overflow-hidden')
						.scrollTop(currentScroll);
					seizureData.seizedAt = currentScroll;
				}
				// Current call count
				seizureData.counter = (seizureData.counter || -1) + 1;
				return this;
			},
			
			/**
			 * Release the mechanism that seizes scrolling.
			 *
			 * @param bool forceResume
			 *
			 * @return jQuery
			 */
			resumeScrolling: function(forceResume) {
				var viewport = this;
				var seizureData = viewport.data('scroll-seizure');
				if (!seizureData || typeof seizureData.seizedAt !== 'number') {
					// No active seizure 
					return this;
				}
				if (seizureData.counter > 1 && !forceResume) {
					// There are other active calls 
					seizureData.counter --;
					return this;
				}
				var subViewport = $(viewport.children(seizureData.containerSelector)[0]);
				var scrollAnchor = viewport.is('body') ? $(window) : viewport;
				subViewport
					.scrollTop(0)
					.removeClass('overlay overflow-hidden');
				viewport
					.removeClass('pos-fxd overlay overflow-y-scroll')
					.removeData('scroll_value_at_seizure')
					.removeData('call_count_to_seizure');
				scrollAnchor.scrollTop(seizureData.seizedAt);
				return this;
			},
			
			/**
			 * Gets an element's nearest scrollable parent.
			 *
			 * @return jQuery
			 */
			scrollParent: function() {
				var element = this[0];
				if (element) {
					var style = window.getComputedStyle(element);
					var excludeStaticParent = style.position === 'absolute';
					var overflowRegex = false/*includeHidden*/ ? /(auto|scroll|hidden)/ : /(auto|scroll)/;
					if (style.position === 'fixed') {
						return $(document.body);
					}
					for (var parent = element; (parent = parent.parentElement);) {
						style = window.getComputedStyle(parent);
						if (excludeStaticParent && style.position === 'static') {
							continue;
						}
						if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
							return $(parent);
						}
					}
				}
				return $(document.body);
			},
			
			/**
			 * Scrolls an element into a visible area relative to its closest scrollable parent.
			 *
			 * @params string|jQuery 	viewport
			 * @params object			params
			 * @params function 		complete
			 *
			 * @return jQuery
			 */
			scrollIntoView: function(viewport, params, complete) {
				if (!this.offset()) {
					return this;
				}
				params = params || {};
				var length = {x:'width', y:'height'};
				var start = {x:'left', y:'top'};
				var end = {x:'right', y:'bottom'};
				var viewport = viewport ? this.parents(viewport) : this.scrollParent();
				if (viewport && !viewport.scrolls()) {
					return this;
				}
				// Calculate distances
				var impliedViewport = viewport.is('body') ? $(window) : viewport;
				var offsets = this.intersectionWith(impliedViewport);
				var getScrollValue = function(axis) {
					var rect1Length = offsets.rect1[length[axis]];
					// Distinguish and predicate
					var alignment = d.str.splitOperands(params[axis] || '', ['-', '+']);						
					// If the "whenNotInView" flag is true but its in view, return
					var inView = axis === 'x' 
						? (offsets.intersectsLeft || offsets.intersectsRight) 
						: (offsets.intersectsTop || offsets.intersectsBottom);
					if (params.whenNotInView && inView) {
						return;
					}
					if (alignment.operand1 == 'start') {
						// Distance elementStart -to- ViewportStart
						var scrollAmount = offsets[start[axis]];// .left, .top
					} else if (alignment.operand1 == 'end') {
						// Distance elementBottom -to- ViewportBottom
						var scrollAmount = - offsets[end[axis]];// .right, .bottom
					} else {
						// Distance elementCenter -to- ViewportCenter
						var scrollAmount = offsets.delta[axis];// .delta.x, .delta.y;
					}
					// Relative values
					var currentScroll = axis === 'x' ? impliedViewport.scrollLeft() : impliedViewport.scrollTop();
					// Very important
					scrollAmount += currentScroll;
					// Process predicate
					if (alignment.operator) {
						var alignmentMath = function(oprnd) {
							return oprnd.endsWith('%') ? (parseFloat(oprnd) / 100) * rect1Length : oprnd;
						};
						scrollAmount += d.str.sumExpr(alignment.operand2, alignmentMath) * (alignment.operator == '-' ? -1 : 1);
					}
					return scrollAmount;
				};
				var newScrollValues = {};
				if (params.x !== false) {
					newScrollValues.scrollLeft = getScrollValue('x');
				}
				if (params.y !== false) {
					newScrollValues.scrollTop = getScrollValue('y');
				}
				if (viewport.is('body')) {
					viewport = viewport.add('html');
				}
				// Execute
				var duration = typeof params.duration == 'number' ? params.duration : 400;
				viewport.clearQueue().animate(newScrollValues, duration, complete);
				return this;
			},
		});
		
		// -------------------------------------------------------------------

		var originalEventListener = jQuery.fn.on;
		var originalEventListenerRemover = jQuery.fn.off;
		var mutationObserverOptions = function(options) {
			if ($.isPlainObject(options)) {
				var opts = {optionsObject: options, optionsArray: Object.keys(options)};
			} else {
				var opts = {optionsObject: {}, optionsArray: typeof options === 'string' ? options.split(' ') : options};
				opts.optionsArray.forEach((option) => {
					opts.optionsObject[option] = true;
				});
			}
			return opts;
		};
	
		var eventBindCallback = function(events, selector, data, handler, callback) {
			if ($.isPlainObject(events)) {
				$.each(events, (events, handler) => {
					eventBindCallback(events, selector, data, handler, callback);
				});
				return;
			}
			// In search of handler
			if (typeof handler === 'undefined') {
				handler = data;
				data = undefined;
				if (typeof handler === 'undefined') {
					handler = selector;
					selector = undefined;
				}
			}
			events.split(' ').forEach((evt) => {
				callback(evt, selector, data, handler);
			});
		};
			
		// -------------------------------------------------------------------
		
		$.fn.extend({
			/**
			 * @inheritdoc
			 */
			on: function(events, selector, data, handler) {
				var element = this;
				var eventsRewrite = '';
				var hammertime = null;
				eventBindCallback(events, selector, data, handler, (evt, selector, data, handler) => {
					var gestureBind = d.gesture.bind(element, evt, selector, data, handler, hammertime, events);
					if (gestureBind) {
						hammertime = gestureBind;
					} else {
						// We're rebilding the event string from what the binder returns
						eventsRewrite += ' ' + d.event.bind(element, evt);
					}
				});
				// Was it all-hammer?
				if (!eventsRewrite) {
					return element;
				}
				// We're good to go...
				return originalEventListener.call(this, eventsRewrite.trim(), selector, data, handler);
			},
			
			/**
			 * @inheritdoc
			 */
			off: function(events, selector, handler) {
				var element = this;
				var eventsRewrite = '';
				eventBindCallback(events, selector, null/*data*/, handler, (evt, selector, data, handler) => {
					// Gesture or event?
					if (d.gesture.active.indexOf(evt) > -1) {
						(element.data('---dramatic-hammerInstances') || []).forEach((binding) => {
							if (binding.str === evt && (!selector || binding.selector === selector) && (!handler || binding.handler === handler)) {
								// Yes destroy...
								binding.hammer.destroy();
							}
						});
					} else {
						eventsRewrite += ' ' + (d.event.rewrites[evt] || evt);
					}
				});
				// Was it all-hammer?
				if (!eventsRewrite) {
					return element;
				}
				// We're good to go...
				return originalEventListenerRemover.call(this, eventsRewrite.trim(), selector, handler);
			},
			
			/**
			 * Observes mutations in the element or its subtree.
			 *
			 * @param string|array		options
			 * @param function			handler
			 *
			 * @return jQuery
			 */
			observe: function(options, callback) {
				options = mutationObserverOptions(options);
				if (!['childList', 'attributes', 'characterData']._intersect(options.optionsArray).length) {
					return this;
				}
				var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
				var Observer = new MutationObserver(function(mutations) {
					mutations.forEach((mutation) => {
						if (options.optionsArray.indexOf(mutation.type) > -1) {
							callback.call($(mutation.target), mutation)
						}
					});
				});
				return this.each((i, el) => {
					Observer.observe(el, options.optionsObject);
				});
			},
			
			/**
			 * Observes when an attribute of this element changes and runs a callback.
			 *
			 * @param array|string		attrFilter
			 * @param function			callback
			 *
			 * @return jQuery
			 */
			observeAttr: function(attrFilter, callback) {
				callback = arguments.length === 1 ? attrFilter : callback;
				attrFilter = arguments.length === 1 ? [] : (typeof attrFilter === 'string' ? [attrFilter] : attrFilter);
				return this.each((i, el) => {
					$(el).observe({attributes: true, attributeFilter: attrFilter, attributeOldValue: true}, function(e) {
						callback.call($(el), e);
					});
				});
			},
			
			/**
			 * Observes when this element leaves the DOM and runs a callback.
			 *
			 * @param function			callback
			 *
			 * @return jQuery
			 */
			observeRemoved: function(callback) {
				return this.each((i, el) => {
					$(el).parent().observe('childList', function(e) {
						$.each(e.removedNodes, (i, removed) => {
							if (removed === el) {
								callback.call($(el), e);
							}
						});
					});
				});
			},
			
			/**
			 * Observes mutations in the element's subtree.
			 *
			 * @param string|array		options
			 * @param function			handler
			 *
			 * @return jQuery
			 */
			observeTree: function(options, callback) {
				options = mutationObserverOptions(options);
				options.optionsObject.subtree = true;
				return this.observe(options.optionsObject, callback);
			},
			
			/**
			 * Replants an unplanted element.
			 *
			 * @param function callback
			 *
			 * @return jQuery
			 */
			reinsertion: function(callback) {
				this.attr('reinsertion', 'true');				
				var reinserted = false;
				var reinsert = function() {
					if (!reinserted) {
						this.removeAttr('reinsertion');
						reinserted = true;
					}
				};
				var callbaclReturn = callback.call(this);
				if (callbaclReturn instanceof window.Promise) {
					callbaclReturn.then(reinsert).catch(reinsert);
				} else {
					reinsert();
				}
				return this;
			},
		});
	})();
	
				
	(function() {
		
		// ------------------------------------------------------------
		// THE OBSERVABLE OBJECT
		// ------------------------------------------------------------
	
		/**
		 * The Observable class
		 */
		window.Observable = class {
			/**
			 * Constructs a new observable
			 */
			constructor() {
				this.state = {};
				this.prevState = {};
				this.bindings = [];
			}
			
			/**
			 * Registers an observer.
			 *
			 * @param string			query
			 * @param function			handler
			 * @param int				edge
			 *
			 * @return void
			 */
			observe(query, handler, edge) {
				var main = this;
				if (typeof query === 'function') {
					edge = handler;
					handler = query;
					query = null;
				} else if (typeof query !== 'string' || typeof handler !== 'function') {
					return false;
				}
				var operands = query ? (new d.interpreter(null/*subject*/, null/*options*/)).scan(query) : [];
				main.bindings.push({query:query, handler:handler, operands:operands, edge:edge,});
			}
		
			/**
			 * Unregisters an observer.
			 *
			 * @param string		query
			 * @param function		handler
			 * @param int			edge
			 *
			 * @return void
			 */
			unobserve(query, handler, edge) {
				var main = this;
				if (typeof query === 'function') {
					edge = handler;
					handler = query;
					query = null;
				}
				main.bindings.forEach(observerObj => {
					if ((!query && observerObj.query === query) 
					&& (!handler || observerObj.handler === handler) 
					&& (!edge || observerObj.edge === edge)) {
						main.bindings._remove(observerObj);
					}
				});
			}
			
			/**
			 * Publishes current state to elements, handles callbacks and event firing.
			 *
			 * @param string|object		stateName
			 * @param mixed				stateData
			 * @param bool|array		runBindings
			 *
			 * @return mixed
			 */
			pushState(stateName, stateData = true, runBindings = true) {
				var main = this;
				if ($.isPlainObject(stateName)) {
					$.each(stateName, (_stateName, _stateData) => {
						main.pushState(_stateName, _stateData, stateData/*runBindings*/);
					});
					return false;
				}
				main.state[stateName] = stateData;
				var changedStates = [stateName];
				if (main.statesAliases[stateName]) {
					main.state[main.statesAliases[stateName]] = stateData;
					changedStates.push(main.statesAliases[stateName]);
				}
				// ------------------------------------------------
				if (stateData !== false) {
					// If this state belongs to a push-pull group,
					// every other state in the group is turned off
					main.pushPullStates.forEach((group) => {
						if (group.indexOf(stateName) > -1) {
							group._difference([stateName]).forEach((_stateName) => {
								main.prevState[_stateName] = ($.isPlainObject(main.state[_stateName]) && main.state[_stateName]) || $.isArray(main.state[_stateName]) 
									? d.obj.copyPlain(main.state[_stateName]) : main.state[_stateName];
								main.state[_stateName] = false;
								changedStates.push(_stateName);
								if (main.statesAliases[_stateName]) {
									main.state[main.statesAliases[_stateName]] = false;
									changedStates.push(main.statesAliases[_stateName]);
								}
							});
						}
					});
				}
				var returnToken = null;
				if (runBindings) {
					var scanners = [];
					// runBindings when an array specifies a of stateNames/queries to run
					main.bindings.forEach((handleObject) => {
						if (!handleObject.query && !$.isArray(runBindings)) {
							scanners.push(handleObject);
							return;
						}
						if (changedStates._intersect(handleObject.operands).length) {
							returnToken = main.readStates(handleObject.query, handleObject.handler, null/*valueCallback*/, handleObject.edge) === false ? false : returnToken;
						}
					});
					if (scanners.length) {
						main.scanStates((stateName, stateData) => {
							scanners.forEach((binding) => {
								if (!d.isNumeric(binding.edge) || (binding.edge === 1 && stateData) || (binding.edge === 0 && !stateData)) {
									returnToken = binding.handler(stateName, stateData) === false ? false : returnToken;
								}
							});
						});
					}
				}
				// So we're going to save copies of all states affected
				changedStates.forEach((_stateName) => {
					main.prevState[_stateName] = $.isPlainObject(main.state[_stateName]) || $.isArray(main.state[_stateName]) 
						? d.obj.copyPlain(main.state[_stateName]) : main.state[_stateName];
				});
				return returnToken;
			}
				
			/**
			 * Returns the list of active states.
			 *
			 * @param string 	query
			 * @param function 	queryCallback
			 * @param function 	valueCallback
			 * @param int		edge
			 * @param object	options
			 *
			 * @return mixed
			 */
			readStates(query, queryCallback, valueCallback, edge = null, options = {}) {
				var main = this;
				var currentValueOrAssertion = (new d.interpreter(valueCallback ? (propName) => {
					return valueCallback(main.state, propName);
				} : main.state, options)).eval(query);
				if (!queryCallback) {
					return currentValueOrAssertion;
				}
				var previousValueOrAssertion = (new d.interpreter(valueCallback ? (propName) => {
					return valueCallback(main.prevState, propName);
				} : main.prevState, options)).eval(query);
				var fallingOrRisingEdge = !d.isNumeric(edge) || (edge === 1 && currentValueOrAssertion) || (edge === 0 && !currentValueOrAssertion);
				if (!d.interpreter.compare(currentValueOrAssertion, previousValueOrAssertion) && fallingOrRisingEdge) {
					return queryCallback ? queryCallback(currentValueOrAssertion) : currentValueOrAssertion;
				}
			}
			
			/**
			 * Scans the states for changes.
			 *
			 * @param function callback
			 */
			scanStates(callback) {
				var main = this;
				Object.keys(main.state).forEach(key => {
					// Call on any change!
					if (!d.interpreter.compare(main.state[key], main.prevState[key])) {
						callback(key, main.state[key]);
					}
				});
			}
			
			/**
			 * Returns the list of active states.
			 *
			 * @return array
			 */
			activeStates() {
				var main = this;
				var activeStates = [];
				$.each(main.state, (stateName, stateData) => {
					if (stateData !== false && stateData !== undefined && !isNaN(stateData)) {
						activeStates.push(stateName);
					}
				});
				return activeStates;
			}
				
			/**
			 * Returns the list of states being observed.
			 *
			 * @return array
			 */
			observedStates() {
				var main = this;
				var observedStates = [];
				main.bindings.forEach(observerObj => {
					observedStates = observedStates.concat(observerObj.operands.filter(oprnd => observedStates.indexOf(oprnd) === -1));
				});
				return observedStates;
			}
		}
		Observable.prototype.pushPullStates = [];
		
		/**
		 * ------------------------------------------------------------
		 * ROLE-BASED DOM EXTENSION
		 * ------------------------------------------------------------
		 */
		
		$.fn.extend({	
			/**
			 * Tells if an element has the given role set.
			 *
			 * @param string roleName
			 *
			 * @return bool
			 */
			hasRole: function(roleName) {
				var rolesList = (this.attr('data-role') || '') + ' ' + (this.attr('role') || '');
				return rolesList.trim().split(' ').indexOf(roleName) > -1;
			},
			
			/**
			 * Adds a role to the element's list of roles.
			 *
			 * @param string roleName
			 *
			 * @return this
			 */
			addRole: function(roleName) {
				var dataRole = (this.attr('data-role') || '').split(' ');
				var role = (this.attr('role') || '').split(' ');
				// Role values wherever they are
				var roleTarget = dataRole.length ? 'data-role' : 'role';
				roleName.split(' ').forEach((r) => {
					if (dataRole.indexOf(r) === -1 && role.indexOf(r) === -1) {
						if (roleTarget === 'data-role') {
							dataRole.push(r);
						} else {
							role.push(r);
						}
					}
				});
				// Where do we save to?
				this.attr(roleTarget, roleTarget === 'data-role' ? dataRole.filter(itm => itm !== '').join(' ') : role.join(' '));
				return this;
			},
			
			/**
			 * Removes a role from the element's list of roles.
			 *
			 * @param string roleName
			 *
			 * @return this
			 */
			removeRole: function(roleName) {
				var dataRole = this.attr('data-role');
				var role = this.attr('role');
				if (dataRole) {
					this.attr('data-role', dataRole.split(' ')._difference(roleItems).join(' '));
				}
				if (role) {
					this.attr('role', role.split(' ')._difference(roleItems).join(' '));
				}
				return this;
			},
			
			/**
			 * Gets the element playing the given role in the matched component.
			 *
			 * @param object selectors
			 * @param string roleName
			 * @param object params
			 *
			 * @return RoleDom|Proxy
			 */
			roledom: function(selectors, roleName, params) {
				var element = $(this[0]);
				if (!element.length) {
					return new RoleDom(this, roleName, selectors, params);
				}
				if (element.data('dramatic.roledom.registry.' + roleName)) {
					return element.data('dramatic.roledom.registry.' + roleName);
				}
				// Collect more props and params
				if (roleName && roleName.length) {
					var attrSelectors = element.attr('data-' + roleName + '-role-selectors');
					if (attrSelectors) {
						selectors = $.extend(true, {}, selectors, d.parseParams(attrSelectors));
					}
					var attrParams = element.attr('data-' + roleName + '-role-params');
					if (attrParams) {
						params = $.extend(true, {}, params, d.parseParams(attrParams));
					}
				}
				// Instantiate at this point...
				var domdi = new RoleDom(element, selectors, roleName, params);
				var domdiRegistry = domdi.registry();
				if (roleName && roleName.length) {
					element.data('dramatic.roledom.' + roleName, domdi);
					element.data('dramatic.roledom.registry.' + roleName, domdiRegistry);
				}
				return domdiRegistry;
			},
		});
		
		// ------------------------------------------------------------
		// THE ROLEDOM OBJECT
		// ------------------------------------------------------------
	
		/**
		 * The RoleDom class
		 */
		class RoleDom {
			/**
			 * @param DOMNode				baseElement
			 * @param object|string			selectors
			 * @param string 				role
			 * @param array|string			params
			 */
			constructor(baseElement, selectors, role, params) {
				this.baseElement = $(baseElement);
				this.role = role;
				if (role === '*') {
					this.role = (this.baseElement.attr('data-role') || this.baseElement.attr('role') || '').split(' ')._first();
				}
				this.selectors = typeof selectors === 'string' ? d.str.parseParams(selectors) : (selectors || {});
				this.params = typeof params === 'string' ? d.str.parseParams(params) : (params || {});
				this.elements = {};
				this.elements['element'] = baseElement;
			}
		
			/**
			 * Returns a proxy object that lazily retreives a element.
			 *
			 * @return Proxy
			 */
			registry() {
				var main = this;
				// Can we return it wrapped in Proxy?
				if ('Proxy' in window) {
					return new Proxy(main, {
						get: function(RoleDomInstance, key) {
							var orig = RoleDomInstance[key];
							if ($.isFunction(orig)) {
								return function() {
									return orig.apply(RoleDomInstance, arguments);
								};
							}
							return RoleDomInstance.getElement(key);
						},
						set: function(RoleDomInstance, key, val) {
							RoleDomInstance.addElement(key, val);
							return val;
						},
						has: function(RoleDomInstance, key) {
							RoleDomInstance.hasElement(key);
						},
						deleteProperty: function(RoleDomInstance, key) {
							RoleDomInstance.removeElement(key);
						}
					});
				}
				return main.createAll();
			}
		
			/**
			 * Creates all element from selectors.
			 *
			 * @param array 		only
			 * @param array 		except
			 * @param bool	 		forceCreate
			 * @param jQuery		context
			 *
			 * @return array
			 */
			createAll(only, except, forceCreate, context) {
				var main = this;
				// Find the elements...
				var only = $.isArray(only) && only.length ? only : Object.keys(main.selectors);
				// Run now...
				only.forEach((name) => {
					if (except && except.indexOf(name) > -1) {
						return;
					}
					main.create(name, forceCreate, context);
				});
				return main.elements;
			}
		
			/**
			 * Finds an element from a corresponding selector in params.
			 *
			 * @param string 			name
			 * @param bool	 			forceCreate
			 * @param jQuery		 	context
			 *
			 * @return jQuery
			 */
			create(name, forceCreate, context) {
				var main = this;
				var context = context ? context : main.baseElement;
				var selector = main.selectors[name] || '';
				if (!selector) {
					var roleElement = main.findSubRoleElements(name);
					if (roleElement) {
						main.addElement(name, roleElement);
					} else if (forceCreate) {
						main.addElement(name, $());
					}
				}
				// We have a selector...
				if (selector === 'element') {
					// A nice way to refere to main element
					main.addElement(name, main.baseElement);
				} else if (typeof selector === 'string' && selector.length) {
					// A bare string. Find globally
					main.addElement(name, $(selector));
				} else if (typeof selector === 'function') {
					// A function. So, we use function return
					var returned = selector(main.baseElement);
					if (returned) {
						main.addElement(name, returned);
					}
				} else if (selector instanceof $ || ($.isPlainObject(selector) && Object.keys(selector).length)) {
					if (selector instanceof $) {
						// Already a jQuery object
						main.addElement(name, selector);
					} else {
						// Plain object. Evaluate each components
						$.each(selector, (resolution, subselector) => {
							if (resolution === 'global') {
								main.addElement(name, $(subselector));
							} else {
								var parsedResolution = main.parseResolution(resolution);
								if (parsedResolution) {
									main.addResolvableElement(name, parsedResolution.new_context, parsedResolution.new_resolution, subselector);
								} else {
									main.addResolvableElement(name, context, resolution, subselector);
								}
							}
						});
					}
				}
				return main.elements[name];
			}
			
			/**
			 * Strategically finds the element that plays the given role for this objects's role.
			 *
			 * @param string		name
			 *
			 * @return jQuery|null
			 */
			findSubRoleElements(name) {
				var main = this;
				var roleSelector = '[data-role~="' + main.role + '"], [role~="' + main.role + '"]';
				if (main.role && main.baseElement.is(roleSelector)) {
					var subRoleSelector = '.' + main.role + '-' + name;
					var roleElement = main.baseElement.find(subRoleSelector).filter(function(i, element) {
						return $(element).closest(roleSelector)[0].isSameNode(main.baseElement[0]);
					});
					return roleElement.length ? roleElement : null;
				}
			}
			
			/**
			 * Parses a selector string for context.
			 *
			 * @param string	resolution
			 *
			 * @return object
			 */
			parseResolution(resolution) {
				var main = this;
				if (resolution && resolution.indexOf('.') > -1) {
					var resolutionParts = resolution.split('.');
					// Base name
					var baseName = resolutionParts[0].trim();
					// New selector
					var new_resolution = resolutionParts[1].trim();
					// Switch context
					var new_context = baseName === 'element' 
						? main.baseElement 
						: (main.elements[baseName] || main.create(baseName));
					if (!new_context) {
						// Context is not even in main.params.selectors
						new_context = $();
					}
					return {
						new_resolution: new_resolution,
						new_context: new_context
					}
				}
			}
			
			/**
			 * Parses a selector string for context.
			 *
			 * @param string		name
			 * @param jQuery	 	context
			 * @param string		resolution
			 * @param string		selector
			 *
			 * @return void
			 */
			addResolvableElement(name, context, resolution, selector) {
				var main = this;
				if (['import', 'importBefore', 'importAfter'].indexOf(resolution) > -1 && main.params.importer) {
					var imported = main.params.importer(selector)
					if (typeof imported === 'string' || imported instanceof $) {
						element = typeof imported === 'string' ? $(imported) : imported;
						if (main.role) {
							element.addClass(main.role + '-' + name);
						}
						context[resolution === 'importBefore' ? 'prepend' : (resolution === 'importAfter' ? 'append' : 'html')](element);
						main.addElement(name, element);
					}
				} else {
					var args = selector ? ($.isArray(selector) ? selector : [selector]) : []; 
					if (resolution === 'closestDesc') {
						args[1] = main.params.stopContext;
					}
					main.addElement(name, context[resolution].apply(context, args));
				}
			}
			
			/**
			 * Adds a new element to the stack.
			 *
			 * @param string 			name
			 * @param jQuery 			element
			 * @param bool	 			merge
			 *
			 * @return this
			 */
			addElement(name, element, merge = true) {
				var main = this;
				main.elements[name] = main.elements[name] instanceof $ && merge ? main.elements[name].add(element) : element;
				return main;
			}
			
			/**
			 * Returns an element or creates it if not yet created.
			 *
			 * @param string name
			 * @param bool	 returnBaseOnFalse
			 *
			 * @return jQuery|null
			 */
			getElement(name, returnBaseOnFalse) {
				var main = this;
				if (!main.elements[name]) {
					main.create(name);
				}
				if ((!main.elements[name] || !main.elements[name].length) && returnBaseOnFalse) {
					return main.baseElement;
				}
				return main.elements[name] || null;
			}
			
			/**
			 * Removes a created element from the list.
			 *
			 * @param string name
			 *
			 * @return this
			 */
			removeElement(name) {
				var main = this;
				if (main.elements[name]) {
					delete main.elements[name];
				}
				return main;
			}
			
			/**
			 * Tells if an element is defined or is findable as sub-role.
			 *
			 * @param string name
			 *
			 * @return bool
			 */
			hasElement(name) {
				var main = this;
				return (main.elements[name] || main.selectors[name] || main.findSubRoleElements(name));
			}
		}
		
		/**
		 * @var array
		 */
		RoleDom.prototype.resolutions = [
			'parents', 
			'parent', 
			'closest', 
			'siblings', 
			'children', 
			'closestDesc',
			'roledom', 
			'getElement', 
			'find', 
			'filter',
			'load',
		];
	})();
	
})(jQuery, Dramatic)