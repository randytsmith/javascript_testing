var TestUtils = require('react/addons').addons.TestUtils,
    React = require('react'),
    _ = require('lodash'),
    ComponentTree = require('react-component-tree');


var _container;

// If there's a container on the page named #test-area, use that, otherwise
// create a detached div and use that. The former case is useful when running
// the tests in your own browser so you can debug how the component is
// rendered.
var testArea = document.querySelector('#test-area');

if (testArea) {
  _container = testArea;
} else {
  _container = document.createElement('div');
}


/**
 * Render a component into the DOM.
 *
 * @param {React class} Component
 * @param {Object} fixture
 * @param {DOM} container You should set this to this.container inside your
 *     tests.
 *
 * @returns {React instance}
 */
exports.render = function(Component, fixture = {}) {
  var props = _.omit(fixture, 'state', 'children'),
      component;

  try {
    component = React.render(React.createElement(
        Component, props, fixture.children),
        _container);
  } catch (e) {
    throw new Error('The component threw an exception while rendering:\n' +
                     e.message);
  }

  if (fixture.state) {
    // Injecting state will trigger a new render cycle and we only care about
    // the calls caused by the last render
    sandbox.reset();

    ComponentTree.injectState(component, fixture.state);
  }

  return component;
};


/**
 * Unmount the currently rendered component.
 */
exports.unmount = function() {
  React.unmountComponentAtNode(_container);
};


// Unmount the component after each test. A hidden side effect, but worth it.
afterEach(function() {
  exports.unmount();
});


/**
 * Stub a method on a React class.
 *
 * @param {React} _class
 * @param {String} method The name of the method you want to stub.
 * @param {*} [resp] The response the stub should return. If not provided, the
 *    stub will return `undefined`.
 *
 * @returns {Stub}
 */
module.exports.stubMethod = function(_class, method, resp) {
  var methodLoc = _getMethodLocation(_class, method);

  if (_.isFunction(resp)) {
    return sandbox.stub(methodLoc, method, resp);
  }

  return sandbox.stub(methodLoc, method).returns(resp);
};


/**
 * Get the props that will be sent to a child.
 *
 * @param {React} component Component instance.
 * @param {String} name Name of the method that's in the `children` key.
 * @param {Object[]} [args=[]] Arguments that will be passed to the method.
 *
 * @returns {Object} The props.
 */
module.exports.getChildProps = function(component, name, args) {
  args = args || [];

  var children = component.children;

  if (children === undefined) {
    throw new Error('Component doesn\'t have children');
  }

  var method = children[name];

  if (method === undefined) {
    throw new Error('Component doesn\'t have child `' + name + '`');
  }

  return method.apply(component, args);
};


/**
 * Simulate typing into an input.
 *
 * Works by updating the value of the given node and then triggering a change
 * event with TestUtils.Simulate. Only a single event will be triggered.
 *
 * @param {ref} node React reference.
 * @param {String} value
 */
module.exports.simulateTyping = function(ref, value) {
  var node = ref.getDOMNode();
  node.value = value;
  TestUtils.Simulate.change(node);
};


/**
 * Get the prototype of a React class.
 *
 * @param {React} _class
 *
 * @return {prototype}
 */
function _getClassPrototyppe(_class) {
  try {
    return _class.prototype;
  } catch (e) {
    throw new Error('Couldn\'t get the component\'s prototype');
  }
}


/**
 * Get the object of which a method is part of.
 *
 * @param {React} _class
 * @param {String} method
 *
 * @returns {Object}
 */
function _getMethodLocation(_class, method) {
  var proto = _getClassPrototyppe(_class);

  // React.createClass automagically binds event handlers and stores a cache of
  // them..ES6 classes don't autobind methods so this cache doesn't even exist.
  if (proto.__reactAutoBindMap && proto.__reactAutoBindMap[method]) {
    return proto.__reactAutoBindMap;
  }

  // Static methods sit here.
  if (proto.constructor[method]) {
    return proto.constructor;
  }

  // All the other methods sit here.
  if (proto[method]) {
    return proto;
  }

  throw new Error('Could not find method `' + method + '` on the class ' +
                  'prototype');
}
