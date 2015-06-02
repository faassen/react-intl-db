import React from 'react';
import ReactIntl from 'react-intl';
import {FormattedMessage, IntlMixin} from 'react-intl';


export class IntlDomainDatabase {
    constructor(loader) {
        this.defaultDomains = {};
        this.locales = {};
        this.currentLocaleId = null;
        this.loader = loader;
        this.neededDomainIds = new Set();
    }
    clearMessages() {
        this.locales = {};
    }
    defaultMessages(data) {
        this.defaultDomains[data.domainId] = data.messages;
    }
    setLocale(localeId) {
        this.currentLocaleId = localeId;
        return this.loadDomains(localeId);
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
            const messages = this.defaultDomains[domainId];
            if (!messages) {
                return Promise.reject(new Error(
                    "Loader not defined and cannot find domain: " + domainId));
            }
            return Promise.resolve(messages);
        }
        return this.loader(localeId, domainId).then(messages => {
            const domainMessages = this.defaultDomains[domainId];
            if (!messages) {
                if (!domainMessages) {
                    return Promise.reject(
                        new Error("Unknown locale " + localeId +
                                  " or domain " + domainId));
                }
                return domainMessages;
            }
            if (domainMessages) {
                messages = Object.assign(domainMessages,
                                         messages);
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
    makeFormatStr(domainId) {
        const db = this;
        this.neededDomainIds.add(domainId);
        return function(path, values) {
            if (values === undefined) {
                values = {};
            }
            // XXX formats support
            const message = db.getMessageById(
                db.currentLocaleId, domainId, path);
            const format = IntlMixin.getMessageFormat(
                message, db.currentLocaleId, {});
            return format.format(values);
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
                return db.getMessageById(db.currentLocaleId, domainId, path);
            },
            render() {
                const props = Object.assign({}, this.props);
                props.message = this.getMessageById(this.props.messageId);
                props.locales = db.currentLocaleId;
                delete props.messageId;
                return React.createElement(FormattedMessage, props);
            }
        });
    }
}
