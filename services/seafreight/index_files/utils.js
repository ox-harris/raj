(function(d) {
	
	// ------------------------------------
	d.arr = {};
	d.str = {};
	d.obj = {};
	d.interpreter = {conditionals:{}, comparison:{}};
	d.accessor = {};
	d.utils = {};
	// ------------------------------------

	/**
	 * ---------------------------
	 * Array instance methods
	 * ---------------------------
	 */				

	if (!Array.prototype._firstAll) {
		Array.prototype._firstAll = function() {
			return d.arr.firstAll(this, ...arguments);
		}
	}
	
	if (!Array.prototype._first) {
		Array.prototype._first = function() {
			return d.arr.first(this, ...arguments);
		}
	}
					
	if (!Array.prototype._lastAll) {
		Array.prototype._lastAll = function() {
			return d.arr.lastAll(this, ...arguments);
		}
	}
					
	if (!Array.prototype._last) {
		Array.prototype._last = function() {
			return d.arr.last(this, ...arguments);
		}
	}
					
	if (!Array.prototype._followingAll) {
		Array.prototype._followingAll = function() {
			return d.arr.followingAll(this, ...arguments);
		}
	}
					
	if (!Array.prototype._followingUntil) {
		Array.prototype._followingUntil = function() {
			return d.arr.followingUntil(this, ...arguments);
		}
	}
					
	if (!Array.prototype._following) {
		Array.prototype._following = function() {
			return d.arr.following(this, ...arguments);
		}
	}
					
	if (!Array.prototype._precedingAll) {
		Array.prototype._precedingAll = function() {
			return d.arr.precedingAll(this, ...arguments);
		}
	}
					
	if (!Array.prototype._precedingUntil) {
		Array.prototype._precedingUntil = function() {
			return d.arr.precedingUntil(this, ...arguments);
		}
	}
					
	if (!Array.prototype._preceding) {
		Array.prototype._preceding = function() {
			return d.arr.preceding(this, ...arguments);
		}
	}
					
	if (!Array.prototype._intersect) {
		Array.prototype._intersect = function() {
			return d.arr.intersect(this, ...arguments);
		}
	}
		
	if (!Array.prototype._difference) {
		Array.prototype._difference = function() {
			return d.arr.difference(this, ...arguments);
		}
	}
		
	if (!Array.prototype._insertBefore) {
		Array.prototype._insertBefore = function() {
			return d.arr.insertBefore(this, ...arguments);
		}
	}
		
	if (!Array.prototype._insertAfter) {
		Array.prototype._insertAfter = function() {
			return d.arr.insertAfter(this, ...arguments);
		}
	}
		
	if (!Array.prototype._pushUnique) {
		Array.prototype._pushUnique = function() {
			return d.arr.pushUnique(this, ...arguments);
		}
	}
		
	if (!Array.prototype._remove) {
		Array.prototype._remove = function() {
			return d.arr.remove(this, ...arguments);
		}
	}
		
	if (!Array.prototype._replace) {
		Array.prototype._replace = function() {
			return d.arr.replace(this, ...arguments);
		}
	}
		
	if (!Array.prototype._removeAll) {
		Array.prototype._removeAll = function() {
			return d.arr.removeAll(this, ...arguments);
		}
	}
		
	if (!Array.prototype._random) {
		Array.prototype._random = function() {
			return d.arr.random(this, ...arguments);
		}
	}
		
	if (!Array.prototype._inSequence) {
		Array.prototype._inSequence = function() {
			return d.arr.inSequence(this, ...arguments);
		}
	}
	
	/**
	 * ---------------------------
	 * Other instance methods
	 * ---------------------------
	 */				

	if (!Math._sumExpr) {
		Math._sumExpr = function() {
			return d.str.sumExpr(...arguments);
		}
	}

	
	/**
	 * ---------------------------
	 * Array utils
	 * ---------------------------
	 */				

	d.arr.firstAll = function(arr, length) {
		var count = 0;
		arr.forEach(itm => {
			count ++;
		});
		return arr.slice(arr.length - count, length || 0);
	};
	
	d.arr.first = function(arr) {
		var count = 0;
		arr.forEach(itm => {
			count ++;
		});
		return arr[arr.length - count];
	};
	
	d.arr.lastAll = function(arr, length) {
		return arr.slice().reverse().slice(0, length || 0).reverse();
	};
	
	d.arr.last = function(arr) {
		return arr[arr.length - 1];
	};
	
	d.arr.followingAll = function(arr, reference, length, loop) {
		length = length || arr.length;
		var from = arr.indexOf(reference) + 1;
		var following = typeof reference !== 'undefined' ? arr.slice(from, from + length) : [];
		if (loop && following.length < length && following.length < arr.length) {
			following = following.concat(arr.slice(0, length - following.length));
		}
		return following;
	};
	
	d.arr.followingUntil = function(arr, reference, reference2, loop) {
		var from = arr.indexOf(reference);
		var to = arr.indexOf(reference2);
		var length = to < from 
			? arr.length - from - 1/*the remainder forward*/ + to + 1/*the other half*/
			: to - from;
		return d.arr.followingAll(arr, reference, length, loop);
	};
	
	d.arr.following = function(arr, reference, loop) {
		return d.arr.followingAll(arr, reference, 1, loop)[0];
	};

	d.arr.precedingAll = function(arr, reference, length, loop) {
		length = length || arr.length;
		var arr = arr.slice().reverse();
		var from = arr.indexOf(reference) + 1;
		var preceding = typeof reference !== 'undefined' ? arr.slice(from, from + length) : [];
		if (loop && preceding.length < length && preceding.length < arr.length) {
			preceding = preceding.concat(arr.slice(0, length - preceding.length));
		}
		return preceding;
	};
	
	d.arr.precedingUntil = function(arr, reference, reference2, loop) {
		var from = arr.indexOf(reference);
		var to = arr.indexOf(reference2);
		var length = to > from 
			? from/*the begining backward*/ + arr.length - to/*the other half*/
			: from - to;
		return d.arr.precedingAll(arr, reference, length, loop);
	};
	
	d.arr.preceding = function(arr, reference, loop) {
		return d.arr.precedingAll(arr, reference, 1, loop)[0];
	};

	d.arr.intersect = function(arr, arr2) {
		return !$.isArray(arr2) ? [] : arr.filter(value => -1 !== arr2.indexOf(value));
	};

	d.arr.difference = function(arr, arr2) {
		return !$.isArray(arr2) ? [] : arr.filter(value => -1 === arr2.indexOf(value));
	};

	d.arr.insertBefore = function(arr, reference, itm, spread) {
		var secondHalf = arr.splice(arr.indexOf(reference));
		(spread ? itm : [itm]).concat(secondHalf).forEach(function(itm) {
			arr.push(itm);
		});
		return arr;
	};

	d.arr.insertAfter = function(arr, reference, itm, spread) {
		var secondHalf = arr.splice(arr.indexOf(reference) + 1/*the difference between _insertBefore*/);
		(spread ? itm : [itm]).concat(secondHalf).forEach(function(itm) {
			arr.push(itm);
		});
		return arr;
	};

	d.arr.pushUnique = function(arr, itm) {
		if (arr.indexOf(itm) < 0) {
			arr.push(itm);
		}
		return arr;
	};

	d.arr.remove = function(arr, itm) {
		var index = arr.indexOf(itm);
		if (index > -1) {
			arr.splice(index, 1);
		}
		return arr;
	};

	d.arr.replace = function(arr, itm, replacement) {
		var index = arr.indexOf(itm);
		if (index > -1) {
			arr[index] = replacement;
		}
		return arr;
	};

	d.arr.removeAll = function(arr, itms) {
		if (typeof itms === 'undefined') {
			return arr;
		}
		itms = typeof itms !== 'array' ? [itms] : itms;
		itms.forEach(function(itm) {
			d.arr.remove(arr, itm);
		});
		return arr;
	};
	
	/**
	 * Gets a random value from an array.
	 *
	 * @param array 	arr
	 *
	 * @return mixed
	 */
	d.arr.random = function(arr) {
		return arr[Math.floor(Math.random() * arr.length)];
	};

	/**
	 * calls callback with each item in the list and waits inbetween for each callback's promise to resolve.
	 * The delay parameter may be used solely as the wait or as an addition to the promise-based wait.
	 *
	 * @param int|string|object 	interval
	 *
	 * @return new Promise
	 */
	d.arr.inSequence = function(arr, callback, timing) {
		if (!Array.isArray(arr)) {
			return;
		}
		if (timing && typeof timing === 'object') {
			var delay = timing.delay || 0;
			var sync = timing.sync || false;
		} else {
			var delay = typeof timing === 'number' ? timing : 0;
			var sync = typeof timing === 'boolean' || timing === 'last' ? timing : false;
		}
		var items = arr;
		var promise = new Promise(function(resolve, reject) {
			if (items.length) {
				var call = function(i) {
					var advance = () => {
						if (items.length > i + 1) {
							if (delay) {
								setTimeout(() => {call(i + 1);}, delay);
							} else {
								call(i + 1);
							}
						} else {
							resolve()
						}
					}
					var ret = callback(items[i]);
					if (ret instanceof Promise && (sync === true || (sync === 'last' && i === items.length - 1))) {
						// On any of the outcomes...
						ret.then(advance);
						ret.catch(advance);
					} else {
						advance();
					}
				}
				call(0);
			} else {
				resolve();
			}
		});
		return promise;
	};
	
	/**
	 * ---------------------------
	 * String utils
	 * ---------------------------
	 */
	 
	/**
	 * Tells if a string is evaluates to a number.
	 *
	 * @param string 	str
	 *
	 * @return bool
	 */
	d.isNumeric = function(str) {
		return str !== null && !isNaN(str * 1);
	};
	
	/**
	 * Removes enc;osing backticks from a string.
	 *
	 * @param string 	str
	 *
	 * @return string
	 */
	d.str.untick = function(str) {
		if (str.startsWith('`') && str.endsWith('`')) {
			return str.substr(1, str.length - 2);
		}
		return str;
	};
	 
	/**
	 * Converts a string to title case.
	 *
	 * @param string 	str
	 * @param bool 		strict
	 *
	 * @return string
	 */
	d.str.toTitleCase = function(str, strict) {
		if (typeof str !== 'string') {
			return str;
		}
		return str.replace(/\w\S*/g,  function(txt) { return txt.charAt(0).toUpperCase() + ((typeof strict !== undefined && strict) ? txt.substr(1).toLowerCase() : txt.substr(1)); })
	};
	
	/**
	 * Makes a string camel-cased.
	 *
	 * @param string 	str
	 * @param bool	 	fromStart
	 *
	 * @return string
	 */
	d.str.toCamelCase = function(str, fromStart) {
		// Make disting words
		str = d.str.toTitleCase(str.replace(/-/g, ' ')).replace(/ /g, '');
		return fromStart ? str : str[0].toLowerCase() + str.substr(1);
	};
	
	/**
	 * Splits a camel-cased string.
	 *
	 * @param string 	str
	 * @param string 	delimiter
	 *
	 * @return string
	 */
	d.str.fromCamelCase = function(str, delimiter) {
		return str === undefined ? '' : str.split(/(?=[A-Z])/).join(delimiter ? delimiter : ' '); // positive lookahead to keep the capital letters
	};
	
	/**
	 * Splits a structured string on its outer delimiters.
	 *
	 * @param string 	str
	 * @param string 	delim
	 * @param object	options:
	 * @param string 		blocks				The strings that begin and end a nested structure
	 * @param number 		limit				Max results to return
	 * @param string 		backreference		A character like (\) that prefixes non-delim characters
	 * @param bool	 		delimInclusive		
	 *
	 * @return array
	 */
	d.str.splitOuter = function(str, delims, options) {
		// Parameters and defaults
		options = options || {};
		// We accept multiple delims
		delims = delims 
			? (!Array.isArray(delims) ? [delims] : delims) 
			: [','];
		if (!delims.length) {
			return [str];
		}
		var delimIf = function(i) {
			return delims.filter(delim => str.substr(i, delim.length) === delim)[0];
		};
		// We accept multiple stop chars
		stopChars = options.stopChars 
			? (!Array.isArray(options.stopChars) ? [options.stopChars] : options.stopChars) 
			: [];
		var stopCharIf = function(i) {
			return stopChars.filter(char => str.substr(i, char.length) === char)[0];
		};
		options.blocks = options.blocks 
			? (!Array.isArray(options.blocks) ? [options.blocks] : options.blocks).map(block => !Array.isArray(block) ? [block] : block)
			: [['(', ')'], ['[', ']'], ['{', '}'], ['"'], ["'"], ['`'],];
		// Bool testers
		var nestingLevel = [];
		var handleNesting = function(i) {
			var matchedBlocks_start = options.blocks.filter(block => str.substr(i, block[0].length) === block[0])[0];
			var matchedBlocks_end = options.blocks.filter(block => str.substr(i, block._last().length) === block._last())[0];
			if (matchedBlocks_end && nestingLevel.length && matchedBlocks_end[0] === nestingLevel._last()[0]) {
				nestingLevel.pop();
			} else if (matchedBlocks_start) {
				nestingLevel.push(matchedBlocks_start);
			}
			return nestingLevel;
		};
		var matches = [];
		options.matchedDelims = [];
		// Iterate over each character, keep track of current row and column (of the returned array)
		var evalCharsAt = function(i) {
			if (i >= str.length) {
				return;
			}
			if (matches.length - 1 !== options.limit
			&& (!options.backreference || str.substr(i - options.backreference.length, options.backreference.length) !== options.backreference)
			&& !handleNesting(i).length) {
				if (stopCharIf(i)) {
					return;
				}
				var matchedDelim = delimIf(i);
				if (matchedDelim) {
					options.matchedDelims.push(matchedDelim);
					if (!options.delimInclusive) {
						return evalCharsAt(i + matchedDelim.length);
					}
				}
			}
			matches[options.matchedDelims.length] = (matches[options.matchedDelims.length] || '') + str[i];
			return evalCharsAt(i + 1);
		}
		evalCharsAt(0);
		return matches;
	};
	
	/**
	 * @see d.str.splitOuter
	 */
	d.str.splitOuterInclusive = function(str, delim, options) {
		options = options || {};
		options.delimInclusive = true;
		return d.str.splitOuter(str, delim, options);
	};
	
	/**
	 * @see d.str.splitOuter
	 */
	d.str.splitOuterAggregated = function(str, aggregation, options) {
		options = options || {};
		if (!$.isPlainObject(aggregation)) {
			return [];
		}
		var result = {};
		var matchedDelims = {};
		var aggregationNames = Object.keys(aggregation);
		$.each(aggregationNames, (i, name) => {
			var delims = !Array.isArray(aggregation[name]) ? [aggregation[name]] : aggregation[name];
			var stopChars = aggregationNames.slice(i + 1).map(name => aggregation[name])._flatten();
			var split = d.str.splitOuter(str, delims, {stopChars:stopChars});
			str = split.pop();
			if (split.length || delims._last() === true) {
				result[name] = split.length === 1 ? split[0] : split;
				matchedDelims[name] = options.matchedDelims;
				delete options.matchedDelims;
				if (result[i - 1] && !result[i - 1].length) {
					result[i - 1] = i === aggregationNames.length - 1 ? str : result[name].shift();
				}
			}
		});
		options.matchedDelims = matchedDelims;
		return result;
	};
	
	/**
	 * Parse the string into operand1, operator, operand2
	 *
	 * @param string 	str		
	 * @param array		operators		
	 *
	 * @return object
	 */
	d.str.splitOperands = function(str, operators = ['!=', '<=', '>=', '<', '>', '^=', '$=', '*=', '~=', '==', '=',]) {
		if (!str || typeof str !== 'string') {
			return {};
		}
		operators = typeof operators == 'string' ? [operators] : operators;
		var options = {limit:1,};
		var split = d.str.splitOuter(str, operators, options);
		var parts = {operand1: split[0].trim()};
		if (options.matchedDelims.length) {
			parts.operand2 = split[1].trim();
			parts.operator = options.matchedDelims[0].trim();
		}
		return parts;
	};

	/**
	 * Evaluates the Math in an expression.	
	 *
	 * @param string 	expr		
	 * @param function 	operandCallback		
	 *
	 * @return number|string
	 */	
	d.str.sumExpr = function(expr, operandCallback) {
		expr = d.str.splitOuterInclusive(expr, ['+', '-', '*', '/',]);
		var result = 0;
		expr.forEach(oprnd => {
			var operator = oprnd.substr(0, 1);
			var _oprnd = oprnd.substr(1).trim();
			if (operator === '+') {
				result += operandCallback ? operandCallback(_oprnd) : _oprnd;
			} else if (operator === '-') {
				result -= operandCallback ? operandCallback(_oprnd) : _oprnd;
			} else if (operator === '*') {
				result *= operandCallback ? operandCallback(_oprnd) : _oprnd;
			} else if (operator === '/') {
				result /= operandCallback ? operandCallback(_oprnd) : _oprnd;
			} else {
				// This must be the first oprnd
				result = operandCallback ? operandCallback(oprnd) : oprnd;
			}
		});
		return result;
	};
	 		
	/**
	 * Parses a depth in string notation into array.
	 *
	 * @param string 	strDepth
	 *
	 * @return array
	 */
	d.str.parseDepth = function(strDepth) {
		if (!strDepth) {
			return [];
		}
		if (strDepth.substr(0, 1) == '[') {
			// Remove the leading brackets [ from [key1][key2]
			strDepth = strDepth.substr(1);
		}
		if (strDepth.substr(strDepth.length - 1, 1) == ']') {
			// Remove the trailing brackets ] from [key1][key2]
			strDepth = strDepth.substr(0, strDepth.length - 1);
		}
		return strDepth.split('[', strDepth.replace(/\]\[/g, '['));
	};
		
	/**
	 * Write the given list of keys in string notation.
	 *
	 * @param array array The input array.
	 *
	 * @return string
	 */
	d.str.stringifyDepth = function(arr) {
		var wrapper = arr[0];
		var strDepth = wrapper;
		var keys = arr.slice(1);
		if (keys.length) {
			strDepth = wrapper + '[' + keys.join('][') + ']';
		}
		return strDepth;
	};
	
	/**
	 * Converts a structured string to object.
	 *
	 * @param string 	str
	 *
	 * @return string
	 */
	d.str.parseParams = function(str) {
		var obj = {};
		if (str && str.indexOf(':') > -1) {
			$.each(d.str.splitOuter(str.trim(), ';'), (i, param) => {
				var prop = d.str.splitOuter(param, ':');
				if (prop.length > 2 && !prop[0]) {
					// Something like this... {:key:value}
					var key = prop[1].trim();
					var val = prop[2].trim();
				} else {
					// The normal thing like this... {key:value}
					var key = prop[0].trim();
					var val = (prop[1] ? prop[1] : '').trim();
				}
				obj[d.str.untick(key)] = d.str.parseParams.val(val);
			});
		} else if (str) {
			return d.str.parseParams.val(str);
		}
		return obj;
	};
	
	/**
	 * Helper for d.str.parseParams.
	 *
	 * @param string 	val
	 *
	 * @return mixed
	 */
	d.str.parseParams.val = function(val) {
		if (val.startsWith('{') && val.endsWith('}')) {
			return d.str.parseParams(val.substr(1, val.length - 2));
		} else if (val.startsWith('[') && val.endsWith(']')) {
			return d.str.splitOuter(val.substr(1, val.length - 2), ',').map(itm => d.str.parseParams.val(itm.trim()));
		} else if (val === 'TRUE' || val === 'FALSE' || val === 'NULL' || val === 'UNDEFINED' || d.isNumeric(val)) {
			return val === 'TRUE' ? true 
				: (val === 'FALSE' ? false 
					: (val === 'NULL' ? null 
						: (val === 'UNDEFINED' ? undefined : parseFloat(val))));
		}
		return d.str.untick(val);
	};
	
	/**
	 * Writes the given list of properties (keys => val) as string in multidimensional array notation. 
	 * The reverse of Accessor::parseParams().
	 * Its a more flexible version http_build_query() as this is totally controllable with flags.
	 *
	 * @param object obj 				The input object.
	 * @param string operator 			The key => value pairer.
	 * @param string delimiter 			The pairs separator.
	 *
	 * @return string
	 */
	d.str.stringifyParams = function(obj, operator = ':', delimiter = '; ') {
		if (!$.isPlainObject(obj)) {
			return obj;
		}
		var strs = [];
		$.each(obj, (key, val) => {
			strs.push(key + operator + d.str.stringifyParams.val(val, operator, delimiter));
		});
		return strs.join(delimiter);
	};
	
	/**
	 * Helper for d.str.stringifyParams.
	 *
	 * @param mixed 	val
	 *
	 * @return string
	 */
	d.str.stringifyParams.val = function(val, operator, delimiter) {
		if (val === true || val === false || val === null || val === undefined) {
			return val === true ? 'TRUE' : (val === false ? 'FALSE' : (val === null ? 'NULL' : 'UNDEFINED'));
		} else if ($.isArray(val)) {
			return '[' + val.map(v => d.str.stringifyParams.val(v, operator, delimiter)).join(delimiter) + ']';
		} else if ($.isPlainObject(val)) {
			var str =  d.str.stringifyParams(val, operator, delimiter);
			return str ? '{' + str + delimiter.trim() + '}' : '{}';
		}
		return val;
	};
	
	/**
	 * ---------------------------
	 * Interpreter
	 * ---------------------------
	 */				
	
	d.interpreter = class {
		/**
		 * Initiats an interpreter instance.	
		 *
		 * @param object|function 	subject		
		 * @param object		 	options		
		 */	
		constructor(subject, options) {
			if (typeof subject !== 'object' && !$.isFunction(subject)) {
				throw new Error('Subject must be an object or a callback function. (' + subject + ' given!)');
			}
			this.subject = subject;
			this.options = options || {};
			this.references = [];
		}
		
		/**
		 * Scans a query string and mines the operand.	
		 *
		 * @param string query		
		 *
		 * @return array
		 */	
		scan(query) {
			var main = this;
			var operands = [];
			// --------------------
			main.scanning = true;
			var originalSubject = main.subject;
			main.subject = function(expr) {
				operands._pushUnique(expr.split('.')._first());
			};
			// --------------------
			main.eval(query);
			// --------------------
			main.subject = originalSubject;
			main.scanning = false;
			// --------------------
			return operands;
		}
		
		/**
		 * Evaluate a list of conditions with "and" or "or" as conjuctions,
		 * with support for ternary operators.	
		 *
		 * @param string query		
		 *
		 * @return bool|mixed
		 */	
		eval(query) {
			var main = this;
			// Break the query on its "and/or" conjuctions
			var and = main.options.and || ' && ';
			var or = main.options.or || ' || ';
			var conjunction = null;
			if (query.indexOf(and) > -1 || query.indexOf(or) > -1) {
				var split = query.indexOf('(') > -1 ? d.str.splitOuter(query, and) : query.split(and);
				conjunction = and;
				if (split.length < 2) {
					split = query.indexOf('(') > -1 ? d.str.splitOuter(query, or) : query.split(or);
					conjunction = or;
				}
			} else {
				var split = [query];
			}
			// Obtain the outcomes...
			var hasOutcomeSection = false;
			var onTrue = true;
			var onFalse = false;
			var outcomeSection = split._last();
			if (outcomeSection.indexOf('?') > -1 && outcomeSection.indexOf(':') > -1) {
				var options2 = {};
				var outcomeSection = d.str.splitOuter(outcomeSection, ['?', ':'], options2);
				if (options2.matchedDelims.length) {
					split.pop();
					split.push(outcomeSection[0]);
					onTrue = outcomeSection[1].trim();
					onFalse = outcomeSection[2].trim();
					hasOutcomeSection = true;
				}
			}
			if (!hasOutcomeSection && split.length === 1) {
				return main.evalEpression(split[0]);
			}
			// Evaluate each part of the query
			var assertion = conjunction === and ? true : false;
			split.forEach(q => {
				assertion = conjunction === and ? (assertion && main.evalEpression(q.trim())) : (assertion || main.evalEpression(q.trim()));
			});
			// Handle outcome
			if (main.scanning) {
				// Run both outcomes to just also scan their operands
				main.evalEpression(onTrue);
				main.evalEpression(onFalse);
			} else {
				// Return the appropriate outcome
				var outcome = assertion ? onTrue : onFalse;
				return typeof outcome === 'string' ? main.evalEpression(outcome) : outcome;
			}
		}
		
		/**
		 * Resolves an expression and evaluates any mathematical expression within	
		 *
		 * @param string expr	
		 *
		 * @return string|number
		 */
		evalEpression(expr) {
			var main = this;
			if (typeof expr !== 'string' || d.isNumeric(expr)) {
				return d.isNumeric(expr) ? parseFloat(expr) : expr;
			}
			expr = expr.trim();
			if (expr.startsWith('!')) {
				return main.evalEpression(expr.substr(1)) ? false : true;
			}
			if (expr.startsWith('$') && d.isNumeric(expr.substr(1))) {
				if (main.references.length - 1 < expr.substr(1)) {
					throw new Error('Parser variable ' + expr + ' does not exist!');
				}
				return main.references[expr.substr(1)];
			}
			var quote = main.options.quote || '"';
			if (expr.startsWith(quote) && expr.endsWith(quote) && expr.replace(new RegExp(quote, 'g'), '').length === (expr.length - 2)) {
				return expr.substr(1, expr.length - 2);
			}
			// Full expression
			// ---------------
			if ((expr.startsWith('(') || expr.startsWith('$(')) && expr.endsWith(')') && expr.indexOf(')') > expr.lastIndexOf('(')) {
				var oror = expr;
				var isReference = false;
				if (expr.startsWith('$(')) {
					isReference = true;
					expr = expr.substr(1);
				}
				expr = main.eval(expr.substr(1, expr.length - 2).trim());
				if (isReference) {
					main.references.push(expr);
				}

				return expr;
			}
			// Object
			// ---------------
			if (expr.startsWith('{') && expr.endsWith('}') && expr.indexOf('}') > expr.lastIndexOf('{')) {
				var _expr = {};
				d.str.splitOuter(expr.substr(1, expr.length - 2), ',').forEach((entry) => {
					var keyValue = d.str.splitOuter(entry.trim(), ':');
					_expr[keyValue[0]] = main.evalEpression(keyValue[1]);
				});
				return _expr;
			}
			// Array
			// ---------------
			if (expr.startsWith('[') && expr.endsWith(']') && expr.indexOf(']') > expr.lastIndexOf('[')) {
				var _expr = [];
				d.str.splitOuter(expr.substr(1, expr.length - 2), ',').forEach((entry) => {
					_expr.push(main.evalEpression(entry.trim()));
				});
				return _expr;
			}
			// Comparison
			// ---------------
			var comparsison = d.str.splitOperands(expr);
			if (comparsison.operator) {
				return d.interpreter.compare(main.evalEpression(comparsison.operand1), main.evalEpression(comparsison.operand2), comparsison.operator);
			}
			// Math
			// ---------------
			if (expr.indexOf('+') > 1 || expr.indexOf('-') > 1 || expr.indexOf('*') > 1 || expr.indexOf('/') > 1) {
				return d.str.sumExpr(expr, (oprnd) => {
					return main.evalEpression(oprnd);
				});
			}
			// Percentage Case
			// ---------------
			if (expr.endsWith('%')) {
				if (!main.options.percentageContext) {
					throw new Error('Percentage context not given for an expression with percentages!');
				}
				return (parseFloat(expr) / 100) * main.options.percentageContext
			}
			if (typeof main.subject === 'function') {
				return main.subject(expr);
			}
			return d.accessor.get(main.subject, expr.split('.'));
		}
	};

	/**
	 * Use the operator type to compare the two operands
	 *
	 * @param mixed		operand1		
	 * @param mixed		operand2		
	 * @param string 	operator		
	 *
	 * @return bool
	 */
	d.interpreter.compare = function(operand1, operand2, operator = '==') {
		if (operand1 && operand2 && $.isPlainObject(operand1) && $.isPlainObject(operand1) && operator !== '===') {
			var entry1Keys = Object.keys(operand1);
			var entry2Keys = Object.keys(operand2);
			if (entry1Keys.length !== entry2Keys.length || entry1Keys._difference(entry2Keys).length) {
				return false;
			}
			var allEntriesMatch = true;
			entry1Keys.forEach(key => {
				allEntriesMatch = allEntriesMatch && d.interpreter.compare(operand1[key], operand2[key], operator);
			});
			return allEntriesMatch;
		} else if ($.isArray(operand1) && $.isArray(operand2) && operator !== '===') {
			if (operand1.length !== operand2.length) {
				return false;
			}
			var allItemsMatch = true;
			operand1 = operand1.slice().sort();
			operand2 = operand2.slice().sort();
			for (var i = 0; i < operand1.length; i ++) {
				allItemsMatch = allItemsMatch && d.interpreter.compare(operand1[i], operand2[i], operator);
			}
			return allItemsMatch;
		}
		switch(operator) {
			case '===':
			case '==':
				return operand1 === operand2;
			case '=':
				return operand1 == operand2;
			case '>':
				return operand1 > operand2;
			case '<':
				return operand1 < operand2;
			case '>=':
				return operand1 >= operand2;
			case '<=':
				return operand1 <= operand2;
			case '!=':
				return operand1 != operand2;
			case '!==':
				return operand1 !== operand2;
			case '^=':
				return typeof operand1 === 'string' && operand1.startsWith(operand2);
			case '$=':
				return typeof operand1 === 'string' && operand1.endsWith(operand2);
			case '*=':
				// Contains string
				return typeof operand1 === 'string' && operand1.indexOf(operand2) > -1;
			case '~=':
				// Contains word
				return typeof operand1 === 'string' && typeof operand2 === 'string' && (' ' + operand1 + ' ').indexOf(' ' + operand2 + ' ') > -1;
			default:
				return false;
		}
	};
	
	/**
	 * ---------------------------
	 * Object Utils
	 * ---------------------------
	 */				
	
	d.accessor.get = function(obj, keys) {
		var val = undefined;
		(!Array.isArray(keys) ? [keys] : keys).forEach(k => {
			val = (typeof obj === 'object' || typeof obj === 'function') && obj 
				? obj[k] 
				: undefined;
			obj = val;
		});
		return val;
	};
	// ------------------------------------
	d.accessor.set = function(obj, keys, value, depthExtender) {
		keys = !Array.isArray(keys) ? [keys] : keys;
		$.each(keys, (i, k) => {
			if (i < keys.length - 1) {
				// If current $ref does not have the current $key, then force an array container here
				if (typeof obj[k] === 'undefined') {
					depthExtension = typeof depthExtender === 'function' ? depthExtender(i, i === keys.length - 2) : {};
					if (!((typeof depthExtension === 'object' || typeof depthExtension === 'function') && depthExtension)) {
						throw new Error('Depth extenders must return an array or an object!');
					}
					// The $ref gotten below must always of type access.
					// At least the depthExtension ensures it is.
					obj[k] = depthExtension;
				}
				// Gets by reference.
				obj = obj[k]; 
			} else if (typeof obj === 'object' && obj) {
				// Actual set takes place here
				obj[k] = value;
			}
		});
	};
	// ------------------------------------
	d.accessor.isset = function(obj, keys) {
		return typeof d.accessor.get(obj, keys) !== 'undefined';
	};
	// ------------------------------------
	d.accessor.unset = function(obj, keys) {
		keys = !Array.isArray(keys) ? [keys] : keys;
		var lastKey = keys.pop();
		if (keys.length) {
			obj = d.accessor.get(obj, keys);
		}
		if (!((typeof obj === 'object' || typeof obj === 'function') && obj)) {
			return;
		}
		delete obj[lastKey];
	};
	// ------------------------------------
	// ------------------------------------
	d.obj.prototypeChain = function(obj, until) {
		until = until === true ? ($.isPlainObject(obj) ? Object : Function) : until;
		until = until && !Array.isArray(until) ? [until] : until;
		// We get the chain of inheritance
		var prototypalChain = [];
		var obj = obj;
		while(obj && (!until || until.indexOf(obj) < 0)) {
			prototypalChain.push(obj);
			obj = obj ? Object.getPrototypeOf(obj) : null;
		}
		return prototypalChain;
	};
	
	/**
	 * Tells if an object has all the listed methods.
	 *
	 * @param string|array 	methods
	 * @param object	 	obj
	 *
	 * @return bool
	 */
	d.obj.implementsMethods = function(methods, obj) {
		if (methods) {
			var methods = typeof methods === 'string' ? [methods] : methods;
			var hasMethos = 0;
			$.each(methods, (i, method) => {
				if (typeof obj[method] === 'function') {
					hasMethos ++;
				}
			});
			return methods.length === hasMethos;
		}
	};
	// ------------------------------------
	d.obj.copyPlain = function(obj, only = []) {
		return JSON.parse(only  && only.length ? JSON.stringify(obj, only) : JSON.stringify(obj));
	};
	// ------------------------------------
	d.obj.proxy = function(obj, withDotAccess = true, prefix = '_') {
		var context = {obj:obj, withDotAccess:withDotAccess, prefix:prefix,};
		return new Proxy(context, {
			get: function(context, key) {
				// The "merge" and "fill" helpers
				// ---------------------------
				var method = null;
				if (typeof context.obj[key] === 'undefined' && (!context.prefix || key.startsWith(context.prefix))) {
					method = context.prefix ? key.substr(context.prefix.length) : key;
				}
				if (method === 'first' || method === 'last' 
				|| method === 'each' || method === 'leavesEach' 
				|| method === 'get' || method === 'set' || method === 'isset' || method === 'unset' 
				|| method === 'merge' || method === 'fill' 
				|| method === 'isAssociative' || method === 'isNumeric' 
				|| method === 'getNumericOffsets' || method === 'getAssociativeOffsets') {
					return function() {
						if (method === 'first' || method === 'last') {
							var keys = Object.keys(context.obj);
							return keys.length 
								? (method === 'first' ? context.obj[keys[0]] : context.obj[keys._last()]) 
								: undefined;
						}
						if (method === 'each' || method === 'leavesEach') {
							var each = function(obj) {
								var continueFlag = true;
								Object.keys(obj).forEach(key => {
									if (continueFlag) {
										if (method === 'leavesEach' && !Array.isArray(obj[key]) && Object.isObject(obj[key])) {
											continueFlag = each(obj[key]);
										} else {
											continueFlag = arguments[0].call(key, key, obj[key]) !== false;
										}
									}
								});
								return continueFlag;
							}
							if (typeof arguments[0] === 'function') {
								return each(context.obj);
							}
						}
						if (method === 'get' || method === 'set' || method === 'isset' || method === 'unset') {
							var _k = context.withDotAccess && typeof arguments[0] === 'string' ? arguments[0].split('.') : arguments[0];
							if ( method === 'set') {
								d.accessor.set(context.obj, _k, arguments[1]);
								return arguments[1];
							}
							return d.accessor[method](context.obj, _k);
						}
						if (method === 'merge' || method === 'fill') {
							var node = context.obj;
							var val = arguments[0];
							if (arguments.length > 1) {
								var _k = context.withDotAccess && typeof arguments[0] === 'string' ? arguments[0].split('.') : arguments[0];
								if (!d.accessor.isset(context.obj, _k)) {
									d.accessor.set(context.obj, _k, {});
								}
								node = d.accessor.get(context.obj, _k);
								val = arguments[1];
							}
							if (method === 'merge') {
								return $.extend(true, node, val);
							}
							if (method === 'fill') {
								return $.each(val, (k, v) => {
									node[k] = v;
								});
							}
						}
						if (method === 'isAssociative' || method === 'isNumeric') {
							var keys = Object.keys(context.obj);
							for (var i = 0; i < keys.length; i ++) {
								if ((method === 'isAssociative' && keys[i] !== ''/*not NULL*/ && !d.isNumeric(keys[i]))
								|| (method === 'isNumeric' && (d.isNumeric(keys[i]) || (arguments[0] === true && keys[i] === ''/*NULL*/)))) {
									return true;
								}
							}
							return false;
						}
						if (method === 'getAssociativeOffsets' || method === 'getNumericOffsets') {
							var keys = Object.keys(context.obj);
							var result = method === 'getAssociativeOffsets' ? {} : [];
							for (var i = 0; i < keys.length; i ++) {
								if ((method === 'getAssociativeOffsets' && keys[i] !== ''/*not NULL*/ && !d.isNumeric(keys[i]))
								|| (method === 'getNumericOffsets' && (d.isNumeric(keys[i]) || (arguments[0] === true && keys[i] === ''/*NULL*/)))) {
									result[keys[i]] = context.obj[keys[i]];
								}
							}
							return result;
						}
					};
				}
				// The regular proxy "getter"
				// ---------------------------
				var orig = d.accessor.get(context.obj, context.withDotAccess && typeof key === 'string' ? key.split('.') : key);
				if ($.isFunction(orig)) {
					return function() {
						return orig.apply(context.obj, arguments);
					};
				}
				return orig;
			},
			set: function(context, key, val) {
				d.accessor.set(context.obj, context.withDotAccess && typeof key === 'string' ? key.split('.') : key, val);
				return val === false ? null : val;
			},
			has: function(context, key) {
				d.accessor.isset(context.obj, context.withDotAccess && typeof key === 'string' ? key.split('.') : key);
			},
			deleteProperty: function(context, key) {
				d.accessor.unset(context.obj, context.withDotAccess && typeof key === 'string' ? key.split('.') : key);
			}
		});
	};
	// ---------------------------------------------------------------------------------------------------------
	// CREATOR HELPERS
	// ---------------------------------------------------------------------------------------------------------

	// Class for creating multi inheritance.
	d.classes = function() {
		// The list of classes
		var classesMerge = class extends d.ui.component {};
		classesMerge.__classes = Array.prototype.slice.call(arguments);
		var _mergeables = Array.isArray(classesMerge.__classes[0]) ? classesMerge.__classes.shift() : ['params', 'init', 'pushPullStates'];
		var functionsAll = {};
		classesMerge.__classes.forEach(_class => {
			// We're using for...in...
			// cos we also want props down the prototype chain
			d.classes.members(_class).forEach(name => {
				if (name === 'prototype' || name === 'constructor' || name === 'instanceOf') {
					return;
				}
				if (_mergeables.includes(name)) {
					if (typeof _class.prototype[name] === 'function') {
						functionsAll[name] = functionsAll[name] || [];
						functionsAll[name].push(_class.prototype[name]);
					} else {
						d.classes.concat(classesMerge.prototype, _class.prototype, name);
					}
				} else if (!classesMerge.prototype[name]) {
					if (typeof _class.prototype[name] === 'function') {
						classesMerge.prototype[name] = function(...args) {
							return _class.prototype[name].apply(this, args);
						}
					} else {
						classesMerge.prototype[name] = _class.prototype[name];
					}
				}
			});
		});
		$.each(functionsAll, (name, funcs) => {
			classesMerge.prototype[name] = function(...args) {
				var instance = this;
				var callsRet = true;
				funcs.forEach(func => {
					var callRet = func.apply(instance, args);
					if (callRet === false) {
						callsRet = false;
					}
				})
				return callsRet;
			};
		});
		return classesMerge;
	};
	// Members
	d.classes.members = function(_class) {
		var keysAll = [];
		d.obj.prototypeChain(_class, d.ui.component/*until*/).forEach(_class => {
			Object.getOwnPropertyNames(_class.prototype).forEach(name => {keysAll._pushUnique(name)});
		});
		return keysAll;
	};
	// Concat
	d.classes.concat = function(_target, _source, key) {
		if (Array.isArray(_source[key]) && (Array.isArray(_target[key]) || !_target[key])) {
			_target[key] = (_target[key] || []).concat(_source[key]);
		} else if ($.isPlainObject(_source[key]) && ($.isPlainObject(_target[key]) || !_target[key])) {
			_target[key] = $.extend(true, {}, _target[key] || {}, _source[key]);
		} else {
			console.log('Source and Target objects must have key [' + key + '] as mergeable! ' + (typeof _target[key]) + ' given!');
		}
	};
	// Members
	d.classes.isImplementation = function(operand1, operand2) {
			if (operand1 === operand2) {
				return true;
			}
			var prototypeChain = d.obj.prototypeChain(operand1);
			for (var k = 1; k < prototypeChain.length; k ++) {
				if (d.classes.isImplementation(prototypeChain[k], operand2)) {
					return true;
				}
			}
			if (operand1.__classes) {
				for (var i = 0; i < operand1.__classes.length; i ++) {
					if (d.classes.isImplementation(operand1.__classes[i], operand2)) {
						return true;
					}
				} 
			}
			return false;
	};
	
	/**
	 * ---------------------------
	 * Other Utils
	 * ---------------------------
	 */				

	d.utils.makeList = function(list, standard, orStandard) {
		return typeof list === 'undefined' ? (orStandard ? standard : [])
			: (!$.isArray(list) && standard.indexOf(list) > -1 ? [list] : standard._intersect(list));
	};
	// ------------------------------------
	d.utils.event = {};
	// ------------------------------------
	d.utils.event.keydowns = ['shift', 'alt', 'ctrl', 'fn', 'meta', 'space',];
	d.utils.event.getKeydowns = function(e) {
		var keydowns = [];
		d.utils.event.keydowns.forEach(name => {
			if (e[name + 'Key']) {
				keydowns.push(name);
			}
		});
		return keydowns;
	};
	// ------------------------------------
	d.utils.event.matchKeydowns = function(keydowns, e) {
		keydowns = typeof keydowns === 'string' ? [keydowns] : keydowns;
		return $.isArray(keydowns) && (d.utils.event.getKeydowns(e)._intersect(keydowns).length === keydowns.length);
	};
	
	/**
	 * Tells if a keypress event produces a printable key.
	 *
	 * @param Event 	e
	 *
	 * @return bool
	 */
	d.utils.event.isPrintableKey = function(e) {
		if (typeof e.which == 'undefined') {
			// This is IE which only fires keypress events for printable keys
			return true;
		} else if (typeof e.which == 'number' && e.which > 0) {
			// In other browsers, except older bersions of WebKit,
			// e.which is only greater than zero if the keypress is a printable key.
			// We need to filter out Backspace and Ctrl/Alt/Meta key combinations.
			return !e.ctrlKey && !e.altKey && !e.metaKey && e.which !== 8;
		}
		return false;
	};
	
	// ------------------------------------
	d.utils.input = {};
	// ------------------------------------
	d.utils.input.value = function(el) {
		return $(el).val();
	};
	// ------------------------------------
	d.utils.input.maxValue = function(el) {
		element = $(el);
		// For distributed radio values
		if (element.is(':radio') && element.attr('name')) {
			var max = 0;
			$('[type="radio"][name="' + element.attr('name') + '"]').each(function(i, el) {
				max = Math.max(max, $(el).val());
			});
			return max;
		} else if (element.attr('max') !== 'undefined') {
			// For inputs of type:
			// range, number, date, datatime, datetime-local, month, time, week
			return parseInt(element.attr('max'));
		}
		return undefined;
	};
	// ------------------------------------
	// Return a hook
	d.utils.input.getStates = function(el) {
		element = $(el);
		var eventValue = element.val();
		// empty, falsey, invalid/valid
		var states = {empty: eventValue === '' ? true : false,};
		if (element.is(':radio,:checkbox')) {
			if (element.is(':checked')) {
				states.checked = true;
				states.valid = true;
				states.truthy = eventValue === '' || eventValue === '0' ? false : true;
			} else {
				states.checked = false;
				states.valid = element.attr('required') ? true : false;
				states.truthy = false;
			}
		} else {
			states.valid = element.attr('required') ? true : false;
			states.truthy = eventValue === '' || eventValue === '0' ? false : true;
		}
		return states;
	};
	// ------------------------------------
	d.utils.input.matchStates = function(states, element) {
		states = typeof states === 'string' ? [states] : states;
		return $.isArray(states) && (d.utils.input.getStates(element)._intersect(states).length === states.length);
	};


	var obj = {name:'abi', lastName:'harry'};
	var interpr = new d.interpreter(obj);
	//console.log(interpr.eval('name'));
	console.log(interpr.eval('(name = "abi") && name+44 = $(1 ? "abi44" : 0) ? [$0, lastName, "yes"] : name + "no"'));
	//console.log(interpr.eval('(name = "abi") && name+44 = "abi44" ? lastName + "yes" : "no"'));
	/**
	*/
})(Dramatic);