# diffy-update

Scripts to update object or array with a diff output

Different from other object-update libraries, this module provides an extra `diff` object so that you can check which properties are modified and how they are modified later.

The `diff` object is only provided via the `withDiff` method:

```javascript
import withDiff from 'diffy-update';

let source = {
    name: {
        firstName: 'Navy',
        lastName: 'Wong'
    }
};
let [target, diff] = withDiff(source, {name: {firstName: {$set: 'Petty'}}});

console.log(target);
// {
//     name: {
//         firstName: 'Pretty',
//         lastName: 'Wong'
//     }
// }

console.log(diff);
// {
//     name: {
//         firstName: {
//             $change: 'change',
//             oldValue: 'Navy',
//             newValue: 'Pretty'
//         }
//     }
// }
```

Currently we only provide diffs for primitive values and objects, array diffing is not implement yet.

The `diff` object is an object with the same structure of `source` argument, when a property is changed, assigned or removed, it will report a `DiffNode` object with 3 properties:

- `$change` property is used to determine wether a property is a common one or a `DiffNode`, it can be either `"add"`, `"remove"` or `"change"` according to the type of modification.
- `oldValue` is the old value of property, when a property is newly assigned, `oldValue` should be `undefined`.
- `newValue` is the new value of property, when a property is removed, `newValue` should be `undefined`.

The default export of `update` module is a function behaves the same as `withDiff` function but removes the `diff` object from return value.

`diffy-update` also provieds short functions such as `set`, `push`, `unshift`, `merge`, `defaults` to quckly modify a specific property, use `npm run doc` to generate API docs, then open `doc/api/index.html` for defaults.
