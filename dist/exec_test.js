"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai_1 = require("chai");
const WebSocket = require("isomorphic-ws");
const stream_buffers_1 = require("stream-buffers");
const ts_mockito_1 = require("ts-mockito");
const config_1 = require("./config");
const exec_1 = require("./exec");
const web_socket_handler_1 = require("./web-socket-handler");
describe('Exec', () => {
    describe('basic', () => {
        it('should correctly exec to a url', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const kc = new config_1.KubeConfig();
            const fakeWebSocket = ts_mockito_1.mock(web_socket_handler_1.WebSocketHandler);
            const exec = new exec_1.Exec(kc, ts_mockito_1.instance(fakeWebSocket));
            const osStream = new stream_buffers_1.WritableStreamBuffer();
            const errStream = new stream_buffers_1.WritableStreamBuffer();
            const isStream = new stream_buffers_1.ReadableStreamBuffer();
            const namespace = 'somenamespace';
            const pod = 'somepod';
            const container = 'container';
            const cmd = 'command';
            const cmdArray = ['command', 'arg1', 'arg2'];
            const path = `/api/v1/namespaces/${namespace}/pods/${pod}/exec`;
            yield exec.exec(namespace, pod, container, cmd, osStream, errStream, isStream, false);
            let args = `stdout=true&stderr=true&stdin=true&tty=false&command=${cmd}&container=${container}`;
            ts_mockito_1.verify(fakeWebSocket.connect(`${path}?${args}`, null, ts_mockito_1.anyFunction())).called();
            yield exec.exec(namespace, pod, container, cmd, null, errStream, isStream, false);
            args = `stdout=false&stderr=true&stdin=true&tty=false&command=${cmd}&container=${container}`;
            ts_mockito_1.verify(fakeWebSocket.connect(`${path}?${args}`, null, ts_mockito_1.anyFunction())).called();
            yield exec.exec(namespace, pod, container, cmd, null, null, isStream, false);
            args = `stdout=false&stderr=false&stdin=true&tty=false&command=${cmd}&container=${container}`;
            ts_mockito_1.verify(fakeWebSocket.connect(`${path}?${args}`, null, ts_mockito_1.anyFunction())).called();
            yield exec.exec(namespace, pod, container, cmd, null, null, null, false);
            args = `stdout=false&stderr=false&stdin=false&tty=false&command=${cmd}&container=${container}`;
            ts_mockito_1.verify(fakeWebSocket.connect(`${path}?${args}`, null, ts_mockito_1.anyFunction())).called();
            yield exec.exec(namespace, pod, container, cmd, null, errStream, isStream, true);
            args = `stdout=false&stderr=true&stdin=true&tty=true&command=${cmd}&container=${container}`;
            ts_mockito_1.verify(fakeWebSocket.connect(`${path}?${args}`, null, ts_mockito_1.anyFunction())).called();
            yield exec.exec(namespace, pod, container, cmdArray, null, errStream, isStream, true);
            // tslint:disable-next-line:max-line-length
            args = `stdout=false&stderr=true&stdin=true&tty=true&command=${cmdArray[0]}&command=${cmdArray[1]}&command=${cmdArray[2]}&container=${container}`;
            ts_mockito_1.verify(fakeWebSocket.connect(`${path}?${args}`, null, ts_mockito_1.anyFunction())).called();
        }));
        it('should correctly attach to streams', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const kc = new config_1.KubeConfig();
            const fakeWebSocket = ts_mockito_1.mock(web_socket_handler_1.WebSocketHandler);
            const exec = new exec_1.Exec(kc, ts_mockito_1.instance(fakeWebSocket));
            const osStream = new stream_buffers_1.WritableStreamBuffer();
            const errStream = new stream_buffers_1.WritableStreamBuffer();
            const isStream = new stream_buffers_1.ReadableStreamBuffer();
            const namespace = 'somenamespace';
            const pod = 'somepod';
            const container = 'somecontainer';
            const cmd = 'command';
            const path = `/api/v1/namespaces/${namespace}/pods/${pod}/exec`;
            const args = `stdout=true&stderr=true&stdin=true&tty=false&command=${cmd}&container=${container}`;
            let statusOut = {};
            const fakeConn = ts_mockito_1.mock(WebSocket);
            ts_mockito_1.when(fakeWebSocket.connect(`${path}?${args}`, null, ts_mockito_1.anyFunction())).thenResolve(fakeConn);
            yield exec.exec(namespace, pod, container, cmd, osStream, errStream, isStream, false, (status) => {
                statusOut = status;
            });
            const [, , outputFn] = ts_mockito_1.capture(fakeWebSocket.connect).last();
            /* tslint:disable:no-unused-expression */
            chai_1.expect(outputFn).to.not.be.null;
            // this is redundant but needed for the compiler, sigh...
            if (!outputFn) {
                return;
            }
            let buffer = Buffer.alloc(1024, 10);
            outputFn(web_socket_handler_1.WebSocketHandler.StdoutStream, buffer);
            chai_1.expect(osStream.size()).to.equal(1024);
            let buff = osStream.getContents();
            for (let i = 0; i < 1024; i++) {
                chai_1.expect(buff[i]).to.equal(10);
            }
            buffer = Buffer.alloc(1024, 20);
            outputFn(web_socket_handler_1.WebSocketHandler.StderrStream, buffer);
            chai_1.expect(errStream.size()).to.equal(1024);
            buff = errStream.getContents();
            for (let i = 0; i < 1024; i++) {
                chai_1.expect(buff[i]).to.equal(20);
            }
            const msg = 'This is test data';
            isStream.put(msg);
            ts_mockito_1.verify(fakeConn.send(msg));
            const statusIn = {
                code: 100,
                message: 'this is a test',
            };
            outputFn(web_socket_handler_1.WebSocketHandler.StatusStream, Buffer.from(JSON.stringify(statusIn)));
            chai_1.expect(statusOut).to.deep.equal(statusIn);
            isStream.stop();
            ts_mockito_1.verify(fakeConn.close());
        }));
    });
});
//# sourceMappingURL=exec_test.js.map