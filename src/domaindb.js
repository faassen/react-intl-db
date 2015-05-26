import React from 'react';
import ReactIntl from 'react-intl';
import {FormattedMessage} from 'react-intl';

export class IntlDomainDatabase {
    constructor(loader) {
        this.defaultDomains = {};
        this.locales = {};
        this.loader = loader;
        this.neededDomainIds = new Set();
    }
    clearMessages() {
        this.locales = {};
    }
    defaultMessages(data) {
        this.defaultDomains[data.domainId] = data.messages;
    }
    loadMessages(localeId, domainId) {
        let domains = this.locales[localeId];
        if (domains === undefined) {
            this.locales[localeId] = domains = {};
        }
        const messages = domains[domainId];
        if (messages !== undefined) {
            return Promise.resolve(messages);
        }
        if (this.loader === undefined) {
            return Promise.reject(new Error(
                "Loader not defined and cannot find domain: " + domainId));
        }
        return this.loader(localeId, domainId).then(messages => {
            if (!messages) {
                messages = this.defaultDomains[domainId];
                if (!messages) {
                    return Promise.reject(
                        new Error("Unknown locale " + localeId +
                                  " or domain " + domainId));
                }
                return messages;
            }
            domains[domainId] = messages;
            return messages;
        });
    }
    loadDomains(localeId) {
        const promises = []
        for (let domainId of this.neededDomainIds) {
            promises.push(this.loadMessages(localeId, domainId));
        }
        return Promise.all(promises);
    }
    getMessages(localeId, domainId) {
        const locale = this.locales[localeId];
        if (locale === undefined) {
            return this.defaultDomains[domainId];
        }
        const domain = locale[domainId];
        if (domain === undefined) {
            return this.defaultDomains[domainId];
        }
        return domain;
    }
    getMessageById(localeId, domainId, path) {
        const messages = this.getMessages(localeId, domainId);
        const pathParts = path.split('.');
        let message;
        try {
            message = pathParts.reduce((obj, pathPart) => {
                return obj[pathPart];
            }, messages);
        } finally {
            if (message === undefined) {
                throw new ReferenceError(
                    'Could not find Intl message: ' + path);
            }
        }
        return message;
    }
    makeFormatFunc(domainId) {
        const db = this;
        this.neededDomainIds.add(domainId);
        return function(component, path) {
            return db.getMessageById(getLocaleId(component), domainId, path);
        };
    }
    makeFormat(domainId) {
        const db = this;
        this.neededDomainIds.add(domainId);

        return React.createClass({
            mixins: [ReactIntl.IntlMixin],
            propTypes: {
                tagName: React.PropTypes.string,
                messageId: React.PropTypes.string
            },
            getMessageById(path) {
                return db.getMessageById(getLocaleId(this), domainId, path);
            },
            render() {
                const props = Object.assign({}, this.props);
                props.message = this.getMessageById(this.props.messageId);
                delete props.messageId;
                return React.createElement(FormattedMessage, props);
            }
        });
    }
    makeIntl(Component) {
        const db = this;
        return React.createClass({
            mixins: [ReactIntl.IntlMixin],
            getInitialState() {
                return {
                    'messagesLoaded': false
                }
            },
            componentWillMount() {
                db.loadDomains(this.props.locales).then(() => {
                    this.setState({'messagesLoaded': true});
                });
            },
            render() {
                if (!this.state.messagesLoaded) {
                    return null;
                }
                const props = Object.assign({}, this.props);
                return <Component {...props} />;
            }
        });
    }
}

function getLocaleId(component) {
    const locales = component.props.locales || component.context.locales;
    if (Array.isArray(locales)) {
        return locales[0];
    }
    return locales;
}
