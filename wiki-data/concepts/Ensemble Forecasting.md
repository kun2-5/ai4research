---
concept: "Ensemble Forecasting"
chinese: "集合预报"
aliases: ["ensemble forecasting", "ensemble prediction", "集合预报"]
frequency: 2
first_seen: 1996
last_updated: 2026-04-25
related_concepts: ["Adaptive Fourier Neural Operator", "Deep Learning Weather Forecasting", "Diffusion Model", "ERA5 reanalysis", "Earth System Emulator", "Extreme Weather Prediction", "High-Performance Computing", "machine learning weather prediction", "medium-range weather forecast", "probabilistic forecasting"]
---

# Ensemble Forecasting

**中文**: 集合预报

## 定义
> 定义待 LLM 综合生成。以下是相关论文的 TL;DR 摘要，可用于生成定义。

## 相关论文

- [[FourCastNet：Accelerating Global High-Resolution Weather Forecasting Using Adaptive Fourier Neural Operators]] — *FourCastNet: Accelerating Global High-Resolution Weather Forecasting using Adaptive Fourier Neural Operators* (2023)
  > FourCastNet提出了一种基于自适应傅里叶神经算子（AFNO）的数据驱动全球高分辨率天气预报方法，相比传统物理数值天气预报（NWP）在推理阶段实现了五个数量级的加速，同时保持了接近最先进的预测精度。
- [[GenCast：Diffusion-based ensemble forecasting for medium-range weatherpdf]] — *GenCast: Diffusion-based ensemble forecasting* (1996)
  > 本文提出了GenCast，一种基于条件扩散模型的概率性天气预报方法，首次在0.25°分辨率下实现了超越欧洲中期天气预报中心（ECMWF）ENS集合预报的15天全球集合预报，生成50个成员仅需8分钟。

## 时间线

- **1996**: [[GenCast：Diffusion-based ensemble forecasting for medium-range weatherpdf|GenCast: Diffusion-based ensem...]]
- **2023**: [[FourCastNet：Accelerating Global High-Resolution Weather Forecasting Using Adaptive Fourier Neural Operators|FourCastNet: Accelerating Glob...]]

## 相关概念

- [[wiki/concepts/Adaptive Fourier Neural Operator|Adaptive Fourier Neural Operator]]
- [[wiki/concepts/Deep Learning Weather Forecasting|Deep Learning Weather Forecasting]]
- [[wiki/concepts/Diffusion Model|Diffusion Model]]
- [[wiki/concepts/ERA5 reanalysis|ERA5 reanalysis]]
- [[wiki/concepts/Earth System Emulator|Earth System Emulator]]
- [[wiki/concepts/Extreme Weather Prediction|Extreme Weather Prediction]]
- [[wiki/concepts/High-Performance Computing|High-Performance Computing]]
- [[wiki/concepts/machine learning weather prediction|machine learning weather prediction]]
- [[wiki/concepts/medium-range weather forecast|medium-range weather forecast]]
- [[wiki/concepts/probabilistic forecasting|probabilistic forecasting]]

## 动态查询
```dataview
TABLE year, title FROM "papers" WHERE contains(canonical_concepts, "Ensemble Forecasting") SORT year DESC
```
