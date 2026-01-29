# OMDX (Open Meteor Data Exchange) 数据标准与工具箱

**omdx** 是一个开源的流星观测数据交换标准及配套工具集，旨在解决流星监测领域的数据碎片化问题，促进多站点协作与科学数据的标准化流通。

## 开发背景与愿景

随着流星监测技术的普及，国内涌现出大量流星监测爱好者与观测站点。然而，长期以来生态较为分散，不同设备、不同软件（如 UFOCapture, RMS 等）生成的数据格式各异。流星科学研究——特别是高精度的轨迹计算与轨道定轨——往往需要多站点的协同观测数据配合。数据格式的不统一成为了数据共享与联合解算的巨大障碍。

**omdx** 标准基于中国科学院大学（UCAS）开发的 **M3系统** 的数据结构进行了通用化设计。我们的目标是：

1.  **建立标准**：定义一套包含流星视频、时间戳、天体测量（恒星/流星位置）、测光以及元数据的统一交换格式。
2.  **打破壁垒**：提供开源的 Python SDK，方便开发者将该格式集成到各自的流星监测软件中。
3.  **连接生态**：提供转换工具（`MeteorConverter`），支持将UFOCapture的历史数据转换为标准格式，激活沉睡的数据价值。

我们诚挚邀请流星监测软件的开发者与天文爱好者加入 omdx 生态，共同推动流星科学数据的标准化进程。

---

## 核心类：`MeteorObservation`

`MeteorObservation` 是 `omdx` 库的核心 Python 类，用于在内存中表示一次完整的流星观测事件。它不仅存储原始图像数据，还通过属性承载了所有的科学元数据。

### 数据内容和定义

该类最关键的属性是 `self.contents` (List[str])。它是一个字符串列表，用于标记当前对象中包含了哪些有效的数据模块。下游程序应根据此属性判断数据的完整性。

| 标记 (`contents`) | 含义             | 必须包含的非空属性                                                                                   |
| :---------------- | :--------------- | :--------------------------------------------------------------------------------------------------- |
| `image`           | 包含图像数据     | `data` (视频帧), `mask_frame` (非探测区域遮罩), `signal_frame` (流星区域), `max_frame`, `mean_frame` |
| `time`            | 包含时间信息     | `mean_time` (基准绝对时间), `frame_time` (每帧相对基准时间),`frame_exposure` (每帧曝光时间)          |
| `star`            | 包含恒星定标信息 | `star_pixel_coord`, `star_eci_coord`, `star_name`                                                    |
| `meteor`          | 包含流星测量信息 | `objects` (流星对象列表), `meteor_index`, `meteor_pixel_coord` 等                                    |
| `calibration`     | 包含相机校准模型 | `calibration_model`, `calibration_residual` 等                                                       |
| `photometry`      | 包含测光模型     | `photometry_model`, `photometry_residual` 等                                                         |

### 保存格式

`MeteorObservation` 类提供了两种数据持久化方案，以适应不同的使用场景：

1.  **FITS 格式 (`to_fits`)**：
    这是推荐的标准交换格式。它将视频图像、元数据、流星/恒星列表等所有信息封装在一个 `.fits` 文件中，适合科学归档与专业分析。

2.  **组合文件格式 (`to_files`)**：
    这是一种轻量级的拆分存储方案，将数据解包为通用的多媒体和文本文件，便于在 Web 端展示或使用常规媒体播放器查看。包含以下文件：
    - **`.json`**：存储所有非图像的属性、元数据及目标对象列表。
    - **`.mp4`**：存储核心视频图像数据 (`data`)。
    - **`.png`**：存储遮罩 (`mask_frame`) 与信号 (`signal_frame`) 的可视化混合图像。

---

### 安装

可以通过 pip 安装（假设已发布）：

```bash
pip install omdx
```

或者从源码安装：

```bash
git clone https://gitee.com/your-repo/omdx-project.git
cd omdx-project
pip install -e .
```

### 依赖项

- Python >= 3.9
- numpy
- opencv-python
- astropy
- pillow
- matplotlib
- skyfield
