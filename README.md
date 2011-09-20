trimlib is a simple jQuery plugin wrapper for TrimPath JST that provides a couple small enhancements:

1. The ability to externalize your JST template files
2. The ability to invoke those JST template files VIA a custom tag definition on the DOM

Examples
=========

Rendering a TrimPath JST
-------------------------------------------------

Consider the following HTML template:

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
			jQuery('#content1').trimlib({namespace: 'test', template: 'hello', data: {world: 'World'}});
		</script>
	</body>
</html>
```

The 2 (two) key things happening in this example are:

`<link rel="trimlib" type="text/html" namespace="test" href="tld.html" />`: The `rel="trimlib"`
attribute tells trimlib that it is linking to a set of trimlib templates (i.e., a "library"); the 
`namespace="test"` is specifying the *namespace* of the library; and `href="tld.html"` is specifying
a website that contains the actual Trimpath JST templates (note that for XSS security, the path to
tld.html must be on the same domain as the html document).

`jQuery('#content1').trimlib({namespace: 'test', template: 'hello', data: {world: 'World'}});`: This
tells trimlib to render the template `hello` in the library with namespace `test` with data
`{world: 'World'}`, and insert it into the element with id `content1`. Pretty straight-forward.

Now the file `tld.html` would be located on your domain, and its contents might be this:

```html
<textarea id="hello">
	<p>
		Hello, ${world}!
	</p>
</textarea>

<textarea id="another-template">
	<p>
		This is another template, rendered as a 
		<a href="http://code.google.com/p/trimpath/wiki/JavaScriptTemplates" target="_blank">
			Trimpath JST template
		</a>!
	</p>
</textarea>
```

2. Custom Tags
---------------------------------------------

Rather than explicitly invoking the TrimPath template, you can reference the namespace, template ID
and specify its data in a "custom tag" on the DOM. Then, you can "expand" that tag using a TrimLib
call.

Consider the following HTML file:

```html
<html>
	<head>
			<title>trimlib</title>
			<link rel="trimlib" type="text/html" namespace="test" href="tld.html" />
	</head>
	<body>

		<test:large-title title="Introduction to TrimLib" />

		<script type="text/javascript" src="scripts/trimpath-template-1.0.38.js"></script>
		<script type="text/javascript" src="scripts/jquery.min.js"></script>
		<script type="text/javascript" src="jquery.trimlib.js"></script>
		<script type="text/javascript">
			(function($) {
				$('body').find('*').trimlib('expand');
			})(jQuery);
		</script>
	</body>
</html>
```

In this example, the custom tag would be equivalent to running $.trimlib with the following options:

`{namespace: 'test', template: 'large-title', data: {title: 'Introduction to TrimLib'}}`

In this case, that custom tag will be completely replaced with the result of rendering that
template. The `tld.html` file might have a template that looks like this:

```html
<textarea id="large-title">
	<h1>${title}</h1>
</textarea>
```

Simple attribute values as seen above are always passed into the TrimPath JST as strings. Using a
prefix of `javascript:` for the value, you can specify a more complex value, which is shown next.

3. Using the `javascript:` attribute value prefix
--------------------------------------------------

TrimLib supports `eval`uating JavaScript to derive an attribute value similar to how JavaScript can
be evaluated in an `href` tag:

```html
<html>
	<head>
			<title>trimlib</title>
			<link rel="trimlib" type="text/html" namespace="test" href="tld.html" />
	</head>
	<body>

		<test:task-list title="My Task List" items="javascript:myTaskItems" />

		<script type="text/javascript" src="scripts/trimpath-template-1.0.38.js"></script>
		<script type="text/javascript" src="scripts/jquery.min.js"></script>
		<script type="text/javascript" src="jquery.trimlib.js"></script>
		<script type="text/javascript">
			var myTaskItems = ['Eat', 'Code', 'Sleep'];
			jQuery('body').find('*').trimlib('expand');
		</script>
	</body>
</html>
```

As you can see, the attribute `items` will evaluate to the variable `myTaskItems` in the global
scope, passing in the array `['Eat', 'Code', 'Sleep']` as the variable `items`. Then in our task
list template, we can iterate through the elements like so:

```html
<textarea id="task-list">
	<div class="task-list">
		<h1>${title}</h1>
		<ul>
			{for item in items}
				<li>${item}</li>
			{/for}
		</ul>
	</div>
</textarea>
```

4. Using the special `__body` JST variable
-------------------------------------------

Using these custom tags would be pretty lame if you couldn't render the body of the custom tags.
That's why the `__body` variable exists. In your JST, if you access the `__body` variable, the body
of the custom tag will be recursively rendered and inserted into the location of the variable in the
template. For example:

```html
<html>
	<head>
			<title>trimlib</title>
			<link rel="trimlib" type="text/html" namespace="test" href="tld.html" />
	</head>
	<body>

		<test:section title="My Things">
			<p>These are some things that have to do with me.</p>
			<test:task-list title="Tasks" items="javascript:myTaskItems" />
			<test:pictures pictures="javascript:myPictures" />
		</test:section>

		<script type="text/javascript" src="scripts/trimpath-template-1.0.38.js"></script>
		<script type="text/javascript" src="scripts/jquery.min.js"></script>
		<script type="text/javascript" src="jquery.trimlib.js"></script>
		<script type="text/javascript">
			var myTaskItems = ['Eat', 'Code', 'Sleep'];
			var myPictures = [
				{ src: 'MyFace.jpg', alt: 'This is my face.' },
				{ src: 'MyArm.jpg', alt: 'Now this is a picture of my arm.' }
			];
				
			jQuery('body').find('*').trimlib('expand');
		</script>
	</body>
</html>
```

And consider this `tld.html`:

```html
<textarea id="section">
	{if !defined('rendered')}
		{var rendered = true}
	{/if}
	{if rendered === true}
		<h1>${title}</h1>
		<div>
			${__body}
		</div>
	{/if}
</textarea>

<textarea id="task-list">
	<div class="task-list">
		<h2>${title}</h2>
		<ul>
			{for item in items}
				<li>${item}</li>
			{/for}
		</ul>
	</div>
</textarea>

<textarea id="pictures">
	<div class="pictures">
		<h2>My Pictures</h2>
		{for picture in pictures}
			<div class="picture">
				<img src="${picture.src}" alt="${picture.alt}" />
			</div>
		{/for}
	</div>
</textarea>
```

As you can see, the `section` template makes use of the `${__body}` variable and places it within
those `<div></div>` tags, which is where the body of the tag will be recursively rendered.

Now if the `<test:section...>` tag is invoked with the attribute `rendered="javascript:false"`, the
body tag will never be rendered.

And that's all I have for now. If you have questions or feedback, feel free to drop me a message!

