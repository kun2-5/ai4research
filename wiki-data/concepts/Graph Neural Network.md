---
concept: "Graph Neural Network"
chinese: "图神经网络"
aliases: ["GNN", "gnn", "graph neural network", "图神经网络"]
frequency: 3
first_seen: 2020
last_updated: 2026-04-25
related_concepts: ["ERA5 reanalysis", "Numerical Weather Prediction", "Physics-Informed Machine Learning", "Symbolic Regression", "Transformer", "Weather Forecasting", "cosmology", "dark matter", "inductive bias", "interpretable AI"]
---

# Graph Neural Network

**中文**: 图神经网络

## 定义
> 定义待 LLM 综合生成。以下是相关论文的 TL;DR 摘要，可用于生成定义。

## 相关论文

- [[Learning skillful medium-range global weather forecasting]] — *Learning skillful medium-range global weather forecasting* (2022)
  > 本文提出了GraphCast，一种基于图神经网络（GNN）的机器学习方法，直接从再分析数据训练，可在1分钟内以0.25°分辨率生成全球10天天气预报，在90%的1380个验证目标上显著优于最准确的确定性业务预报系统。
- [[第4章__知识图谱相关文献__1]] — *A Survey on Knowledge Graphs: Representation, Acquisition and Applications* (2021)
  > Human knowledge provides a formal understand-
ing of the world.
- [[Discovering Symbolic Models from Deep Learning with Inductive Biases]] — *Discovering Symbolic Models from Deep Learning* (2020)
  > 本文提出了一种从深度图神经网络中提取符号表示的通用方法，通过引入强归纳偏置使网络学习稀疏潜在表示，再结合符号回归提取显式物理方程。该方法不仅能恢复已知的物理定律，还能发现新的解析公式，且提取的符号表达式比原始神经网络具有更好的分布外泛化能力。

## 时间线

- **2020**: [[Discovering Symbolic Models from Deep Learning with Inductive Biases|Discovering Symbolic Models fr...]]
- **2021**: [[第4章__知识图谱相关文献__1|A Survey on Knowledge Graphs: ...]]
- **2022**: [[Learning skillful medium-range global weather forecasting|Learning skillful medium-range...]]

## 相关概念

- [[wiki/concepts/ERA5 reanalysis|ERA5 reanalysis]]
- [[wiki/concepts/Numerical Weather Prediction|Numerical Weather Prediction]]
- [[wiki/concepts/Physics-Informed Machine Learning|Physics-Informed Machine Learning]]
- [[wiki/concepts/Symbolic Regression|Symbolic Regression]]
- [[wiki/concepts/Transformer|Transformer]]
- [[wiki/concepts/Weather Forecasting|Weather Forecasting]]
- [[wiki/concepts/cosmology|cosmology]]
- [[wiki/concepts/dark matter|dark matter]]
- [[wiki/concepts/inductive bias|inductive bias]]
- [[wiki/concepts/interpretable AI|interpretable AI]]

## 动态查询
```dataview
TABLE year, title FROM "papers" WHERE contains(canonical_concepts, "Graph Neural Network") SORT year DESC
```
