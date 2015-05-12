import React from 'react';
import {FormattedMessage} from 'react-intl';

export class WrappedFormattedMessage {
    render() {
        const props = Object.assign({}, this.props, this.context.intl);
        if (!props.message) {
            props.message = this.context.intl.getIntlMessage(
                this.props.messageId);
        }
        return React.createElement(FormattedMessage, props);
    }
}

WrappedFormattedMessage.propTypes = {
    tagName: React.PropTypes.string,
    message: React.PropTypes.string,
    messageId: React.PropTypes.string
};

WrappedFormattedMessage.contextTypes = {
    intl: React.PropTypes.object.isRequired
};

class IntlState {
    constructor(locales, formats, messages) {
        this.locales = locales;
        this.formats = formats;
        this.messages = messages;
    }
    getIntlMessage(path) {
        const messages  = this.messages;
        const pathParts = path.split('.');

        let message;

        try {
            message = pathParts.reduce(function (obj, pathPart) {
                return obj[pathPart];
            }, messages);
        } finally {
            if (message === undefined) {
                throw new ReferenceError('Could not find Intl message: ' + path);
            }
        }
        return message;
    }
};

export const Intl = React.createClass({
    propTypes: {
        locales: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.array
        ]),
        formats: React.PropTypes.object,
        messages: React.PropTypes.object
    },
    childContextTypes: {
        intl: React.PropTypes.object.isRequired
    },
    getInitialState() {
        return {
            'intl': new IntlState(
                this.props.locales, this.props.formats, this.props.messages)

        }
    },
    render() {
        const { children } = this.props;

        if (!children) {
            return null;
        }
        if (!Array.isArray(children)) {
            return React.addons.cloneWithProps(React.Children.only(children));
        }
        const newChildren = React.Children.map(children, (child) => {
            return React.addons.cloneWithProps(child);
        });
        return (<span>{newChildren}</span>);
    },
    getChildContext() {
        return {
            intl: this.state.intl
        };
    },
});

// export class Intl extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//             'intl': new IntlState(
//                 props.locales, props.formats, props.messages)
//         };
//     }
//     render() {
//         return this.props.children;
//     }
//     getChildContext() {
//         return {
//             intl: this.state.intl
//         };
//     }
// }

// Intl.propTypes = {
//     locales: React.PropTypes.oneOfType([
//         React.PropTypes.string,
//         React.PropTypes.array
//     ]),
//     formats: React.PropTypes.object,
//     messages: React.PropTypes.object
// };


// Intl.childContextTypes = {
//     intl: React.PropTypes.object.isRequired
// };


export default Intl;
