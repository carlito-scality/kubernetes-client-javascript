"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai_1 = require("chai");
const stream_buffers_1 = require("stream-buffers");
const ts_mockito_1 = require("ts-mockito");
const config_1 = require("./config");
const portforward_1 = require("./portforward");
const web_socket_handler_1 = require("./web-socket-handler");
describe('PortForward', () => {
    it('should correctly port-forward to a url', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const kc = new config_1.KubeConfig();
        const fakeWebSocket = ts_mockito_1.mock(web_socket_handler_1.WebSocketHandler);
        const portForward = new portforward_1.PortForward(kc, true, ts_mockito_1.instance(fakeWebSocket));
        const osStream = new stream_buffers_1.WritableStreamBuffer();
        const errStream = new stream_buffers_1.WritableStreamBuffer();
        const isStream = new stream_buffers_1.ReadableStreamBuffer();
        const namespace = 'somenamespace';
        const pod = 'somepod';
        const port = 8080;
        yield portForward.portForward(namespace, pod, [port], osStream, errStream, isStream);
        const path = `/api/v1/namespaces/${namespace}/pods/${pod}/portforward?ports=${port}`;
        ts_mockito_1.verify(fakeWebSocket.connect(path, null, ts_mockito_1.anyFunction())).called();
    }));
    it('should not disconnect if disconnectOnErr is false', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const kc = new config_1.KubeConfig();
        const fakeWebSocket = ts_mockito_1.mock(web_socket_handler_1.WebSocketHandler);
        const portForward = new portforward_1.PortForward(kc, false, ts_mockito_1.instance(fakeWebSocket));
        const osStream = new stream_buffers_1.WritableStreamBuffer();
        const isStream = new stream_buffers_1.ReadableStreamBuffer();
        const conn = yield portForward.portForward('ns', 'p', [8000], osStream, null, isStream);
        const [, , outputFn] = ts_mockito_1.capture(fakeWebSocket.connect).last();
        /* tslint:disable:no-unused-expression */
        chai_1.expect(outputFn).to.not.be.null;
        // this is redundant but needed for the compiler, sigh...
        if (!outputFn) {
            return;
        }
        const buffer = Buffer.alloc(1024, 10);
        // unknown stream shouldn't close the socket.
        outputFn(2, buffer);
        outputFn(0, buffer);
        // first time, drop two bytes for the port number.
        chai_1.expect(osStream.size()).to.equal(1022);
    }));
    it('should correctly port-forward streams if err is null', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const kc = new config_1.KubeConfig();
        const fakeWebSocket = ts_mockito_1.mock(web_socket_handler_1.WebSocketHandler);
        const portForward = new portforward_1.PortForward(kc, true, ts_mockito_1.instance(fakeWebSocket));
        const osStream = new stream_buffers_1.WritableStreamBuffer();
        const isStream = new stream_buffers_1.ReadableStreamBuffer();
        yield portForward.portForward('ns', 'p', [8000], osStream, null, isStream);
        const [, , outputFn] = ts_mockito_1.capture(fakeWebSocket.connect).last();
        /* tslint:disable:no-unused-expression */
        chai_1.expect(outputFn).to.not.be.null;
        // this is redundant but needed for the compiler, sigh...
        if (!outputFn) {
            return;
        }
        const buffer = Buffer.alloc(1024, 10);
        // error stream, drop two bytes for the port number.
        outputFn(1, buffer);
        // error stream is null, expect output to be dropped and nothing to change.
        chai_1.expect(osStream.size()).to.equal(0);
    }));
    it('should correctly port-forward streams', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const kc = new config_1.KubeConfig();
        const fakeWebSocket = ts_mockito_1.mock(web_socket_handler_1.WebSocketHandler);
        const portForward = new portforward_1.PortForward(kc, true, ts_mockito_1.instance(fakeWebSocket));
        const osStream = new stream_buffers_1.WritableStreamBuffer();
        const errStream = new stream_buffers_1.WritableStreamBuffer();
        const isStream = new stream_buffers_1.ReadableStreamBuffer();
        yield portForward.portForward('ns', 'p', [8000], osStream, errStream, isStream);
        const [, , outputFn] = ts_mockito_1.capture(fakeWebSocket.connect).last();
        /* tslint:disable:no-unused-expression */
        chai_1.expect(outputFn).to.not.be.null;
        // this is redundant but needed for the compiler, sigh...
        if (!outputFn) {
            return;
        }
        const buffer = Buffer.alloc(1024, 10);
        outputFn(0, buffer);
        // first time, drop two bytes for the port number.
        chai_1.expect(osStream.size()).to.equal(1022);
        outputFn(0, buffer);
        chai_1.expect(osStream.size()).to.equal(2046);
        // error stream, drop two bytes for the port number.
        outputFn(1, buffer);
        chai_1.expect(errStream.size()).to.equal(1022);
        outputFn(1, buffer);
        chai_1.expect(errStream.size()).to.equal(2046);
        // unknown stream, shouldn't change anything.
        outputFn(2, buffer);
        chai_1.expect(osStream.size()).to.equal(2046);
        chai_1.expect(errStream.size()).to.equal(2046);
    }));
    it('should throw with no ports or too many', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const kc = new config_1.KubeConfig();
        const portForward = new portforward_1.PortForward(kc);
        const osStream = new stream_buffers_1.WritableStreamBuffer();
        const isStream = new stream_buffers_1.ReadableStreamBuffer();
        try {
            yield portForward.portForward('ns', 'pod', [], osStream, osStream, isStream);
            chai_1.expect(false, 'should have thrown').to.equal(true);
        }
        catch (err) {
            chai_1.expect(err.toString()).to.equal('Error: You must provide at least one port to forward to.');
        }
        try {
            yield portForward.portForward('ns', 'pod', [1, 2], osStream, osStream, isStream);
            chai_1.expect(false, 'should have thrown').to.equal(true);
        }
        catch (err) {
            chai_1.expect(err.toString()).to.equal('Error: Only one port is currently supported for port-forward');
        }
    }));
});
//# sourceMappingURL=portforward_test.js.map