"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
// Generic set of tests to verify the package is built and configured correctly
describe('package', () => {
    it('package-lock.json should match package.json', () => {
        const v1 = require('../package.json').version;
        const v2 = require('../package-lock.json').version;
        chai_1.expect(v1).to.equal(v2);
    });
});
//# sourceMappingURL=package_test.js.map