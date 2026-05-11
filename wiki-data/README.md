# Domain Knowledge Wiki

Generated: 2026-04-18 03:53:56

## Statistics

- **Total Documents**: 36
- **Canonical Concepts**: 269
- **Cross-lingual Mappings**: 81
- **File Relationships**: 1080

- **Bilingual Concepts**: 53

- **Core Documents** (score ≥ 8.0): 33
- **Important Documents** (score 6.0-7.9): 1
- **Relevant Documents** (score 4.0-5.9): 0
- **Peripheral Documents** (score < 4.0): 2

## Top Concepts

- **Artificial Intelligence** (人工智能) - freq: 152, aliases: artificial intelligence, AI, 人工智能
- **Remote Sensing** (遥感) - freq: 131, aliases: remote sensing, RS, 遥感
- **Large Model** (大模型) - freq: 109, aliases: large language model, Foundation Model, Large Language Model
- **Earth Observation** (对地观测) - freq: 101, aliases: Earth observation, EO, 对地观测
- **Neural Networks** (神经网络) - freq: 75, aliases: NN, Neural Network, neural network
- **Machine Learning** (机器学习) - freq: 70, aliases: machine learning, ML, 机器学习
- **Weather Forecasting** (天气预报) - freq: 64, aliases: 天气预报, weather forecasting, weather prediction
- **Earth** - freq: 37
- **Digital Twin** (数字孪生) - freq: 31, aliases: Digital Twins, 数字孪生, digital twin
- **Causal Reasoning** (因果推理) - freq: 24, aliases: causal inference, 因果推理, Causal Inference

## Document Importance Rankings

Documents ranked by overall importance score (concept coverage + network centrality + core concept density):

**#1 [CORE]** `ClimaX：A Foundation Model for Weather and Climate.md`
- Score: **20.85** (Coverage: 12.31, Centrality: 8.45, Core: 13)
- Key contributions: Data-Driven, Artificial Intelligence, Weather Forecasting

**#2 [CORE]** `GeoAgent  a hierarchical LLM-based multi-agent architecture for autonomous spatial analysis.md`
- Score: **19.66** (Coverage: 13.85, Centrality: 8.12, Core: 9)
- Key contributions: Artificial Intelligence, GIS, Earth Observation

**#3 [CORE]** `On the Opportunities and Challenges of Foundation Models for Geospatial Artificial Intelligence.md`
- Score: **18.84** (Coverage: 11.54, Centrality: 8.25, Core: 9)
- Key contributions: foundation models, Artificial Intelligence, Earth Observation

**#4 [CORE]** `FourCastNet：Accelerating Global High-Resolution Weather Forecasting Using Adaptive Fourier Neural Operators.md`
- Score: **18.74** (Coverage: 12.31, Centrality: 8.21, Core: 13)
- Key contributions: Weather Forecasting, Artificial Intelligence, Internet of Things

**#5 [CORE]** `A Digital Twin of the terrestrial water cycle a glimpse into the future through high-resolution Earth observations.md`
- Score: **18.33** (Coverage: 10.77, Centrality: 8.3, Core: 7)
- Key contributions: Artificial Intelligence, Machine Learning, Earth Observation

**#6 [CORE]** `Accurate medium-range global weather forecasting with 3D neural networks.md`
- Score: **17.32** (Coverage: 12.31, Centrality: 8.06, Core: 10)
- Key contributions: Weather Forecasting, Artificial Intelligence, Data-Driven

**#7 [CORE]** `Autonomous GIS  the next-generation AI-powered GIS.md`
- Score: **17.3** (Coverage: 10.77, Centrality: 7.84, Core: 9)
- Key contributions: Artificial Intelligence, GIS, Unlike

**#8 [CORE]** `Learning skillful medium-range global weather forecasting.md`
- Score: **17.11** (Coverage: 10.0, Centrality: 8.0, Core: 9)
- Key contributions: Weather Forecasting, Artificial Intelligence, Machine Learning

**#9 [CORE]** `GenCast：Diffusion-based ensemble forecasting for medium-range weatherpdf.md`
- Score: **16.91** (Coverage: 13.08, Centrality: 7.7, Core: 10)
- Key contributions: Weather Forecasting, Extreme Weather, Artificial Intelligence

**#10 [CORE]** `GeoLLM：Extracting Geospatial Knowledge from Large Language Models.md`
- Score: **16.83** (Coverage: 12.31, Centrality: 7.72, Core: 5)
- Key contributions: Artificial Intelligence, Earth Observation, Large Model

**#11 [CORE]** `Artificial Intelligence to Advance Earth Observation：A review of models, recent trends, and pathways forward.md`
- Score: **16.68** (Coverage: 8.46, Centrality: 8.16, Core: 8)
- Key contributions: Data-Driven, Artificial Intelligence, Machine Learning

**#12 [CORE]** `EarthGPT：A Universal Multi-modal Large Language Model for Earth Sciences.md`
- Score: **16.09** (Coverage: 9.23, Centrality: 8.03, Core: 6)
- Key contributions: Artificial Intelligence, Unlike, Large Model

**#13 [CORE]** `K2：A Foundation Language Model for Geoscience Knowledge Understanding and Utilization.md`
- Score: **16.01** (Coverage: 10.77, Centrality: 7.62, Core: 4)
- Key contributions: Artificial Intelligence, Earth Observation, Large Model

**#14 [CORE]** `Autonomous Agents for Scientific Discovery：Orchestrating Scientists, Language, Code, and Physics.md`
- Score: **15.9** (Coverage: 10.77, Centrality: 7.69, Core: 6)
- Key contributions: Artificial Intelligence, Language, Large Model

**#15 [CORE]** `Socratic Models：Composing Zero-Shot Multimodal Reasoning with Language.md`
- Score: **15.78** (Coverage: 8.46, Centrality: 7.69, Core: 6)
- Key contributions: foundation models, Artificial Intelligence, Earth Observation


## File Structure

- `file_list.txt` - List of all processed documents
- `concept_list.txt` - Canonical English concepts
- `index.json` - Concept index with cross-lingual mappings and aliases
- `concept_rel.json` - File-to-file relationship mappings
- `document_importance.json` - Document importance scores and rankings

## Cross-lingual Features

This wiki supports cross-lingual concept alignment:
- Chinese concepts are mapped to English canonical forms
- Each concept includes `chinese_equivalent` field
- Synonymous concepts are merged with `aliases` tracking
- Original forms preserved in metadata

## Document Importance Scoring

Each document receives an importance score (0-10) based on three dimensions:

1. **Concept Coverage (30%)**: How many domain concepts the document covers
2. **Network Centrality (40%)**: How central the document is in the knowledge graph
3. **Core Concept Density (30%)**: Presence of high-frequency domain concepts

**Tier Classification**:
- **Core** (≥ 8.0): Foundational papers, must-read
- **Important** (6.0-7.9): Significant contributions
- **Relevant** (4.0-5.9): Moderate importance
- **Peripheral** (< 4.0): Specialized or niche papers
