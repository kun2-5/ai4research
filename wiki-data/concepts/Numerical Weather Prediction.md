---
concept: "Numerical Weather Prediction"
chinese: "数值天气预报"
aliases: ["numerical weather prediction", "nwp", "数值天气预报"]
frequency: 2
first_seen: 2022
last_updated: 2026-04-25
related_concepts: ["3D Neural Network", "ERA5 reanalysis", "Earth-specific transformer", "Graph Neural Network", "Pangu-Weather", "Weather Forecasting", "medium-range forecast", "medium-range prediction", "tropical cyclone tracking"]
---

# Numerical Weather Prediction

**中文**: 数值天气预报

## 定义
> 定义待 LLM 综合生成。以下是相关论文的 TL;DR 摘要，可用于生成定义。

## 相关论文

- [[Accurate medium-range global weather forecasting with 3D neural networks]] — *Accurate medium-range global weather forecasting with 3D neural networks* (2023)
  > 本文提出了Pangu-Weather，一种基于三维深度神经网络的人工智能全球中期天气预报方法，通过引入地球特定先验和分层时间聚合策略，在所有测试变量上超越了欧洲中期天气预报中心（ECMWF）的数值天气预报系统，同时计算速度提升超过10,000倍。
- [[Learning skillful medium-range global weather forecasting]] — *Learning skillful medium-range global weather forecasting* (2022)
  > 本文提出了GraphCast，一种基于图神经网络（GNN）的机器学习方法，直接从再分析数据训练，可在1分钟内以0.25°分辨率生成全球10天天气预报，在90%的1380个验证目标上显著优于最准确的确定性业务预报系统。

## 时间线

- **2022**: [[Learning skillful medium-range global weather forecasting|Learning skillful medium-range...]]
- **2023**: [[Accurate medium-range global weather forecasting with 3D neural networks|Accurate medium-range global w...]]

## 相关概念

- [[wiki/concepts/3D Neural Network|3D Neural Network]]
- [[wiki/concepts/ERA5 reanalysis|ERA5 reanalysis]]
- [[wiki/concepts/Earth-specific transformer|Earth-specific transformer]]
- [[wiki/concepts/Graph Neural Network|Graph Neural Network]]
- [[wiki/concepts/Pangu-Weather|Pangu-Weather]]
- [[wiki/concepts/Weather Forecasting|Weather Forecasting]]
- [[wiki/concepts/medium-range forecast|medium-range forecast]]
- [[wiki/concepts/medium-range prediction|medium-range prediction]]
- [[wiki/concepts/tropical cyclone tracking|tropical cyclone tracking]]

## 动态查询
```dataview
TABLE year, title FROM "papers" WHERE contains(canonical_concepts, "Numerical Weather Prediction") SORT year DESC
```
