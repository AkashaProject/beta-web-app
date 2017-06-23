import settingsDB from './db/settings';
import BaseService from './base-service';

class SettingsService extends BaseService {
    saveSettings = ({
        options,
        onError = () => {
        },
        onSuccess
    }) => {
        const settings = options.settings;
        return settingsDB[options.table].put({ name: options.table, ...settings })
            .then(() => {
                onSuccess(options.settings, options.table);
            }).catch((reason) => {
                onError(reason, options.table);
            });
    };
    getSettings = ({
        options = { table: '', query: {} },
        onError = () => {
        },
        onSuccess
    }) => {
        settingsDB[options.table].where('name').equals(options.table).toArray()
            .then((data) => {
                onSuccess(data[0] || {}, options.table);
            })
            .catch((reason) => {
                onError(reason, options.table);
            });
    }

    saveLastBlockNr = ({ akashaId, blockNr }) => {
        settingsDB.user.where('akashaId').equals(akashaId).toArray()
            .then((data) => {
                const result = data[0] || {};
                result.lastBlockNr = blockNr;
                settingsDB.user.put({ akashaId, ...result });
            })
            .catch(() => null);
    };

    saveLatestMention = ({ akashaId, timestamp, onSuccess, onError }) => {
        settingsDB.user.where('akashaId').equals(akashaId).toArray()
            .then((data) => {
                const result = data[0] || {};
                result.latestMention = timestamp;
                settingsDB.user
                    .put({ akashaId, ...result })
                    .then((updated) => {
                        if (updated) {
                            onSuccess(timestamp);
                        }
                    })
                    .catch(error => onError(error));
            })
            .catch(error => onError(error));
    };

    saveDefaultLicence = ({ akashaId, licenceObj }) => {
        settingsDB.user.where('akashaId').equals(akashaId).toArray()
            .then((data) => {
                const result = data[0] || {};
                result.defaultLicence = licenceObj;
                settingsDB.user.put({ akashaId, ...result });
            });
    };

    savePasswordPreference = ({ akashaId, preference, onSuccess, onError }) =>
        settingsDB.user
            .where('akashaId')
            .equals(akashaId)
            .toArray()
            .then((data) => {
                const result = data[0] || {};
                result.passwordPreference = preference;
                settingsDB.user
                    .put({ akashaId, ...result })
                    .then((updated) => {
                        if (updated) {
                            onSuccess(preference);
                        }
                    })
                    .catch(error => onError(error));
            })
            .catch(error => onError(error));

    getUserSettings = ({ akashaId, onSuccess, onError }) => {
        settingsDB.user.where('akashaId').equals(akashaId).toArray()
            .then((data) => {
                onSuccess(data[0]);
            })
            .catch(reason => onError(reason));
    };

    disableNotifFrom = ({ loggedAkashaId, akashaId, profileAddress, onError, onSuccess }) => {
        settingsDB.user
            .where('akashaId')
            .equals(loggedAkashaId)
            .toArray()
            .then((data) => {
                if (!data[0]) {
                    settingsDB.user
                        .put({ akashaId: loggedAkashaId, notifications: { muted: [profileAddress] } })
                        .then(updated => updated ? onSuccess(profileAddress) : onError())
                        .catch(reason => onError(reason, akashaId));
                    return;
                }
                const mutedList = (data[0].notifications && data[0].notifications.muted) || [];
                if (mutedList.findIndex(muted => muted === profileAddress) !== -1) {
                    onError({}, akashaId);
                } else {
                    const newMutedList = [...mutedList, profileAddress];
                    settingsDB.user
                        .update(loggedAkashaId, { notifications: { muted: newMutedList } })
                        .then(updated => updated ? onSuccess(akashaId) : onError())
                        .catch(reason => onError(reason, akashaId));
                }
            })
            .catch(reason => onError(reason, akashaId));
    };

    enableNotifFrom = ({ loggedAkashaId, akashaId, profileAddress, onError, onSuccess }) => {
        settingsDB.user
            .where('akashaId')
            .equals(loggedAkashaId)
            .toArray()
            .then((data) => {
                if (!data[0] || !data[0].notifications || !data[0].notifications.muted) {
                    onError({}, akashaId);
                    return;
                }
                const mutedList = data[0].notifications.muted || [];
                const index = mutedList.findIndex(muted => muted === profileAddress);
                if (index === -1) {
                    onError({}, akashaId);
                } else {
                    mutedList.splice(index, 1);
                    settingsDB.user
                        .update(loggedAkashaId, { notifications: { muted: mutedList } })
                        .then((updated) => {
                            if (updated) {
                                onSuccess(akashaId);
                            } else {
                                onError();
                            }
                        })
                        .catch(reason => onError(reason, akashaId));
                }
            })
            .catch(reason => onError(reason, akashaId));
    };
}

const getSettings = table =>
    new Promise((resolve, reject) =>
        settingsDB[table].where('name').equals(table).toArray()
            .then(data => resolve(data[0] || {}))
            .catch(error => reject(error))
    );

const saveSettings = (table, payload) =>
    new Promise((resolve, reject) => {
        settingsDB[table].where('name').equals(table).toArray()
            .then((data) => {
                if (data.length) {
                    settingsDB[table].where('name').equals(table).modify(payload)
                        .then(() => resolve(payload))
                        .catch(error => reject(error));
                } else {
                    settingsDB[table].put({ name: table, ...payload })
                        .then(() => resolve(payload))
                        .catch(error => reject(error));
                }
            });
    });

export const generalSettingsRequest = () => getSettings('general');
export const gethSettingsRequest = () => getSettings('geth');
export const ipfsSettingsRequest = () => getSettings('ipfs');
export const userSettingsRequest = akashaId =>
    new Promise((resolve, reject) =>
        settingsDB.user.where('akashaId').equals(akashaId).toArray()
            .then(data => resolve(data[0] || {}))
            .catch(error => reject(error))
    );

export const generalSettingsSave = payload => saveSettings('general', payload);
export const gethSettingsSave = payload => saveSettings('geth', payload);
export const ipfsSettingsSave = payload => saveSettings('ipfs', payload);
export const userSettingsSave = (akashaId, payload) =>
    new Promise((resolve, reject) => {
        settingsDB.user.where('akashaId').equals(akashaId).toArray()
            .then((data) => {
                const resp = { akashaId, ...payload };
                if (data.length) {
                    settingsDB.user.where('akashaId').equals(akashaId).modify(payload)
                        .then(() => resolve(resp))
                        .catch(error => reject(error));
                } else {
                    settingsDB.user.put(resp)
                        .then(() => resolve(resp))
                        .catch(error => reject(error));
                }
            });
    });

export { SettingsService };
