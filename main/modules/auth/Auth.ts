import { Cipher, createCipher, createDecipher, Decipher, randomBytes } from 'crypto';
import { addHexPrefix, hashPersonalMessage, stripHexPrefix, unpad } from 'ethereumjs-util';
import contracts from '../../contracts/index';
import * as Promise from 'bluebird';
import { web3Api } from '../../services';

export const randomBytesAsync = Promise.promisify(randomBytes);

export class Auth {
    private _decipher: Decipher;
    private _cipher: Cipher;
    private _session: { address: string, expiration: Date, sig: string };
    private _task;
    private _key;

    public constructor(key = 'session-key') {
        this._key = key;
    }

    /**
     *
     * @param token
     * @returns {boolean}
     */
    public regenSession(token: string) {
        let session;
        const data = localStorage.getItem(this._key);
        if (!data) {
            return false;
        }

        this._generateDecipher(stripHexPrefix(token));
        try {
            const sessionData = JSON.parse(data);
            if (!sessionData.hasOwnProperty('data')) {
                return false;
            }
            const sessionBuffer = Buffer.from(sessionData.data);
            const sessionDecrypted = Buffer.concat([this._decipher.update(sessionBuffer), this._decipher.final()]);
            session = JSON.parse(sessionDecrypted.toString());
            if (
                !session.hasOwnProperty('address') ||
                !session.hasOwnProperty('expiration') ||
                !session.hasOwnProperty('sig')
            ) {
                return false;
            }
            session.expiration = new Date(session.expiration);

        } catch (err) {
            session = null;
            console.error(err);
        }
        this._session = session;
        return !!this._session;
    }

    private _generateCipher(token: string) {
        this._cipher = createCipher('aes-256-ctr', token);
    }

    private _generateDecipher(token: string) {
        this._decipher = createDecipher('aes-256-ctr', token);
    }

    /**
     *
     * @param acc
     * @param pass
     * @param timer
     * @param registering
     * @returns {any}
     */
    public login(acc: string, timer: number = 30, registering = false) {

        return contracts.instance
            .registry
            .getByAddress(acc)
            .then((address: string) => {
                if (!unpad(address) && !registering) {
                    throw new Error(`eth key: ${acc} has no profile attached`);
                }
                // return gethHelper.hasKey(acc);
                return true;
            })
            .then(() => {
                return randomBytesAsync(40);
            })
            .then((buff: Buffer) => {
                const token = addHexPrefix(buff.toString('hex'));
                return this._signSession(token, acc)
                    .then((signedString: string) => {
                        const expiration = new Date();
                        const clientToken = hashPersonalMessage(buff);
                        expiration.setMinutes(expiration.getMinutes() + timer);
                        web3Api.instance.eth.defaultAccount = acc;
                        this._session = {
                            expiration,
                            address: acc,
                            sig: signedString
                        };
                        this._generateCipher(clientToken.toString('hex'));
                        localStorage.setItem(this._key,
                            JSON.stringify(
                                Buffer.concat([this._cipher.update(Buffer.from(JSON.stringify(this._session))),
                                    this._cipher.final()]
                                )
                            )
                        );
                        this._task = setTimeout(() => this._flushSession(), 1000 * 60 * timer);
                        return { token: addHexPrefix(clientToken.toString('hex')), expiration, account: acc };
                    });
            });
    }

    public logout() {
        this._flushSession();

    }

    /**
     *
     * @param token
     * @returns {boolean}
     */
    public isLogged(token: any) {
        const now = new Date();
        // console.log(token);
        if (!this._session || !token) {
            return false;
        }

        if (now > this._session.expiration) {
            return false;
        }
        return web3Api.instance
            .personal
            .ecRecoverAsync(token, this._session.sig)
            .then((address) => {
                return address === this._session.address;
            });
    }

    /**
     *
     * @private
     */
    private _flushSession() {
        this._session = null;
        clearTimeout(this._task);
        console.log('flushed session');
    }

    /**
     *
     * @param hash
     * @param account
     * @param password
     * @returns {any}
     * @private
     */
    private _signSession(hash: string, account: string) {
        // metamask bug
        // @todo: first param should be hash when solved
        return web3Api.instance.personal.signAsync(account, account);
    }

    /**
     *
     * @param data
     * @param token
     * @returns {any}
     */
    public signData(data: {}, token: string) {
        // if (!this.isLogged(token)) {
        //     throw new Error('Token is not valid');
        // }
        return web3Api.instance.eth.sendTransactionAsync(data);
    }
}

export default new Auth();