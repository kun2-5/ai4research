# ResearchOS 知识图谱设计文档

> 文档版本: 2026-05-29
> 对应代码: `src/components/knowledge/KnowledgeGraph.tsx`, `src/app/api/graph/route.ts`

---

## 1. 概述

知识图谱是 ResearchOS 知识空间的核心可视化模块，将文献库中的 **概念** 与 **文献** 以图结构呈现，帮助研究者：

- **宏观洞察**：一眼看清领域内的核心概念及其关联强度
- **文献定位**：通过概念关联快速定位关键文献
- **关系探索**：发现文献之间的引用、共享概念、甚至对立关系

### 1.1 核心设计原则

| 原则 | 说明 |
|------|------|
**分层降噪** | 文献按四级重要性（Core/Important/Relevant/Peripheral）过滤，避免信息过载
**三视图架构** | 星系视图（概念全景）、聚焦视图（单概念深入）、网络视图（全图展开）
**视觉降噪** | 概念节点大而醒目，文献节点小而隐蔽，边线极细且低透明度
**渐进式交互** | 点击概念进入聚焦，点击空白返回，悬停显示详情，搜索高亮匹配

---

## 2. 数据层设计

### 2.1 数据来源

数据来自三个 wiki 数据源，通过 `src/lib/wiki/reader.ts` 统一读取：

```
wiki-data/
├── concepts/*.md          # 21 个概念卡片（frontmatter + markdown）
├── index.md               # 150 篇文献索引（分级、标题、年份、概念）
├── .links/
│   ├── concept_index.json     # 概念 → 文献映射
│   └── relationship_graph.json # 文献间关系图（强度、类型、共享概念）
└── document_importance.json   # 文献重要性评分（补充数据）
```

### 2.2 节点类型

| 类型 | ID 前缀 | 数量 | 视觉特征 | 数据来源 |
|------|---------|------|----------|----------|
| **概念节点** | `c-` | 21 | 蓝色大圆，大小与关联文献数成正比 | `concepts/*.md` frontmatter |
| **文献节点** | `p-` | 动态（按 tier 过滤） | 彩色小圆点（6px），默认隐藏标签 | `index.md` + `document_importance.json` |

### 2.3 边类型

| 类型 | 连接对象 | 样式 | 数据来源 |
|------|----------|------|----------|
| `related_concept` | 概念 ↔ 概念 | 灰色虚线，1.5px，opacity 0.4 | `concepts/*.md` 的 `related_concepts` 字段 |
| `mentions` | 概念 → 文献 | 极细蓝线，0.6px，opacity 0.2 | `concept_index.json` |
| `paper_paper` | 文献 ↔ 文献 | 极细黄线，0.5px，opacity 0.12 | `relationship_graph.json`（过滤后） |

### 2.4 文献-文献边过滤策略

原始 `relationship_graph.json` 包含约 5750 条边，直接渲染会导致图完全不可读。采用三级过滤：

1. **强度阈值**：仅保留 `strength >= 0.25` 的关系
2. **Top-K 裁剪**：每篇文献最多保留 3 条最强关联
3. **Tier 联动**：两端文献都必须属于用户选中的 tier 集合

过滤后典型数据规模（Core+Important+Relevant）：
- 概念节点：21
- 文献节点：约 95
- 边：约 417

---

## 3. API 层设计

### 3.1 端点

```
GET /api/graph?tier=Core,Important,Relevant
```

### 3.2 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tier` | string | `Core,Important,Relevant,Peripheral` | 逗号分隔的 tier 列表，控制文献节点过滤 |

### 3.3 响应结构

```typescript
interface GraphData {
  nodes: Array<{ data: GraphNode }>;
  edges: Array<{ data: GraphEdge }>;
  stats: {
    conceptCount: number;  // 概念节点数
    paperCount: number;    // 文献节点数
    edgeCount: number;     // 边总数
  };
}

interface GraphNode {
  id: string;              // c-{slug} 或 p-{slug}
  label: string;           // 显示标签
  type: "concept" | "paper";
  tier?: string;           // 文献层级
  year?: number;
  paperCount?: number;     // 概念关联文献数（决定节点大小）
  description?: string;    // 概念定义 / 文献摘要
  chineseEquivalent?: string;
  aliases?: string[];
  authors?: string[];
  abstract?: string;
  concepts?: string[];     // 文献相关概念
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;            // related_concept | mentions | paper_paper
  strength?: number;       // 仅 paper_paper 有
}
```

### 3.4 服务端处理流程

