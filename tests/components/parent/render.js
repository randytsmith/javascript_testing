var React = require('react'),
    Parent = require('../../../src/components/parent.jsx'),
    fixture = require('../../fixtures/parent/base.js'),
    TestUtils = require('react/addons').addons.TestUtils,
    TestHelpers = require('../../helpers.js'),
    $ = require('jquery');


describe('Parent', function() {
  var component;
  var doStuffStub, loadChildStub;

  beforeEach(function() {
    loadChildStub = TestHelpers.stubMethod(Parent, 'loadChild', null);
    doStuffStub = TestHelpers.stubMethod(Parent, 'doStuff');

    component = TestHelpers.render(Parent, fixture);
  });

  it('should do stuff when clicking on the button', function() {
    TestUtils.Simulate.click(component.refs.btn.getDOMNode());

    expect(doStuffStub).to.have.been.calledOnce;
  });

  it('should render stuff', function() {
    expect($(component.refs.stuff.getDOMNode()).text()).to.equal('tomato');
  });

  it('should render a child', function() {
    expect(loadChildStub).to.have.been.calledWith('child');
  });
});
