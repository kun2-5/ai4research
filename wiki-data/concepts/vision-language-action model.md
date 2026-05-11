---
concept: "vision-language-action model"
frequency: 2
first_seen: 2023
last_updated: 2026-04-25
related_concepts: ["chain of thought reasoning", "emergent capabilities", "end-to-end learning", "foundation models for robotics", "generalization", "imitation learning", "open-source robotics", "parameter-efficient fine-tuning", "robot manipulation", "robotic control"]
---

# vision-language-action model

## 定义
> 定义待 LLM 综合生成。以下是相关论文的 TL;DR 摘要，可用于生成定义。

## 相关论文

- [[OpenVLA]] — *OpenVLA: An Open-Source Vision-Language-Action Model* (2024)
  > OpenVLA提出了一个70亿参数的开源视觉-语言-动作模型，通过在互联网规模的视觉-语言数据和97万条真实机器人演示上进行预训练，在通用机器人操作任务上超越了参数量大7倍的闭源模型RT-2-X，并支持在消费级GPU上高效微调。
- [[RT-2：Vision-Language-Action Models Transfer]] — *Web Knowledge to Robotic Control* (2023)
  > 本文提出了RT-2模型，通过将视觉-语言模型（VLM）直接微调为视觉-语言-动作模型（VLA），将互联网规模的语义知识迁移到机器人端到端控制中，实现了显著的新颖物体泛化能力和涌现的语义推理能力。

## 时间线

- **2023**: [[RT-2：Vision-Language-Action Models Transfer|Web Knowledge to Robotic Contr...]]
- **2024**: [[OpenVLA|OpenVLA: An Open-Source Vision...]]

## 相关概念

- [[wiki/concepts/chain of thought reasoning|chain of thought reasoning]]
- [[wiki/concepts/emergent capabilities|emergent capabilities]]
- [[wiki/concepts/end-to-end learning|end-to-end learning]]
- [[wiki/concepts/foundation models for robotics|foundation models for robotics]]
- [[wiki/concepts/generalization|generalization]]
- [[wiki/concepts/imitation learning|imitation learning]]
- [[wiki/concepts/open-source robotics|open-source robotics]]
- [[wiki/concepts/parameter-efficient fine-tuning|parameter-efficient fine-tuning]]
- [[wiki/concepts/robot manipulation|robot manipulation]]
- [[wiki/concepts/robotic control|robotic control]]

## 动态查询
```dataview
TABLE year, title FROM "papers" WHERE contains(canonical_concepts, "vision-language-action model") SORT year DESC
```
