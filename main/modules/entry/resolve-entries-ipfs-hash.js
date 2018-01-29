import * as Promise from 'bluebird';
import { getFullContent, getShortContent } from './ipfs';
import { SHORT_WAIT_TIME } from '../../config/settings';
import schema from '../utils/jsonschema';
export const resolveEntriesIpfsHash = {
    'id': '/resolveEntriesIpfsHash',
    'type': 'object',
    'properties': {
        'ipfsHash': {
            'type': 'array',
            'items': { 'type': 'string' },
            'uniqueItems': true,
            'minItems': 1
        },
        'full': { 'type': 'boolean' }
    },
    'required': ['ipfsHash']
};
const execute = Promise.coroutine(function* (data, cb) {
    const v = new schema.Validator();
    v.validate(data, resolveEntriesIpfsHash, { throwError: true });
    const fetchData = (data.full) ? getFullContent : getShortContent;
    data.ipfsHash.forEach((ipfsHash) => {
        fetchData(ipfsHash, false)
            .timeout(SHORT_WAIT_TIME)
            .then((entry) => {
            cb(null, { entry, ipfsHash: ipfsHash });
        })
            .catch((err) => {
            cb({ message: err.message, ipfsHash: ipfsHash });
        });
    });
    return {};
});
export default { execute, name: 'resolveEntriesIpfsHash', hasStream: true };
//# sourceMappingURL=resolve-entries-ipfs-hash.js.map