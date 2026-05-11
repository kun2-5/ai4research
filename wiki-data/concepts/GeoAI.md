---
concept: "GeoAI"
frequency: 4
first_seen: 2018
last_updated: 2026-04-25
related_concepts: ["Autonomous Agent", "Autonomous GIS", "Foundation Model", "GPT-4", "Geospatial Artificial Intelligence", "Health Geography", "Multimodal Learning", "Remote Sensing", "Shapefile处理", "Urban Geography"]
---

# GeoAI

## 定义
> 定义待 LLM 综合生成。以下是相关论文的 TL;DR 摘要，可用于生成定义。

## 相关论文

- [[GeoAgent  a hierarchical LLM-based multi-agent architecture for autonomous spatial analysis]] — *GeoAgent: a hierarchical LLM-based multi-agent architecture for autonomous spatial analysis* (2026)
  > 本文提出GeoAgent，一种面向自主空间分析的分层LLM多智能体架构，通过规划层、执行层和审查层的协同设计，在147项空间分析任务中实现了超过94%的成功率，验证了分层多智能体协作与自验证机制在地理空间挑战中的有效性。
- [[ShapefileGPT  a multi-agent large language model framework for automated shapefile processing]] — *ShapefileGPT: a multi-agent large language model framework for automated shapefile processing* (2025)
  > 本文提出ShapefileGPT，一种基于多智能体大语言模型的Shapefile自动化处理框架，通过规划器-工作器架构实现复杂空间分析任务的分解与执行，在几何操作和空间查询等任务上达到95.24%的成功率，显著优于通用GPT模型。
- [[Autonomous GIS  the next-generation AI-powered GIS]] — *Autonomous GIS: the next-generation AI-powered GIS* (2023)
  > 本文提出"自主GIS"（Autonomous GIS）概念，即以大型语言模型（LLM）为核心推理引擎的下一代AI驱动地理信息系统，并开发了LLM-Geo原型系统，通过自动空间数据收集、分析和可视化实现无需人工干预的空间问题解决。研究表明LLM-Geo在三个案例研究中均返回准确结果，展示了自主GIS的可行性和潜力。
- [[On the Opportunities and Challenges of Foundation Models for Geospatial Artificial Intelligence]] — *On the Opportunities and Challenges of Foundation Models for Geospatial Artificial Intelligence* (2018)
  > 本文首次系统评估了现有基础模型在多个地理空间智能任务上的表现，发现纯文本任务中基础模型表现优异，但多模态任务仍落后于专用模型，并提出了构建地理空间多模态基础模型的框架与独特挑战。

## 时间线

- **2018**: [[On the Opportunities and Challenges of Foundation Models for Geospatial Artificial Intelligence|On the Opportunities and Chall...]]
- **2023**: [[Autonomous GIS  the next-generation AI-powered GIS|Autonomous GIS: the next-gener...]]
- **2025**: [[ShapefileGPT  a multi-agent large language model framework for automated shapefile processing|ShapefileGPT: a multi-agent la...]]
- **2026**: [[GeoAgent  a hierarchical LLM-based multi-agent architecture for autonomous spatial analysis|GeoAgent: a hierarchical LLM-b...]]

## 相关概念

- [[wiki/concepts/Autonomous Agent|Autonomous Agent]]
- [[wiki/concepts/Autonomous GIS|Autonomous GIS]]
- [[wiki/concepts/Foundation Model|Foundation Model]]
- [[wiki/concepts/GPT-4|GPT-4]]
- [[wiki/concepts/Geospatial Artificial Intelligence|Geospatial Artificial Intelligence]]
- [[wiki/concepts/Health Geography|Health Geography]]
- [[wiki/concepts/Multimodal Learning|Multimodal Learning]]
- [[wiki/concepts/Remote Sensing|Remote Sensing]]
- [[wiki/concepts/Shapefile处理|Shapefile处理]]
- [[wiki/concepts/Urban Geography|Urban Geography]]

## 动态查询
```dataview
TABLE year, title FROM "papers" WHERE contains(canonical_concepts, "GeoAI") SORT year DESC
```
