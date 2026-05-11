---
concept: "Symbolic Regression"
chinese: "符号回归"
aliases: ["symbolic regression", "符号回归"]
frequency: 3
first_seen: 2020
last_updated: 2026-04-25
related_concepts: ["Causal Reasoning", "Graph Neural Network", "Physics-Informed Machine Learning", "cosmology", "dark matter", "genetic programming", "inductive bias", "interpretable AI", "ocean eddy parameterization", "quasi-geostrophic model"]
---

# Symbolic Regression

**中文**: 符号回归

## 定义
> 定义待 LLM 综合生成。以下是相关论文的 TL;DR 摘要，可用于生成定义。

## 相关论文

- [[Discovering causal relations and equations from data]] — *Discovering causal relations and equations from data* (2023)
  > 本文系统综述了从数据中发现因果关系和物理方程的数据驱动方法，提出了因果发现与方程发现的统一分类体系，并结合地球气候科学、流体动力学和神经科学等领域的案例研究，展示了现代机器学习与领域知识结合在复杂系统理解中的巨大潜力。
- [[Benchmarking of Machine Learning Ocean Subgrid Parameterizations in an Idealized Model]] — *Benchmarking of Machine Learning Ocean Subgrid Parameterizations in an Idealized Model* (2022)
  > 本文开发了一套包含19个物理和气候学指标的评估框架，系统比较了神经网络与物理参数化方案在理想化海洋模型中的在线表现；并提出一种结合遗传编程与线性回归的符号回归算法，发现其所得显式闭合方案在分布外泛化能力上优于神经网络。
- [[Discovering Symbolic Models from Deep Learning with Inductive Biases]] — *Discovering Symbolic Models from Deep Learning* (2020)
  > 本文提出了一种从深度图神经网络中提取符号表示的通用方法，通过引入强归纳偏置使网络学习稀疏潜在表示，再结合符号回归提取显式物理方程。该方法不仅能恢复已知的物理定律，还能发现新的解析公式，且提取的符号表达式比原始神经网络具有更好的分布外泛化能力。

## 时间线

- **2020**: [[Discovering Symbolic Models from Deep Learning with Inductive Biases|Discovering Symbolic Models fr...]]
- **2022**: [[Benchmarking of Machine Learning Ocean Subgrid Parameterizations in an Idealized Model|Benchmarking of Machine Learni...]]
- **2023**: [[Discovering causal relations and equations from data|Discovering causal relations a...]]

## 相关概念

- [[wiki/concepts/Causal Reasoning|Causal Reasoning]]
- [[wiki/concepts/Graph Neural Network|Graph Neural Network]]
- [[wiki/concepts/Physics-Informed Machine Learning|Physics-Informed Machine Learning]]
- [[wiki/concepts/cosmology|cosmology]]
- [[wiki/concepts/dark matter|dark matter]]
- [[wiki/concepts/genetic programming|genetic programming]]
- [[wiki/concepts/inductive bias|inductive bias]]
- [[wiki/concepts/interpretable AI|interpretable AI]]
- [[wiki/concepts/ocean eddy parameterization|ocean eddy parameterization]]
- [[wiki/concepts/quasi-geostrophic model|quasi-geostrophic model]]

## 动态查询
```dataview
TABLE year, title FROM "papers" WHERE contains(canonical_concepts, "Symbolic Regression") SORT year DESC
```
