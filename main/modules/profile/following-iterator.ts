import * as Promise from 'bluebird';
import { web3Api } from '../../services';
import contracts from '../../contracts/index';
import { profileAddress } from './helpers';
import schema from '../utils/jsonschema';
import { followersIterator } from './followers-iterator';
import { uniq } from 'ramda';

/**
 * Get followed profiles of id
 * @type {Function}
 */
const execute = Promise.coroutine(function* (data: {
    lastBlock?: number, limit?: number,
    akashaId?: string, ethAddress?: string, lastIndex?: number
}) {
    const v = new schema.Validator();
    v.validate(data, followersIterator, { throwError: true });

    const collection = [];
    const address = yield profileAddress(data);
    const lastBlock = yield web3Api.instance.eth.getBlockNumberAsync();
    const toBlock = (!data.lastBlock) ? lastBlock : data.lastBlock;
    const totalFollowing = yield contracts.instance.Feed.totalFollowing(address);
    let maxResults = totalFollowing.toString() === '0' ? 0 : data.limit || 5;
    if (maxResults > totalFollowing.toNumber()) {
        maxResults = totalFollowing.toNumber();
    }
    const fetched = yield contracts.fromEvent(contracts.instance.Feed.Follow, { follower: address }, toBlock, maxResults, { lastIndex: data.lastIndex });
    for (let event of fetched.results) {
        const follows = yield contracts.instance.Feed.follows(address, event.args.followed);
        if (!follows) {
            continue;
        }

        collection.push({ ethAddress: event.args.followed });
    }
    return {
        collection: uniq(collection),
        lastBlock: fetched.fromBlock,
        lastIndex: fetched.lastIndex,
        akashaId: data.akashaId,
        limit: maxResults
    };
});

export default { execute, name: 'followingIterator' };