```
1. 读取所有概念（getConcepts）
2. 读取所有文献（getLiterature）
3. 构建概念节点 → 添加概念-概念边
4. 遍历概念关联文献 → 匹配文献 → 添加概念-文献边 → 记录已连接文献ID
5. 仅对已连接的文献添加文献节点（避免孤立节点）
6. 读取 relationship_graph.json → 按强度和Top-K过滤 → 添加文献-文献边
7. 返回 nodes + edges + stats
```

---

## 4. 前端架构

### 4.1 组件结构

```
KnowledgeGraphPage (Server Component)
└── KnowledgeGraph (Client Component, 649 lines)
    ├── Header          // 模式切换 + tier 过滤 + 统计
    ├── Canvas          // Cytoscape 挂载点（始终存在于 DOM）
    ├── Overlays
    │   ├── Loading     // 加载中
    │   ├── Error       // 加载失败
    │   └── Layouting   // 布局计算中
    ├── Controls
    │   ├── BackButton  // 聚焦模式返回
    │   ├── SearchBox   // 节点搜索
    │   ├── ZoomPanel   // 缩放/适配/重布局
    │   └── Legend      // 图例
    └── Panels
        ├── Tooltip     // 悬停提示（fixed 定位）
        └── DetailPanel // 选中节点详情卡片
```

### 4.2 关键状态管理

```typescript
const [graphData, setGraphData] = useState<GraphData | null>(null);
const [mode, setMode] = useState<ViewMode>("constellation");
const modeRef = useRef<ViewMode>("constellation");  // 避免闭包陷阱
const [focusId, setFocusId] = useState<string | null>(null);
const [search, setSearch] = useState("");
const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
const [tiers, setTiers] = useState<string[]>(["Core", "Important", "Relevant"]);
```

### 4.3 生命周期设计（关键修复点）

**问题**：早期版本在 `loading=true` 时不渲染 canvas div，导致 Cytoscape 初始化时 `containerRef.current` 为 null，图永远无法显示。

**解决方案**：
- canvas div **始终存在于 DOM**
- loading/error 状态使用 **绝对定位的 overlay** 覆盖
- Cytoscape 初始化放在 `useEffect` 中，条件为 `containerRef.current && graphData && !cyRef.current`

```typescript
// 正确的生命周期
useEffect(() => {
  if (!containerRef.current || !graphData) return;
  if (cyRef.current) return; // 已初始化，跳过
  // ... 初始化 cytoscape
}, [graphData, centrality]);
```

---

## 5. 三视图模式

### 5.1 星系视图（Constellation）—— 默认

**用途**：概念全景，快速识别领域核心

| 特性 | 说明 |
|------|------|
| 节点 | 仅显示概念节点（21个） |
| 边 | 仅显示概念-概念关联 |
| 布局 | `concentric`（同心圆），中心度高的概念在中心 |
| 节点大小 | `mapData(paperCount, 1, 30, 40, 70)` — 关联文献越多，节点越大 |

**交互**：点击任意概念节点 → 切换到聚焦视图

### 5.2 聚焦视图（Focus）—— 单概念深入

**用途**：围绕一个核心概念，查看其关联概念和文献

| 特性 | 说明 |
|------|------|
| 中心节点 | 选中的概念（80px，加粗边框，z-index 置顶） |
| 第一层 | 关联概念（concentric=2） |
| 第二层 | 该概念提及的文献（concentric=1） |
| 第三层 | 文献之间的关联边 |
| 布局 | `concentric`，中心概念在圆心 |

**交互**：点击空白处 → 返回星系视图

### 5.3 网络视图（Network）—— 全图展开

**用途**：查看概念和文献的完整关系网络

| 特性 | 说明 |
|------|------|
| 节点 | 所有概念 + 所有符合 tier 过滤的文献 |
| 边 | 所有三类边 |
| 布局 | `cose`（Compound Spring Embedder），力导向布局 |
| 参数 | nodeRepulsion=15000, idealEdgeLength=120, gravity=1.8 |

---

## 6. 视觉设计系统

### 6.1 颜色体系

#### 概念节点
- 填充：`#3b82f6`（蓝色 500）
- 边框：`#1e40af`（蓝色 800），2.5px
- 聚焦中心：填充 `#2563eb`，边框 `#1e3a8a`，4px

#### 文献节点（按 Tier）
| Tier | 颜色 | 说明 |
|------|------|------|
| Core | `#dc2626` | 红色 — 领域奠基性文献 |
| Important | `#ea580c` | 橙色 — 重要贡献 |
| Relevant | `#ca8a04` | 黄色 — 相关文献 |
| Peripheral | `#6b7280` | 灰色 — 边缘文献 |

