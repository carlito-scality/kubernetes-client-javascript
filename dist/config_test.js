"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const chai_1 = require("chai");
const mockfs = require("mock-fs");
const api_1 = require("./api");
const config_1 = require("./config");
const config_types_1 = require("./config_types");
const kcFileName = 'testdata/kubeconfig.yaml';
const kcNoUserFileName = 'testdata/empty-user-kubeconfig.yaml';
/* tslint:disable: no-empty */
describe('Config', () => { });
function validateFileLoad(kc) {
    // check clusters
    chai_1.expect(kc.clusters.length).to.equal(2, 'there are 2 clusters');
    const cluster1 = kc.clusters[0];
    const cluster2 = kc.clusters[1];
    chai_1.expect(cluster1.name).to.equal('cluster1');
    chai_1.expect(cluster1.caData).to.equal('Q0FEQVRB');
    chai_1.expect(cluster1.server).to.equal('http://example.com');
    chai_1.expect(cluster2.name).to.equal('cluster2');
    chai_1.expect(cluster2.caData).to.equal('Q0FEQVRBMg==');
    chai_1.expect(cluster2.server).to.equal('http://example2.com');
    chai_1.expect(cluster2.skipTLSVerify).to.equal(true);
    // check users
    chai_1.expect(kc.users.length).to.equal(2, 'there are 2 users');
    const user1 = kc.users[0];
    const user2 = kc.users[1];
    chai_1.expect(user1.name).to.equal('user1');
    chai_1.expect(user1.certData).to.equal('VVNFUl9DQURBVEE=');
    chai_1.expect(user1.keyData).to.equal('VVNFUl9DS0RBVEE=');
    chai_1.expect(user2.name).to.equal('user2');
    chai_1.expect(user2.certData).to.equal('VVNFUjJfQ0FEQVRB');
    chai_1.expect(user2.keyData).to.equal('VVNFUjJfQ0tEQVRB');
    // check contexts
    chai_1.expect(kc.contexts.length).to.equal(2, 'there are two contexts');
    const context1 = kc.contexts[0];
    const context2 = kc.contexts[1];
    chai_1.expect(context1.name).to.equal('context1');
    chai_1.expect(context1.user).to.equal('user1');
    chai_1.expect(context1.namespace).to.equal(undefined);
    chai_1.expect(context1.cluster).to.equal('cluster1');
    chai_1.expect(context2.name).to.equal('context2');
    chai_1.expect(context2.user).to.equal('user2');
    chai_1.expect(context2.namespace).to.equal('namespace2');
    chai_1.expect(context2.cluster).to.equal('cluster2');
    chai_1.expect(kc.getCurrentContext()).to.equal('context2');
}
describe('KubeConfig', () => {
    describe('findObject', () => {
        it('should find objects', () => {
            const list = [
                {
                    name: 'foo',
                    cluster: {
                        some: 'sub-object',
                    },
                    some: 'object',
                },
                {
                    name: 'bar',
                    some: 'object',
                    cluster: {
                        some: 'sub-object',
                    },
                },
            ];
            // Validate that if the named object ('cluster' in this case) is inside we pick it out
            const obj1 = config_1.findObject(list, 'foo', 'cluster');
            chai_1.expect(obj1).to.not.equal(null);
            if (obj1) {
                chai_1.expect(obj1.some).to.equal('sub-object');
            }
            // Validate that if the named object is missing, we just return the full object
            const obj2 = config_1.findObject(list, 'bar', 'context');
            chai_1.expect(obj2).to.not.equal(null);
            if (obj2) {
                chai_1.expect(obj2.some).to.equal('object');
            }
            // validate that we do the right thing if it is missing
            const obj3 = config_1.findObject(list, 'nonexistent', 'context');
            chai_1.expect(obj3).to.equal(null);
        });
    });
    describe('loadFromClusterAndUser', () => {
        it('should load from cluster and user', () => {
            const kc = new config_1.KubeConfig();
            const cluster = {
                name: 'foo',
                server: 'http://server.com',
            };
            const user = {
                name: 'my-user',
                password: 'some-password',
            };
            kc.loadFromClusterAndUser(cluster, user);
            const clusterOut = kc.getCurrentCluster();
            chai_1.expect(clusterOut).to.equal(cluster);
            const userOut = kc.getCurrentUser();
            chai_1.expect(userOut).to.equal(user);
        });
    });
    describe('clusterConstructor', () => {
        it('should load from options', () => {
            const cluster = {
                name: 'foo',
                server: 'http://server.com',
            };
            const user = {
                name: 'my-user',
                password: 'some-password',
            };
            const context = {
                name: 'my-context',
                user: user.name,
                cluster: cluster.name,
            };
            const kc = new config_1.KubeConfig();
            kc.loadFromOptions({
                clusters: [cluster],
                users: [user],
                contexts: [context],
                currentContext: context.name,
            });
            const clusterOut = kc.getCurrentCluster();
            chai_1.expect(clusterOut).to.equal(cluster);
            const userOut = kc.getCurrentUser();
            chai_1.expect(userOut).to.equal(user);
        });
    });
    describe('loadFromString', () => {
        it('should throw with a bad version', () => {
            const kc = new config_1.KubeConfig();
            chai_1.expect(() => kc.loadFromString('apiVersion: v2')).to.throw('unknown version: v2');
        });
    });
    describe('loadFromFile', () => {
        it('should load the kubeconfig file properly', () => {
            const kc = new config_1.KubeConfig();
            kc.loadFromFile(kcFileName);
            validateFileLoad(kc);
        });
        it('should fail to load a missing kubeconfig file', () => {
            // TODO: make the error check work
            // let kc = new KubeConfig();
            // expect(kc.loadFromFile("missing.yaml")).to.throw();
        });
    });
    describe('loadEmptyUser', () => {
        it('should load a kubeconfig with an empty user', () => {
            const kc = new config_1.KubeConfig();
            kc.loadFromFile(kcNoUserFileName);
        });
    });
    describe('applyHTTPSOptions', () => {
        it('should apply cert configs', () => {
            const kc = new config_1.KubeConfig();
            kc.loadFromFile(kcFileName);
            const opts = {};
            kc.applytoHTTPSOptions(opts);
            chai_1.expect(opts).to.deep.equal({
                ca: new Buffer('CADATA2', 'utf-8'),
                cert: new Buffer('USER2_CADATA', 'utf-8'),
                key: new Buffer('USER2_CKDATA', 'utf-8'),
                rejectUnauthorized: false,
            });
        });
    });
    describe('loadClusterConfigObjects', () => {
        it('should fail if name is missing from cluster', () => {
            chai_1.expect(() => {
                config_types_1.newClusters([
                    {
                        name: 'some-cluster',
                        cluster: {
                            server: 'some.server.com',
                        },
                    },
                    {
                        foo: 'bar',
                    },
                ]);
            }).to.throw('clusters[1].name is missing');
        });
        it('should fail if cluster is missing from cluster', () => {
            chai_1.expect(() => {
                config_types_1.newClusters([
                    {
                        name: 'some-cluster',
                        cluster: {
                            server: 'some.server.com',
                        },
                    },
                    {
                        name: 'bar',
                    },
                ]);
            }).to.throw('clusters[1].cluster is missing');
        });
        it('should fail if cluster.server is missing from cluster', () => {
            chai_1.expect(() => {
                config_types_1.newClusters([
                    {
                        name: 'some-cluster',
                        cluster: {
                            server: 'some.server.com',
                        },
                    },
                    {
                        name: 'bar',
                        cluster: {},
                    },
                ]);
            }).to.throw('clusters[1].cluster.server is missing');
        });
    });
    describe('loadUserConfigObjects', () => {
        it('should fail if name is missing from user', () => {
            chai_1.expect(() => {
                config_types_1.newUsers([
                    {
                        name: 'some-user',
                        user: {},
                    },
                    {
                        foo: 'bar',
                    },
                ]);
            }).to.throw('users[1].name is missing');
        });
        it('should load correctly with just name', () => {
            const name = 'some-name';
            const users = config_types_1.newUsers([
                {
                    name,
                },
            ]);
            chai_1.expect(name).to.equal(users[0].name);
        });
        it('should load token correctly', () => {
            const name = 'some-name';
            const token = 'token';
            const users = config_types_1.newUsers([
                {
                    name,
                    user: {
                        token: 'token',
                    },
                },
            ]);
            chai_1.expect(name).to.equal(users[0].name);
            chai_1.expect(token).to.equal(users[0].token);
        });
        it('should load token file correctly', () => {
            const name = 'some-name';
            const token = 'token-file-data';
            mockfs({
                '/path/to/fake/dir': {
                    'token.txt': token,
                },
            });
            const users = config_types_1.newUsers([
                {
                    name,
                    user: {
                        'token-file': '/path/to/fake/dir/token.txt',
                    },
                },
            ]);
            mockfs.restore();
            chai_1.expect(name).to.equal(users[0].name);
            chai_1.expect(token).to.equal(users[0].token);
        });
        it('should load extra auth stuff correctly', () => {
            const authProvider = 'authProvider';
            const certData = 'certData';
            const certFile = 'certFile';
            const keyData = 'keyData';
            const keyFile = 'keyFile';
            const password = 'password';
            const username = 'username';
            const name = 'some-name';
            const users = config_types_1.newUsers([
                {
                    name,
                    user: {
                        'auth-provider': authProvider,
                        'client-certificate-data': certData,
                        'client-certificate': certFile,
                        'client-key-data': keyData,
                        'client-key': keyFile,
                        password,
                        username,
                    },
                },
            ]);
            chai_1.expect(authProvider).to.equal(users[0].authProvider);
            chai_1.expect(certData).to.equal(users[0].certData);
            chai_1.expect(certFile).to.equal(users[0].certFile);
            chai_1.expect(keyData).to.equal(users[0].keyData);
            chai_1.expect(keyFile).to.equal(users[0].keyFile);
            chai_1.expect(password).to.equal(users[0].password);
            chai_1.expect(username).to.equal(users[0].username);
            chai_1.expect(name).to.equal(users[0].name);
        });
    });
    describe('findHome', () => {
        it('should load from HOME if present', () => {
            const currentHome = process.env.HOME;
            const expectedHome = 'foobar';
            process.env.HOME = expectedHome;
            const dir = path_1.join(process.env.HOME, '.kube');
            const arg = {};
            arg[dir] = { config: 'data' };
            mockfs(arg);
            const home = config_1.findHomeDir();
            mockfs.restore();
            process.env.HOME = currentHome;
            chai_1.expect(home).to.equal(expectedHome);
        });
    });
    describe('win32HomeDirTests', () => {
        let originalPlatform;
        const originalEnvVars = {};
        before(() => {
            originalPlatform = process.platform;
            Object.defineProperty(process, 'platform', {
                value: 'win32',
            });
            originalEnvVars.HOME = process.env.HOME;
            originalEnvVars.USERPROFILE = process.env.USERPROFILE;
            originalEnvVars.HOMEDRIVE = process.env.HOMEDRIVE;
            originalEnvVars.HOMEPATH = process.env.HOMEPATH;
            delete process.env.HOME;
            delete process.env.USERPROFILE;
            delete process.env.HOMEDRIVE;
            delete process.env.HOMEPATH;
        });
        after(() => {
            Object.defineProperty(process, 'platform', {
                value: originalPlatform,
            });
            process.env.HOME = originalEnvVars.HOME;
            process.env.USERPROFILE = originalEnvVars.USERPROFILE;
            process.env.HOMEDRIVE = originalEnvVars.HOMEDRIVE;
            process.env.HOMEPATH = originalEnvVars.HOMEPATH;
        });
        it('should return null if no home is present', () => {
            const dir = config_1.findHomeDir();
            chai_1.expect(dir).to.equal(null);
        });
        it('should load from HOMEDRIVE/HOMEPATH if present', () => {
            process.env.HOMEDRIVE = 'foo';
            process.env.HOMEPATH = 'bar';
            const dir = path_1.join(process.env.HOMEDRIVE, process.env.HOMEPATH);
            const arg = {};
            arg[dir] = { config: 'data' };
            mockfs(arg);
            const home = config_1.findHomeDir();
            mockfs.restore();
            chai_1.expect(home).to.equal(dir);
        });
        it('should load from USERPROFILE if present', () => {
            const dir = 'someplace';
            process.env.HOMEDRIVE = 'foo';
            process.env.HOMEPATH = 'bar';
            process.env.USERPROFILE = dir;
            const arg = {};
            arg[dir] = { config: 'data' };
            mockfs(arg);
            const home = config_1.findHomeDir();
            mockfs.restore();
            chai_1.expect(home).to.equal(dir);
        });
    });
    describe('loadContextConfigObjects', () => {
        it('should fail if name is missing from context', () => {
            chai_1.expect(() => {
                config_types_1.newContexts([
                    {
                        name: 'some-cluster',
                        context: {
                            cluster: 'foo',
                            user: 'bar',
                        },
                    },
                    {
                        foo: 'bar',
                    },
                ]);
            }).to.throw('contexts[1].name is missing');
        });
        it('should fail if context is missing from context', () => {
            chai_1.expect(() => {
                config_types_1.newContexts([
                    {
                        name: 'some-cluster',
                        context: {
                            cluster: 'foo',
                            user: 'bar',
                        },
                    },
                    {
                        name: 'bar',
                    },
                ]);
            }).to.throw('contexts[1].context is missing');
        });
        it('should fail if context is missing from context', () => {
            chai_1.expect(() => {
                config_types_1.newContexts([
                    {
                        name: 'some-cluster',
                        context: {
                            cluster: 'foo',
                            user: 'bar',
                        },
                    },
                    {
                        name: 'bar',
                        context: {
                            user: 'user',
                        },
                    },
                ]);
            }).to.throw('contexts[1].context.cluster is missing');
        });
    });
    describe('auth options', () => {
        it('should populate basic-auth for https', () => {
            const config = new config_1.KubeConfig();
            const user = 'user';
            const passwd = 'password';
            config.loadFromClusterAndUser({}, { username: user, password: passwd });
            const opts = {};
            config.applytoHTTPSOptions(opts);
            chai_1.expect(opts.auth).to.equal(`${user}:${passwd}`);
        });
        it('should populate options for request', () => {
            const config = new config_1.KubeConfig();
            const user = 'user';
            const passwd = 'password';
            config.loadFromClusterAndUser({
                skipTLSVerify: true,
            }, {
                username: user,
                password: passwd,
            });
            const opts = {};
            config.applyToRequest(opts);
            /* tslint:disable no-unused-expression*/
            chai_1.expect(opts.auth).to.not.be.undefined;
            if (opts.auth) {
                chai_1.expect(opts.auth.username).to.equal(user);
                chai_1.expect(opts.auth.password).to.equal(passwd);
            }
            chai_1.expect(opts.strictSSL).to.equal(false);
        });
        it('should not populate strict ssl', () => {
            const config = new config_1.KubeConfig();
            config.loadFromClusterAndUser({ skipTLSVerify: false }, {});
            const opts = {};
            config.applyToRequest(opts);
            chai_1.expect(opts.strictSSL).to.equal(undefined);
        });
        it('should populate from token', () => {
            const config = new config_1.KubeConfig();
            const token = 'token';
            config.loadFromClusterAndUser({ skipTLSVerify: false }, {
                token,
            });
            const opts = {};
            config.applyToRequest(opts);
            chai_1.expect(opts.headers).to.not.be.undefined;
            if (opts.headers) {
                chai_1.expect(opts.headers.Authorization).to.equal(`Bearer ${token}`);
            }
        });
        it('should populate from auth provider', () => {
            const config = new config_1.KubeConfig();
            const token = 'token';
            config.loadFromClusterAndUser({ skipTLSVerify: false }, {
                authProvider: {
                    name: 'azure',
                    config: {
                        'access-token': token,
                        expiry: 'Fri Aug 24 07:32:05 PDT 3018',
                    },
                },
            });
            const opts = {};
            config.applyToRequest(opts);
            chai_1.expect(opts.headers).to.not.be.undefined;
            if (opts.headers) {
                chai_1.expect(opts.headers.Authorization).to.equal(`Bearer ${token}`);
            }
            opts.headers = [];
            opts.headers.Host = 'foo.com';
            config.applyToRequest(opts);
            chai_1.expect(opts.headers.Authorization).to.equal(`Bearer ${token}`);
        });
        it('should populate from auth provider without expirty', () => {
            const config = new config_1.KubeConfig();
            const token = 'token';
            config.loadFromClusterAndUser({ skipTLSVerify: false }, {
                authProvider: {
                    name: 'azure',
                    config: {
                        'access-token': token,
                    },
                },
            });
            const opts = {};
            config.applyToRequest(opts);
            chai_1.expect(opts.headers).to.not.be.undefined;
            if (opts.headers) {
                chai_1.expect(opts.headers.Authorization).to.equal(`Bearer ${token}`);
            }
        });
        it('should populate rejectUnauthorized=false when skipTLSVerify is set', () => {
            const config = new config_1.KubeConfig();
            const token = 'token';
            config.loadFromClusterAndUser({ skipTLSVerify: true }, {
                authProvider: {
                    name: 'azure',
                    config: {
                        'access-token': token,
                    },
                },
            });
            const opts = {};
            config.applyToRequest(opts);
            chai_1.expect(opts.rejectUnauthorized).to.equal(false);
        });
        it('should not set rejectUnauthorized if skipTLSVerify is not set', () => {
            // This test is just making 100% sure we validate certs unless we explictly set
            // skipTLSVerify = true
            const config = new config_1.KubeConfig();
            const token = 'token';
            config.loadFromClusterAndUser({}, {
                authProvider: {
                    name: 'azure',
                    config: {
                        'access-token': token,
                    },
                },
            });
            const opts = {};
            config.applyToRequest(opts);
            chai_1.expect(opts.rejectUnauthorized).to.equal(undefined);
        });
        it('should throw with expired token and no cmd', () => {
            const config = new config_1.KubeConfig();
            config.loadFromClusterAndUser({ skipTLSVerify: false }, {
                authProvider: {
                    name: 'azure',
                    config: {
                        expiry: 'Aug 24 07:32:05 PDT 2017',
                    },
                },
            });
            const opts = {};
            chai_1.expect(() => config.applyToRequest(opts)).to.throw('Token is expired!');
        });
        it('should throw with bad command', () => {
            const config = new config_1.KubeConfig();
            config.loadFromClusterAndUser({ skipTLSVerify: false }, {
                authProvider: {
                    name: 'azure',
                    config: {
                        'access-token': 'token',
                        expiry: 'Aug 24 07:32:05 PDT 2017',
                        'cmd-path': 'non-existent-command',
                    },
                },
            });
            const opts = {};
            chai_1.expect(() => config.applyToRequest(opts)).to.throw(/Failed to refresh token/);
        });
        it('should exec with expired token', () => {
            const config = new config_1.KubeConfig();
            const token = 'token';
            const responseStr = `{ "token": { "accessToken": "${token}" } }`;
            config.loadFromClusterAndUser({ skipTLSVerify: false }, {
                authProvider: {
                    name: 'azure',
                    config: {
                        expiry: 'Aug 24 07:32:05 PDT 2017',
                        'cmd-path': 'echo',
                        'cmd-args': `'${responseStr}'`,
                        'token-key': '{.token.accessToken}',
                        'expiry-key': '{.token.token_expiry}',
                    },
                },
            });
            const opts = {};
            config.applyToRequest(opts);
            chai_1.expect(opts.headers).to.not.be.undefined;
            if (opts.headers) {
                chai_1.expect(opts.headers.Authorization).to.equal(`Bearer ${token}`);
            }
        });
        it('should exec without access-token', () => {
            const config = new config_1.KubeConfig();
            const token = 'token';
            const responseStr = `{ "token": { "accessToken": "${token}" } }`;
            config.loadFromClusterAndUser({ skipTLSVerify: false }, {
                authProvider: {
                    name: 'azure',
                    config: {
                        'cmd-path': 'echo',
                        'cmd-args': `'${responseStr}'`,
                        'token-key': '{.token.accessToken}',
                        'expiry-key': '{.token.token_expiry}',
                    },
                },
            });
            const opts = {};
            config.applyToRequest(opts);
            chai_1.expect(opts.headers).to.not.be.undefined;
            if (opts.headers) {
                chai_1.expect(opts.headers.Authorization).to.equal(`Bearer ${token}`);
            }
        });
        it('should exec without access-token', () => {
            const config = new config_1.KubeConfig();
            const token = 'token';
            const responseStr = `{ "token": { "accessToken": "${token}" } }`;
            config.loadFromClusterAndUser({ skipTLSVerify: false }, {
                authProvider: {
                    name: 'azure',
                    config: {
                        'cmd-path': 'echo',
                        'cmd-args': `'${responseStr}'`,
                        'token-key': '{.token.accessToken}',
                        'expiry-key': '{.token.token_expiry}',
                    },
                },
            });
            const opts = {};
            config.applyToRequest(opts);
            chai_1.expect(opts.headers).to.not.be.undefined;
            if (opts.headers) {
                chai_1.expect(opts.headers.Authorization).to.equal(`Bearer ${token}`);
            }
        });
        it('should exec with exec auth and env vars', () => {
            const config = new config_1.KubeConfig();
            const token = 'token';
            const responseStr = `'{"status": { "token": "${token}" }}'`;
            config.loadFromClusterAndUser({ skipTLSVerify: false }, {
                authProvider: {
                    name: 'exec',
                    config: {
                        exec: {
                            command: 'echo',
                            args: [`${responseStr}`],
                            env: [
                                {
                                    name: 'foo',
                                    value: 'bar',
                                },
                            ],
                        },
                    },
                },
            });
            // TODO: inject the exec command here and validate env vars?
            const opts = {};
            config.applyToRequest(opts);
            chai_1.expect(opts.headers).to.not.be.undefined;
            if (opts.headers) {
                chai_1.expect(opts.headers.Authorization).to.equal(`Bearer ${token}`);
            }
        });
        it('should exec with exec auth', () => {
            const config = new config_1.KubeConfig();
            const token = 'token';
            const responseStr = `'{
                "apiVersion": "client.authentication.k8s.io/v1beta1",
                "kind": "ExecCredential",
                "status": {
                  "token": "${token}"
                }
              }'`;
            config.loadFromClusterAndUser({ skipTLSVerify: false }, {
                authProvider: {
                    name: 'exec',
                    config: {
                        exec: {
                            command: 'echo',
                            args: [`${responseStr}`],
                        },
                    },
                },
            });
            // TODO: inject the exec command here?
            const opts = {};
            config.applyToRequest(opts);
            chai_1.expect(opts.headers).to.not.be.undefined;
            if (opts.headers) {
                chai_1.expect(opts.headers.Authorization).to.equal(`Bearer ${token}`);
            }
        });
        it('should throw with no command.', () => {
            const config = new config_1.KubeConfig();
            config.loadFromClusterAndUser({ skipTLSVerify: false }, {
                authProvider: {
                    name: 'exec',
                    config: {
                        exec: {},
                    },
                },
            });
            const opts = {};
            chai_1.expect(() => config.applyToRequest(opts)).to.throw('No command was specified for exec authProvider!');
        });
    });
    describe('loadFromDefault', () => {
        it('should load from $KUBECONFIG', () => {
            process.env.KUBECONFIG = kcFileName;
            const kc = new config_1.KubeConfig();
            kc.loadFromDefault();
            delete process.env.KUBECONFIG;
            validateFileLoad(kc);
        });
        it('should load from $HOME/.kube/config', () => {
            const currentHome = process.env.HOME;
            process.env.HOME = 'foobar';
            const data = fs_1.readFileSync(kcFileName);
            const dir = path_1.join(process.env.HOME, '.kube');
            const arg = {};
            arg[dir] = { config: data };
            mockfs(arg);
            const kc = new config_1.KubeConfig();
            kc.loadFromDefault();
            mockfs.restore();
            process.env.HOME = currentHome;
            validateFileLoad(kc);
        });
        it('should load from cluster', () => {
            const token = 'token';
            const cert = 'cert';
            mockfs({
                '/var/run/secrets/kubernetes.io/serviceaccount': {
                    'ca.crt': cert,
                    token,
                },
            });
            process.env.KUBERNETES_SERVICE_HOST = 'kubernetes';
            process.env.KUBERNETES_SERVICE_PORT = '443';
            const kc = new config_1.KubeConfig();
            kc.loadFromDefault();
            mockfs.restore();
            delete process.env.KUBERNETES_SERVICE_HOST;
            delete process.env.KUBERNETES_SERVICE_PORT;
            const cluster = kc.getCurrentCluster();
            chai_1.expect(cluster).to.not.be.null;
            if (!cluster) {
                return;
            }
            chai_1.expect(cluster.caFile).to.equal('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt');
            chai_1.expect(cluster.server).to.equal('https://kubernetes:443');
            const user = kc.getCurrentUser();
            chai_1.expect(user).to.not.be.null;
            if (user) {
                chai_1.expect(user.token).to.equal(token);
            }
        });
        it('should load from cluster with http port', () => {
            const token = 'token';
            const cert = 'cert';
            mockfs({
                '/var/run/secrets/kubernetes.io/serviceaccount': {
                    'ca.crt': cert,
                    token,
                },
            });
            process.env.KUBERNETES_SERVICE_HOST = 'kubernetes';
            process.env.KUBERNETES_SERVICE_PORT = '80';
            const kc = new config_1.KubeConfig();
            kc.loadFromDefault();
            mockfs.restore();
            delete process.env.KUBERNETES_SERVICE_HOST;
            delete process.env.KUBERNETES_SERVICE_PORT;
            const cluster = kc.getCurrentCluster();
            chai_1.expect(cluster).to.not.be.null;
            if (!cluster) {
                return;
            }
            chai_1.expect(cluster.server).to.equal('http://kubernetes:80');
        });
        it('should default to localhost', () => {
            const currentHome = process.env.HOME;
            process.env.HOME = '/non/existent';
            const kc = new config_1.KubeConfig();
            kc.loadFromDefault();
            process.env.HOME = currentHome;
            const cluster = kc.getCurrentCluster();
            chai_1.expect(cluster).to.not.be.null;
            if (!cluster) {
                return;
            }
            chai_1.expect(cluster.name).to.equal('cluster');
            chai_1.expect(cluster.server).to.equal('http://localhost:8080');
            const user = kc.getCurrentUser();
            chai_1.expect(user).to.not.be.null;
            if (user) {
                chai_1.expect(user.name).to.equal('user');
            }
        });
    });
    describe('makeAPIClient', () => {
        it('should be able to make an api client', () => {
            const kc = new config_1.KubeConfig();
            kc.loadFromFile(kcFileName);
            const client = kc.makeApiClient(api_1.Core_v1Api);
            chai_1.expect(client instanceof api_1.Core_v1Api).to.equal(true);
        });
    });
    describe('EmptyConfig', () => {
        const emptyConfig = new config_1.KubeConfig();
        it('should throw if you try to make a client', () => {
            chai_1.expect(() => emptyConfig.makeApiClient(api_1.Core_v1Api)).to.throw('No active cluster!');
        });
        it('should get a null current cluster', () => {
            chai_1.expect(emptyConfig.getCurrentCluster()).to.equal(null);
        });
        it('should get empty user', () => {
            chai_1.expect(emptyConfig.getCurrentUser()).to.equal(null);
        });
        it('should get empty cluster', () => {
            chai_1.expect(emptyConfig.getCurrentCluster()).to.equal(null);
        });
        it('should get empty context', () => {
            chai_1.expect(emptyConfig.getCurrentContext()).to.be.undefined;
        });
        it('should apply to request', () => {
            const opts = {};
            emptyConfig.applyToRequest(opts);
        });
    });
    describe('BufferOrFile', () => {
        it('should load from a file if present', () => {
            const data = 'some data for file';
            const arg = {
                config: data,
            };
            mockfs(arg);
            const inputData = config_1.bufferFromFileOrString('config');
            chai_1.expect(inputData).to.not.equal(null);
            if (inputData) {
                chai_1.expect(inputData.toString()).to.equal(data);
            }
            mockfs.restore();
        });
    });
});
//# sourceMappingURL=config_test.js.map