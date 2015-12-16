'use strict';
module.exports = DelegateConfig;

var slice = Array.prototype.slice;

function DelegateConfig() {
	if (!(this instanceof DelegateConfig)) {
		return new DelegateConfig();
	}
	this._config = [];
}

DelegateConfig.prototype.method = function (methodName, config) {
	this._config.push(setValue(methodName, function () {
		var args = slice.call(arguments);
		return applyConfig(config, this.then(function (result) {
			return result[methodName].apply(result, args);
		}));
	}));
	return this;
};

DelegateConfig.prototype.chain = function (methodName) {
	this._config.push(setValue(methodName, function () {
		var args = slice.call(arguments);
		this.then(function (result) {
			return result[methodName].apply(result, args);
		});
		return this;
	}));
	return this;
};

DelegateConfig.prototype.getter = function (propertyName, config) {
	this._config.push(defineProperty(propertyName, {get: getter(propertyName, config)}));
	return this;
};

DelegateConfig.prototype.setter = function (propertyName) {
	this._config.push(defineProperty(propertyName, {set: setter(propertyName)}));
	return this;
};

DelegateConfig.prototype.access = function (propertyName, config) {
	this._config.push(defineProperty(propertyName, {
		get: getter(propertyName, config),
		set: setter(propertyName)
	}));
	return this;
};

DelegateConfig.prototype.apply = function (promise) {
	this._config.forEach(function (fn) {
		fn(promise);
	});
	return promise;
};

DelegateConfig.prototype.wrap = function (promiseFn, ctx) {
	var self = this;
	return function () {
		return self.apply(promiseFn.apply(ctx || this, arguments));
	};
};

function getter(propertyName, config) {
	return function () {
		return applyConfig(config, this.then(function (result) {
			return result[propertyName];
		}));
	};
}

function setter(propertyName) {
	return function (value) {
		this.then(function (result) {
			result[propertyName] = value;
		});
	};
}

function defineProperty(propertyName, config) {
	return function (promise) {
		Object.defineProperty(promise, propertyName, config);
	};
}

function setValue(propertyName, value) {
	return function (promise) {
		promise[propertyName] = value;
	};
}

function applyConfig(config, promise) {
	if (config) {
		config.apply(promise);
	}
	return promise;
}
