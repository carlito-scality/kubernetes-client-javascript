"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ListWatch {
    constructor(path, watch, listFn) {
        this.path = path;
        this.watch = watch;
        this.listFn = listFn;
        this.objects = [];
        this.indexCache = {};
        this.watch = watch;
        this.listFn = listFn;
        this.doneHandler(null);
    }
    get(name, namespace) {
        return this.objects.find((obj) => {
            return obj.metadata.name === name && (!namespace || obj.metadata.namespace === namespace);
        });
    }
    list(namespace) {
        if (!namespace) {
            return this.objects;
        }
        return this.indexCache[namespace];
    }
    doneHandler(err) {
        this.listFn((result) => {
            this.objects = result;
            for (const elt of this.objects) {
                this.indexObj(elt);
            }
            this.watch.watch(this.path, {}, this.watchHandler.bind(this), this.doneHandler.bind(this));
        });
    }
    indexObj(obj) {
        let namespaceList = this.indexCache[obj.metadata.namespace];
        if (!namespaceList) {
            namespaceList = [];
            this.indexCache[obj.metadata.namespace] = namespaceList;
        }
        addOrUpdateObject(namespaceList, obj);
    }
    watchHandler(phase, obj) {
        switch (phase) {
            case 'ADDED':
            case 'MODIFIED':
                addOrUpdateObject(this.objects, obj);
                if (obj.metadata.namespace) {
                    this.indexObj(obj);
                }
                break;
            case 'DELETED':
                deleteObject(this.objects, obj);
                if (obj.metadata.namespace) {
                    const namespaceList = this.indexCache[obj.metadata.namespace];
                    if (namespaceList) {
                        deleteObject(namespaceList, obj);
                    }
                }
                break;
        }
    }
}
exports.ListWatch = ListWatch;
// Only public for testing.
function addOrUpdateObject(objects, obj) {
    const ix = findKubernetesObject(objects, obj);
    if (ix === -1) {
        objects.push(obj);
    }
    else {
        objects[ix] = obj;
    }
}
exports.addOrUpdateObject = addOrUpdateObject;
function isSameObject(o1, o2) {
    return o1.metadata.name === o2.metadata.name && o1.metadata.namespace === o2.metadata.namespace;
}
function findKubernetesObject(objects, obj) {
    return objects.findIndex((elt) => {
        return isSameObject(elt, obj);
    });
}
// Public for testing.
function deleteObject(objects, obj) {
    const ix = findKubernetesObject(objects, obj);
    if (ix !== -1) {
        objects.splice(ix, 1);
    }
}
exports.deleteObject = deleteObject;
//# sourceMappingURL=cache.js.map