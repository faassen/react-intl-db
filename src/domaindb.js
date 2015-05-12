import React from 'react';
import ReactIntl from 'react-intl';
import {FormattedMessage} from 'react-intl';

export class IntlDomainDatabase {
    constructor(defaultDomains, loader) {
        this.defaultDomains = defaultDomains;
        this.locales = {};
        this.loader = loader;
        this.neededDomainIds = new Set();
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
            throw new Error(
                "Loader not defined and cannot find domain: " + domainId);
        }
        return this.loader(localeId, domainId).then(messages => {
            if (!messages) {
                messages = this.defaultDomains[domainId];
                if (!messages) {
                    throw new Error("Unknown domain id " +
                                    domainId + " for locale " +
                                    localeId);
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
                const messages = db.domains[domainId];
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
            },
            render() {
                const props = Object.assign({}, this.props);
                props.message = this.getMessageById(this.props.messageId);
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
