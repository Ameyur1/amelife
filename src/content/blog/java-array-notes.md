---
title: "Java 数组学习笔记"
description: "从声明、初始化到常见遍历方式，整理 Java 数组的基础知识。"
date: 2026-09-24
category: "学术"
tags: ["Java", "学习"]
draft: false
featured: false
---

数组用于保存一组**类型相同**的数据。它的长度在创建后固定，适合处理数量明确、需要按索引访问的元素。

## 声明与初始化

```java
int[] scores = {88, 92, 76, 95};
String[] names = new String[3];
```

推荐把方括号写在类型后面，例如 `int[] scores`，这样更容易一眼看出变量类型。

## 遍历数组

### 使用普通 for 循环

```java
for (int i = 0; i < scores.length; i++) {
    System.out.println(scores[i]);
}
```

### 使用增强 for 循环

```java
for (int score : scores) {
    System.out.println(score);
}
```

## 常见注意点

1. 有效索引从 `0` 开始。
2. 最后一个元素的索引是 `length - 1`。
3. 越界访问会抛出 `ArrayIndexOutOfBoundsException`。

> 这是示例学习笔记，内容用于展示代码高亮、目录、列表与引用样式。
