# OMDX Python SDK API 参考手册

## 核心类：MeteorObservation

`omdx.observation.MeteorObservation` 是 OMDX 标准的核心容器类。它在内存中表示一次完整的流星观测事件，包含了从原始图像数据到高级天体测量结果的所有信息。

每个实例或文件仅代表一颗流星的观测数据。如果同时出现两颗流星，这两颗流星应该分为两个实例和文件保存。每个实例或文件支持包含同一颗流星的多个碎片，保存在`objects`列表中。

这个类的设计遵循“渐进式丰富”原则：一个对象初始只包含基础数据和图像，随着处理流程（Pipeline）的推进，逐步填充时间、恒星、流星轨迹和定标模型等数据，

### 兼容多种相机校准和测光模型

为了兼容不同数据处理算法，这个类可以记录每一步处理算法的名称。对于相机校准模型和测光模型，开发者可以自由地用字典的形式保存模型的参数。为了方便读写FITS文件，要求保存模型参数的字典是扁平的，key为4个或以下的小写字母。

### 坐标系和历元约定

- 观测站经纬度、海拔默认采用**WGS84**
- 时间采用Unix时间戳
- 图像xy坐标遵循numpy.ndarray的顺序，维度按顺序为帧序数数、高度、宽度（、色彩通道）。坐标从0开始。
- 恒星名称默认采用**伊巴谷星表（HIP）**编号
- 流星和恒星的天球坐标采用**地心惯性坐标系ECI**。历元为**J2000**。

### 核心机制：Contents 协议

为了解决数据完整性校验问题，该类使用 `contents` 属性作为数据内容的“清单”。下游程序应首先检查此列表，以确定哪些属性是安全可访问的。

| Contents 标记 | 含义       | 必须非空的关联属性                                                                 |
| :------------ | :--------- | :--------------------------------------------------------------------------------- |
| **(Base)**    | 基础元数据 | `version`, `station_name`, `camera_name`                                           |
| `image`       | 图像数据   | `data`, `image_width`, `image_height`, `frame_count`, `mask_frame`, `signal_frame` |
| `time`        | 时间信息   | `mean_time`, `frame_time`, `frame_exposure`                                        |
| `star`        | 恒星定标   | `star_pixel_coord`, `star_eci_coord`, `star_name`等                                |
| `meteor`      | 流星测量   | `objects` (列表), 以及 `objects` 内部的坐标数据                                    |
| `calibration` | 相机校准   | `calibration_model`, `calibration_residual`等                                      |
| `photometry`  | 测光模型   | `photometry_model`, `photometry_residual`等                                        |
| `database`    | 数据库索引 | `station_id`, `meteor_id`                                                          |

---

### 属性详解

以下每个小节列出了`contents`属性在包含每个标记时，`MeteorObservation`应该包含的属性。无需包含的属性若未特别说明，默认值均为 `None`。

#### 基础数据 (Base)

- **`version`** (`str`): OMDX 标准版本号，如 "0.1.0"。
- **`station_name`** (`str`): 观测站点名称/代码。
- **`camera_name`** (`str`): 相机名称。
- **`meteor_name`** (`str`): 事件名称（通常包含站点名称和时间戳等信息，如 `ZBPL_530_20230813_123456_FAST`）。
- **`mode`** (`str`): 观测模式标识。可选的值为`fast`和`slow`。`fast`是用来记录流星或其他暂现现象的模式，数据中每一帧对应原始画面中的一帧，保存了完整的视频信息。`slow`是用来记录人造卫星、飞机等慢速现象的模式，数据中每一帧对应原始画面中多帧的平均值。
- **`station_location`** (`List[float]`): 站点地理坐标，遵循 **WGS84** 标准。格式为 `[纬度(deg), 经度(deg), 海拔(m)]`。
- **`color`** (`str`): 图像色彩模式。
  - 支持值：`'A'` (单色/Alpha), `'RGB'`, `'BGR'`, `'RGGB'`, `'BGGR'` (Bayer格式) 等。
- **`processed_time`** (`Union[float, str]`): 数据处理时的 Unix 时间戳或 ISO 字符串。

#### 图像数据 (`image`)

- **`data`** (`np.ndarray`): 视频帧序列数据。
  - Shape: `(frame_count, height, width)` (灰度) 或 `(frame_count, height, width, channels)`。
  - Dtype: 通常为 `uint8` 或 `uint16`。`mode`为`slow`时可以是`float32`等。
