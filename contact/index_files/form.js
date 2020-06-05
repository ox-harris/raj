// JavaScript Document
(function($, d) {
	/**
	 * Generic object that manages functionality and states of an Entry: FORM or FORMFIELD.
	 */
	class BaseInputComponent extends d.ui.component {
		
		// Initialize
		init(initialStateObject) {
			var main = this;
			main.state.errors = {};
			// Bind conditional properties
			// ------------------------
			if (main.params.dynamicProps && main.ownerComponent) {
				$.each(main.params.dynamicProps, (prop, query) => {
					main.observe(query, (val) => {
						if (prop === 'value') {
							main.val(val);
						} else {
							main.pushState(prop, val);
						}
					});
				});
			}
			// Show reset control
			// ------------------------
			if (initialStateObject.resetable) {
				main.resetable();
			}
			// Add repeatability?
			// ------------------------
			if (initialStateObject.repeatable) {
				main.repeatable();
			}
		}
		
		// Resetable
		resetable() {
			var main = this;
			if (main.state.resetable) {
				return;
			}
			// Bind the reset action
			// ------------------------
			if (!main.registry.reset_ctrl && main.registry.ctrls) {
				var resetCtrlDom = d.view.make('component/menu', {
					icon: 'fa-history',
					label: 'Reset',
					tooltip: 'Undo edits',
					class: 'reset-ctrl',
				}, main.registry.ctrls.removeClass('d-none'));
				main.registry.addElement('reset_ctrl', resetCtrlDom.element);
			}
			main.bindTrigger(main.registry.reset_ctrl, 'click', (e) => {
				if (main.state.changed) {
					main.reset();
				}
			});
			// It's a permanent flag
			// ------------------------
			main.pushState('resetable');
		}
		
		// Clonable
		repeatable() {
			var main = this;
			if (main.state.repeatable) {
				return;
			}
			// Bind the clone action
			// ------------------------
			if (!main.registry.repeat_ctrl && main.registry.ctrls) {
				var repeatCtrlDom = d.view.make('component/menu', {
					icon: 'fa-clone',
					label: 'Repeat',
					tooltip: 'Repeat this entry',
					class: 'repeat-ctrl',
				}, main.registry.ctrls.removeClass('d-none'));
				main.registry.addElement('repeat_ctrl', repeatCtrlDom.element);
			}
			main.bindTrigger(main.registry.repeat_ctrl, 'click', (e) => {
				main.repeat();
			});
			// Bind the remove action
			// ------------------------
			if (!main.registry.remove_ctrl) {
				var removeCtrlDom = d.view.make('component/menu', {
					icon: 'fa-trash-o',
					label: 'Remove',
					tooltip: 'Remove this entry',
					class: 'remove-ctrl',
				}, main.registry.ctrls.removeClass('d-none'));
				main.registry.addElement('remove_ctrl', removeCtrlDom.element);
			}
			main.bindTrigger(main.registry.remove_ctrl, 'click', (e) => {
				main.remove();
			});
			// It's a permanent flag
			// ------------------------
			main.pushState('repeatable');
		}
		
		/**
		 * Resets members of entry to their defaults Or simply clears.
		 *
		 * @param bool	 	forceClear		Whether or not to attempt to 
		 *									restore individual input defaults
		 *
		 * @return void
		 */
		reset(forceClear) {
			var main = this;
			main.element.resetInput(forceClear);
			main.pushState('reset');
		}
		
		/**
		 * Repeats entry.
		 *
		 * @return void
		 */
		repeat() {
			var main = this;
			if (main.ownerComponent) {
				main.ownerComponent.repeatItem(main);
			}
			main.pushState('repeated');
		}
	
		/**
		 * Removes entry.
		 *
		 * @return void
		 */
		remove() {
			var main = this;
			main.element.play('light-speed-out', {duration: 300}).then(() => {
				main.element.remove();
				main.pushState('removed');
			});
		}
	
		/**
		 * Adds and renders an alert message.
		 *
		 * @param string		type
		 * @param string		msg
		 * @param string|int	code
		 * @param string|int	suncode
		 *
		 * @return void
		 */
		addAlert(type, msg, code, suncode) {
			var main = this;
			alert(msg);
		}
	
		/**
		 * Removes a rendered alert message.
		 *
		 * @param string		type
		 * @param string|int	code
		 * @param string|int	suncode
		 *
		 * @return void
		 */
		removeAlert(type, code, suncode) {
			var main = this;
		}
		
		/**
		 * Returns or sets the input name.
		 *
		 * @param string		newName
		 *
		 * @return string
		 */
		fieldName(newName) {
			var main = this;
			var nameElement = main.registry.input || main.element;
			if (newName) {
				lineageSource.renameInput(newName, (newName, oldName, newId, oldId) => {
					// Update label
					main.fieldName_ = d.str.toTitleCase(d.str.parseDepth(newName)._last());
					if (main.registry.label) {
						main.registry.label.html(main.fieldName);
					}
					// Update label[for]
					main.element.find('label[for="' + oldId + '"]').attr('for', newId);
					// Update Arias
					main.element.find('[arial-controls="' + oldId + '"]').attr('arial-controls', newId);
					main.element.find('[owned-by="' + oldId + '"]').attr('owned-by', newId);
				});
			} else {
				return nameElement.attr('name') || nameElement.attr('data-name') || '';
			}
		}
		
		lineage() {
			var main = this;
			var lineage = main.ownerForm ? d.obj.copyPlain(main.ownerForm.lineage()) : [];
			lineage.push(main.fieldName());
			return lineage;
		}
	};
	
	// Add to UI
	d.ui.comp('baseInput', BaseInputComponent, {
		// Params
		params: {
			selectors: {
				// Structure
				icon: '',
				label: '',
				index: '',
				desc: '',
				ctrls: '',
				alerts: '',				
				// Controls
				reset_ctrl: {
					'ctrls.find': '.reset-ctrl',
				},
				repeat_ctrl: {
					'ctrls.find': '.repeat-ctrl',
				},
				remove_ctrl: {
					'ctrls.find': '.remove-ctrl',
				},
			},
			
			behaviours: {
				reset: {
					reset_ctrl: 'd-none',
				},
			},
		},
		// PushPullStates
		pushPullStates: [
			['reseting', 'reset'],
			['repeating', 'repeated'],
			['renaming', 'renamed'],
			['removing', 'removed'],
			['success', 'error'],
			['change', 'reset'],
		],
		
	});
	
	/**
	 * Opens a container for form fields.
	 *
	 * @param DOMNodeList	element
	 * @param object		options
	 *
	 * @return void
	 */
	class InputCollectionComponent extends d.classes(BaseInputComponent, d.ui.component.collection) {
		init(initialStateObject) {
			super.init(initialStateObject);
			var main = this;
			// Add extendability?
			if (initialStateObject.extendable) {
				main.extendable();
			}
		}
		
		/**
		 * @inheritdoc
		 */
		namedItem(itemName) {
			var main = this;
			var component = null;
			$.each(main.items.components, (id, comp) => {
				if (comp.fieldName() === itemName) {
					component = comp;
				}
			});
			return component;
		}
		
		/**
		 * Resolves and applies naming for a new child field/form.
		 *
		 * @param object		itemComponent
		 * @param function		callback
		 */
		setItemLineage(itemComponent, callback) {
			var main = this;
			var currentMax = 0;
			var nameAlreadyExists = false;
			$.each(main.items.components, (id, existing) => {
				var indexExisting = d.str.parseDepth(existing.lineage())._last();
				if (d.isNumeric(indexExisting)) {
					currentMax = Math.max(currentMax, indexExisting);
				}
				if (existing.lineage() === itemComponent.lineage()) {
					nameAlreadyExists = true;
				}
			});
			// A valid child of this form
			var msg = 'Please enter the HTML name for the new entry:';
			if (nameAlreadyExists || (main.lineage() && itemComponent.lineage().startsWith(main.lineage()))) {
				if (itemComponent.lineage() === main.lineage() || (nameAlreadyExists && !currentMax)) {
					msg = '(Name conflict!) ' + msg;
				} else if (nameAlreadyExists && currentMax) {
					// Auto-incrementing
					var newName = main.lineage() + '[' + (currentMax + 1) + ']';
					itemComponent.lineage(newName);
					callback(newName);
					return;
				}
				if (itemComponent.lineage().substr(main.lineage().length).length) {
					// Already a valid child
					callback(newName);
					return;
				}
			}
			d.ui.prompt(msg, main.fieldName() || itemComponent.fieldName()).then((newName) => {
				itemComponent.fieldName(newName);
				callback(newName);
			});
		}
	
		/**
		 * Repeats the given entry and positions it.
		 *
		 * @param object		itemComponent
		 */
		repeatItem(itemComponent) {
			var main = this;
			if (main.pushState('repeating', itemComponent) === false) {
				return;
			}
			// Clone...
			var repeatedEntry = itemComponent.element.clone();
			// Add now... as last
			if (main.items && Object.keys(main.items.components).length) {
				main.items.components[Object.keys(main.items.components)._last()].element.after(repeatedEntry);
			} else {
				itemComponent.element.after(repeatedEntry);
			}
			repeatedEntry.scrollIntoView().playTranslateFrom(itemComponent.element);			
			main.pushState('repeated', itemComponent);
		}
	
		/**
		 * Creates the "extend" control.
		 *
		 * @return void
		 */
		extendable() {
			var main = this;
			if (main.state.extendable) {
				return;
			}
			// Bind the extend action
			// ------------------------
			if (!main.registry.extend_ctrl && main.registry.ctrls) {
				var extendCtrlDom = d.view.make('component/menu', {
					icon: 'fa-trash-o',
					label: 'Extend',
					tooltip: 'Extend this entry',
					class: 'extend-ctrl',
				}, main.registry.ctrls.removeClass('d-none'));
				main.registry.addElement('extend_ctrl', extendCtrlDom.element);
			}
			main.bindTrigger(main.registry.extend_ctrl, 'click', (e) => {
				main.extend();
			});
			// It's a permanent flag
			main.pushState('extendable');
		}
	
		/**
		 * Creates the "nest" control.
		 *
		 * @return void
		 */
		nestable() {
			var main = this;
			if (main.state.nestable) {
				return;
			}
			// Bind the extend action
			// ------------------------
			if (!main.registry.nest_ctrl && main.registry.ctrls) {
				var nestCtrlDom = d.view.make('component/menu', {
					icon: 'fa-trash-o',
					label: 'Nest',
					tooltip: 'Nest this entry',
					class: 'nest-ctrl',
				}, main.registry.ctrls.removeClass('d-none'));
				main.registry.addElement('nest_ctrl', nestCtrlDom.element);
			}
			main.bindTrigger(main.registry.nest_ctrl, 'click', (e) => {
				main.nest();
			});
			// It's a permanent flag
			main.pushState('nestable');
		}
		
		/**
		 * Clones last member member.
		 *
		 * @return void
		 */
		extend() {
			var main = this;
			if (main.registry.items && main.registry.items.length) {
				main.cloneItem($(main.registry.items._last()));
			}
		}
	
		/**
		 * Repeats the given entry as a child of itself.
		 */
		nest() {
			var main = this;
			if (!main.pushState('nesting', itemComponent)) {
				return;
			}
			// Clone...
			var repeatedEntry = main.element.clone();
			// Add now... as child
			var container = main.registry.body && main.registry.body.length ? main.registry.body : main.element;
			container.empty().append(repeatedEntry);
			repeatedEntry.scrollIntoView().playTranslateFrom(itemComponent.element, {scale:true,});			
			main.pushState('nested');
		}
	
		/**
		 * Process validation.
		 *
		 * @return bool
		 */
		runValidation() {
			var main = this;
		}
	
		/**
		 * Compiles values.
		 *
		 * @return object
		 */
		val() {
			var main = this;
			if (typeof main.params.valueGlue === 'string') {
				return Object.keys(main.items.components).map((id) => {
					return main.items.components[id].state.val;
				}).join(main.params.valueglue);
			}
			var vals = {};
			Object.keys(main.items.components).forEach((id) => {
				vals[main.items.components[id].fieldName()] = main.items.components[id].state.value;
			});
			return vals;
		}
	};

	d.ui.comp('inputCollection', InputCollectionComponent, {
		// Params
		params: {
			selectors: {
				extend_ctrl: {
					'ctrls.find': '.extend-ctrl',
				},
				nest_ctrl: {
					'ctrls.find': '.nest-ctrl',
				},
			},
		},
	});
	
	/**
	 * ------------------------------------------------
	 */
	
	/**
	 * Opens a container for form fields.
	 *
	 * @param DOMNodeList	element
	 * @param object		options
	 *
	 * @return void
	 */
	class InputComponent extends BaseInputComponent {
		// Initialize
		init(initialStateObject) {
			var main = this;
			if (main.registry.form && main.registry.form.length) {
				// Let's add ourself to collection
				$.each(main.registry.form.data(), function(key, component) {
					if (key.indexOf('dramatic.ui.component.') === 0 && typeof component === 'object' && component.addItem) {
						if (main.ownerForm) {
							throw new Error('More than one form component instance found for this item!');
						}
						main.ownerForm = component;
						component.addItem(main, initialStateObject);
					}
				});
			}
			if (!main.ownerForm) {
				throw new Error('Form component instance not found for this item!');
			}
			main.fieldName_ = d.str.toTitleCase(main.fieldName());
			main.observe('value', (val) => {
				main.runValidation();
				if (main.state.reset) {
					main.pushState('reset', false);
				}
			});
			super.init(initialStateObject);
		}
	
		/**
		 * Process validation.
		 *
		 * @return bool
		 */
		runValidation() {
			var main = this;
			if (!main.state.value && !d.isNumeric(main.state.value) && main.params.required) {
				main.addAlert('error', 'This field is required!', 'VALIDATION', 'REQ');
			} else {
				main.removeAlert('error', 'VALIDATION', 'REQ');
			}
		}
	}

	d.ui.comp('input', InputComponent, {
		// Params
		params: {
			userole: 'field',
			selectors: {
				form: {closest: '[dramatic-input-collection]'},
			},
		},
	});
	
	/**
	 * ------------------------------------------------
	 */
	
	/**
	 * A button.
	 */
	class ButtonComponent extends d.ui.component.request {
		
		init(initialStateObject) {
			var main = this;
			if (main.registry.form && main.registry.form.length) {
				// Let's add ourself to collection
				$.each(main.registry.form.data(), function(key, component) {
					if (key.indexOf('dramatic.ui.component.') === 0 && typeof component === 'object' && component.addItem) {
						if (main.ownerForm) {
							throw new Error('More than one form component instance found for this item!');
						}
						main.ownerForm = component;
					}
				});
			}
			if (!main.ownerForm) {
				throw new Error('Form component instance not found for this item!');
			}
			// Resolve response to target
			if (!main.registry.target && main.ownerForm.element.attr('id')) {
				main.registry.addElement('target', main.ownerForm.element);
				main.params._set('responseSelector', '#' + main.ownerForm.element.attr('id'));
			}
			if (main.ownerForm.registry.status && !(main.registry.progress && main.registry.progress.length)) {
				var progressElement = main.ownerForm.registry.status.find('[role~="progressbar"],[data-role~="progressbar"]');
				if (progressElement) {
					main.registry.addElement('progressContainer', main.ownerForm.registry.status);
					main.registry.addElement('progress', progressElement);
				}
			}
			main.bindTrigger(main.ownerForm.element, 'submit', (e) => {
				e.preventDefault();
			});
			main.bindTrigger(main.element, 'click', (e) => {
				main.request(main.ownerForm.val());
			});
			
			super.init(initialStateObject);
		}
		
		request(data, url) {
			var main = this;
			var buttonElement = main.element.is('button, [type="submit"]')
				? main.element 
				: main.element.find('[type="submit"]');
			if ((main.params.method || '').toLowerCase() !== 'get' && typeof window.FormData !== 'undefined') {
				var proccessedData = new FormData();
				//FormDataInstance.append(buttonElement.attr('name'), buttonElement.attr('value'));
				$.each(data, function(key, value) {
					proccessedData.append(key, value);
				});
			} else {
				var proccessedData = [];
				//proccessedData.push(buttonElement.attr('name') + '=' + buttonElement.attr('value'));
				$.each(data, function(key, value) {
					/*
					if (value is file) {
						return;
					}
					*/
					proccessedData.push(key + '=' + value);
				});
				proccessedData = proccessedData.join('&');
			}
			return super.request(proccessedData, url);
		}
	}
		
	d.ui.comp('button', ButtonComponent, {
		// Params
		params: {
			method: 'post',
			userole: 'button',
			selectors: {
				form: {closest: '[dramatic-input-collection]'},
			},
			behaviours: {
				busy: {
					element: 'active pointer-events-none',
				},
				'!busy': {
					progressContainer: 'd-none',
				},
			},
		},
	});
	
	/**
	 * ------------------------------------------------
	 */
	
	/**
	 * A content field.
	 */
	class ContentInputComponent extends InputComponent {
		init(initialStateObject) {
			super.init(initialStateObject);
			var main = this;
			if (!(main.registry.input && main.registry.input.length)) {
				throw new Error('No input field found!');
			}
			main.pushState('type', main.registry.input.attr('type'));
			main.pushState('value', main.val());
			main.bindTrigger(main.registry.input, 'keyup change', (e) => {
				main.pushState('value', main.val());
			});
			main.bindTrigger(main.registry.input, 'focusin focusout', (e) => {
				main.pushState('inputfocus', e.type === 'focusin');
			});
		}
		
		/*
		 * Sets or return the current value.
		 *
		 * @param string 	newVal
		 *
		 * @param void|string
		 */
		val(newVal) {
			var main = this;
			if (arguments.length) {
				return;
			}
			return main.registry.input.val();
		}
	}

	d.ui.comp('contentInput', ContentInputComponent, {
		// Params
		params: {
			selectors: {
				input: {'content.find': 'textarea',},
			},
		},
		attrBindings: {
			inputfocus: 'data-inputfocus', 
		},
	});
	
	/**
	 * ------------------------------------------------
	 */
	
	/**
	 * A text input field.
	 */
	class TextInputComponent extends ContentInputComponent {
		init(initialStateObject) {
			super.init(initialStateObject);
			var main = this;
			var floatingLabelHandler = function(attended) {
				if (!main.state.attended && attended) {
					main.pushState('attended');
					if (main.params.floating_label) {
						clearTimeout(main.labelOffTimeout);
						main.registry.label.popCss(main.labelPush,true/*forvePopAll*/);
						main.registry.input.attr('placeholder', main.registry.input.attr('data-placeholder'));
						main.registry.input.removeAttr('data-placeholder');
					}
				}
				if (!attended && (main.state.attended || typeof main.state.attended === 'undefined')) {
					main.pushState('attended', false);
					if (main.params.floating_label) {
						var floatX = 'start + ' + parseFloat(main.registry.input.css('padding-left'));
						var floatProps = d.rect.translateTo(main.registry.label[0], main.registry.input[0], {x:floatX, y:'center',});
						$.extend(floatProps, main.registry.input.css(['color','font-size','font-weight',]), {lineHeight: main.registry.label.css('line-height')});
						main.labelPush = main.registry.label.pushCss(floatProps);
						main.labelOffTimeout = setTimeout(() => {
							main.registry.input.attr('data-placeholder', main.registry.input.attr('placeholder'));
							main.registry.input.removeAttr('placeholder');
						}, 175);
					}
				}
			};
			floatingLabelHandler(main.state.value);
			main.observe('inputfocus || value', floatingLabelHandler);
		}
		
		prefix(newPrefix) {
			var main = this;
			if (!(main.registry.prefix && main.registry.prefix.length)) {
				return;
			}
			if (newPrefix) {
				if (main.registry.prefix.is(':input')) {
					main.registry.prefix.val(newPrefix);
				} else {
					main.registry.prefix.html(newPrefix);
				}
				return;
			}
			return main.registry.prefix.is(':input') ? main.registry.prefix.val() : main.registry.prefix.text();
		}
		
		suffix(newSuffix) {
			var main = this;
			if (!(main.registry.suffix && main.registry.suffix.length)) {
				return;
			}
			if (newSuffix) {
				if (main.registry.suffix.is(':input')) {
					main.registry.suffix.val(newSuffix);
				} else {
					main.registry.suffix.html(newSuffix);
				}
				return;
			}
			return main.registry.suffix.is(':input') ? main.registry.suffix.val() : main.registry.suffix.text();
		}
		
		/*
		 * Sets or return the current value.
		 *
		 * @param string 	newVal
		 *
		 * @param void|string
		 */
		val(newVal) {
			var main = this;
			if (arguments.length) {
				return;
			}
			return (main.prefix() || '') + main.registry.input.val() + (main.suffix() || '');
		}
	}

	d.ui.comp('textInput', TextInputComponent, {
		// Params
		params: {
			selectors: {
				input: {'content.find': 'input',},
				prefix: {
					find: '.prefix',
				},
				suffix: {
					find: '.suffix',
				},
			},
			behaviours: {
				'!attended': {
					desc: 'opacity-0',
				},
			},
			floating_label: true,
		},
		attrBindings: {
			value: 'value', 
		},
	});
	
	/**
	 * ------------------------------------------------
	 */
	
	/**
	 * A password field.
	 */
	class PasswordInputComponent extends TextInputComponent {
		toggleVisibility() {
			var main = this;
			if (main.state.type === 'password') {
				main.registry.input.attr('type', 'text');
				main.pushState('type', 'text');
			} else {
				main.registry.input.attr('type', 'password');
				main.pushState('type', 'password');
			}
		}
	}

	d.ui.comp('passwordInput', PasswordInputComponent, {});
	
	/**
	 * ------------------------------------------------
	 */
	
	/**
	 * Opens a container for form fields.
	 *
	 * @param DOMNodeList	element
	 * @param object		options
	 *
	 * @return void
	 */
	class QueryBuilderComponent extends InputCollectionComponent {
		init(initialStateObject) {
			super.init(initialStateObject);
			var main = this;
			main.conjuction = null;
		}
		
		addItem(itemComponent, initialStateObject) {
			var main = this;
			if (main.items.components.length  && !main.conjuction) {
				d.ui.prompt('', 'and/or').then(response => {
					if (itemComponent.registry.label) {
						main.conjuction = response === 'or' ? 'or' : 'and';
						itemComponent.registry.label.html(main.conjuction);
					}
					super.addItem(itemComponent, initialStateObject);
				});
			} else {
				if (itemComponent.registry.label) {
					itemComponent.registry.label.html(main.conjuction);
				}
				super.addItem(itemComponent, initialStateObject);
			}
		}
	}

	d.ui.comp('queryBuilder', QueryBuilderComponent, {});
	
	/**
	 * ------------------------------------------------
	 */
	
	/**
	 * A file upload field.
	 */
	class FileInputComponent extends InputComponent {
		init(initialStateObject) {
			super.init(initialStateObject);
			var main = this;
			// Drag and drop
			if (main.registry.drop_area) {
				main.bindTrigger(main.registry.drop_area, 'drag dragstart dragend dragover dragenter dragleave drop', (e) => {
					e.preventDefault();
					e.stopPropagation();
					if (e.type === 'dragover' || e.type === 'dragenter') {
						main.pushState('highlighted');
					} else if (e.type === 'dragleave' || e.type === 'dragend' || e.type === 'drop') {
						main.pushState('highlighted', false);
					}
					if (e.type === 'drop') {
						// Always merge dropped files
						main.val(Array.prototype.slice.call(e.originalEvent.dataTransfer.files), true/*only*/);
					}
				});
			}
			// Direct choosing
			main.bindTrigger(main.registry.input, 'change', (e) => {
				// Always replace chosen files
				main.val(Array.prototype.slice.call(e.target.files), true/*only*/);
			});
			// States...
			main.pushState('default', (main.registry.input.attr('data-value') || ''));
			main.pushState('accept', (main.registry.input.attr('accept') || '').toLowerCase()
				.replace('image/*', '.png,.jpg,.jpeg,.svg,.gif')
				.replace('audio/*', '.mp3,.wma,.wav')
				.replace('video/*', '.mp4,.wmv,.mpeg,.mov,.flv')
				.replace(/\,/g, ', ')
			);
			main.bucket = [];
			main._fetchedFiles = [];
		}
		
		/*
		 * Sets or return the current value.
		 *
		 * @param object|array 	newVal
		 * @param bool		 	only
		 *
		 * @param void|object|array
		 */
		val(newVal, only) {
			var main = this;
			if (arguments.length) {
				if (only || !main.state.multiple) {
					main.bucket = [];
				}
				var files = $.isArray(newVal) ? newVal.slice() : [newVal];
				main.bucket = main.bucket.concat(main.bucket, main.state.multiple ? files : files.slice(0, 1));
				main.processFiles(main.bucket);
				main.pushState('value', main.val());
			}
			return main.state.multiple ? main.bucket : main.bucket[0];
		}

		/*
		 * Uses XMLHTTPREQUEST to fetch a file from the entry's
		 * default value.
		 *
		 * @param int i
		 */
		fetchDefaultFiles(i) {
			var main = this;
			if (!main.state.default) {
				return;
			}
			var xhr = new XMLHttpRequest();
			var fileDefault = main.state.default.split(',');
			xhr.open('GET', fileDefault[i]);
			xhr.responseType = 'blob';
			xhr.onload = () => {
				var blob = xhr.response;
				blob.name = fileDefault[i];
				main._fetchedFiles.push(blob);
				if (fileDefault[i + 1]) {
					main.fetchDefaultFiles(i + 1);
				} else {
					main.processFiles(main._fetchedFiles, true/*isDefaultFiles*/);
				}
			};
			xhr.send();
		}
	
		/*
		 * Parses files marshalled from file input
		 *
		 * @param array files
		 * @param bool isDefaultFiles
		 */
		processFiles(files, isDefaultFiles) {
			var main = this;
			var errors = [];
			var previews = [];
			if (!files) {
				if (main.state.required && !isDefaultFiles) {
					errors.push('This filed is required!');
				}
			} else {
				$.each(files, function(i, file) {
					// Validate extension...
					var accept = main.state.accept.split(',').map(trim);
					var ext = file.name.substr(file.name.lastIndexOf('.'), file.name.length);
					if (accept.length && accept[0] !== '' && !accept.includes(ext.toLowerCase())) {
						errors.push('Unsupported file extension "' + ext + '": ' + file.name);
					}
					var desc = file.name + ': ' + (file.size/1024) + 'KB';
					// Show thumnails
					var revokeURL = function(el) {
						window.URL.revokeObjectURL(el.src);
					};
					if (/^image\//.test(file.type)) {
						var img = document.createElement('img');
						img.onload = (e) => {revokeURL(img)};
						img.src = window.URL.createObjectURL(file);
						previews.push({thumbnail:img, type:'image', mime:file.type, ext:ext, desc:desc,});
					} else if (/^video\//.test(file.type)) {
						var media = document.createElement('video');
						media.onloadstart/*canplay*/ = (e) => {revokeURL(media); media.play()};
						media.src = window.URL.createObjectURL(file);
						media.muted = true;
						previews.push({thumbnail:media, type:'video', mime:file.type, ext:ext, desc:desc,});
					} else {
						var type = 'file';
						if (/^audio\//.test(file.type)) {
							type = 'audio';
						} else if (/msword|ms-word|wordprocessing/.test(file.type)) {
							type = 'word';
						} else if (/powerpoint|presentation/.test(file.type)) {
							type = 'powerpoint';
						} else if (/excel|spreadsheet/.test(file.type)) {
							type = 'excel';
						} else if (/^text\//.test(file.type)) {
							type = 'text';
						} else if (/\/pdf/.test(file.type)) {
							type = 'pdf';
						} else if (/\/zip/.test(file.type)) {
							type = 'zip';
						}
						previews.push({type:type, mime:file.type, ext:ext, desc:desc,});
					}
				});
			}
			main.previewFiles(previews);
		}
	
		/*
		 * Shows preview of files.
		 *
		 * @param array previews
		 */
		previewFiles(previews) {
			var main = this;
			if (!main.registry.preview) {
				return;
			}
			main.registry.preview.not(':first').remove();
			var previewElement = main.registry.preview;
			$.each(previews, (i, preview) => {
				if (!preview.thumbnail) {
					var icon = main.params.icons && main.params.icons[thumbnail.type] ? main.params.icons[thumbnail.type] : 'fa fa-file';
					preview.thumbnail = document.createElement('span');
					preview.thumbnail.classList.add(icon);
				}
				preview.thumbnail.title = preview.desc;
				if (i > 0) {
					var newPreviewElement = previewElement.clone(true);
					previewElement.after(newPreviewElement);
					previewElement = newPreviewElement;
				}
				previewElement.empty().append(preview.thumbnail).play('zoom-in');
			});
		}
	}

	d.ui.comp('fileInput', FileInputComponent, {
		// Params
		params: {
			selectors: {
				preview: '',
				drop_area: '',
			},
			icons: {
				audio: 'fa fa-file-audio-o',
				word: 'fa fa-file-word-o',
				powerpoint: 'fa fa-file-powerpoint-o',
				excel: 'fa fa-file-excel-o',
				text: 'fa fa-file-text',
				pdf: 'fa fa-file-pdf-o',
				zip: 'fa fa-file-zip-o',
			},
			behaviours: {
				'highlighted': {
					element: '',
				},
			},
		},
	});

	/**
	 * ------------------------------------------------
	 */
	
	/**
	 * A checkbox or radio field.
	 */
	class CheckInputComponent extends InputComponent {
		init(initialStateObject) {
			super.init(initialStateObject);
			var main = this;
			main.pushState('type', main.registry.input.attr('type'));
			main.bindTrigger(main.registry.input, 'change', (e) => {
				main.pushState('type', e.value);
				if (typeof e.maxValue !== 'undefined') {
					main.pushState('maxValue', e.maxValue);
				}
				if (typeof e.is !== 'undefined') {
					main.pushState('is', e.is);
				}
			});
		}
	}

	d.ui.comp('checkInput', CheckInputComponent, {
		// Params
		params: {
			selectors: {
				icon: {
					find: '.fa',
				},
			},
			behaviours: {
				'is.checked & type=`checkbox`': {
					icon: 'fa-check-square-o',
				},
				'is.checked & type=`radio`': {
					icon: 'fa-dot-circle-o',
				},
				'!is.checked & type=`checkbox`': {
					icon: 'fa-square-o',
				},
				'!is.checked & type=`radio`': {
					icon: 'fa-circle-o',
				},
				'is.checked & type!=`checkbox` & type!=`radio`': {
					icon: 'fa-square',
				},
			},
		},
	});
	
	/**
	 * ------------------------------------------------
	 */
	
	/**
	 * Intermediary class. Connects collection to controller.
	 */
	class ListboxConnection extends d.ui.component {
		listbox() {
			var main = this;
			if (!main._listbox) {
				if (!main.registry.listbox && main.registry.input.attr('aria-controls')) {
					main.registry.addElement('listbox', $('#' + main.registry.input.attr('aria-controls')))
				} else if (main.registry.listbox && !main.registry.input.attr('aria-controls')) {
					if (!main.registry.listbox.attr('id')) {
						main.registry.listbox.attr('id', '_listbox_' + main.uniqueKey());
					}
					main.registry.input.attr('aria-controls', main.registry.listbox.attr('id'));
				}
				if (main.registry.listbox) {
					// Let's add ourself to collection
					$.each(main.registry.listbox.data(), function(key, component) {
						if (key.indexOf('dramatic.ui.component.') === 0 && typeof component === 'object' && component.addItem) {
							main._listbox = component;
						}
					});
				}
			}
			return main._listbox;
		}
		
		val(newVal, only) {
			var main = this;
			if (!main.listbox()) {
				return;
			}
			if (arguments.length) {
				var newVals = (!$.isArray(newVal) ? [newVal] : newVal).map(value => {
					return typeof value === 'string' ? value.toLowerCase() : value;
				});
				$.each(main.listbox().items.components, (id, itemComponent) => {
					if (only) {
						itemComponent.deselect();
					}
					var currentValue = typeof itemComponent.value === 'function' ? itemComponent.value() : itemComponent.text();
					currentValue = typeof currentValue === 'string' ? currentValue.toLowerCase() : currentValue;
					newVals.forEach(value => {
						// Can compare primitves, objects and arrays
						if (d.interpreter.comparison.compareOperands('==', currentValue, currentValue)) {
							itemComponent.select();
						}
					});
				});
				main.pushState('value', main.val());
			} else {
				var values = main.listbox().state.items.selected.map(id => {
					var itemComponent = main.listbox().items.components[id];
					return typeof itemComponent.value === 'function' ? itemComponent.value() : itemComponent.text();
				});
				return main.state.multiple ? values : values[0];
			}
		}
	}
	
	/**
	 * Intermediary class. Binds and searches listbox.
	 */
	class ListboxSearch extends ListboxConnection {
		init(initialStateObject) {
			super.init(initialStateObject);
			var main = this;
			// Search collection... typeahead supported
			main.bindTrigger(main.registry.input, 'keydown&is.editKey', (e) => {
				main.listbox().filter(e.value, (matchedIds, autoComplete) => {
					if (e.value && !matchedIds.length) {
						main.pushState('invalid');
					} else {
						main.pushState('invalid', false);
						if (e.value && autoComplete) {
							main.registry.input.val(autoComplete).get(0).setSelectionRange(e.value.length, autoComplete.length);
						}
					}
				});
			});
			// Select the item with the entered text
			main.bindTrigger(main.registry.input, 'keydown&key=`Enter`', (e) => {
				if (main.state.invalid) {
					return;
				}
				main.val(main.registry.input.val());
			});
		}
	}
	
	/**
	 * ------------------------------------------------
	 */
	
	/**
	 * A select field.
	 */
	class SelectInputComponent extends d.classes(ListboxConnection, InputComponent) {
		init(initialStateObject) {
			super.init(initialStateObject);
			var main = this;
			// Sync our state of multiple with collection's mutltiplicty
			main.observe('multiple', (value) => {
				main.listbox().params.max = value ? false : 1;
			});
			if (main.registry.ctrls) {
				main.bindTrigger(main.registry.ctrls, 'focusin focusout', (e) => {
					if (e.type === 'focusin') {
						main.showListbox();
					} else {
						// When the focus moves to an element that's NOT A CHILD of ctrls
						if (!$(document.activeElement).parents(main.registry.ctrls).length) {
							main.hideListbox();
						}
					}
				});
			}
			main.listbox().observe('items.selected', (count) => {
				main.pushState('value', main.val());
				main.showSelection(selection);
				if (count && !main.state.multiple) {
					main.hideListbox();
				}
				if (!count && main.state.required) {
					// Error
				}
			});
		}
		
		listbox() {
			var listbox = super.listbox();
			var main = this;
			if (!listbox) {
				throw new Error('Listbox not found!');
			} else if (!main.registry.selection) {
				throw new Error('Selection element not found!');
			}
			return listbox;
		}
		
		showSelection() {
			var main = this;
			var selection = main.listbox().state.items.selected.map(id => main.listbox().items.components[id]);
			if (main.state.multiple) {
				main.registry.selection.html(selection.length + ' selected');
			} else {
				main.registry.selection.html(selection[0].text());
				main.registry.input.val(typeof selection[0].value === 'function' ? selection[0].value() : selection[0].text());
			}
		}
		
		showListbox() {
			var main = this;
		}
		
		hideListbox() {
			var main = this;
		}
	}

	d.ui.comp('selectInput', SelectInputComponent, {});
	
	/**
	 * ------------------------------------------------
	 */
	
	/**
	 * A datalist field.
	 * It's like the select field but searches listbox
	 * and also renders more advanced previews.
	 */
	class DatalistInputComponent extends d.classes(ListboxSearch, SelectInputComponent) {
		showSelection(selection) {
			var main = this;
			if (main.state.multiple) {
			} else {
			}
		}
	}

	d.ui.comp('datalist', DatalistInputComponent, {});
	
	/**
	 * ------------------------------------------------
	 */
	
	/**
	 * A search field.
	 * It's like the text field but searches listbox if connected.
	 */
	class SearchInputComponent extends d.classes(ListboxSearch, TextInputComponent) {
		init(initialStateObject) {
			super.init(initialStateObject);
			var main = this;
			// Listbox is optional
			if (main.listbox()) {
				// Only one thing can be searched for
				main.listbox().params.max = 1;
			}
		}
		
		val(newVal, only) {
			var main = this;
			if (!main.listbox()) {
				return TextInputComponent.prototype.val.apply(main, arguments);
			}
			return super.val(...arguments);
		}
	}

	d.ui.comp('searchInput', SearchInputComponent, {});
	
})(jQuery, Dramatic);
