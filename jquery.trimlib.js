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
		
	$.fn.trimlib = function(options) {
		init();
		render(this, options.namespace, options.template, options.data);
		return this;
	};

	/**
	 * Instantiate all the trimlib libraries that have been declared.
	 */
	function init() {
		if (trimlibs === false) {
			trimlibs = {};
			$('link[rel=trimlib]').each(function() {
				var namespace = $(this).attr('namespace');
				trimlibs[namespace] = new Trimlib(this);
			});
		}
	}
		
	/**
	 * Render the template described by the {@code namespace}, {@code template} and {@data} and place
	 * it inside the given {@code el}ement.
	 * 
	 * @param el {Node} The element in which the rendered template should be inserted.
	 * @param namespace {String} The namespace of the template.
	 * @param template {String} The ID of the trimpath template to use.
	 * @param data {Object} The data that will feed the template.
	 */
	function render(el, namespace, template, data) {
		var tld = trimlibs[namespace];
		if (tld) {
			var templateProcessor = tld.templateObject(template);
			if (templateProcessor) {
				var content = templateProcessor.process(data);
				$(el).html(content);
			}
		}
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
			namespace: $(link).attr('namespace'),
			templateObject: function(name) {
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
					content = value;
				}
			});
						
			return $('<div></div>').html(content).get(0);
		}
		
		/**
		 * Parse the template with the given {@code id}. This template must exist within the
		 * trimlib library.
		 * 
		 * @param name {string} The ID of the trimpath template inside the trimlib library.
		 * 
		 */
		function parseTemplate(id) {
			try {
				var template = $(content).find('textarea[id='+id+']').val();
				return TrimPath.parseTemplate(template);
			} catch (err) {
				console.log('Error parsing template "'+id+'": '+err);
			}
		}
	}
		
		
})(jQuery);