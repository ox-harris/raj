// JavaScript Document

// POPUP, TOUR, TABS, CAROUSEL
// COMBOBOX, DATALIST, CHECKRADIO, FILE/DROP AREA
// REQUEST, SCROLL-TRIGGER, FORM

(function($, d) {
	/**
	 * Permits only one item at a time to be expanded.
	 * Items that are expanding will not respond... thus the item that initiated this will continue expanding.
	 */
	class RequestComponent extends d.ui.component {
		
		init(initialStateObject) {
			var main = this;
			if (main.registry.progress) {
				// Allow time to initalize
				setTimeout(() => {
					main.progressComponent = main.registry.progress.componentInstance('circularProgress') || main.registry.progress.componentInstance('linearProgress'); 
				}, 100);
			}
		}
		
		// Exec
		request(data, url) {
			var main = this;
			if (main.ongoing()) {
				if (main.params.replaceOngoing) {
					main.abort();
				} else {
					return;
				}
			}
			// Call before-functions
			main.pushStateDynamic('busy');
			var params = d.obj.copyPlain(main.params, ['url', 'data', 'method', 'contentType', 'processData', 'responseContentType', 'timeout', 'cache',]);
			if (data) {
				params.data = data;
			}
			if (url) {
				params.url = 'http://localhost:8002/contact/';
			}
			if (params.responseContentType) {
				params.dataType = params.responseContentType;
				delete params.responseContentType;
			}
			if ((params.method || '').toLowerCase() === 'post' || params.method.toLowerCase() === 'put') {
				params.processData = false;
				params.contentType = false;
			}
			// --------------------------
			params.xhr = function() {
				 var xhr = new window.XMLHttpRequest();
				 //Upload progress
				 xhr.upload.addEventListener('progress', main.handleProgress, false);
				 //Download progress
				 xhr.addEventListener('progress', function(evt) {
					 if (evt.lengthComputable) {}
				 }, false);
				 return xhr;
			};
			// --------------------------
			params.success = function(data, textStatus, jqXHR) {
				main.handleData(data);
				main.pushStateDynamic('success', textStatus);
			};
			// --------------------------
			params.error = function(jqXHR, errorString, httpException) {
				// errorString could be one of null,timeout,abort,error,parsererror
				main.handleHttpException(httpException);
				main.pushStateDynamic('error', errorString);
			};
			// --------------------------
			params.complete = function() {
				main.pushState('complete');
			};
			// Execute now
			main.ongoingRequest = $.ajax(params);
		}
		
		// Abort
		abort(requestHandle) {
			var main = this;
			if (main.ongoingRequest) {
				var wasOngong = main.ongoing();
				main.ongoingRequest.abort();
				return wasOngong;
			}
			return false;
		}
		
		ongoing() {
			var main = this;
			if (main.ongoingRequest && main.ongoingRequest.state() === 'pending') {
				return true;
			}
			return false;
		}
		
		handleHttpException(httpExceptionObject) {
			var main = this;
		}
		
		handleData(dataStringOrObject) {
			var main = this;
			if (typeof dataStringOrObject === 'string') {
				var content = dataStringOrObject;
				if (main.params.responseSelector) {
					var DOM = $($.parseHTML(dataStringOrObject));
					if (!DOM) {
						main.pushState('error', 'parseerror');
					}
					content = DOM.find(main.params.responseSelector);
				}
			} else if ($.isPlainObject(dataStringOrObject)) {
				var content = d.view.make(main.params.responseView || 'component', dataStringOrObject).render();
			}
			// --------------------------
			var target = main.registry.target || main.element;
			var execInsert = function() {
				if (main.params.insertFn === 'append') {
					target.append(content);
				} else if (main.params.insertFn === 'prepend') {
					target.prepend(content);
				} else if (main.params.insertFn === 'replace') {
					target.replaceWith(content);
				} else {
					target.html(content);
				}
			};
			if (main.params.animateInsert) {
				execInsert();
				main.pushState('loaded');
			} else {
				execInsert();
				main.pushState('loaded');
			}
		}

		// Show the percentage amount of progress from the current request
		handleProgress(progressEvent) {
			var main = this;
			if (!main.progressComponent) {
				return;
			}
			if (progressEvent.lengthComputable && progressEvent.total) {
				main.progressComponent.valuemax(progressEvent.total);
				main.progressComponent.valuenow(progressEvent.loaded);
			} else {
				main.progressComponent.indeterminate();
			}
		}
		
		// Show status on element and ajax-process element
		pushStateDynamic(stateName, data) {
			var main = this;
			var statusText = data || ($.isArray(main.params.statusTexts[stateName]) ? main.params.statusTexts[stateName]._random() : main.params.statusTexts[stateName]);
			var statusComment = $.isArray(main.params.statusComments[stateName]) ? main.params.statusComments[stateName]._random() : main.params.statusComments[stateName];
			// Fire event
			return main.pushState(stateName, {statusText: statusText, statusComment: statusComment});
		}
	}
	
	// Add to UI
	d.ui.comp('request', RequestComponent, {
		params: {
			url: null,
			method: 'get',
			data: null,
			contentType: null,
			processData: null,
			responseContentType: null,
			timeout: null,
			cache: false,
			replaceOngoing: false,
			browserPushstate: false,
			animateInsert: true,
			insertFn: 'insert', //insert,prepend,append,replace
			statusTexts: {
				busy: 'Busy...',
				success: 'Success!',
				error: 'Error!',
				cancelled: 'Cancelled!',
			},
			statusComments: {
				busy: ['Please wait.', 'Just a moment.'],
				success: ['Go have beer.', 'That\'s some victory.'],
				error: ['Something\'s wrong!', 'We couldn\'t fix that.', 'Please respond.'],
				cancelled: ['No qualms.', 'No worries.'],
			},
			progressType: null,
			responseView: null,
			responseSelector: null,
			selectors: {
				target: '',
				progress: '',
			},
			behaviours: {
				busy: {
					element: 'active',
				},
			},
		},
		// PushPullStates
		pushPullStates: [
			['success', 'error', 'cancelled',],
			['busy', 'completed',],
		],
	});
	
})(jQuery, Dramatic);
