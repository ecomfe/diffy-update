# diffy-update

本库实现了一个更新对象的函数，同时随更新过程输出新旧对象的差异结构

## 为何要开发这个库

在当前的前端形势下，不可变（Immutable）的概念开始出现在开发者的视野中，以不可变作为第一考虑的设计和实现会让程序普遍拥有更好的可维护性

而在不可变的前提下，我们不能对一个对象的属性进行直接的操作（赋值、修改、删除等），因此更新一个对象变得复杂：

```javascript
let newObject = clone(source);
newObject.foo = 1;
```

如果我们需要修改更深层次的属性，则会变得更为复杂：

```javascript
let newObject = clone(source);
newObject.foo = clone(newObject.foo);
newObject.foo.bar = 1;
// 有其它属性都需要依次操作
```

这是相当麻烦的，每次更新都会需要大量的代码，因此偷懒的话我们会用深克隆来搞定这事：

```javascript
let newObject = deepClone(source);
newObject.foo.bar = 1;
// 其它修改
```

但是深克隆存在一些严重的问题：

1. 性能不好，我们只更新一层属性的情况下，原对象的n层属性都要经过克隆操作，有大量无谓的遍历和对象创建开销
2. 遇到环引用无法处理


基于此，社区上出现了一些用声明式的指令更新对象的辅助库，比如[React Immutability Helpers](https://facebook.github.io/react/docs/update.html)，这些库封装了上面的逻辑，且选择了效率最优（仅复制未更新的属性，不需要深克隆）的方案

但是随之而来的一个问题是，当我们更新完一个对象，如何知道更新了什么？如果我们所有的针对更新的操作都在更新后立即进行，那么在编码时我们可以人为地基于更新指令进行：

```javascript
let newObject = update(source, {foo: {$set: 1}});
view.globalDatasource = newObject;
view.updateUserInterfaceOfFoo();
```

但现实中几乎不可能存在如此理想的场景，更多的时候我们仅仅拿到一个未知来源的`newObject`。如果根据`newObject`强制进行界面的完全刷新，自然会导致性能的损失。我们更希望找到对象更新前后的差异，可以针对性地进行后续的操作，因此就会引入`diff`这一概念，比如使用[flibit/diff](https://github.com/flitbit/diff)：

```javascript
let differences = diff(oldObject, newObject);
for (let node of differences) {
    this.updateForPath(node.path, node.rhs);
}
```

但是值得注意的是，差异分析本身是一个基于两个对象的深度遍历的操作，它是耗时的，在一个系统中引入这样一个环节必然会损失掉一定的性能

基于以上的原因，我们更希望有这样的一个库，它可以提供基本的对象更新的功能，且在更新的同时实时计算出对象前后的差异。因为更新的过程中知道更新的指令，所以可以在没有额外的遍历损耗的情况下直接得到差异，`diffy-update`库正是以此为目标而诞生的

## 使用

### 前置环境

`diffy-update`完全由ES2015+编写，如果环境无法满足要求，则在使用前需要添加对应的`polyfill`或`shim`，并使用[babel](http://babeljs.io)进行编译，全局至少要包含`Object.entries`函数的实现

针对`babel`除[es2015 preset](http://babeljs.io/docs/plugins/preset-es2015/)外，至少需要[function bind](http://babeljs.io/docs/plugins/transform-function-bind/)插件得以正常工作

### 基本场景

仅`withDiff`函数会提供差异对象：

```javascript
import {withDiff, isDiffNode} from 'diffy-update';

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

console.log(isDiffNode(diff.name.firstName));
// true

console.log(diff);
// {
//     name: {
//         firstName: {
//             changeType: 'change',
//             oldValue: 'Navy',
//             newValue: 'Pretty'
//         }
//     }
// }
```

当前版本仅实现了针对基本类型和对象的差异计算，针对数组的差异计算将在后续版本中提供

差异对象的结构与输入的`source`对象相同，其中如果有一个属性有被修改，则该属性会变为一个“差异节点”，使用`isDiffNode`进行判断即可，如果一个属性为差异节点，则会仅包含以下属性：

- `changeType`表示修改的类型，值为`"add"`、`"remove"`或者`"change"`
- `oldValue`表示修改前的值，如果`changeType`为`"add"`则值恒定为`undefined`
- `newValue`表示修改后的值，如果`changeType`为`"remove"`则值恒定为`undefined`

### 快捷方式

`update`模块的默认导出是`withDiff`函数的快捷方式，仅返回更新后的对象，不提供差异对象，可用于函数内部更新对象等常用场景

除此之外，本库还提供了一系列快捷函数，如`set`、`push`、`unshift`、`merge`、`defaults`等，这些函数可用于快速更新对象的某个属性，可以通过API文档进行查阅

### 差异合并

在一个完整的应用模型中，如果每一次对数据的操作都映射为后续的操作（如UI更新），则可能出现一些不可预期的问题：

- 可能因为频繁的UI更新导致性能的问题
- 如果存在一些循环的变化，则可能进入死循环

所以在成熟的应用中，我们通常会在进行若干次数据变化后，根据整体的变化来进行后续的逻辑，这就要求每次变化产生的差异可以相互合并，生成一个最终的差异以供后续使用

`diffy-update`库提供了`merge`模块来支持差异的合并，我们可以使用`mergeDiff`函数将多次`withDiff`生成的差异进行合并：

```javascript
import {withDiff} from 'diffy-update/update';
import {mergeDiff} from 'diffy-upadte/merge';

let source = {
    age: 21,
    name: {
        firstName: 'Gray',
        lastName: 'Zhang'
    }
};
let [ageUpdated, diffOnAge] = withDiff(source, {age: {$set: 22}});
let [nameUpdated, diffOnName] = withDiff(ageUpdated, {name: {firstName: {$set: 'Pretty'}}});

console.log(nameUpdated);
// {
//     age: 22,
//     name: {
//         firstName: 'Pretty',
//         lastName: 'Zhang'
//     }
// }

console.log(diffOnAge);
// {
//     age: {
//         changeType: 'change',
//         oldValue: 21,
//         newValue: 22
//     }
// }

console.log(diffOnName);
// {
//     name: {
//         firstName: {
//             changeType: 'change',
//             oldValue: 'Gray',
//             newValue: 'Pretty'
//         }
//     }
// }

// 注意要提供最先和最后的对象，即`source`和`nameUpdated`，中间过程产生的`ageUpdated`没用
let totalDiff = mergeDiff(diffOnAge, diffOnName, source, nameUpdated);
console.log(totalDiff);
// {
//     age: {
//         changeType: 'change',
//         oldValue: 21,
//         newValue: 22
//     },
//     name: {
//         firstName: {
//             changeType: 'change',
//             oldValue: 'Gray',
//             newValue: 'Pretty'
//         }
//     }
// }
```

差异的合并是智能的，它包括：

- 同一个属性发生多次变化，则会合并成一个，根据变化的类型生成新的变化，如`"add"`后再进行`"change"`则会合并为一个`"add"`
- 如果变化导致最终属性值前后相同，则该差异会被丢弃，如先`"add"`后`"remove"`，或者多次`"change"`导致最终值并没有变化
- 一个属性变化后，其子属性再变化，或者反之，也同样会进行合并，如`foo.bar`变化后再修改`foo`，则会变成`foo`的整体变化

需要注意的是，差异合并本身是一个消耗资源的计算工作（虽然很快），因此在实现上并不追求输出最小的差异集，而是在性能和正确性之间取得一个折衷，在可接受的速度之下输出相对优化后的差异结果

## 应用场景

在使用`diffy-update`后，我们可以制作一个非常简易的UI-数据绑定模型，其基本逻辑为：

1. 在UI中可以声明某一区块与数据对象中某个属性的绑定关系
2. 打开一个异步操作，使用`setImmediate`等函数完成
3. 允许用户通过`withDiff`方法更新数据，同时记录最初的数据对象、每一次的差异以及更新后的新数据对象
4. 在异步回调后，将收集的差异，配合原数据对象、新数据对象，使用`mergeDiff`生成最终的差异对象
5. 通过遍历差异对象，仅更新UI中绑定了产生变化的属性部分

当然一个完整的模型需要更多的细节考虑，但大致思路如上所示，`diffy-update`在这一模型中作为底层的工具库，可以提供非常大的帮助

## API文档


```shell
npm i
npm run doc
open doc/api/index.html
```

## 更新历史

### 2.0.0

- 差异节点中的`$change`属性改名为`changeType`，现在应该使用`isDiffNode`函数判断一个对象是否为差异节点
- 文档更新为简体中文

### 2.1.0

- `update`模块下的`isDiffNode`函数已标记为废弃，请使用`diffNode`模块下的该函数
- 增加了差异合并的相关函数
