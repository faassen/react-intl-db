react-intl-db
=============

Introduction
------------

This package contains i18n domain and message id support for the
[React integration](http://formatjs.io/react/) of
[Format.js](http://formatjs.io). It also makes it possible to load
translation messages dynamically from a backend or other source.

Usage
-----

First we can define a loader that shows how to load the messages from
the server. It should return a `Promise`:

    function loader(localeId, domainId) {
       // return a promise with the messages
    }

The loader gets the id of the locale to be loaded and the id of the
domain. The locale is an ISO locale; something like `en-US`. The
domain id you make up yourself. Typically each UI application would
use its own separate domain string.

The loader should return a promise that resolves to an object with
message id keys and message values, for this particular locale and
domain. The loader could for instance load its information from the
server:

    function loader(localeId, domainId) {
        return fetch(`http://example.com/i18n/${localeId}/${domainId}`);
    }

The next step is to create an `IntDomainDatabase` with this loader:

    import {IntlDomainDatabase} from 'react-intl-db';

    i18ndb = new IntlDomainDatabase(loader);

You can supply the `i18ndb` with default messages as well. These
messages are used when no loader argument is passed in, or if the
loader returns a promise that resolves to `null` or `undefined` for
that domain, or when the loader doesn't define a particular message.

    i18ndb.defaultMessages({
       domainId: 'mydomain',
       messages: {
           'hello': "Hello world!",
           'photos': ('{name} took {numPhotos, plural,' +
                      ' =0 {no photos}' +
                      ' =1 {one photo}' +
                      ' other {# photos}' +
                      '} on {takenDate, date, long}.')
       }
    })

We can now start using this i18ndb with React. Before we can start the
`React.render` though, we need to make sure we have loaded the information
for the right domain:

    i18ndb.setLocale('en-US').then(() => {
        React.render(<App />, document.body);
    });

We can now create a `Format` component for a particular domain that a
UI application can then use:

    const Format = i18ndb.makeFormat('myapp')

The argument to `makeFormat` is the name of the application's domain.

Once you have the `Format` component you can use it with a `messageId` prop:

    <Format messageId="hello" />

When you use this in code, the system automatically looks up the message id
`hello` for the domain `myapp` and inserts it.

Some messages take variables. You can pass them in like you do for
`FormattedMessage` from `react-intl`:

   <Format
       messageId="photos"
       name="Annie"
       numPhotos={1000}
       takenDate={Date.now()} />

Sometimes you need to be able render a formatted message in code,
for instance when you want to set the value of a prop. You can do by
creating a helper function:

    const formatStr = i18ndb.makeFormatStr('myapp')

You use it by passing the `messageId` as the first argument:

    render() {
        return <input value={formatStr('myMessageId')} />;
    }

You can also put in variables:

    render() {
        return <input value={formatStr('photos',
           { name: 'Annie', numPhotos=1000, takenDate=Date.now()})} />;
    }


Limitation
----------

Currently `react-intl-db` only properly supports a single locale per
application, not a list of locales. You can instead make sure the
right fallback is happening in the loader.

It also has no support for custom formats yet.

I'm happy to receive code that lifts these limitations!

Example application
-------------------

There is example code included in `src/example.jsx`.

First install the required dependencies:

    $ npm install

To try this out can use the webpack-dev-server, which automatically
rebuilds the bundle and serves the content in ``build`` like this:

    $ webpack-dev-server --progress --colors --content-base build

You can then access the example app on http://localhost:8080

