---
concept: "ERA5 reanalysis"
frequency: 2
first_seen: 1996
last_updated: 2026-04-25
related_concepts: ["Diffusion Model", "Ensemble Forecasting", "Graph Neural Network", "Numerical Weather Prediction", "Weather Forecasting", "machine learning weather prediction", "medium-range prediction", "medium-range weather forecast", "probabilistic forecasting", "tropical cyclone prediction"]
---

# ERA5 reanalysis

## 定义
> 定义待 LLM 综合生成。以下是相关论文的 TL;DR 摘要，可用于生成定义。

## 相关论文

- [[Learning skillful medium-range global weather forecasting]] — *Learning skillful medium-range global weather forecasting* (2022)
  > 本文提出了GraphCast，一种基于图神经网络（GNN）的机器学习方法，直接从再分析数据训练，可在1分钟内以0.25°分辨率生成全球10天天气预报，在90%的1380个验证目标上显著优于最准确的确定性业务预报系统。
- [[GenCast：Diffusion-based ensemble forecasting for medium-range weatherpdf]] — *GenCast: Diffusion-based ensemble forecasting* (1996)
  > 本文提出了GenCast，一种基于条件扩散模型的概率性天气预报方法，首次在0.25°分辨率下实现了超越欧洲中期天气预报中心（ECMWF）ENS集合预报的15天全球集合预报，生成50个成员仅需8分钟。

## 时间线

- **1996**: [[GenCast：Diffusion-based ensemble forecasting for medium-range weatherpdf|GenCast: Diffusion-based ensem...]]
- **2022**: [[Learning skillful medium-range global weather forecasting|Learning skillful medium-range...]]

## 相关概念

- [[wiki/concepts/Diffusion Model|Diffusion Model]]
- [[wiki/concepts/Ensemble Forecasting|Ensemble Forecasting]]
- [[wiki/concepts/Graph Neural Network|Graph Neural Network]]
- [[wiki/concepts/Numerical Weather Prediction|Numerical Weather Prediction]]
- [[wiki/concepts/Weather Forecasting|Weather Forecasting]]
- [[wiki/concepts/machine learning weather prediction|machine learning weather prediction]]
- [[wiki/concepts/medium-range prediction|medium-range prediction]]
- [[wiki/concepts/medium-range weather forecast|medium-range weather forecast]]
- [[wiki/concepts/probabilistic forecasting|probabilistic forecasting]]
- [[wiki/concepts/tropical cyclone prediction|tropical cyclone prediction]]

## 动态查询
```dataview
TABLE year, title FROM "papers" WHERE contains(canonical_concepts, "ERA5 reanalysis") SORT year DESC
```
