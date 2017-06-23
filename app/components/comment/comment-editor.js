import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { createTypeStrategy, DraftJS, editorStateToJSON, MegadraftEditor } from 'megadraft';
import Link from 'megadraft/lib/components/Link';
import { RaisedButton } from 'material-ui';
import { MentionDecorators, MentionSuggestions } from '../../shared-components';
import { Avatar } from '../';
import { getInitials } from '../../utils/dataModule';
import { getMentionsFromEditorState } from '../../utils/editorUtils';
import { entryMessages, generalMessages } from '../../locale-data/messages'; // eslint-disable-line import/no-unresolved, import/extensions
import styles from './comment-editor.scss';

const { CompositeDecorator, EditorState } = DraftJS;

class CommentEditor extends Component {
    constructor (props) {
        super(props);

        this.container = null;
        this.editor = null;

        this.decorators = new CompositeDecorator([MentionDecorators.editableDecorator, {
            strategy: createTypeStrategy('LINK'),
            component: Link
        }]);

        this.state = {
            editorState: EditorState.createEmpty(this.decorators),
        };
    }

    shouldComponentUpdate (nextProps, nextState) {
        return nextState.editorState !== this.state.editorState;
    }

    getBaseNode = () => this.baseNodeRef;

    getContainerRef = el => (this.container = el);

    getEditorRef = el => (this.editor = el);

    setSuggestionsRef = el => (this.suggestionsComponent = el);

    handleCommentChange = (editorState) => {
        // Ignore "Enter" key press if suggestions list is opened
        const isOpen = this.suggestionsComponent.getIsOpen();
        if (editorState.getLastChangeType() === 'split-block' && isOpen) {
            return;
        }
        this.setState({
            editorState,
        });
    };

    handleCommentCreate = () => {
        const { commentsAddPublishAction, entryId, parent = '0' } = this.props;
        const { editorState } = this.state;
        const mentions = getMentionsFromEditorState(editorState);
        const payload = {
            content: editorStateToJSON(editorState),
            date: new Date().toISOString(),
            entryId,
            mentions,
            parent
        };
        commentsAddPublishAction(payload);
    };

    handleCommentCancel = () => {
        this.resetEditorState();
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    };

    resetEditorState = () => {
        this.setState({
            editorState: EditorState.createEmpty(this.decorators)
        });
    };

    render () {
        const { intl, loggedProfileData, showPublishActions } = this.props;
        const userInitials = getInitials(loggedProfileData.firstName, loggedProfileData.lastName);
        let { placeholder } = this.props;

        if (!placeholder) {
            placeholder = `${intl.formatMessage(entryMessages.writeComment)}...`;
        }

        return (
          <div
            className={`${styles.comment_writer} row`}
            ref={baseNode => (this.baseNodeRef = baseNode)}
          >
            <div className={`${styles.avatar_image} col-xs-1 start-xs`}>
              <Avatar
                image={loggedProfileData.get('avatar')}
                radius={48}
                userInitials={userInitials}
                userInitialsStyle={{ fontSize: 22 }}
              />
            </div>
            <div className={`${styles.comment_editor} col-xs-11`}>
              <div
                className={styles.comment_editor_inner}
                ref={this.getContainerRef}
                onFocus={this.onContainerFocus}
              >
                <MegadraftEditor
                  ref={this.getEditorRef}
                  placeholder={placeholder}
                  editorState={this.state.editorState}
                  onChange={this.handleCommentChange}
                  sidebarRendererFn={() => null}
                />
                <MentionSuggestions
                  ref={this.setSuggestionsRef}
                  editorState={this.state.editorState}
                  onChange={this.handleCommentChange}
                  parentRef={this.container}
                />
              </div>
            </div>
            {(this.state.editorState.getCurrentContent().hasText() || showPublishActions) &&
              <div className={`${styles.comment_publish_actions} col-xs-12 end-xs`}>
                <RaisedButton
                  label={intl.formatMessage(generalMessages.cancel)}
                  onClick={this.handleCommentCancel}
                />
                <RaisedButton
                  label={intl.formatMessage(generalMessages.publish)}
                  onClick={this.handleCommentCreate}
                  primary
                  style={{ marginLeft: 8 }}
                />
              </div>
            }
          </div>
        );
    }
}

CommentEditor.propTypes = {
    commentsAddPublishAction: PropTypes.func.isRequired,
    entryId: PropTypes.string,
    intl: PropTypes.shape(),
    loggedProfileData: PropTypes.shape(),
    onCancel: PropTypes.func,
    parent: PropTypes.string,
    placeholder: PropTypes.string,
    showPublishActions: PropTypes.bool,
};

export default CommentEditor;
