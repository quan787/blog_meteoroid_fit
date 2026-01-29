# OMDX Python SDK API 参考手册

## 核心类：MeteorObservation

`omdx.observation.MeteorObservation` 是 OMDX 标准的核心容器类。它在内存中表示一次完整的流星观测事件，包含了从原始图像数据到高级天体测量结果的所有信息。

该类的设计遵循“渐进式丰富”原则：一个对象初始可能只包含原始图像，随着处理流程（Pipeline）的推进，逐步填充时间、恒星、流星轨迹和定标模型等数据。

### 1. 核心机制：Contents 协议

为了解决数据完整性校验问题，该类使用 `contents` 属性作为数据内容的“清单”。下游程序应首先检查此列表，以确定哪些属性是安全可访问的。

| Contents 标记 | 含义       | 必须非空的关联属性                                                                 |
| :------------ | :--------- | :--------------------------------------------------------------------------------- |
| **(Base)**    | 基础元数据 | `version`, `station_name`, `camera_name`                                           |
| `image`       | 图像数据   | `data`, `image_width`, `image_height`, `frame_count`, `mask_frame`, `signal_frame` |
| `time`        | 时间信息   | `mean_time`, `frame_time`, `frame_exposure`                                        |
| `star`        | 恒星定标   | `star_pixel_coord`, `star_eci_coord`, `star_name`                                  |
| `meteor`      | 流星测量   | `objects` (列表), 以及 `objects` 内部的坐标数据                                    |
| `calibration` | 相机校准   | `calibration_model`, `calibration_residual`                                        |
| `photometry`  | 测光模型   | `photometry_model`, `photometry_residual`                                          |
| `database`    | 数据库索引 | `station_id`, `meteor_id`                                                          |

---

### 2. 属性详解

以下属性若未特别说明，默认值均为 `None`。

#### 2.1 基础元数据 (Metadata)

- **`version`** (`str`): OMDX 标准版本号，默认为 "0.1"。
- **`station_name`** (`str`): 观测站点名称/代码。
- **`camera_name`** (`str`): 相机名称/ID。
- **`meteor_name`** (`str`): 事件名称（通常由时间戳生成，如 `20230813_123456`）。
- **`mode`** (`str`): 观测模式标识（例如 `fast`, `slow`, `detect`）。
- **`station_location`** (`List[float]`): 站点地理坐标，遵循 **WGS84** 标准。格式为 `[纬度(deg), 经度(deg), 海拔(m)]`。
- **`color`** (`str`): 图像色彩模式。
  - 支持值：`'A'` (单色/Alpha), `'RGB'`, `'BGR'`, `'RGGB'`, `'BGGR'` (Bayer格式) 等。
- **`processed_time`** (`Union[float, str]`): 数据处理时的 Unix 时间戳或 ISO 字符串。

#### 2.2 图像数据 (Image Payload)

- **`data`** (`np.ndarray`): 视频帧序列数据。
  - Shape: `(frame_count, height, width)` (灰度) 或 `(frame_count, height, width, channels)`。
  - Dtype: 通常为 `uint8` 或 `uint16`。
- **`image_width`** / **`image_height`** (`int`): 图像分辨率。
- **`frame_count`** (`int`): 包含的总帧数。
- **`mask_frame`** (`np.ndarray`): 遮罩层，`1` (或 `255`) 表示被遮挡/忽略区域，`0` 表示有效区域。
- **`signal_frame`** (`np.ndarray`): 信号层，`1` (或 `255`) 表示检测到的流星像素区域。
- **`max_frame`** (`np.ndarray`): 最大值合成帧（只读属性，自动计算并缓存）。
- **`mean_frame`** (`np.ndarray`): 平均值合成帧（只读属性，自动计算并缓存）。
- **`std_frame`** (`np.ndarray`): 标准差帧（只读属性，自动计算并缓存）。

#### 2.3 时间系统 (Time System)

- **`mean_time`** (`float`): 事件的基准时间，UTC Unix 时间戳（秒）。通常取流星出现的中间时刻或触发时刻。
- **`frame_time`** (`np.ndarray`): 每一帧相对于 `mean_time` 的时间偏移量（秒）。
  - 绝对时间计算公式：$T_{frame} = \text{mean\_time} + \text{frame\_time}[i]$
- **`frame_exposure`** (`np.ndarray`): 每一帧的有效曝光时长（秒）。
- **`time_source`** (`str`): 时间来源（如 `'gps'`, `'ntp'`, `'system'`）。

#### 2.4 天体测量与流星对象 (Astrometry & Objects)

- **`star_pixel_coord`** (`np.ndarray`): 参考恒星的像素坐标。Shape: `(2, N)`，第一行为 X，第二行为 Y。
- **`star_eci_coord`** (`np.ndarray`): 参考恒星的地心惯性坐标 (**ECI J2000**)。Shape: `(3, N)`。
- **`star_name`** (`List[str]`): 参考恒星名称列表（通常为 HIP 编号）。
- **`objects`** (`List[ObservationObject]`): 检测到的移动目标列表。

> **Class `ObservationObject`**:
>
> - `object_type` (`str`): 类型，如 `'meteor'`, `'satellite'`。
> - `meteor_index` (`List[int]`): 该目标出现的帧索引列表。
> - `meteor_pixel_coord` (`np.ndarray`): 像素坐标 `(2, N)`。
> - `meteor_eci_coord` (`np.ndarray`): ECI J2000 空间坐标 `(3, N)`。
> - `meteor_flux` (`np.ndarray`): 原始光通量数值 (ADU)。
> - `meteor_magnitude` (`np.ndarray`): 视星等。

#### 2.5 模型与校准 (Model)

- **`calibration_model`** (`Dict`): 几何校准模型参数（如透镜畸变系数、旋转矩阵）。要求为扁平字典，Key 长度限制为 4 字符（适应 FITS 限制）。
- **`photometry_model`** (`Dict`): 测光模型参数（如零点星等、消光系数）。

---

### 3. 主要方法

- **`check_format() -> bool`**
  - 根据 `contents` 列表严格校验数据完整性。如果数据维度不匹配或关键字段缺失，抛出 `ValueError`。
- **`to_fits(fits_path: str)`**
  - 将对象序列化为符合 OMDX 标准的 FITS 文件。
- **`from_fits(fits_path: str) -> MeteorObservation`**
  - 从 FITS 文件反序列化还原对象。
- **`to_files(base_path: str)`**
  - 导出为 web 友好的文件组合：`.json` (元数据), `.mp4` (视频), `.png` (Mask/Signal)。
