# OMDX FITS 数据格式标准 v0.1

本文档定义了 Open Meteor Data Exchange (OMDX) 在 FITS (Flexible Image Transport System) 文件中的存储规范。

## 1. 文件结构概览

OMDX FITS 文件由一个主扩展（Primary HDU）和若干后续扩展组成。这种结构允许在一个文件中同时存储合成图像、原始视频序列、逐帧元数据以及表格数据。

| HDU 索引  | 类型        | 名称 (EXTNAME) | 内容描述                                      |
| :-------- | :---------- | :------------- | :-------------------------------------------- |
| **0**     | PrimaryHDU  | (N/A)          | 基础元数据头 + 压缩后的合成图像 (Mask/Signal) |
| **1...N** | ImageHDU    | `M_FRAME_{ID}` | 第 `{ID}` 帧的图像数据 + 该帧的时间与流星坐标 |
| **N+1**   | BinTableHDU | `M_STAR`       | 恒星目录表 + 几何/测光模型参数                |

---

## 2. Primary HDU (主扩展)

### 2.1 Header 关键字

主头文件存储全局元数据。以下关键字是必须或建议包含的：

| 关键字       | 类型   | 说明                           | 对应 Python 属性                |
| :----------- | :----- | :----------------------------- | :------------------------------ |
| `M_VER`      | String | 标准版本号                     | `version`                       |
| `M_STA`      | String | 站点名称                       | `station_name`                  |
| `M_CAM`      | String | 相机 ID                        | `camera_name`                   |
| `M_NAME`     | String | 事件唯一标识名                 | `meteor_name`                   |
| `M_MEANT`    | Float  | 基准时间 (Unix Timestamp, UTC) | `mean_time`                     |
| `M_TSRC`     | String | 时间来源 (GPS/System)          | `time_source`                   |
| `M_STALAT`   | Float  | 站点纬度 (WGS84, Degrees)      | `station_location[0]`           |
| `M_STALON`   | Float  | 站点经度 (WGS84, Degrees)      | `station_location[1]`           |
| `M_STAALT`   | Float  | 站点海拔 (Meters)              | `station_location[2]`           |
| `M_COLOR`    | String | 色彩空间 (A, RGB, RGGB等)      | `color`                         |
| `M_CONTS`    | String | 内容清单，逗号分隔             | `contents`                      |
| `M_W`, `M_H` | Int    | 图像宽、高                     | `image_width/height`            |
| `M_FCNT`     | Int    | 总帧数                         | `frame_count`                   |
| `M_PROCT`    | String | 处理时间                       | `processed_time`                |
| `M_*_MTH`    | String | 各阶段算法方法名               | `time_method`, `star_method` 等 |

### 2.2 Data 部分：合成位图 (Composite Bitmap)

为了节省空间，主 HDU 的 Data 部分不存储视频流，而是存储一张 **uint8** 格式的二维图像，用于指示遮罩和流星区域。数据通过位运算编码：

- **Bit 6 (Value 64)**: 遮罩层 (Mask)。如果该像素是遮罩区域，则置位。
- **Bit 7 (Value 128)**: 信号层 (Signal)。如果该像素属于流星区域，则置位。

**解析示例：**

- 像素值 `0`: 背景。
- 像素值 `64`: 被遮挡区域。
- 像素值 `128`: 流星信号。
- 像素值 `192` (`64+128`): 遮罩区域内的信号（理论上不应发生，但格式支持）。

---

## 3. Image Sequence HDUs (序列帧)

每一帧视频数据被存储为一个独立的 `ImageHDU`。

- **Naming Convention**: `EXTNAME` = `M_FRAME_{DDDDD}` (例如 `M_FRAME_00000`, `M_FRAME_00123`)。
- **Data**: 图像矩阵 (Height, Width)。如果是 Bayer 或 RGB，将在后续版本扩展维度，当前实现主要支持单通道亮度数据。

### 3.1 逐帧元数据与流星坐标

OMDX 的一个设计特色是将流星的瞬时位置存储在对应帧的 Header 中，而非单独的表格。这使得播放器在读取某一帧图像时，能立即获取该帧上的所有流星位置。

#### Header 关键字

| 关键字    | 类型  | 说明                           |
| :-------- | :---- | :----------------------------- |
| `M_FTIME` | Float | 相对 `M_MEANT` 的时间偏移 (秒) |
| `M_EXPOS` | Float | 该帧曝光时间 (秒)              |

#### 流星对象关键字 (Object Keywords)

如果该帧检测到了流星（或卫星），使用十六进制索引 `{ID}` (如 `00`, `01`, `0A`) 来区分不同目标：

- **`M_O_PX{ID}`** / **`M_O_PY{ID}`**: 目标的像素坐标 (X, Y)。
- **`M_O_EX{ID}`** / **`M_O_EY{ID}`** / **`M_O_EZ{ID}`**: 目标的 ECI J2000 空间坐标 (X, Y, Z)。
- **`M_O_FX{ID}`**: 光通量 (Flux)。
- **`M_O_MG{ID}`**: 视星等 (Magnitude)。

**示例 Header 片段：**

```text
M_FTIME = 0.040        / Frame time offset
M_EXPOS = 0.033        / Exposure time
M_O_PX00 = 1234.5      / Object 00 Pixel X
M_O_PY00 = 567.8       / Object 00 Pixel Y
M_O_MG00 = -1.5        / Object 00 Magnitude
```

---

## 4. BinTable HDU: M_STAR (星表与模型)

该扩展名为 `M_STAR`，是一个二进制表格（Binary Table）。

### 4.1 Header：模型参数

相机校准和测光模型的参数作为 Header 关键字存储。为了兼容 FITS 关键字长度限制，Python 中的字典 Key 会被截断为 4 个字符并大写。

- **`M_C_{KEY}`**: 校准模型参数 (Calibration)。例如 Python 中的 `r00` 变为 `M_C_R00`。
- **`M_P_{KEY}`**: 测光模型参数 (Photometry)。
- **`M_CRSLT`**: 校准结果描述字符串。
- **`M_CRES`** / **`M_PRES`**: 校准残差 / 测光残差。

### 4.2 Table Data：参考恒星

表格包含用于定标的恒星列表，列定义如下：

| 列名 (TTYPE) | 单位   | 说明                   |
| :----------- | :----- | :--------------------- |
| `star_name`  | String | 恒星标识 (如 HIP 编号) |
| `star_pic_x` | Pix    | 图像 X 坐标            |
| `star_pic_y` | Pix    | 图像 Y 坐标            |
| `star_eci_x` | km     | ECI J2000 X 坐标       |
| `star_eci_y` | km     | ECI J2000 Y 坐标       |
| `star_eci_z` | km     | ECI J2000 Z 坐标       |
| `star_mag`   | mag    | 目录星等               |
| `star_flux`  | ADU    | 实测光通量             |
