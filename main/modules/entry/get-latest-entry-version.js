import * as Promise from 'bluebird';
import contracts from '../../contracts/index';
import IpfsConnector from '@akashaproject/ipfs-js-connector';
const execute = Promise.coroutine(function* (data) {
    const entryEth = yield contracts.instance.entries.getEntry(data.entryId);
    const entryIpfs = yield IpfsConnector.getInstance().api.get(entryEth.ipfsHash);
    const version = entryIpfs.version || null;
    return { version: version };
});
export default { execute, name: 'getLatestEntryVersion' };
//# sourceMappingURL=get-latest-entry-version.js.map