# promise-delegates [![Build Status](https://travis-ci.org/jamestalmage/promise-delegates.svg?branch=master)](https://travis-ci.org/jamestalmage/promise-delegates)

> Extend the promise API with methods and accessors that delegate to the future value.


## Install

```
$ npm install --save promise-delegates
```


## Usage

```js
const delegate = require('promise-delegates');

let config = delegate()
  .method('foo')
  .getter('bar');

let somePromise = config.apply(promiseFn());
    
// the args are stored and the method is executed on the promise result.    
somePromise.foo('args...'); 
 
// returns a promise for the `bar` property on the resolved value of `somePromise`. 
somePromise.bar;   
```

## API Summary

Every method has a nearly identical API. More detailed explanations with examples are in the sections below.

- `config.getter(propertyName, [childConfig])` - Define a getter that returns a promise for a member of the resolved value. Optionally extend the returned promise with another config.

- `config.setter(propertyName)` - Define a setter. Setters can not specify a return value, so a promise is not returned.

- `config.access(propertyName, [childConfig])` - Define a getter and setter. `childConfig` only applies to the getter.
  
- `config.method(methodName, [childConfig])` - Store the args, and call the method on the resolved value. Returns a promise for the result of the method invocation. Optionally extend the r

- `config.chain(methodName)` - Same as `config.method`, but returns the `basePromise`` for chaining. Useful if your promise returns an eventEmitter, etc.


## Child Configs and chaining

Child configs become very helpful in allowing you to build expressive chainable API's'.

Let's pretend we have an entirely async class called `Person`, with the following members: 
 
 - `mother` - A property containing a promise for the persons mother.
 - `father` - A property containing a promise for the persons father.
 - `child(n)` - A method that returns a promise for the persons `n`th child.

No let's define a config to wrap a promise for `Person`:

  ```js
  let personConfig = delegate();

  personConfig
    .getter('mother', personConfig)
    .getter('father', personConfig)
    .method('child', personConfig)
  ```

Assuming `getPerson(name)` returns a promise for a `Person`, we can do the following:

  ```js
  // wrap the promising returning function.
  getPerson = config.wrap(getPerson);
  
  // let's fetch my mothers, fathers, first born
  var auntSharon = getPerson('James').mother.father.child(1);
  ```
That last line is the equivalent of the following:

  ```js
  var auntSharon = getPerson('James')
    .then(function (me) {
      return me.mother;
    })
    .then(function (mother) {
      return mother.father;
    })
    .then(function (grandpa) {
      return grandpa.child(1);
    });  
  ```

## API

### delegate()

Creates a new `delegateConfig` instance for defining a set of extensions to a promise. 

### delegateConfig.apply(basePromise)

Applies the config built using the methods below `basePromise`. `basePromise` will be extended with the property accessors and methods defined in the config.

### delegateConfig.getter(propertyName, [childConfig])

Defines a property getter on the `basePromise`. The value returned by the getter is a promise for a property on the resolved value of `basePromise`.

```js
delegate().getter('foo').apply(somePromise);

let foo = somePromise.foo; 
```

is equivalent to:

```js
let foo = somePromise.then(function (result) {
  return result.foo;
});
```

##### propertyName

Type: `string`  

The property name for the getter created.

##### childConfig

Type: `delegateConfig`  

If supplied, the promise returned from the getter will be extended with this config.

### delegateConfig.setter(propertyName)

Defines a property setter on the `basePromise`. Setters can not specify return a value. 

```js
delegate().setter('foo').apply(somePromise);

somePromise.foo = 'bar'; 
```

is equivalent to:

```js
somePromise.then(function (result) {
  result.foo = 'bar';
});
```

### delegateConfig.access(propertyName, [childConfig])

Defines a getter and setter on the `basePromise`. If specified, `childConfig` is only applied to the getter.

### delegateConfig.method(propertyName, [childConfig])

Defines a method on the `basePromise`. When invoked, the method will store its arguments and perform the same invocation on the resolved value of `basePromise`. The returned value is a promise for the result of the method invocation. The returned value can optionally be extended with `childConfig`.

```js
delegate().method('foo').apply(somePromise);

let foo = somePromise.foo('bar', 'baz'); 
```

is equivalent to:

```js
let foo = somePromise.then(function (result) {
  return result.foo('bar', 'baz');
});
```

### delegateConfig.chain(propertyName)

Defines a method on the `basePromise`. When invoked, the method will store its arguments and perform the same invocation on the resolved value of `basePromise`. The returned value is `basePromise`. This is useful for method chaining.

```js
delegate().chain('foo').apply(somePromise);

assert(somePromise === somePromise.foo('bar')); 
```

## License

MIT © [James Talmage](http://github.com/jamestalmage)