- **`image_width`** / **`image_height`** (`int`): 图像分辨率。
- **`frame_count`** (`int`): 包含的总帧数。
- **`mask_frame`** (`np.ndarray`): 遮罩层，`1` (或 `255`) 表示被遮挡/忽略区域，`0` 表示有效区域。
- **`signal_frame`** (`np.ndarray`): 信号层，`1` (或 `255`) 表示检测到的流星像素区域。
- **`max_frame`** (`np.ndarray`): 最大值帧，所有视频画面的最大值。
- **`mean_frame`** (`np.ndarray`): 平均值帧，所有视频画面**排除最大值后**的平均值。
- **`std_frame`** (`np.ndarray`): 标准差帧。

#### 时间 (`time`)

- **`time_method`** (`str`): 确定每帧时间的算法名称。
- **`mean_time`** (`float`): 事件的基准时间，UTC Unix 时间戳（秒）。通常取流星出现的中间时刻或触发时刻。
- **`frame_time`** (`np.ndarray`): 每一帧相对于 `mean_time` 的时间偏移量（秒）。
  - 绝对时间计算公式：$T_{frame} = \text{mean\_time} + \text{frame\_time}[i]$
- **`frame_exposure`** (`np.ndarray`): 每一帧的有效曝光时长（秒）。
- **`time_source`** (`str`): 时间来源（如 `'gps'`, `'ntp'`, `'system'`）。

#### 恒星 (`star`)

- **`star_method`** (`str`): 测量画面中恒星位置，星表匹配的算法名称。
- **`star_pixel_coord`** (`np.ndarray`): 参考恒星的像素坐标。Shape: `(2, N)`，第一行为 X，第二行为 Y。
- **`star_eci_coord`** (`np.ndarray`): 参考恒星的地心惯性坐标 (**ECI J2000**)。Shape: `(3, N)`。
- **`star_name`** (`List[str]`): 参考恒星名称列表（通常为 HIP 编号）。

#### 流星 (`meteor`)

- **`object_method`** (`str`): 测量画面中目标位置的算法名称。
- **`objects`** (`List[ObservationObject]`): 检测到的移动目标列表。列表中可以包含同一事件的多个目标，例如火流星的多个碎片。

> **Class `ObservationObject`**:
>
> - `object_type` (`str`): 经过精确判断后得到的目标类型，如 `'meteor'`, `'satellite'`, `'no_detection'`。
> - `meteor_index` (`List[int]`): 该目标出现的帧索引列表。
> - `meteor_pixel_coord` (`np.ndarray`): 像素坐标 `(2, N)`，与`meteor_index`中的对应。
>
> 在`contents`中具有`calibration`时，应该包含流星的ECI坐标：
>
> - `meteor_eci_coord` (`np.ndarray`): ECI J2000 空间坐标 `(3, N)`。
>
> 在`contents`中具有`photometry`时，应该包含流星的ECI坐标：
>
> - `meteor_flux` (`np.ndarray`): 原始测光流量数值 (ADU)。
> - `meteor_magnitude` (`np.ndarray`): 视星等。

#### 相机校准 (`calibration`)

- **`calibration_method`** (`str`): 相机校准的算法名称。
- **`calibration_model`** (`Dict`): 几何校准模型参数（如透镜畸变系数、相机指向等）。开发者可以自主实现模型的参数，保存在`calibration_model`中的参数列表要求为扁平字典，Key 长度限制为 4 字符小写（适应 FITS 限制）。
- **`calibration_result`** (`str`): 校准结果，取值可以是`locked`，`blind`, `failed`等，分别代表校准成功，校准不成功但采用历史数据，校准不成功。
- **`calibration_residual`** (`float`): 校准残差，单位是度。

#### 测光（`photometry`）

- **`photometry_method`** (`str`): 测光算法名称。
- **`photometry_model`** (`Dict`): 测光模型参数（如零点星等、消光系数）。开发者可以自主实现模型的参数，保存在`photometry_model`中的参数列表要求为扁平字典，Key 长度限制为 4 字符小写（适应 FITS 限制）。
- **`photometry_result`** (`str`): 测光校准结果，取值可以是`locked`，`blind`, `failed`等，分别代表校准成功，校准不成功但采用历史数据，校准不成功。
- **`photometry_residual`** (`float`): 校准残差，单位是星等。
- **`star_flux`** (`List[str]`): 定标恒星的测光流量。
- **`star_magnitude`** (`List[str]`): 定标恒星的星等，从星表查找得到。

#### 数据库索引（`database`）

- **`station_id`** (`str`): 数据库中收录流星时添加的站点的唯一代码。不建议手动填写。
- **`meteor_id`** (`str`): 数据库中收录流星时添加的流星的唯一代码。不建议手动填写。

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
- **`from_files`**
  - 从文件组合读取还原对象。注意，因为`.mp4`格式为有损压缩，不推荐采用此方法保存原始数据和中间结果，尤其是多次保存和读取。
