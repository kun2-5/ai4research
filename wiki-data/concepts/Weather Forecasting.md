---
concept: "Weather Forecasting"
chinese: "天气预报"
aliases: ["weather forecasting", "weather prediction", "天气预报", "气象预报"]
frequency: 6
first_seen: 2008
last_updated: 2026-04-25
related_concepts: ["3D Neural Network", "CMIP6", "ERA5 reanalysis", "Earth-specific transformer", "Foundation Model", "Graph Neural Network", "NeuralGCM", "Numerical Weather Prediction", "Pangu-Weather", "Transformer"]
---

# Weather Forecasting

**中文**: 天气预报

## 定义
> 定义待 LLM 综合生成。以下是相关论文的 TL;DR 摘要，可用于生成定义。

## 相关论文

- [[第4章__知识图谱相关文献__31]] — *Zephyrus : AN Agentic Framework FOR Weather Science* (2026)
  > Foundation models for weather science are pre-trained on vast amounts of struc-
tured numerical data and outperform traditional weather forecasting systems.
- [[Neural general circulation models for weather and climate - 副本]] — *Neural general circulation models for weather and climate* (2024)
  > NeuralGCM是一种结合可微分大气动力学求解器与机器学习参数化的混合通用环流模型，通过端到端在线训练实现了从1天到15天天气预报乃至数十年气候模拟的准确预测，同时计算效率比传统GCM提升数个数量级。
- [[Accurate medium-range global weather forecasting with 3D neural networks]] — *Accurate medium-range global weather forecasting with 3D neural networks* (2023)
  > 本文提出了Pangu-Weather，一种基于三维深度神经网络的人工智能全球中期天气预报方法，通过引入地球特定先验和分层时间聚合策略，在所有测试变量上超越了欧洲中期天气预报中心（ECMWF）的数值天气预报系统，同时计算速度提升超过10,000倍。
- [[Learning skillful medium-range global weather forecasting]] — *Learning skillful medium-range global weather forecasting* (2022)
  > 本文提出了GraphCast，一种基于图神经网络（GNN）的机器学习方法，直接从再分析数据训练，可在1分钟内以0.25°分辨率生成全球10天天气预报，在90%的1380个验证目标上显著优于最准确的确定性业务预报系统。
- [[第4章__多模态地球科学大模型文献__4.3.2_多模态表示与融合方法__气象预报基础模型__ClimaX]] — *ClimaX: A foundation model for weather and climate* (2021)
  > 待补充
- [[ClimaX：A Foundation Model for Weather and Climate]] — *ClimaX: A Foundation Model for Weather and Climate* (2008)
  > ClimaX提出了首个专为天气与气候科学设计的基础模型，通过扩展Transformer架构并采用自监督预训练，实现了跨变量、跨时空尺度的通用气候建模能力，在天气预报和气候预测基准上显著优于现有数据驱动基线方法。

## 时间线

- **2008**: [[ClimaX：A Foundation Model for Weather and Climate|ClimaX: A Foundation Model for...]]
- **2021**: [[第4章__多模态地球科学大模型文献__4.3.2_多模态表示与融合方法__气象预报基础模型__ClimaX|ClimaX: A foundation model for...]]
- **2022**: [[Learning skillful medium-range global weather forecasting|Learning skillful medium-range...]]
- **2023**: [[Accurate medium-range global weather forecasting with 3D neural networks|Accurate medium-range global w...]]
- **2024**: [[Neural general circulation models for weather and climate - 副本|Neural general circulation mod...]]
- **2026**: [[第4章__知识图谱相关文献__31|Zephyrus : AN Agentic Framewor...]]

## 相关概念

- [[wiki/concepts/3D Neural Network|3D Neural Network]]
- [[wiki/concepts/CMIP6|CMIP6]]
- [[wiki/concepts/ERA5 reanalysis|ERA5 reanalysis]]
- [[wiki/concepts/Earth-specific transformer|Earth-specific transformer]]
- [[wiki/concepts/Foundation Model|Foundation Model]]
- [[wiki/concepts/Graph Neural Network|Graph Neural Network]]
- [[wiki/concepts/NeuralGCM|NeuralGCM]]
- [[wiki/concepts/Numerical Weather Prediction|Numerical Weather Prediction]]
- [[wiki/concepts/Pangu-Weather|Pangu-Weather]]
- [[wiki/concepts/Transformer|Transformer]]

## 动态查询
```dataview
TABLE year, title FROM "papers" WHERE contains(canonical_concepts, "Weather Forecasting") SORT year DESC
```
