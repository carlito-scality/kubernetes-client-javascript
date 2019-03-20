"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai_1 = require("chai");
const mock = tslib_1.__importStar(require("ts-mockito"));
const cache_1 = require("./cache");
const watch_1 = require("./watch");
describe('ListWatchCache', () => {
    it('should perform basic caching', () => {
        const fakeWatch = mock.mock(watch_1.Watch);
        const list = [
            {
                metadata: {
                    name: 'name1',
                },
            },
            {
                metadata: {
                    name: 'name2',
                },
            },
        ];
        const listFn = (callback) => {
            callback(list);
        };
        const cache = new cache_1.ListWatch('/some/path', mock.instance(fakeWatch), listFn);
        const [pathOut, , watchHandler] = mock.capture(fakeWatch.watch).last();
        chai_1.expect(pathOut).to.equal('/some/path');
        chai_1.expect(cache.list()).to.deep.equal(list);
        chai_1.expect(cache.get('name1')).to.equal(list[0]);
        chai_1.expect(cache.get('name2')).to.equal(list[1]);
        watchHandler('ADDED', {
            metadata: {
                name: 'name3',
            },
        });
        chai_1.expect(cache.list().length).to.equal(3);
        chai_1.expect(cache.get('name3')).to.not.equal(null);
        watchHandler('MODIFIED', {
            metadata: {
                name: 'name3',
                resourceVersion: 'baz',
            },
        });
        chai_1.expect(cache.list().length).to.equal(3);
        const obj3 = cache.get('name3');
        chai_1.expect(obj3).to.not.equal(null);
        if (obj3) {
            chai_1.expect(obj3.metadata.name).to.equal('name3');
            chai_1.expect(obj3.metadata.resourceVersion).to.equal('baz');
        }
        watchHandler('DELETED', {
            metadata: {
                name: 'name2',
            },
        });
        chai_1.expect(cache.list().length).to.equal(2);
        chai_1.expect(cache.get('name2')).to.equal(undefined);
    });
    it('should perform namespace caching', () => {
        const fakeWatch = mock.mock(watch_1.Watch);
        const list = [
            {
                metadata: {
                    name: 'name1',
                    namespace: 'ns1',
                },
            },
            {
                metadata: {
                    name: 'name2',
                    namespace: 'ns2',
                },
            },
        ];
        const listFn = (callback) => {
            callback(list);
        };
        const cache = new cache_1.ListWatch('/some/path', mock.instance(fakeWatch), listFn);
        const [pathOut, , watchHandler] = mock.capture(fakeWatch.watch).last();
        chai_1.expect(pathOut).to.equal('/some/path');
        chai_1.expect(cache.list()).to.deep.equal(list);
        chai_1.expect(cache.get('name1')).to.equal(list[0]);
        chai_1.expect(cache.get('name2')).to.equal(list[1]);
        chai_1.expect(cache.list('ns1').length).to.equal(1);
        chai_1.expect(cache.list('ns1')[0].metadata.name).to.equal('name1');
        chai_1.expect(cache.list('ns2').length).to.equal(1);
        chai_1.expect(cache.list('ns2')[0].metadata.name).to.equal('name2');
        watchHandler('ADDED', {
            metadata: {
                name: 'name3',
                namespace: 'ns3',
            },
        });
        chai_1.expect(cache.list().length).to.equal(3);
        chai_1.expect(cache.get('name3', 'ns3')).to.not.equal(null);
        watchHandler('MODIFIED', {
            metadata: {
                name: 'name3',
                namespace: 'ns3',
                resourceVersion: 'baz',
            },
        });
        chai_1.expect(cache.list().length).to.equal(3);
        const obj3 = cache.get('name3', 'ns3');
        chai_1.expect(obj3).to.not.equal(null);
        if (obj3) {
            chai_1.expect(obj3.metadata.name).to.equal('name3');
            chai_1.expect(obj3.metadata.resourceVersion).to.equal('baz');
        }
        watchHandler('DELETED', {
            metadata: {
                name: 'name2',
                namespace: 'other-ns',
            },
        });
        chai_1.expect(cache.list().length).to.equal(3);
        chai_1.expect(cache.get('name2')).to.not.equal(null);
        watchHandler('DELETED', {
            metadata: {
                name: 'name2',
                namespace: 'ns2',
            },
        });
        chai_1.expect(cache.list().length).to.equal(2);
        chai_1.expect(cache.list('ns2').length).to.equal(0);
        chai_1.expect(cache.get('name2', 'ns2')).to.equal(undefined);
    });
    it('should delete an object correctly', () => {
        const list = [
            {
                metadata: {
                    name: 'name1',
                    namespace: 'ns1',
                },
            },
            {
                metadata: {
                    name: 'name2',
                    namespace: 'ns2',
                },
            },
        ];
        cache_1.deleteObject(list, {
            metadata: {
                name: 'other',
                namespace: 'ns1',
            },
        });
        chai_1.expect(list.length).to.equal(2);
        cache_1.deleteObject(list, {
            metadata: {
                name: 'name1',
                namespace: 'ns2',
            },
        });
        chai_1.expect(list.length).to.equal(2);
        cache_1.deleteObject(list, {
            metadata: {
                name: 'name1',
                namespace: 'ns1',
            },
        });
        chai_1.expect(list.length).to.equal(1);
    });
});
//# sourceMappingURL=cache_test.js.map