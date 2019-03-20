import { KubernetesObject } from './types';
import { Watch } from './watch';
export interface ObjectCache<T> {
    get(name: string, namespace?: string): T | undefined;
    list(namespace?: string): ReadonlyArray<T>;
}
export declare type ListCallback<T extends KubernetesObject> = (list: T[]) => void;
export declare class ListWatch<T extends KubernetesObject> implements ObjectCache<T> {
    private readonly path;
    private readonly watch;
    private readonly listFn;
    private objects;
    private readonly indexCache;
    constructor(path: string, watch: Watch, listFn: (callback: ListCallback<T>) => void);
    get(name: string, namespace?: string): T | undefined;
    list(namespace?: string | undefined): ReadonlyArray<T>;
    private doneHandler;
    private indexObj;
    private watchHandler;
}
export declare function addOrUpdateObject<T extends KubernetesObject>(objects: T[], obj: T): void;
export declare function deleteObject<T extends KubernetesObject>(objects: T[], obj: T): void;
