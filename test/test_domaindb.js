import chai from 'chai';
// polyfill intl for running tests
import dummy from 'intl';
import { IntlDomainDatabase } from '../src/domaindb';

let assert = chai.assert;

suite('domaindb', function() {
    test("simple load", function() {
        function myloader(localeId, domainId) {
            return Promise.resolve({'foo': 'bar'});
        }
        const db = new IntlDomainDatabase({}, myloader);
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
        const db = new IntlDomainDatabase({}, myloader);
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
        const db = new IntlDomainDatabase({}, myloader);
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
        const db = new IntlDomainDatabase({}, myloader);
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
    test("load domains", function(done) {
        let loads = {'a': 0, 'b': 0};
        function myloader(localeId, domainId) {
            loads[domainId]++;
            return Promise.resolve({'foo': 'bar'});
        }
        const db = new IntlDomainDatabase({}, myloader);

        db.neededDomainIds.add('a');
        db.neededDomainIds.add('b');
        db.loadDomains('en-US').then(() => {
            assert.equal(loads.a, 1);
            assert.equal(loads.b, 1);
            done();
        });
    });

});
