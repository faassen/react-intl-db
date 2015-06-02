import chai from 'chai';
// polyfill intl for running tests
import React from 'react/addons';
import dummy from 'intl';
import {FormattedMessage } from 'react-intl';
import ReactIntl from 'react-intl';
import jsdom from 'jsdom';
import { IntlDomainDatabase } from '../src/domaindb';

let assert = chai.assert;

global.document = jsdom.jsdom('<!doctype html><html><body></body></html>');
global.window = document.parentWindow;

suite('domaindb', function() {
    test("simple load", function() {
        function myloader(localeId, domainId) {
            return Promise.resolve({'foo': 'bar'});
        }
        const db = new IntlDomainDatabase(myloader);
        return db.loadMessages('en-US', 'foo').then((messages) => {
            assert.deepEqual(messages, {'foo': 'bar'});
        });
    });
    test("load is cached", function(done) {
        let loads = 0;
        function myloader(localeId, domainId) {
            loads++;
            return Promise.resolve({'foo': 'bar'});
        }
        const db = new IntlDomainDatabase(myloader);
        db.loadMessages('en-US', 'foo').then((messages) => {
            assert.equal(loads, 1);
        }).then(() => {
            db.loadMessages('en-US', 'foo').then((messages) => {
                assert.equal(loads, 1);
                done();
            });
        });
    });
    test("cache per domain", function(done) {
        let loads = {'a': 0, 'b': 0};
        function myloader(localeId, domainId) {
            loads[domainId]++;
            return Promise.resolve({'foo': 'bar'});
        }
        const db = new IntlDomainDatabase(myloader);
        db.loadMessages('en-US', 'a').then((messages) => {
            assert.equal(loads.a, 1);
            assert.equal(loads.b, 0);
            return messages;
        }).then((messages) => {
            return db.loadMessages('en-US', 'b');
        }).then((messages) => {
            assert.equal(loads.a, 1);
            assert.equal(loads.b, 1);
            return db.loadMessages('en-US', 'a');
        }).then((messages) => {
            assert.equal(loads.a, 1);
            assert.equal(loads.b, 1);
            return db.loadMessages('en-US', 'b');
        }).then((messages) => {
            assert.equal(loads.a, 1);
            assert.equal(loads.b, 1);
            done();
        });
    });
    test("cache per domain and locale", function(done) {
        let loads = {'en': {'a': 0, 'b': 0},
                     'nl': {'a': 0, 'b': 0}};
        function myloader(localeId, domainId) {
            loads[localeId][domainId]++;
            return Promise.resolve({'foo': 'bar'});
        }
        const db = new IntlDomainDatabase(myloader);
        db.loadMessages('en', 'a').then((messages) => {
            assert.equal(loads.en.a, 1);
            assert.equal(loads.en.b, 0);
            assert.equal(loads.nl.a, 0);
            assert.equal(loads.nl.b, 0);
            return messages;
        }).then((messages) => {
            return db.loadMessages('nl', 'a');
        }).then((messages) => {
            assert.equal(loads.en.a, 1);
            assert.equal(loads.en.b, 0);
            assert.equal(loads.nl.a, 1);
            assert.equal(loads.nl.b, 0);
            done();
        });
    });
    test("default domains", function(done) {
        function myloader(localeId, domainId) {
            return Promise.resolve(null);
        }
        const db = new IntlDomainDatabase(myloader);
        db.defaultMessages({domainId: 'a',
                            messages: {'aDefault': 'A_DEFAULT'}});
        db.defaultMessages({domainId: 'b',
                            messages: {'bDefault': 'B_DEFAULT'}});
        db.loadMessages('en-US', 'a').then((messages) => {
            assert.deepEqual(messages, {'aDefault': 'A_DEFAULT'});
            done();
        });
    });
    test("no loader", function(done) {
        const db = new IntlDomainDatabase();
        db.loadMessages('en-US', 'a').catch((e) => {
            assert.equal(e.message,
                         "Loader not defined and cannot find domain: a");
            done();
        });
    });
    test("no loader with default domains", function(done) {
        const db = new IntlDomainDatabase();
        db.defaultMessages({domainId: 'a',
                            messages: {'aDefault': 'A_DEFAULT'}});
        db.loadMessages('en-US', 'a').then((messages) => {
            assert.deepEqual(messages, {'aDefault': 'A_DEFAULT'});
            done();
        });
    });
    test("no messages for domain", function(done) {
        function myloader(localeId, domainId) {
            return Promise.resolve(null);
        }
        const db = new IntlDomainDatabase(myloader);
        db.loadMessages('en-US', 'a').catch((e) => {
            assert.equal(e.message,
                         "Unknown locale en-US or domain a");
            done();
        });
    });
    test("missing messages for domain", function(done) {
        function myloader(localeId, domainId) {
            return Promise.resolve({'present': 'PRESENT'});
        }
        const db = new IntlDomainDatabase(myloader);
        db.defaultMessages({domainId: 'a',
                            messages: {'missing': 'MISSING'}});

        db.loadMessages('en-US', 'a').then(messages => {
            assert.deepEqual(messages, {'present': 'PRESENT',
                                        'missing': 'MISSING'});
            done();
        });
    });

    test("load domains", function(done) {
        let loads = {'a': 0, 'b': 0};
        function myloader(localeId, domainId) {
            loads[domainId]++;
            return Promise.resolve({'foo': 'bar'});
        }
        const db = new IntlDomainDatabase(myloader);

        db.neededDomainIds.add('a');
        db.neededDomainIds.add('b');
        db.setLocale('en-US').then(() => {
            assert.equal(loads.a, 1);
            assert.equal(loads.b, 1);
            done();
        });
    });

    test("makeFormat with default", function() {
        const renderer = React.addons.TestUtils.createRenderer();
        const db = new IntlDomainDatabase();
        db.defaultMessages({domainId: 'a',
                            messages: {'foo': 'bar'}});
        const Format = React.createFactory(db.makeFormat('a'));
        db.setLocale('en-US');
        const formatted = Format({'messageId': 'foo'});
        renderer.render(formatted);
        const output = renderer.getRenderOutput();
        assert.deepEqual(
            output,
            React.createFactory(FormattedMessage)(
                {'message': 'bar',
                'locales': 'en-US'}));
    });


    test("makeFormatStr with default", function() {
        const renderer = React.addons.TestUtils.createRenderer();
        const db = new IntlDomainDatabase();
        db.defaultMessages({domainId: 'a',
                            messages: {'foo': 'bar'}});
        const formatStr = db.makeFormatStr('a');
        const Element = React.createClass({
            render() {
                return formatStr('foo');
            }
        });

        const ElementFactory = React.createFactory(Element);
        db.setLocale('en-US');
        const formatted = ElementFactory();
        renderer.render(formatted);
        const output = renderer.getRenderOutput();
        assert.deepEqual(
            output,
            'bar');
    });

    test("makeFormat with loader", function(done) {
        const locales = {
            'en-US': {
                'a': {
                    'hello': "Hello world!"
                }
            },
            "nl-NL": {
                'a': {
                    'hello': "Hallo wereld!"
                }
            }
        };

        function myloader(localeId, domainId) {
            return Promise.resolve(locales[localeId][domainId]);
        }
        const db = new IntlDomainDatabase(myloader);

        const renderer = React.addons.TestUtils.createRenderer();

        const Format = React.createFactory(db.makeFormat('a'));
        const formatted = Format({'messageId': 'hello'});
        const formatted2 = Format({'messageId': 'hello'});

        db.setLocale('en-US').then(() => {
            db.setLocale('en-US');
            renderer.render(formatted);
            const output = renderer.getRenderOutput();
            assert.deepEqual(
                output,
                React.createFactory(FormattedMessage)(
                    {'message': 'Hello world!',
                     'locales': 'en-US'}));
        }).then(() => {
            db.clearMessages();
            db.setLocale('nl-NL').then(() => {
                db.setLocale('nl-NL');
                renderer.render(formatted2);
                const output = renderer.getRenderOutput();
                assert.deepEqual(
                    output,
                    React.createFactory(FormattedMessage)(
                        {'message': 'Hallo wereld!',
                        'locales': 'nl-NL'}));
                done();
            });
        });

    });
    test("Format date", function() {
        const db = new IntlDomainDatabase();
        db.defaultMessages({
            domainId: 'a',
            messages: {'foo': 'From {start, date, long}'}});
        const Format = React.createFactory(db.makeFormat('a'));
        db.setLocale('en-US');
        const formatted = Format({'messageId': 'foo',
                                  start: new Date('2003-12-24')});
        React.render(formatted, document.body);
        assert.equal(document.body.textContent, 'From December 24, 2003');
    });
    test("formatStr date", function() {
        const db = new IntlDomainDatabase();
        db.defaultMessages({
            domainId: 'a',
            messages: {'foo': 'From {start, date, long}'}});
        const formatStr = db.makeFormatStr('a');
        const Element = React.createClass({
            render() {
                return React.createElement(
                    'span', null,
                    formatStr('foo', {'start': new Date('2003-12-24')}));
            }
        });
        const ElementFactory = React.createFactory(Element);
        db.setLocale('en-US');
        React.render(ElementFactory(), document.body);
        assert.equal(document.body.textContent, 'From December 24, 2003');
    });
});
