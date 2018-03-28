import * as Promise from 'bluebird';
import contracts from '../../contracts/index';
import schema from '../utils/jsonschema';
import { profileAddress } from '../profile/helpers';
import queue from './queue';
import { web3Api } from '../../services';


const watchDonate = {
    'id': '/watchDonate',
    'type': 'object',
    'properties': {
        'akashaId': { 'type': 'string' },
        'ethAddress': { 'type': 'string', 'format': 'address' },
        'fromBlock': { 'type': 'number' }
    }
};
const EVENT_TYPE = 'DONATION_EVENT';
export const execute = Promise.coroutine(function* (data: { ethAddress?: string, akashaId?: string, fromBlock: number }, cb) {

    const v = new schema.Validator();
    v.validate(data, watchDonate, { throwError: true });
    const ethAddress = yield profileAddress(data);

    const donateEvent = contracts.createWatcher(contracts.instance.AETH.Donate, { to: ethAddress }, data.fromBlock);

    donateEvent.watch((err, ev) => {
        if (!err) {
            queue.push(
                cb,
                {
                    type: EVENT_TYPE,
                    payload: {
                        from: ev.args.from,
                        aeth: (web3Api.instance.fromWei(ev.args.aeth, 'ether')).toFormat(5),
                        eth: (web3Api.instance.fromWei(ev.args.eth, 'ether')).toFormat(5),
                        message: ev.args.extraData
                    },
                    blockNumber: ev.blockNumber
                }
            );
        }
    });

    return donateEvent;
});
