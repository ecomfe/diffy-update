/**
 * EMC (EFE Model & Collection)
 * Copyright 2016 Baidu Inc. All rights reserved.
 *
 * @file functions to merge diff objects
 * @author otakustay
 */

import {isDiffNode, createDiffNode} from './diffNode';

// 按照以下规则对`changeType`进行合并:
//
// - add + add -> 不可能出现
// - add + change -> add
// - add + remove -> 无变化，在前一个逻辑已经判断
// - change + add -> 不可能出现
// - change + change -> change
// - change + remove -> remove
// - remove + add -> change
// - remove + change -> 不可能出现
// - remove + remove -> 不可能出现
const CHANGE_TYPE_MAPPING = {
    'add+change': 'add',
    'add+remove': null,
    'change+change': 'change',
    'change+remove': 'remove',
    'remove+add': 'change'
};

let isEmpty = target => {
    if (target == null) {
        return true;
    }

    for (let key in target) {
        if (target.hasOwnProperty(key)) {
            return false;
        }
    }

    return true;
};

let purgeUneccessaryDiffNode = node => {
    if (isEmpty(node)) {
        return null;
    }
    if (node.changeType === 'change' && node.newValue === node.oldValue) {
        return null;
    }
    return node;
};

/**
 * 合并2个差异节点
 *
 * @param {Object} x 差异节点
 * @param {Object} y 差异节点
 * @return {Object} 合并后的差异节点，可能为`null`表示合并以后没有差异
 */
export function mergeDiffNode(x, y) {
    if (!x) {
        return y;
    }
    if (!y) {
        return x;
    }

    let changeType = CHANGE_TYPE_MAPPING[[x.changeType, y.changeType].join('+')];

    if (changeType === undefined) {
        throw new Error('Unexpected change type mapping when merge two diff nodes');
    }

    if (changeType === null) {
        return null;
    }

    let result = createDiffNode(changeType, x.oldValue, y.newValue);
    return purgeUneccessaryDiffNode(result);
}

/**
 * 合并差异对象
 *
 * 这个函数用来将多次更新的差异对象合并，但需要最初的与最后更新后的对象值
 *
 * @param {Object} stored 已经存在的差异对象
 * @param {Object} merging 需要合并的差异对象
 * @param {*} oldValue 更新前的对象的值
 * @param {*} newValue 更新后的对象的值
 * @return {Object} 合并后的差异对象
 */
export function mergeDiff(stored, merging, oldValue, newValue) {
    // 对于每个节点，将原来已经存在的称为`stored`，要合并上去的称为`merging`，以下是可能的合并情况：
    //
    // - 不存在`stored`，则使用`merging`作为值
    // - 不存在`merging`，则不需要做合并工作
    // - `stored`和`merging`均为差异节点，进行差异的合并
    // - `stored`为差异节点，`merging`为普通节点，则丢弃`merging`，更新`stored`的`newValue`
    // - `stored`为普通对象，`merging`为差异节点，则丢弃`stored`，更新`merging`的`oldValue`
    // - `stored`和`merging`均为普通对象，继续遍历属性
    //
    // 此函数无法保证计算出最小的差异对象，但在性能和复杂度上是一个比较合理的平衡点
    if (!stored) {
        return merging;
    }
    if (!merging) {
        return stored;
    }

    if (isDiffNode(stored)) {
        if (isDiffNode(merging)) {
            return mergeDiffNode(stored, merging);
        }

        stored.newValue = newValue;
        return purgeUneccessaryDiffNode(stored);
    }

    if (isDiffNode(merging)) {
        merging.oldValue = oldValue;
        return purgeUneccessaryDiffNode(merging);
    }

    for (let key of Object.keys(merging)) {
        let mergedNode = mergeDiff(
            stored[key],
            merging[key],
            // 最初的原始值可能是`null`或`undefined`，所以取属性时要进行判断
            oldValue ? oldValue[key] : undefined,
            // 如果我们要判断子属性的差异，那么新值就肯定有这个属性，不要kcej`null`或`undefined`
            newValue[key]
        );
        if (mergedNode) {
            stored[key] = mergedNode;
        }
        else {
            delete stored[key];
        }
    }

    return purgeUneccessaryDiffNode(stored);
}
