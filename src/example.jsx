import React from 'react/addons';
import polyfill from 'babel-core/polyfill';
import ReactIntl from 'react-intl';
import {IntlDomainDatabase} from './domaindb';

// to please locale loaded later manually
window.ReactIntl = ReactIntl;

const domainsEn = {
    'main': {
        'photos': `{name} took {numPhotos, plural,
                   =0 {no photos}
                   =1 {one photo}
                   other {# photos}
                }`
    },
    'other': {
        'chicken': "The chicken's name is {name}"
    }
};

const domainsNl = {
    'main': {
        'photos': `{name} heeft {numPhotos, plural,
                   =0 {geen fotos}
                   =1 {een foto}
                   other {# fotos gemaakt}}`
    },
    'other': {
        'chicken': "De naam van de kip is {name}"
    }
};

function loadDomain(localeId, domainId) {
    let messages;
    if (localeId === 'en-US') {
        messages = domainsEn[domainId];
    } else if (localeId === 'nl-NL') {
        messages = domainsNl[domainId];
    }
    if (messages === undefined) {
        throw new Error(
            "Cannot load domain " + domainId + " in locale " + localeId);
    }
    return Promise.resolve(messages);
}

const db = new IntlDomainDatabase({}, loadDomain);

const Format = db.makeFormat('main');
const OtherFormat = db.makeFormat('other');

class Sub extends React.Component {
    render() {
        return (
            <div>
                <Format messageId="photos"
                        name={'Bob'}
                        numPhotos={1} />
            </div>);
    }
}

class App extends React.Component {
    render() {
        return (
            <div>
                <p>
                    <Format messageId="photos"
                            name={'Annie'}
                            numPhotos={100} />
                </p>
                <p>
                    <OtherFormat messageId="chicken"
                                 name="Fred" />
                </p>
                <p>
                    <Sub />
                </p>
            </div>
        );
    }
}

const IntlApp = db.makeIntl(App);

document.addEventListener('DOMContentLoaded', (event) => {
    const locale = 'nl-NL';

    React.render(
        <IntlApp locales={locale} />,
        document.body
    );
});
