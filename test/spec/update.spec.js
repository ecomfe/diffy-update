import {default as update, withDiff, set, push, unshift, merge, defaults, invoke} from 'update';
import {isDiffNode} from 'diffNode';

function createSourceObject() {
    return {
        x: {
            y: {
                z: [1, 2, 3]
            }
        },
        foo: [1, 2, 3],
        alice: 1,
        bob: 2,
        tom: {
            jack: 1
        }
    };
}

describe('withDiff method', () => {
    it('should update a single property value', () => {
        let source = createSourceObject();
        let [result, diff] = withDiff(source, {alice: {$set: 2}});
        expect(result.alice).toBe(2);
        expect(isDiffNode(diff.alice)).toBe(true);
        expect(diff).toEqual({
            alice: {
                changeType: 'change',
                oldValue: 1,
                newValue: 2
            }
        });
        expect(source).toEqual(createSourceObject());
        result.alice = 1;
        expect(result).toEqual(source);
    });

    it('shoud update a nested property value', () => {
        let source = createSourceObject();
        let [result, diff] = withDiff(source, {tom: {jack: {$set: 2}}});
        expect(result.tom.jack).toBe(2);
        expect(isDiffNode(diff.tom.jack)).toBe(true);
        expect(diff).toEqual({
            tom: {
                jack: {
                    changeType: 'change',
                    oldValue: 1,
                    newValue: 2
                }
            }
        });
        expect(source).toEqual(createSourceObject());
        result.tom.jack = 1;
        expect(result).toEqual(source);
    });

    it('should create nested property if not exist', () => {
        let source = createSourceObject();
        let [result, diff] = withDiff(source, {a: {b: {$set: 2}}});
        expect(result.a.b).toBe(2);
        expect(isDiffNode(diff.a.b)).toBe(true);
        expect(diff).toEqual({
            a: {
                b: {
                    changeType: 'add',
                    oldValue: undefined,
                    newValue: 2
                }
            }
        });
        expect(source).toEqual(createSourceObject());
        delete result.a;
        expect(result).toEqual(source);
    });

    it('should recognize push command', () => {
        let source = createSourceObject();
        let [result, diff] = withDiff(source, {x: {y: {z: {$push: 4}}}});
        expect(result.x.y.z).toEqual([1, 2, 3, 4]);
        expect(isDiffNode(diff.x.y.z)).toBe(true);
        expect(diff).toEqual({
            x: {
                y: {
                    z: {
                        changeType: 'change',
                        oldValue: [1, 2, 3],
                        newValue: [1, 2, 3, 4]
                    }
                }
            }
        });
        expect(source).toEqual(createSourceObject());
        result.x.y.z.pop();
        expect(result).toEqual(source);
    });

    it('should recognize unshift command', () => {
        let source = createSourceObject();
        let [result, diff] = withDiff(source, {x: {y: {z: {$unshift: 0}}}});
        expect(result.x.y.z).toEqual([0, 1, 2, 3]);
        expect(isDiffNode(diff.x.y.z)).toBe(true);
        expect(diff).toEqual({
            x: {
                y: {
                    z: {
                        changeType: 'change',
                        oldValue: [1, 2, 3],
                        newValue: [0, 1, 2, 3]
                    }
                }
            }
        });
        expect(source).toEqual(createSourceObject());
        result.x.y.z.shift();
        expect(result).toEqual(source);
    });

    it('should recognize merge command', () => {
        let source = createSourceObject();
        let [result, diff] = withDiff(source, {x: {y: {$merge: {a: 1, b: 2, z: source.x.y.z}}}});
        expect(result.x.y).toEqual({a: 1, b: 2, z: [1, 2, 3]});
        expect(isDiffNode(diff.x.y.a)).toBe(true);
        expect(isDiffNode(diff.x.y.b)).toBe(true);
        expect(diff).toEqual({
            x: {
                y: {
                    a: {
                        changeType: 'add',
                        oldValue: undefined,
                        newValue: 1
                    },
                    b: {
                        changeType: 'add',
                        oldValue: undefined,
                        newValue: 2
                    }
                    // Should not have `z` in diff
                }
            }
        });
        expect(source).toEqual(createSourceObject());
    });

    it('should recognize defaults command', () => {
        let source = createSourceObject();
        let [result, diff] = withDiff(source, {x: {y: {$defaults: {a: 1, b: 2, z: 3}}}});
        expect(result.x.y).toEqual({a: 1, b: 2, z: [1, 2, 3]});
        expect(isDiffNode(diff.x.y.a)).toBe(true);
        expect(isDiffNode(diff.x.y.b)).toBe(true);
        expect(diff).toEqual({
            x: {
                y: {
                    a: {
                        changeType: 'add',
                        oldValue: undefined,
                        newValue: 1
                    },
                    b: {
                        changeType: 'add',
                        oldValue: undefined,
                        newValue: 2
                    }
                    // Should not have `z` in diff
                }
            }
        });
        expect(source).toEqual(createSourceObject());
    });

    it('should recognize invoke command', () => {
        let source = createSourceObject();
        let [result, diff] = withDiff(source, {tom: {jack: {$invoke(x) { return x * 2; }}}});
        expect(result.tom.jack).toBe(2);
        expect(isDiffNode(diff.tom.jack)).toBe(true);
        expect(diff).toEqual({
            tom: {
                jack: {
                    changeType: 'change',
                    oldValue: 1,
                    newValue: 2
                }
            }
        });
        expect(source).toEqual(createSourceObject());
    });

    it('should expose set function', () => {
        let source = createSourceObject();
        let result = set(source, ['tom', 'jack'], 2);
        expect(result.tom.jack).toBe(2);
        expect(source).toEqual(createSourceObject());
        result.tom.jack = 1;
        expect(result).toEqual(source);
    });

    it('should expose push function', () => {
        let source = createSourceObject();
        let result = push(source, ['x', 'y', 'z'], 4);
        expect(result.x.y.z).toEqual([1, 2, 3, 4]);
        expect(source).toEqual(createSourceObject());
        result.x.y.z.pop();
        expect(result).toEqual(source);
    });

    it('should expose unshift function', () => {
        let source = createSourceObject();
        let result = unshift(source, ['x', 'y', 'z'], 0);
        expect(result.x.y.z).toEqual([0, 1, 2, 3]);
        expect(source).toEqual(createSourceObject());
        result.x.y.z.shift();
        expect(result).toEqual(source);
    });

    it('should expose merge function', () => {
        let source = createSourceObject();
        let result = merge(source, ['x', 'y'], {a: 1, b: 2, z: 3});
        expect(result.x.y).toEqual({a: 1, b: 2, z: 3});
        expect(source).toEqual(createSourceObject());
    });

    it('should expose defaults function', () => {
        let source = createSourceObject();
        let result = defaults(source, ['x', 'y'], {a: 1, b: 2, z: 3});
        expect(result.x.y).toEqual({a: 1, b: 2, z: [1, 2, 3]});
        expect(source).toEqual(createSourceObject());
    });

    it('should expose invoke function', () => {
        let source = createSourceObject();
        let result = invoke(source, ['tom', 'jack'], (x) => x * 2);
        expect(result.tom.jack).toBe(2);
        expect(source).toEqual(createSourceObject());
    });

    describe('run with first level command', () => {
        it('should work with $set', () => {
            let source = {};
            let [result, diff] = withDiff(source, {$set: 1});
            expect(result).toBe(1);
            expect(isDiffNode(diff)).toBe(true);
            expect(diff).toEqual({
                changeType: 'change',
                oldValue: source,
                newValue: result
            });
            expect(source).toEqual({});
        });

        it('should work with $push', () => {
            let source = [1, 2, 3];
            let [result, diff] = withDiff(source, {$push: 4});
            expect(result).toEqual([1, 2, 3, 4]);
            expect(isDiffNode(diff)).toBe(true);
            expect(diff).toEqual({
                changeType: 'change',
                oldValue: source,
                newValue: result
            });
            expect(source).toEqual([1, 2, 3]);
        });

        it('should work with $unshift', () => {
            let source = [1, 2, 3];
            let [result, diff] = withDiff(source, {$unshift: 0});
            expect(result).toEqual([0, 1, 2, 3]);
            expect(isDiffNode(diff)).toBe(true);
            expect(diff).toEqual({
                changeType: 'change',
                oldValue: source,
                newValue: result
            });
            expect(source).toEqual([1, 2, 3]);
        });

        it('should work with $merge', () => {
            let source = {foo: 1};
            let [result, diff] = withDiff(source, {$merge: {foo: 3, bar: 2}});
            expect(result).toEqual({foo: 3, bar: 2});
            expect(isDiffNode(diff.foo)).toBe(true);
            expect(isDiffNode(diff.bar)).toBe(true);
            expect(diff).toEqual({
                foo: {
                    changeType: 'change',
                    oldValue: 1,
                    newValue: 3
                },
                bar: {
                    changeType: 'add',
                    oldValue: undefined,
                    newValue: 2
                }
            });
            expect(source).toEqual({foo: 1});
        });

        it('should work with $defaults', () => {
            let source = {foo: 1};
            let [result, diff] = withDiff(source, {$defaults: {foo: 2, bar: 2}});
            expect(result).toEqual({foo: 1, bar: 2});
            expect(isDiffNode(diff.bar)).toBe(true);
            expect(diff).toEqual({
                bar: {
                    changeType: 'add',
                    oldValue: undefined,
                    newValue: 2
                }
                // Should not have `foo` in diff
            });
            expect(source).toEqual({foo: 1});
        });

        it('should work with $invoke', () => {
            let source = 1;
            let [result, diff] = withDiff(source, {$invoke(x) { return x * 2; }});
            expect(result).toEqual(2);
            expect(isDiffNode(diff)).toBe(true);
            expect(diff).toEqual({
                changeType: 'change',
                oldValue: source,
                newValue: result
            });
            expect(source).toEqual(1);
        });

        it('should not generate diff if value is not modified', () => {
            let source = createSourceObject();

            expect(withDiff(source, {$set: source})[1]).toBe(null);
            expect(withDiff(source, {$merge: source})[1]).toBe(null);
            expect(withDiff(source, {$defaults: source})[1]).toBe(null);
            expect(withDiff(source, {$invoke() { return source; }})[1]).toBe(null);

            expect(withDiff(source, {foo: {$set: source.foo}})[1]).toBe(null);
            expect(withDiff(source, {x: {y: {$merge: {z: source.x.y.z}}}})[1]).toBe(null);
        });
    });

    describe('update method', () => {
        it('should trim the `diff` object from return', () => {
            let source = createSourceObject();
            expect(update(source, {x: {$set: 1}})).toEqual({x: 1, foo: [1, 2, 3], alice: 1, bob: 2, tom: {jack: 1}});
        });
    });

    describe('shortcut function with first level command', () => {
        it('should work with $set', () => {
            let source = {};
            let result = set(source, null, 1);
            expect(result).toBe(1);
            expect(source).toEqual({});
        });

        it('should work with $push', () => {
            let source = [1, 2, 3];
            let result = push(source, null, 4);
            expect(result).toEqual([1, 2, 3, 4]);
            expect(source).toEqual([1, 2, 3]);
        });

        it('should work with $unshift', () => {
            let source = [1, 2, 3];
            let result = unshift(source, null, 0);
            expect(result).toEqual([0, 1, 2, 3]);
            expect(source).toEqual([1, 2, 3]);
        });

        it('should work with $merge', () => {
            let source = {foo: 1};
            let result = merge(source, null, {bar: 2})
            expect(result).toEqual({foo: 1, bar: 2});
            expect(source).toEqual({foo: 1});
        });

        it('should work with $defaults', () => {
            let source = {foo: 1};
            let result = defaults(source, null, {foo: 2, bar: 2});
            expect(result).toEqual({foo: 1, bar: 2});
            expect(source).toEqual({foo: 1});
        });

        it('should work with $invoke', () => {
            let source = 1;
            let result = invoke(source, null, (x) => x * 2);
            expect(result).toEqual(2);
            expect(source).toEqual(1);
        });
    });
});
