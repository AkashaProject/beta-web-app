import { connect } from 'react-redux';
import { AppActions, DraftActions } from 'local-flux';
import PublishEntryStatus from './components/publish-entry-status';

function mapStateToProps (state) {
    return {
        loggedProfile: state.profileState.get('loggedProfile'),
        drafts: state.draftState.get('drafts'),
        draftErrors: state.draftState.get('errors'),
        pendingActions: state.appState.get('pendingActions'),
        selectedTag: state.tagState.get('selectedTag')
    };
}

function mapDispatchToProps (dispatch) {
    return {
        draftActions: new DraftActions(dispatch),
        appActions: new AppActions(dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PublishEntryStatus);
