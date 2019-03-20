"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const oidc_auth_1 = require("./oidc_auth");
describe('OIDCAuth', () => {
    const auth = new oidc_auth_1.OpenIDConnectAuth();
    it('should be true for oidc user', () => {
        const user = {
            authProvider: {
                name: 'oidc',
            },
        };
        chai_1.expect(auth.isAuthProvider(user)).to.equal(true);
    });
    it('should be false for other user', () => {
        const user = {
            authProvider: {
                name: 'azure',
            },
        };
        chai_1.expect(auth.isAuthProvider(user)).to.equal(false);
    });
    it('should be false for null user.authProvider', () => {
        const user = {};
        chai_1.expect(auth.isAuthProvider(user)).to.equal(false);
    });
    it('get a token if present', () => {
        const token = 'some token';
        const user = {
            authProvider: {
                name: 'oidc',
                config: {
                    'id-token': token,
                },
            },
        };
        chai_1.expect(auth.getToken(user)).to.equal(`Bearer ${token}`);
    });
    it('get null if token missing', () => {
        const user = {
            authProvider: {
                name: 'oidc',
                config: {},
            },
        };
        chai_1.expect(auth.getToken(user)).to.equal(null);
    });
});
//# sourceMappingURL=oidc_auth_test.js.map