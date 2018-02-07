import IpfsConnector from '@akashaproject/ipfs-js-connector';
import { bootstrap } from '../app/';
import initModules from './init-modules';
import { channel, ipfsApi, regenWeb3, web3Api } from './services';
import web3Helper from './modules/helpers/web3-helper';
import getChannels from './channels';
import contracts from './contracts';

declare const web3;

window.addEventListener('load', function () {
    let web3Local;
    if (typeof web3 !== 'undefined') {
        web3Local = regenWeb3();
    }
    console.log(web3, web3Local);
    startApp(web3Local);
});


const startApp = (web3) => {
    if (!web3) {
        return bootstrap();
    }
    web3Api.instance = web3;
    ipfsApi.instance = IpfsConnector.getInstance();
    console.time('bootstrap');
    IpfsConnector.getInstance().setOption('config',
        {
            Addresses: {
                Swarm: [
                    '/dns4/akasha.cloud/tcp/443/wss/p2p-webrtc-star'
                ],
                API: '',
                Gateway: ''
            },
            Bootstrap: [
                '/dns4/ams-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd',
                '/dns4/lon-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3',
                '/dns4/sfo-3.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM',
                '/dns4/sgp-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu',
                '/dns4/nyc-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm',
                '/dns4/nyc-2.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64',
                '/dns4/wss0.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic',
                '/dns4/wss1.bootstrap.libp2p.io/tcp/443/wss/ipfs/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6',
                '/dns4/www.akasha.online/tcp/443/wss/ipfs/QmSgTsiHrubEkLKEvdEjNtWHRasU1dUSgPfMjJpkR8KkBU',
                '/dns4/www.akasha.observer/tcp/443/wss/ipfs/QmUjM53zcSRhsA8BCK28DchCdSJCNmEU6W6jPJHiSgxwTW'
            ],
            Discovery: {
                MDNS: {
                    Enabled: false,
                    Interval: 10
                },
                webRTCStar: {
                    Enabled: true
                }
            },
            EXPERIMENTAL: {
                pubsub: true
            }
        });
    IpfsConnector.getInstance().setOption('repo', 'ipfs#akasha-beta');
    initModules();
    channel.instance = getChannels();
    console.log(channel.instance);
    // for dev only
    Object.defineProperty(window, 'Channel', { value: channel.instance });
    Object.defineProperty(window, 'ipfs', { value: IpfsConnector });
    Object.defineProperty(window, 'contracts', { value: contracts });
    // end

    web3Helper.setChannel(channel.instance.client.tx.emitMined);
    console.timeEnd('bootstrap');
    bootstrap(true);
};
