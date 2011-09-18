trimlib is a simple jQuery plugin wrapper for TrimPath JST that provides the ability to externalize your TrimPath templates.

Example
========

Here is an example website that makes use of the TrimLib jQuery plugin:

```html
<html>
	<head>
		<title>trimlib</title>
		<link rel="trimlib" type="text/html" namespace="test" href="tld.html" />
	</head>
	<body>
		<h1>Content1:</h1>
		<div id="content1"></div>

		<script type="text/javascript" src="scripts/trimpath-template-1.0.38.js"></script>
		<script type="text/javascript" src="scripts/jquery.min.js"></script>
		<script type="text/javascript" src="jquery.trimlib.js"></script>
		<script type="text/javascript">
			(function($) {
				$('#content1').trimlib({namespace: 'test', template: 'hello', data: {world: 'World'}});
			})(jQuery);
		</script>
	</body>
</html>
```

The 2 (two) key things happening in this example are:

`<link rel="trimlib" type="text/html" namespace="test" href="tld.html" />`: The `rel="trimlib"` attribute tells trimlib that it is linking to a set of trimlib templates (i.e., a "library"); the `namespace="test"` is specifying the *namespace* of the library; and `href="tld.html"` is specifying a website that contains the actual Trimpath JST templates (note that for XSS security, the path to tld.html must be on the same domain as the html document).

`$('#content1').trimlib({namespace: 'test', template: 'hello', data: {world: 'World'}});`: This tells trimlib to render the template `hello` in the library with namespace `test` with data `{world: 'World'}`, and insert it into the element with id `content1`. Pretty straight-forward.

Now the file `tld.html` would be located on your domain, and its contents might be this:

```html
<textarea id="hello">
	<p>
		Hello, ${world}!
	</p>
</textarea>

<textarea id="another-template">
	<p>
		This is another template, rendered as a <a href="http://code.google.com/p/trimpath/wiki/JavaScriptTemplates" target="_blank">Trimpath JST template</a>!
	</p>
</textarea>
```

And that's all you really need to know, I think.

Roadmap
========

Next, I hope to add the ability to *expand* namespaced tags in your template, so that it works more like a custom tag library. More specifically, the execution of the plugin above:

`$('#content1').trimlib({namespace: 'test', template: 'hello', data: {world: 'World'}});`

could by done by simply putting the following markup in the HTML document:

```html
<div id="content1">
	<test:hello data="World" />
</div>
```

and it could be expanded by running something like:

`$('#content1').trimlib('expand');`
