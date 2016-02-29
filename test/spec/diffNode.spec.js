import {isDiffNode, createDiffNode} from 'diffNode';

describe('createDiffNode method', () => {
    it('should create an object with expected properties', () => {
        let changeType = 'change';
        let oldValue = 1;
        let newValue = 2;
        let node = createDiffNode(changeType, oldValue, newValue);
        expect(node).toEqual({changeType, oldValue, newValue});
    });
});

describe('isDiffNode method', () => {
    it('should pass if an object is created from `createDiffNode` function', () => {
        let node = createDiffNode('change', 1, 2);
        expect(isDiffNode(node)).toBe(true);
    });

    it('should fail if an object is not created from `createDiffNode` function', () => {
        let node = {changeType: 'change', oldValue: 1, newValue: 2};
        expect(isDiffNode(node)).toBe(false);
    })
});
