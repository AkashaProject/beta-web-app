import BaseService from './base-service';
import { channel } from 'services';


/**
 * Default managed channels: [startService, stopService, status]
 */
class GethService extends BaseService {
    constructor () {
        super();
        this.clientManager = channel.instance.client.geth.manager;
        this.gethLoggerInterval = null;
    }

    /**
     * sends start Geth command to main process w/o options
     * @param {object} options Optional params
     * @return promise
     */
    start = ({ options = {}, onError = () => {}, onSuccess }) => {
        const serverChannel = channel.instance.server.geth.startService;
        const clientChannel = channel.instance.client.geth.startService;
        const gethOptions = {};

        Object.keys(options).forEach((key) => {
            if (key !== 'name' && options[key] !== null && options[key] !== false) {
                gethOptions[key] = options[key];
            }
        });

        this.registerListener(
            clientChannel,
            this.createListener(onError, onSuccess, clientChannel.channelName)
        );
        serverChannel.send(gethOptions);
    };

    /**
     * Register stop geth listener
     */
    registerStopListener ({ onError = () => {}, onSuccess }) {
        const clientChannel = channel.instance.client.geth.stopService;
        this.registerListener(
            clientChannel,
            this.createListener(onError, onSuccess, clientChannel.channelName)
        );
    }

    /**
     * Stop Geth process
     */
    stop = ({ options = {} }) => {
        const serverChannel = channel.instance.server.geth.stopService;
        serverChannel.send(options);
    }
    /**
     * Restart Geth
     * @params timer? <Number> milliseconds to wait before starting again
     */
    restart = ({ options = { timer: 6000 }, onError = () => {}, onSuccess }) => {
        const serverChannel = channel.instance.server.geth.restartService;
        const clientChannel = channel.instance.client.geth.restartService;

        return this.openChannel({
            clientManager: this.clientManager,
            serverChannel,
            clientChannel,
            listenerCb: this.createListener(onError, onSuccess, clientChannel.channelName)
        }, () =>
                serverChannel.send(options)
        );
    };
    /**
     *  Retrieve Geth logs
     */
    getLogs = ({ options = {}, onError = () => {}, onSuccess }) => {
        const serverChannel = channel.instance.server.geth.logs;
        const clientChannel = channel.instance.client.geth.logs;

        this.openChannel({
            clientManager: this.clientManager,
            serverChannel,
            clientChannel,
            listenerCb: this.createListener(onError, onSuccess, clientChannel.channelName)
        }, () => {
            this.gethLoggerInterval = setInterval(() => {
                serverChannel.send(options);
            }, 2000);
        });
    };

    stopLogger = () => {
        const serverChannel = channel.instance.server.geth.logs;
        const clientChannel = channel.instance.client.geth.logs;

        clearInterval(this.gethLoggerInterval);
        this.closeChannel(serverChannel, clientChannel);
    };

    /**
     *  Get current status of geth;
     *  @response data = {
     *      downloading?: boolean;
     *      starting?: boolean;
     *      api: boolean;
     *      process: boolean;
     *      started?: boolean;
     *      stopped?: boolean;
     *  }
     */
    getStatus = ({ options = {}, onError = () => {}, onSuccess }) => {
        const serverChannel = channel.instance.server.geth.status;
        const clientChannel = channel.instance.client.geth.status;

        this.registerListener(
            clientChannel,
            this.createListener(onError, onSuccess, clientChannel.channelName)
        );
        serverChannel.send(options);
    };
    /**
     * Retrieve options used by geth
     */
    getOptions = ({ options = {}, onError = () => {}, onSuccess }) => {
        const clientChannel = channel.instance.client.geth.options;
        const serverChannel = channel.instance.server.geth.options;
        return this.openChannel({
            clientManager: this.clientManager,
            serverChannel,
            clientChannel,
            listenerCb: this.createListener(onError, onSuccess, clientChannel.channelName)
        }, () => {
            serverChannel.send(options);
        });
    };
    /**
     * Update sync status sent by main process
     * @param {function} cb callback
     */
    getSyncStatus = ({ options = {}, onError = () => {}, onSuccess }) => {
        const clientChannel = channel.instance.client.geth.syncStatus;
        const serverChannel = channel.instance.server.geth.syncStatus;

        this.openChannel({
            clientManager: this.clientManager,
            serverChannel,
            clientChannel,
            listenerCb: this.createListener(onError, onSuccess, clientChannel.channelName)
        }, () =>
            serverChannel.send(options)
        );
    };
    closeSyncChannel = () => {
        // this.closeChannel(
        //     this.serverManager,
        //     channel.instance.server.geth.syncStatus,
        //     channel.instance.client.geth.syncStatus
        // );
    }
}

export { GethService };
