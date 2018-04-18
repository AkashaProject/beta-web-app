import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

class CellManager extends Component {
    baseNodeSize = {}
    componentDidMount () {
        const { onMount } = this.props;
        // if the card is in pending state don`t bother to update
        // it`s height
        if (this._baseNodeRef) {
            this.baseNodeSize = this._baseNodeRef.getBoundingClientRect();
            onMount(this.baseNodeSize, { firstMount: true });
        }
    }

    shouldComponentUpdate (nextProps) {
        return nextProps.isPending !== this.props.isPending ||
            (nextProps.author && !nextProps.author.equals(this.props.author)) ||
            nextProps.large !== this.props.large ||
            !!(nextProps.entry && !nextProps.entry.equals(this.props.entry)) ||
            nextProps.markAsNew !== this.props.markAsNew;
    }

    componentDidUpdate (prevProps) {
        const { onSizeChange, isPending } = this.props;
        if(isPending !== prevProps.isPending) {
            const refSize = this._baseNodeRef.getBoundingClientRect();
            if ( refSize.height !== this.baseNodeSize.height) {
                ReactDOM.unstable_batchedUpdates(() => {
                    onSizeChange(refSize);
                    this.baseNodeSize = refSize;
                });
            // probably the entry cannot be resolved
            } else if (!isPending) {
                onSizeChange(refSize);
                this.baseNodeSize = refSize;
            }
        }
    }

    _createBaseNodeRef = (node) => {
        this._baseNodeRef = node;
    }

    render () {
        const { entry, children } = this.props;
        return (
          <div
            ref={this._createBaseNodeRef}
            // id={entry.entryId}
          >
            {entry && children()}
          </div>
        );
    }
}

CellManager.propTypes = {
    author: PropTypes.shape(),
    onMount: PropTypes.func,
    onSizeChange: PropTypes.func,
    children: PropTypes.func,
    isPending: PropTypes.bool,
    id: PropTypes.string,
    large: PropTypes.bool,
    entry: PropTypes.shape(),
    markAsNew: PropTypes.bool,
};

export default CellManager;
