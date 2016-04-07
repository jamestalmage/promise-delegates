import _test from 'ava';
import DelegateConfig from './';
const config = DelegateConfig;

// TODO: Remove once power-assert fixes async/await race conditions
const test = _test.serial;

const slice = Array.prototype.slice;

test('method - creates a deferred method execution and returns the result', t => {
	t.plan(2);
	const p = Promise.resolve({
		foo: function () {
			t.deepEqual(slice.call(arguments), ['bar', 'baz']);
			return 'foo';
		}
	});

	config().method('foo').apply(p);

	return p.foo('bar', 'baz').then(foo => t.is(foo, 'foo'));
});

test('chain - like method, but returns the same promise for chaining', t => {
	t.plan(3);
	const p = Promise.resolve({
		foo: function () {
			t.deepEqual(slice.call(arguments), ['bar', 'baz']);
			this.callCount++;
		},
		callCount: 0
	});

	new DelegateConfig().chain('foo').apply(p);

	t.is(p.foo('bar', 'baz'), p);

	return p.then(result => t.is(result.callCount, 1));
});

test('getter - returns a promise for a future property value', async t => {
	const p = Promise.resolve({foo: 'bar'});

	new DelegateConfig().getter('foo').apply(p);

	t.is(await (p.foo), 'bar');
});

test('setter - allows you to set a value on a future promise result', t => {
	const result = {foo: 'bar'};

	const p = Promise.resolve(result);

	new DelegateConfig().setter('foo').apply(p);

	p.foo = 'baz';

	t.is(result.foo, 'bar');

	p.then(() => t.is(result.foo, 'baz'));
});

test('access - getter and setter together', async t => {
	const result = {foo: 'bar'};

	const p = Promise.resolve(result);

	new DelegateConfig().access('foo').apply(p);

	p.foo = 'baz';

	t.is(result.foo, 'bar');

	t.is(await (p.foo), 'baz');
});

test('config can be passed to getter', async t => {
	t.plan(1);

	const bar = Promise.resolve({
		baz: 'quz'
	});

	const foo = Promise.resolve({
		bar: bar
	});

	config().getter('bar', config().getter('baz')).apply(foo);

	t.is(await (foo.bar.baz), 'quz');
});

test('config can be passed to method', async t => {
	t.plan(1);

	const foo = Promise.resolve({
		bar: function (input) {
			return Promise.resolve({
				baz: input + 'baz'
			});
		}
	});

	config().method('bar', config().getter('baz')).apply(foo);

	t.is(await (foo.bar('hello-').baz), 'hello-baz');
});

test('wrap can be used to apply the config to the return value of a function', async t => {
	var foo = config().getter('bar').wrap(function (input) {
		return Promise.resolve({
			bar: input + 'baz'
		});
	});

	t.is(await (foo('hello-').bar), 'hello-baz');
});