#### 边线
| 类型 | 颜色 | 样式 | 宽度 | 透明度 |
|------|------|------|------|--------|
| 概念-概念 | `#94a3b8` | 虚线 | 1.5px | 0.4 |
| 概念-文献 | `#bfdbfe` | 实线 | 0.6px | 0.2 |
| 文献-文献 | `#fde68a` | 实线 | 0.5px | 0.12 |

### 6.2 标签策略

| 节点类型 | 默认标签 | 触发显示 |
|----------|----------|----------|
| 概念 | **始终显示** | — |
| 文献 | 隐藏（`text-opacity: 0`） | 悬停或选中时显示 |

概念标签使用白色半透明背景 + 圆角矩形，确保在任何背景下可读。

### 6.3 选中与高亮

| 状态 | 样式 | 说明 |
|------|------|------|
| **选中（单击）** | 橙色边框 `#f59e0b`，3px | 显示 DetailPanel |
| **搜索匹配** | 蓝色粗边框 `#2563eb`，5px | 仅搜索状态下生效 |
| **聚光灯高亮（双击）** | `highlighted` 类 | 节点 + 邻居保持正常透明度 |
| **聚光灯暗淡** | `dimmed` 类，opacity 0.06 | 非邻居节点 |
| **非匹配（搜索）** | 无特殊样式 | 正常显示，不强制暗淡 |

**互斥规则**：搜索和聚光灯不会同时存在。输入搜索时自动取消聚光灯；双击聚光灯时自动清空搜索。

---

## 7. 交互设计

### 7.1 鼠标交互

| 操作 | 目标 | 效果 |
|------|------|------|
| 单击 | 概念节点 | 选中 + 详情面板 + 切换聚焦视图 |
| 单击 | 文献节点 | 选中 + 详情面板 |
| 单击 | 空白处 | 取消选中 + 聚焦模式返回星系 |
| 悬停 | 任意节点 | 放大（文献）+ 固定定位 tooltip |
| 滚轮 | 画布 | 缩放（0.1x ~ 4x，灵敏度 0.25） |
| 拖拽 | 任意节点 | 调整位置（cose 模式下） |

### 7.2 搜索交互（当前实现：方案 B — 搜索结果面板）

#### 搜索架构

搜索是知识图谱的**核心交互入口**，设计经历了三个方案的演进：

| 方案 | 名称 | 状态 | 说明 |
|------|------|------|------|
| **A** | 增强型高亮搜索 | 待实现 | 扩展搜索维度 + 结果计数 + 上下导航 + 视觉区分 |
| **B** | **搜索结果面板** | **✅ 已实现** | 右侧面板展示结果列表，支持多关键词 AND、类型过滤 |
| **C** | 全局语义搜索 | 待实现 | 自然语言查询 + 向量语义相似度 + pgvector 后端 |

#### 方案 B 详细设计

**7.2.1 多关键词 AND 搜索**

- 空格分隔多个关键词（如 `"machine learning"` → `["machine", "learning"]`）
- 节点必须在**至少一个字段**中同时包含所有关键词才算匹配
- 不需要同一个字段包含所有关键词（如 label 含 "machine" + description 含 "learning" 即可）

**搜索字段（6 个）**：

| 字段 | 适用节点 | 说明 |
|------|----------|------|
| `label` | 全部 | 节点显示名称 |
| `description` | 概念 | 概念定义 / 文献摘要 |
| `aliases` | 概念 | 英文别名、缩写 |
| `chineseEquivalent` | 概念 | 中文等价词 |
| `authors` | 文献 | 作者列表 |
| `concepts` | 文献 | 文献涉及的概念 |

**7.2.2 搜索结果面板**

- 位置：右侧绝对定位（与 DetailPanel 互斥，搜索优先）
- 触发：搜索框有非空输入时自动滑出
- 关闭：清空搜索或点击面板外区域

**面板内容**：
- **顶部**：类型过滤标签（全部 / 概念 / 文献）+ 匹配计数（"找到 12 个"）
- **列表**：每个结果项包含：
  - 类型色块（概念蓝色 / 文献 tier 色）
  - 节点名称
  - 匹配字段标签（如 "匹配：描述、别名"）
  - 文本摘要（截取含关键词的片段，关键词高亮为黄色背景）
  - 点击 → 自动聚焦到该节点 + 聚光灯效果

**7.2.3 排序策略**

结果按得分降序排列：
```
score = 匹配字段数 × 100 + (概念节点 ? 50 : 0) + (label 匹配 ? 30 : 0)
```
- 匹配字段越多 → 越靠前
- 概念节点优先于文献节点
- label 匹配的优先

**7.2.4 视觉反馈**

