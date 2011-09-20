/**
 * jQuery.fn.trimlib
 * 
 * Copyright (c) 2011, Branden Visser (mrvisser at gmail dot com)
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
(function($) {
	
	//maintain a cache of tag libraries, these are initialized on first call
	var trimlibs = false;
	
	var methods = {
		render: _render,
		expand: _expand
	};
	
	$.fn.trimlib = function(method) {
		init();
		
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1))
		} else if (typeof method === 'object') {
			return methods['render'].apply(this, arguments);
		} else {
			throw new Error('Invalid arguments supplied to jQuery.trimlib');
		}
	};

	/**
	 * Simply wraps the {@code render} method, performing input validation and ensuring the jQuery
	 * return type.
	 * 
	 * @param options The executiong options provided by the caller
	 */ 
	function _render(options) {
		var namespace = options.namespace;
		var template = options.template;
		var data = options.data;
		
		if (!namespace || !template)
			throw new Error('Must supply "namespace" and "template" options when rendering a template.');
		
		if (!data)
			data = {};
		
		if (data.__body === undefined)
			data.__body = '';
	 
		this.each(function() {
			render(this, namespace, template, data);
		});
		
		return this;
	}
	
	/**
	 * Simply wraps the {@code expand} method, ensuring the jQuery return type.
	 */
	function _expand(options) {
		this.each(function() {
			expand(this);
		});
		return this;
	}

	/**
	 * Instantiate all the trimlib libraries that have been declared.
	 */
	function init() {
		if (trimlibs === false) {
			trimlibs = {};
			$('link[rel=trimlib]').each(function() {
				var trimlib = new Trimlib(this);
				trimlibs[trimlib.namespace] = trimlib;
			});
		}
	}
		
	/**
	 * Render the template described by the {@code namespace}, {@code template} and {@data} and place
	 * it inside the given {@code el}ement. This method must silently fail under the following
	 * conditions:
	 * 
	 * a) The namespace provided does not exist
	 * b) The template provided does not exist
	 * 
	 * @param el {Node} The element in which the rendered template should be inserted.
	 * @param namespace {String} The namespace of the template.
	 * @param template {String} The ID of the trimpath template to use.
	 * @param data {Object} The data that will feed the template.
	 */
	function render(el, namespace, template, data) {
		var tld = trimlibs[namespace.toLowerCase()];
		if (tld) {
			var templateProcessor = tld.templateObject(template);
			if (templateProcessor) {
				var content = templateProcessor.process(data);
				$(el).html(content);
			}
		}
	}
	
	/**
	 * Replace the given DOM element with the rendered template. The information to render should be
	 * found ont he DOM element itself, in the following format:
	 * 
	 *	<namespace:template attr1="val1" attr2="val2">...</namespace:template>
	 *	
	 * Where the data that is generated for the template would be {attr1: "val1", attr2: "val2"}.
	 * 
	 * @param el {Node} The element on the DOM to expand.
	 * @return {jQuery} The <b>expanded</b> element.
	 */
	function expand(el) {
		if (!el.parentNode)
			return;
		
		var split = el.nodeName.toLowerCase().split(':');
		
		//this means it wasn't a namespaced tag. assume that it means it shouldn't be handled by trimlib
		if (!split[0] || !split[1])
			return;
		if (!trimlibs[split[0]] || !trimlibs[split[0]].hasTemplate(split[1]))
			return;
		
		var data = buildTemplateData(el);
		
		/*
		 * This __body data attribute is a special attribute that allows a template to recursively
		 * render the body of a tag. As JST uses the 'toString' method to resolve a data object, it is
		 * possible to load the content on-demand by overriding the method on the attribute as done
		 * below. This method recursively executes the 'expand' method on the inner content when the
		 * document body is requested. The benefit of loading this on demand is that, since the body
		 * may not ALWAYS be rendered when a template is processed, the inner content will not be
		 * processed unnecessarily.
		 */
		data.__body = {
			'toString': function() {
				$(el).find('*').trimlib('expand');
				return $(el).html();
			}
		};
		
		var content = $('<div />').trimlib({namespace: split[0], template: split[1], data: data}).html();
		$(el).replaceWith(content);
	}
	
	/**
	 * Generate the 'data' of the TrimPath template given the custom tag, using its attribute values.
	 * If an attribute value begins with "javascript:", then everything afterward is {@code eval}'d.
	 * Thus the returned object can be used to pass in complex objects to the template.
	 * 
	 * @param el {Node} The DOM Node whose attributes to process into template data.
	 */
	function buildTemplateData(el) {
		var data = {};
		//attributes on the tag directly translate to the data for the template
		$.each(el.attributes, function(i, attr) {
			if (attr.value.substring(0, 11) === 'javascript:') {
				data[attr.name] = eval(attr.value.substring(11, attr.value.length));
			} else {
				data[attr.name] = attr.value;
			}
		});
		return data;
	}
		
	/**
	 * Represents a link to a trimlib library.
	 * 
	 * @param link A DOM {@code link} tag.
	 */
	function Trimlib(link) {
		//the content of the taglib is loaded lazily
		var content = false;
				
		//the trimpath templates are compiled lazily
		var templates = {};
		
		return {
			namespace: $(link).attr('namespace').toLowerCase(),
			hasTemplate: function(name) {
				return $(content).find('> textarea[id='+name.toLowerCase()+']').length > 0;
			},
			templateObject: function(name) {
				name = name.toLowerCase();
				
				if (content === false)
					content = loadTrimlibContent(link);
					
				if (!templates[name]) {
					templates[name] = parseTemplate(name);
				}
				
				return templates[name];
			}
		};
		
		/**
		 * Download the actual content of the declared trimlib library. This should simply be a document
		 * that contains many trimpath templates inside <textarea /> elements -- as defined in the
		 * TrimPath documentation.
		 * 
		 * @param link {Node} The <link /> tag that specifies the trimlib library properties
		 */
		function loadTrimlibContent(link) {
			var href = $(link).attr('href');
			var content = null;
			$.ajax({
				url: href,
				async: false,
				success: function(value) {
					content = $('<div />').html(value);
				}
			});
			
			//ignore case
			content.find('> textarea').each(function() {
				$(this).attr('id', $(this).attr('id').toLowerCase());
			})
			
			return content.get(0);
		}
		
		/**
		 * Parse the template with the given {@code id}. This template must exist within the
		 * trimlib library.
		 * 
		 * @param id {string} The ID of the trimpath template inside the trimlib library.
		 * 
		 */
		function parseTemplate(id) {
			id = id.toLowerCase();
			try {
				var template = $(content).find('> textarea[id='+id+']').val();
				return TrimPath.parseTemplate(template);
			} catch (err) {
				throw new Error('Error parsing template "'+id+'": '+err);
			}
		}
	}
})(jQuery);