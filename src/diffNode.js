/**
 * EMC (EFE Model & Collection)
 * Copyright 2016 Baidu Inc. All rights reserved.
 *
 * @file diff node utilities
 * @author otakustay
 */

const IS_DIFF_NODE = Symbol('isDiffNode');

/**
 * 判断一个对象是否为差异节点
 *
 * 如果一个对象为差异节点，那么它有且仅有以下属性：
 *
 * - `changeType`表示修改的类型，值为`"add"`、`"remove"`或者`"change"`
 * - `oldValue`表示修改前的值，如果`changeType`为`"add"`则值恒定为`undefined`
 * - `newValue`表示修改后的值，如果`changeType`为`"remove"`则值恒定为`undefined`
 *
 * @param {*} node 用于判断的节点
 * @return {boolean}
 */
export function isDiffNode(node) {
    return node.hasOwnProperty(IS_DIFF_NODE);
}

/**
 * 创建一个差异节点
 *
 * 通常此函数由`withDiff`或`mergeDiff`等函数调用得到差异节点，大部分场景下开发者并不需要自行创建差异节点
 *
 * 本函数依赖外部参数正确，并不会对参数间的关系进行检测，需要在调用时保证如`changeType`为`"add"`时，`oldValue`为`undefined`等约束
 *
 * @param {string} changeType 变化的各类，可以为`"add"`、`"remove"`或`"change"`
 * @param {*} oldValue 原值
 * @param {*} newValue 新值
 * @return {Object} 一个差异节点
 */
export function createDiffNode(changeType, oldValue, newValue) {
    return {
        [IS_DIFF_NODE]: true,
        changeType: changeType,
        oldValue: oldValue,
        newValue: newValue
    };
}
