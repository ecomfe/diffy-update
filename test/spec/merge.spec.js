import {createDiffNode} from 'diffNode';
import {mergeDiffNode, mergeDiff} from 'merge';

describe('mergeDiffNode function', () => {
    it('should merge addition and removal', () => {
        let x = createDiffNode('add', undefined, 2);
        let y = createDiffNode('remove', 2, undefined);
        let node = mergeDiffNode(x, y);
        expect(node).toEqual(null);
    });

    it('should merge addition and change', () => {
        let x = createDiffNode('add', undefined, 2);
        let y = createDiffNode('change', 2, 3);
        let node = mergeDiffNode(x, y);
        expect(node).toEqual({changeType: 'add', oldValue: undefined, newValue: 3});
    });

    it('should merge change and removal', () => {
        let x = createDiffNode('change', 1, 2);
        let y = createDiffNode('remove', 2, undefined);
        let node = mergeDiffNode(x, y);
        expect(node).toEqual({changeType: 'remove', oldValue: 1, newValue: undefined});
    });

    it('should merge 2 changes', () => {
        let x = createDiffNode('change', 1, 2);
        let y = createDiffNode('change', 2, 3);
        let node = mergeDiffNode(x, y);
        expect(node).toEqual({changeType: 'change', oldValue: 1, newValue: 3});
    });

    it('should merge removal and addition', () => {
        let x = createDiffNode('remove', 1, undefined);
        let y = createDiffNode('add', undefined, 2);
        let node = mergeDiffNode(x, y);
        expect(node).toEqual({changeType: 'change', oldValue: 1, newValue: 2});
    });
});

describe('mergeDiff function', () => {
    it('should merge diffs from different properties', () => {
        let oldValue = {x: {a: 1, b: 2}};
        let newValue = {x: {a: 2, b: 3}};
        let x = {
            x: {
                a: createDiffNode('change', 1, 2)
            }
        };
        let y = {
            x: {
                b: createDiffNode('change', 2, 3)
            }
        };
        let node = mergeDiff(x, y, oldValue, newValue);
        expect(node).toEqual({
            x: {
                a: {
                    changeType: 'change',
                    oldValue: 1,
                    newValue: 2
                },
                b: {
                    changeType: 'change',
                    oldValue: 2,
                    newValue: 3
                }
            }
        });
    });

    it('should merge diff for an update of property after its child prpoerty updates', () => {
        let oldValue = {x: {y: {a: 1, b: 2}}};
        let newValue = {x: 1};
        let x = {
            x: {
                y: {
                    c: createDiffNode('add', undefined, 3)
                }
            }
        };
        let y = {
            x: createDiffNode('change', oldValue.x /* 没用 */, 1)
        };
        let node = mergeDiff(x, y, oldValue, newValue);
        expect(node).toEqual({
            x: {
                changeType: 'change',
                oldValue: {
                    y: {
                        a: 1,
                        b: 2
                    }
                },
                newValue: 1
            }
        });
    });

    it('should merge diff for an update of property after its parent prpoerty updates', () => {
        let oldValue = {x: {y: {a: 1, b: 2}}};
        let newValue = {x: {y: [1]}};
        let x = {
            x: createDiffNode('change', oldValue.x, {y: []})
        };
        let y = {
            x: {
                y: createDiffNode('change', {y: []} /* 没用 */, {y: [1]})
            }
        };
        let node = mergeDiff(x, y, oldValue, newValue);
        expect(node).toEqual({
            x: {
                changeType: 'change',
                oldValue: {
                    y: {
                        a: 1,
                        b: 2
                    }
                },
                newValue: {
                    y: [1]
                }
            }
        });
    });
});
