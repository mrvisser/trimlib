trimlib is a simple jQuery plugin wrapper for TrimPath JST that provides a couple small enhancements:

1. The ability to externalize your JST template files
2. The ability to invoke those JST template files VIA a custom tag definition on the DOM

Note that this documentation assumes you are familiar with the
[TrimPath JavaScript Templates API](http://code.google.com/p/trimpath/wiki/JavaScriptTemplates).

Examples
=========

Rendering a TrimPath JST
-------------------------

**/index.html**

```html
...
<link rel="trimlib" type="text/html" namespace="test" href="tld.html" />
...
<div id="hello"></div>
...
<script type="text/javascript" src="scripts/trimpath-template-1.0.38.js"></script>
<script type="text/javascript" src="scripts/jquery.min.js"></script>
<script type="text/javascript" src="jquery.trimlib.js"></script>
<script type="text/javascript">
	jQuery('#hello').trimlib({namespace: 'test', template: 'hello', data: {world: 'World'}});
</script>
...
```

**/tld.html**

```html
<textarea id="hello">
	<p>
		Hello, ${world}!
	</p>
</textarea>
```

**Result:**

```html
...
<div id="hello">
	<p>
		Hello, World!
	</p>
</div>
...
```

The two key things happening in this example are:

`<link rel="trimlib" type="text/html" namespace="test" href="tld.html" />`

The `rel="trimlib"` attribute tells trimlib that it is linking to a set of trimlib templates (i.e., a "library"); the 
`namespace="test"` is specifying the *namespace* of the library; and `href="tld.html"` is specifying
a website that contains the actual Trimpath JST templates (note that for XSS security, the path to
tld.html must be on the same domain as the html document).

`jQuery('#content1').trimlib({namespace: 'test', template: 'hello', data: {world: 'World'}});`

This tells trimlib to render the template `hello` in the library with namespace `test` with data
`{world: 'World'}`, and insert it into the element with id `content1`. Pretty straight-forward.

Custom Tags
------------

Rather than explicitly invoking the TrimPath template, you can reference the namespace, template ID
and specify its data in a "custom tag" on the DOM. Then, you can "expand" that tag using a TrimLib
call.

**/index.html**

```html
...
<link rel="trimlib" type="text/html" namespace="test" href="tld.html" />
...
<test:large-title title="Introduction to TrimLib" />
...
<script type="text/javascript">
	jQuery('body').find('*').trimlib('expand');
</script>
...
```

**/tld.html**

```html
<textarea id="large-title">
	<h1>${title}</h1>
</textarea>
```

**Result:**

```html
...
<h1>Introduction to TrimLib</h1>
...
```

In this example, the custom tag would be equivalent to running $.trimlib with the following options:

`{namespace: 'test', template: 'large-title', data: {title: 'Introduction to TrimLib'}}`

In this case, that custom tag will be completely replaced with the result of rendering that
template. The `tld.html` file might have a template that looks like this:

Simple attribute values as seen above are always passed into the TrimPath JST as strings. Using a
prefix of `javascript:` for the value, you can specify a more complex value, which is shown next.

Using the `javascript:` attribute value prefix
-----------------------------------------------

TrimLib supports `eval`uating JavaScript to derive an attribute value similar to how JavaScript can
be evaluated in an `href` tag:

**/index.html**

```html
...
<link rel="trimlib" type="text/html" namespace="test" href="tld.html" />
...
<test:task-list title="My Task List" items="javascript:myTaskItems" />
...
<script type="text/javascript">
	var myTaskItems = ['Eat', 'Code', 'Sleep'];
	jQuery('body').find('*').trimlib('expand');
</script>
...
```

**/tld.html**
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

**Result:**

```html
...
<div class="task-list">
	<h1>My Task List</h1>
	<div class="task-list">
		<ul>
			<li>Eat</li>
			<li>Code</li>
			<li>Sleep</li>
		</ul>
	</div>
</div>
...
```

As you can see, the attribute `items` will evaluate to the variable `myTaskItems` in the global
scope, passing in the array `['Eat', 'Code', 'Sleep']` as the variable `items`.

Using the special `__body` JST variable
----------------------------------------

Using these custom tags would be pretty lame if you couldn't render the body of the custom tags.
That's why the `__body` variable exists. In your JST, if you access the `__body` variable, the body
of the custom tag will be recursively rendered and inserted into the location of the variable in the
template. For example:

**/index.html**

```html
...
<link rel="trimlib" type="text/html" namespace="test" href="tld.html" />
...
<test:section title="My Things">
	<p>These are some things that have to do with me.</p>
	<test:task-list title="Tasks" items="javascript:myTaskItems" />
	<test:pictures pictures="javascript:myPictures" />
</test:section>
...
<script type="text/javascript">
	var myTaskItems = ['Eat', 'Code', 'Sleep', 'Be more creative with examples'];
	var myPictures = [
		{ src: 'MyFace.jpg', alt: 'This is my face.' },
		{ src: 'MyArm.jpg', alt: 'Now this is a picture of my arm.' }
	];
		
	jQuery('body').find('*').trimlib('expand');
</script>
```

**/tld.html**

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

**Result:**

```html
...
<h1>My Things</h1>
<div>
	<p>These are some things that have to do with me.</p>
	<div class="task-list">
		<h2>Tasks</h2>
		<ul>
			<li>Eat</li>
			<li>Code</li>
			<li>Sleep</li>
			<li>Be more creative with examples</li>
		</ul>
	</div>
	<div class="pictures">
		<h2>My Pictures</h2>
		<div class="picture">
			<img src="MyFace.jpg" alt="This is my face." />
			<img src="MyArm.jpg" alt="Now this is a picture of my arm." />
		</div>
	</div>
</div>
...
```

As you can see, when the template comes across the ${__body} variable, it recursively expands the
inner body of the custom tag.

Suppose, for example, the `<test:section...>` tag is invoked with the attribute `rendered="javascript:false"`,
the body tag will never be expanded.

And that's all I have for now. If you have any questions or feedback, feel free to drop me a message!