| 状态 | 节点效果 | 边效果 |
|------|----------|--------|
| **搜索匹配** | 蓝色粗边框（`search-match` 类，border-width: 5, border-color: #2563eb） | 不变 |
| **聚光灯（双击）** | 节点 + 邻居 `highlighted`，其他 `dimmed`（opacity 0.06） | 邻居边 `highlighted` |
| **两者共存** | 搜索匹配优先显示蓝色边框，聚光灯 dimmed 只影响非搜索匹配节点 |

**互斥规则**：
- 输入搜索时 → 自动取消聚光灯状态
- 双击聚光灯时 → 自动清空搜索

**7.2.5 搜索结果摘要生成**

- 找到第一个匹配关键词在文本中的位置
- 截取前后 20 个字符作为上下文
- 超出文本范围时添加 `...` 省略号
- 用 `<mark>` 标签高亮匹配的关键词（黄色背景）

### 7.3 层级过滤

Header 中提供四个 tier 按钮，点击切换：
- 激活状态：正常显示
- 非激活状态：opacity 0.3
- 切换后重新请求 `/api/graph?tier=...`，Cytoscape 实例销毁重建

### 7.4 缩放控制（左下角）

| 按钮 | 功能 |
|------|------|
| 🔍+ | 放大 1.3x |
| 🔍- | 缩小 1.3x |
| ☐ | 适配视图（fit，padding 40px） |
| ↻ | 重新计算布局 |

---

## 8. 性能优化

### 8.1 服务端优化

| 策略 | 效果 |
|------|------|
| 强度阈值过滤（>=0.25） | 削减约 60% 的低质量边 |
| Top-K 裁剪（每节点最多3条） | 削减约 70% 的冗余边 |
| 仅渲染已连接文献 | 消除孤立节点 |
| Tier 联动过滤 | 按用户需求动态削减 |

### 8.2 客户端优化

| 策略 | 效果 |
|------|------|
| 动态导入 cytoscape | 减少首屏 bundle 体积 |
| `useMemo` 缓存中心度计算 | 避免重复遍历边 |
| `modeRef` 闭包解耦 | 事件处理器读取最新状态 |
| ResizeObserver | 容器大小变化时自动 resize |

---

## 9. 文件清单

| 文件 | 职责 |
|------|------|
| `src/app/(main)/knowledge/graph/page.tsx` | 页面路由包装器 |
| `src/components/knowledge/KnowledgeGraph.tsx` | 核心图谱组件（649行） |
| `src/app/api/graph/route.ts` | 图数据 API（226行） |
| `src/lib/wiki/reader.ts` | Wiki 数据读取器（343行） |
| `src/lib/wiki/config.ts` | Wiki 路径配置 |
| `src/types/index.ts` | 类型定义 |
| `src/lib/constants.ts` | Tier 颜色常量 |

---

## 10. 搜索功能演进路线

### 方案 A：增强型高亮搜索（待实现）

在方案 B 的基础上增加：
- **结果计数导航**：搜索框旁显示 "找到 5 个"，添加 ⬅️ ➡️ 按钮循环跳转
- **更多搜索维度**：支持按年份、作者机构等过滤
- **搜索历史**：记录最近 5 次搜索，下拉快速选择
- **拼音/模糊匹配**：支持中文拼音首字母匹配（如 "jsj" → "计算机视觉"）

### 方案 B：搜索结果面板（✅ 已实现）

详见 7.2 节。

### 方案 C：全局语义搜索（待实现，依赖数据库）

需要前置条件：PostgreSQL + pgvector 搭建完成。

**功能**：
- 自然语言查询："找一下关于扩散模型和卫星数据结合的文献"
- 后端将查询文本 embedding，与预计算的节点向量做余弦相似度排序
- 结果列表按语义相似度排名，而非关键词匹配
- 支持保存搜索条件为"视图快照"，下次直接恢复

**技术方案**：
1. 导入阶段：用 sentence-transformers 为每个概念/文献生成 768 维向量
2. 存储：pgvector 的 `vector(768)` 类型 + `cosine_similarity` 索引
3. 查询：API 路由 `/api/search?q=...&type=concept|paper` 返回语义匹配结果
4. 前端：复用方案 B 的搜索结果面板 UI，数据源从关键词匹配切换为语义匹配

---

## 11. 后续改进方向

1. **文献详情页联动**：点击文献节点可跳转 `/knowledge/literature/[slug]`
2. **概念详情页联动**：点击概念节点可跳转 `/knowledge/concepts/[slug]`
3. **时间轴模式**：按年份布局，展示概念和文献的演进
4. **社区发现**：集成 Cytoscape 的社区检测算法，自动聚类
5. **全屏模式**：支持进入沉浸式全屏浏览
6. **导出功能**：导出当前视图为 PNG/SVG
