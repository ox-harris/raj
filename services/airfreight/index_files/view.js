// JavaScript Document
(function($, d) {
	if (!d.view_import) {
		var importLink = document.querySelector('link[rel="import"][href]');
		if (importLink) {
			if ('import' in importLink && importLink.import) {
				d.view_import = importLink.import;
			} else {
				d.view_import = importLink.innerHTML;
			}
		} else {
			console.log('No HTML imports in document.');
		}
		if (!d.view_import) {
			$.holdReady(true);
			$.get('/templates.html', response => {
				d.view_import = response;
				$.holdReady(false);
			});
			setTimeout(() => {$.holdReady(false);}, 600);
		}
	}
	// ---------------------------------------------------------------------------------------------------------
	// THE DRAMATIC VIEW
	// ---------------------------------------------------------------------------------------------------------
	d.view = class {
		/**
		 * Constructor
		 *
		 * @param plainObject						collection
		 * @param JQuery							element
		 * @param array								params
		 */
		constructor(collection = {}, container = null, params = []) {
			var main = this;
			// Params
			main.params = d.obj.proxy(main.defaultParams || {}, true/*withDotAccess*/);
			main.params._merge(params);
			// Data
			if (collection) {
				main.setCollection(collection);
			}
			// Element
			if (container) {
				main.setContainer(container);
			}
			main.marshalled = [];
		}
		
		/**
		 * Sets the data collection
		 *
		 * @params plainObject collection
		 *
		 * @return this
		 */
		setCollection(collection) {
			var main = this;
			main.collection = d.obj.proxy(collection);
			//main.lineage = main.collection.lineage(true/*withContext*/);
			if (main.collection.params) {
				$.extend(true, main.params, main.collection.params);
			}
			return main;
		}
		
		/**
		 * Sets the target element
		 *
		 * @params jQuery container
		 *
		 * @return this
		 */
		setContainer(container) {
			var main = this;
			main.container = container;
			return main;
		}
		
		/**
		 * Renders the view.
		 */
		render() {
			var main = this;
			if (!main.collection) {
				throw new Error('No collection provided!');
			}
			return true;
		}
		
		/**
		 * -----------------------------------------
		 */
		
		/**
		 * Renders a list of list in a category.
		 * (Accepts a new "group-by" directive for said list.)
		 *
		 * @param array				 	groupby
		 * @param Iterable				listing
		 * @param jQuery				container
		 * @param callable				callback
		 *
		 * @return void
		 */
		groupBy(groupby, callback, listing, container = null) {
			var main = this;
			var categories = {};
			// Loop... and make categories or render list item
			$.each(listing, (index, collection) => {
				if (groupby.length) {
					var onKey = groupby._first();
					var cat = typeof collection[onKey] !== 'undefined' ? collection[onKey] : '';
					categories[cat] = categories[cat] || [];
					categories[cat].push(collection);
				} else {
					callback(index, collection, container);
				}
			});
			// Render categories now...
			$.each(categories, (category, listing) => {
				// Render into something like a <category-item> element
				var sectionDom = main.load('category', container);
				// Render category label
				sectionDom.label.html(category);
				main.groupBy(groupby.slice(1)/*remainder*/, callback, listing, sectionDom.body);
			});
		}
		
		/**
		 * Renders numerically-indexed list of list
		 * Supports a "groupby" directive.
		 *
		 * @param Iterable	 		listing
		 * @param jQuery			container
		 *
		 * @return RoleDom
		 */
		renderListing(listing, container = null) {
			var main = this;
			var sectionDom = main.load('listing', container);
			// Body...
			var bodyElement = sectionDom.body || sectionDom.element;
			main.groupBy(main.params['listing.groupby'] || [], (...args) => main.renderItem(...args), listing, bodyElement);
			return sectionDom;
		}
		
		/**
		 * Renders a collection from a list
		 *
		 * @param int 								index
		 * @param object|ProxyInterface 	collection
		 * @param jQuery							container
		 *
		 * @return RoleDom
		 */
		renderItem(/*int*/index, collection, container = null) {
			var main = this;
			var sectionDom = main.load('item', container);
			// A new View like the foregoing
			var type = collection.params && collection.params.type ? collection.params.type : main.params.view;
			var view = d.view.make(type, collection, sectionDom.body || sectionDom.element).render();
			return sectionDom;
		}
		
		/**
		 * -----------------------------------------
		 */
		
		/**
		 * Loads the template file (into container, if given),
		 * marshals params, loads and returns the appropriate roledom.
		 *
		 * @param string|bool				partname
		 * @param jQuery 					container
		 * @param bool			 			marshalParams
		 *
		 * @return jQuery
		 */
		load(partname, container = null, marshalParams = true) {
			var main = this;
			var filename = partname.indexOf('.') === -1 ? partname + '.html' : partname;
			var templateFile = null;
			if (main.params[partname + '.view'] !== false) {
				templateFile = d.view.findFile((main.params[partname + '.view'] || main.params.view) + '/' + filename);
			}
			if (templateFile) {
				// The loaded template is what's returned
				var loaded = $(templateFile);
				if (container) {
					// The imported template is what's returned
					if (main.params[partname + '.importFn'] === 'replace') {
						container.html(loaded);
					} else if (main.params[partname + '.importFn'] === 'prepend') {
						container.prepend(loaded);
					} else {
						container.append(loaded);
					}
				}
			} else {
				// Possible its been set to FALSE in params
				// or the search found nothing
				var loaded = container || $();
			}
			if (marshalParams && main.marshalled.indexOf(partname) === -1) {
				main.marshalled.push(partname);
				var namespaceAttr = d.ui.attrNamespace + partname;
				var attrParams = loaded.attr(namespaceAttr);
				if (attrParams && attrParams.toLowerCase() !== 'false' && attrParams.toLowerCase() !== 'true') {
					$.extend(true, main.params, d.str.parseParams(attrParams));
				}
			}
			var roleName = loaded.hasRole(partname) ? partname : '*';
			return loaded.roledom(roleName, main.params[partname + '.selectors']);
		}
	};

	/**
	 * -----------------------------------------
	 */
	
	/**
	 * Creates a new view instance from the given classname or fieldname.
	 *
	 * @param string|array 			componentNamespace
	 * @param array					args
	 *
	 * @return ViewInterface
	 */
	d.view.make = function(componentNamespace, ...args) {
		componentNamespace = $.isArray(componentNamespace) ? componentNamespace.join('\\') : componentNamespace.replace('/', '\\');
		var componentNamespaceArray = componentNamespace.split('\\');
		var driver = null;
		while(!driver && componentNamespaceArray.length) {
			driver = d.accessor.get(d.view, componentNamespaceArray);
			componentNamespaceArray.pop();
		}
		var view = new driver(...args);
		if (!view instanceof d.view) {
			throw new Error('"' + componentNamespace + '" must implement Dramatic.view!');
		}
		view.params.view = componentNamespace; // Just the namespace, no .'\\Driver'
		return view;
	};

	/**
	 * Strategically finds the specified file.
	 *
	 * @param string file
	 *
	 * @return string
	 */
	d.view.findFile = function(file) {
		var namespace = file.replace('\\', '/').split('/');
		var snippet = namespace.pop().replace('.html', '');
		if (!d.view_import) {
			return;
		}
		// Now we'll be breaking out the namespace each time...
		// down to baseNamespace
		while(namespace.length > 0) {
			var fullNamespace = namespace.join('/');
			var selector = 'template[data-URI="' + fullNamespace + '/' + snippet.trim() + '"]';
			if (typeof d.view_import === 'string') {
				// Imports were done via polyfill
				var templateElement = $(d.view_import).filter(selector);
			} else {
				// Imports were done natively
				var templateElement = $(d.view_import.querySelector(selector));
			}
			if (templateElement.length) {
				return templateElement.html();
			}
			namespace.pop();
		}
	};
	
	/* ---------------------------------------------------------------- */
	/* COMPONENTS */
	/* ---------------------------------------------------------------- */
	
	d.view.component = class extends d.view {
	
		/**
		 * @inheritdoc
		 */
		render() {
			if (!super.render()) {
				return;
			}
			var main = this;
			var numListing = main.collection._getNumericOffsets();
			var listing = main.collection.listing || (numListing.length ? numListing : null);
			if (main.collection._isAssociative()) {
				var containerDom = main.renderComponent(main.collection);
				if (listing) {
					// In the context of main
					main.renderListing(listing, containerDom.listing || containerDom.element);
				}
				return containerDom;
			}
			if (listing) {
				return main.renderListing(listing, main.container);
			}
		}
	
		/**
		 * Applies Label and Description to their repsective elements.
		 *
		 * @return RoleDom
		 */
		renderComponent(collection) {
			var main = this;
			// Load...
			var containerDom = main.load('component', main.container);
			main.renderIcon(main.collection, containerDom.icon);
			// Label
			var contentRendered = false;
			if (typeof collection.label !== 'undefined' && containerDom.label) {
				containerDom.label.removeClass('d-none').html(collection.label);
				contentRendered = true;
			}
			// Description
			if (typeof collection.desc !== 'undefined' && containerDom.desc) {
				containerDom.desc.removeClass('d-none').html(collection.desc);
				contentRendered = true;
			}
			if (contentRendered && containerDom.content) {
				containerDom.content.removeClass('d-none');
			}
			main.renderStatus(main.collection, containerDom.status);
			main.renderControls(main.collection, containerDom.controls);
			main.applyTooltip(main.collection, containerDom.tooltip);
			return containerDom;
		}
		
		/**
		 * Applies Icon.
		 *
		 * @parma object|Proxy 		collection
		 * @param jQuery		 	element
		 *
		 * @return void
		 */
		renderIcon(collection, element = null) {
			var main = this;
			if (typeof collection.icon !== 'undefined' && element) {
				element.removeClass('d-none');
				if (typeof collection.icon === 'object') {
					d.view.make('component', main.params['icon.params']).render(collection.icon, element);
				} else if (typeof collection.icon === 'string') {
					// Render a font icon
					element.addClass(collection.icon);
				}
			}
		}
		
		/**
		 * Renders Status.
		 *
		 * @parma object|Proxy 		collection
		 * @param jQuery			element
		 *
		 * @return void
		 */
		renderStatus(collection, element = null) {
			var main = this;
			if (typeof collection.status !== 'undefined' && element) {
				$element.removeClass('d-none');
				if (typeof collection.status === 'object') {
					d.view.render(collection.status, element);
				} else if (typeof collection.status === 'string') {
					element.addClass(collection.status);
				}
			}
		}
		
		/**
		 * Renders Controls.
		 *
		 * @parma object|Proxy 			collection
		 * @param jQuery		 		element
		 *
		 * @return void
		 */
		renderControls(collection, element = null) {
			var main = this;
			if (typeof collection.controls === 'object' && element) {
				var params = main.params['controls.params'];
				d.accessor.set(params, ['listing', 'load'], false);
				//d.view.make('component\menu', collection.controls, element.removeClass('d-none'), params).render();
			}
		}
		
		/**
		 * Applies Tooltip.
		 *
		 * @parma object|Proxy 			collection
		 * @param jQuery 				element
		 *
		 * @return void
		 */
		applyTooltip(collection, element = null) {
			var main = this;
			if (typeof collection.tooltip !== 'undefined' && element) {
				element.removeClass('d-none').attr('title', collection.tooltip);
			}
		}
	};
	
})(jQuery, Dramatic);
