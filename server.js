/**
 * 太行鸡生态扩繁基地 · 慢直播后端服务
 * 技术栈: Node.js + Express + Socket.io
 * 用途: 软件著作权申报 - 完整前后端分离架构
 * 
 * 核心功能:
 * 1. RESTful API 接口
 * 2. WebSocket 实时推送
 * 3. IoT 传感器数据模拟
 * 4. 区块链溯源存证模拟
 * 5. API 请求日志记录
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ============ 初始化 ============
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  // 允许传输大文件（视频流相关信息）
  maxHttpBufferSize: 1e8
});

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 请求日志中间件（软著重要特性）
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms) - IP: ${req.ip}`);
    logApiCall(req, res.statusCode);
  });
  next();
});

// ============ 数据存储（内存模拟数据库） ============

// 传感器数据
let sensorData = {
  temperature: 22.3,
  humidity: 63,
  light: 2860,
  nh3: 1.8,
  soilMoisture: 46,
  windSpeed: 1.2,
  co2: 420,
  healthIndex: 92,
  updateTime: new Date().toISOString()
};

// 直播状态
let liveStatus = {
  isLive: true,
  currentViewers: 1284,
  peakViewers: 2300,
  startTime: new Date(Date.now() - 28 * 24 * 3600 * 1000 - 5 * 3600 * 1000).toISOString(),
  currentCameraId: 0,
  cameras: [
    { id: 0, name: "林下自由觅食区", previewUrl: "https://i.ibb.co/C5qr4Frz/20260502203859-251-18.jpg" },
    { id: 1, name: "山坡生态散养区", previewUrl: "https://i.ibb.co/8LQBwqpF/ji1.jpg" },
    { id: 2, name: "鸡舍栖架+沙浴区", previewUrl: "https://i.ibb.co/8g9xrZFT/20260502203900-252-18.jpg" }
  ],
  streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
};

// 设备列表
const equipmentList = [
  { id: 1, name: "环控风机", icon: "🌀", status: "在线", online: true, lastMaintain: "2026-05-20" },
  { id: 2, name: "水帘降温", icon: "💧", status: "自动调温", online: true, lastMaintain: "2026-05-15" },
  { id: 3, name: "传感器阵列", icon: "📡", status: "采集正常", online: true, lastMaintain: "2026-06-01" },
  { id: 4, name: "自动饮水线", icon: "🚰", status: "洁净供水", online: true, lastMaintain: "2026-05-25" },
  { id: 5, name: "补光灯带", icon: "💡", status: "智能调节", online: true, lastMaintain: "2026-05-28" },
  { id: 6, name: "脚环基站", icon: "🔗", status: "实时定位", online: true, lastMaintain: "2026-06-02" }
];

// 溯源数据（区块链模拟）
const traceData = {
  batchId: "ZHH2405",
  blockchainHash: "0x7f3a8e2c1b9a4d7f3e2c1b9a8e2c1b9a8e2c1b9a",
  blockchainExplorer: "https://bscscan.com/tx/0x7f3a8e2c1b9a4d7f",
  certified: true,
  certificationNo: "JNX-2026-0520",
  farm: "赞皇扩繁基地",
  breedDays: 180,
  slaughterDate: "2026-06-15",
  feedRecord: "五谷杂粮+林下虫草",
  vaccineRecord: "全周期无抗养殖",
  uploadTime: new Date().toISOString()
};

// API 调用日志存储（最多200条）
let apiLogs = [];
function logApiCall(req, statusCode) {
  const log = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    status: statusCode,
    userAgent: req.get('user-agent')?.substring(0, 50)
  };
  apiLogs.unshift(log);
  if (apiLogs.length > 200) apiLogs.pop();
}

// ============ 辅助函数 ============

// 统一响应格式
function successResponse(data, message = 'success') {
  return { code: 200, message, data, timestamp: Date.now() };
}

function errorResponse(message, code = 500) {
  return { code, message, timestamp: Date.now() };
}

// 传感器数据波动生成
function fluctuateSensorData() {
  const fluctuate = (val, range) => {
    const delta = (Math.random() - 0.5) * range;
    return Math.round((val + delta) * 10) / 10;
  };

  const newTemp = Math.min(32, Math.max(16, fluctuate(sensorData.temperature, 0.5)));
  const newHumidity = Math.min(85, Math.max(45, Math.round(fluctuate(sensorData.humidity, 2))));
  const newLight = Math.min(5200, Math.max(600, Math.round(fluctuate(sensorData.light, 120))));
  const newNh3 = Math.min(4.0, Math.max(0.6, fluctuate(sensorData.nh3, 0.15)));
  const newSoil = Math.min(70, Math.max(25, Math.round(fluctuate(sensorData.soilMoisture, 2.5))));
  const newWind = Math.min(3.0, Math.max(0.3, fluctuate(sensorData.windSpeed, 0.2)));
  const newCo2 = Math.min(800, Math.max(380, Math.round(fluctuate(sensorData.co2, 30))));

  // 计算健康指数
  let health = 85;
  if (newTemp >= 18 && newTemp <= 26) health += 5;
  if (newHumidity >= 55 && newHumidity <= 75) health += 3;
  if (newNh3 < 2.0) health += 4;
  if (newCo2 < 600) health += 3;
  const newHealth = Math.min(100, health);

  sensorData = {
    temperature: newTemp,
    humidity: newHumidity,
    light: newLight,
    nh3: newNh3,
    soilMoisture: newSoil,
    windSpeed: newWind,
    co2: newCo2,
    healthIndex: newHealth,
    updateTime: new Date().toISOString()
  };

  return sensorData;
}

// 观众数波动
function fluctuateViewers() {
  const change = Math.floor(Math.random() * 60) - 20;
  let newViewers = liveStatus.currentViewers + change;
  newViewers = Math.min(3500, Math.max(800, newViewers));
  liveStatus.currentViewers = newViewers;
  
  if (newViewers > liveStatus.peakViewers) {
    liveStatus.peakViewers = newViewers;
  }
  
  return { viewers: liveStatus.currentViewers, peak: liveStatus.peakViewers };
}

// ============ 定时任务 ============

// 每5秒更新传感器数据并广播
setInterval(() => {
  const newSensorData = fluctuateSensorData();
  io.emit('sensorUpdate', newSensorData);
  console.log(`[广播] 传感器数据: ${newSensorData.temperature}°C / ${newSensorData.humidity}% / 健康指数:${newSensorData.healthIndex}`);
}, 5000);

// 每8秒更新观众数并广播
setInterval(() => {
  const viewerData = fluctuateViewers();
  io.emit('viewerUpdate', viewerData);
  console.log(`[广播] 观众数: ${viewerData.viewers} (峰值: ${viewerData.peak})`);
}, 8000);

// 每30秒发送一次心跳广播（证明服务活跃）
setInterval(() => {
  io.emit('heartbeat', { timestamp: Date.now(), status: 'alive' });
}, 30000);

// ============ RESTful API 路由 ============

// 1. 健康检查
app.get('/api/health', (req, res) => {
  res.json(successResponse({
    status: 'ok',
    service: 'jinongxian-livestream-backend',
    version: '2.0.0',
    uptime: process.uptime(),
    nodeVersion: process.version
  }));
});

// 2. 获取直播状态
app.get('/api/live/status', (req, res) => {
  res.json(successResponse({
    isLive: liveStatus.isLive,
    currentViewers: liveStatus.currentViewers,
    peakViewers: liveStatus.peakViewers,
    startTime: liveStatus.startTime,
    currentCameraId: liveStatus.currentCameraId,
    cameras: liveStatus.cameras,
    streamUrl: liveStatus.streamUrl
  }));
});

// 3. 获取最新传感器数据
app.get('/api/sensor/latest', (req, res) => {
  res.json(successResponse(sensorData));
});

// 4. 获取传感器历史数据（最近20条，软著展示用）
const sensorHistory = [];
app.get('/api/sensor/history', (req, res) => {
  res.json(successResponse(sensorHistory.slice(-20)));
});

// 5. 获取设备列表
app.get('/api/equipment/list', (req, res) => {
  res.json(successResponse(equipmentList));
});

// 6. 获取区块链溯源信息
app.get('/api/trace/batch', (req, res) => {
  res.json(successResponse(traceData));
});

// 7. 切换摄像机机位
app.post('/api/live/camera/switch', (req, res) => {
  const { cameraId } = req.body;
  const camera = liveStatus.cameras.find(c => c.id === cameraId);
  
  if (!camera) {
    return res.status(400).json(errorResponse('机位不存在', 400));
  }
  
  liveStatus.currentCameraId = cameraId;
  console.log(`[操作] 切换机位: ${camera.name} (ID: ${cameraId})`);
  
  // WebSocket 广播机位切换
  io.emit('cameraChanged', { cameraId, camera });
  
  res.json(successResponse({ currentCameraId: cameraId, camera }, '机位切换成功'));
});

// 8. 上报观众数（前端主动上报，可选）
app.post('/api/live/viewers', (req, res) => {
  const { count } = req.body;
  if (count && typeof count === 'number' && count >= 800 && count <= 3500) {
    liveStatus.currentViewers = count;
    if (count > liveStatus.peakViewers) {
      liveStatus.peakViewers = count;
    }
    res.json(successResponse({ viewers: liveStatus.currentViewers, peak: liveStatus.peakViewers }));
  } else {
    res.status(400).json(errorResponse('无效的观众数', 400));
  }
});

// 9. 系统心跳上报
app.post('/api/system/heartbeat', (req, res) => {
  res.json(successResponse({ pong: true, timestamp: Date.now() }));
});

// 10. 获取 API 调用日志（运维用）
app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(successResponse(apiLogs.slice(0, limit)));
});

// 11. 手动更新传感器数据（演示用）
app.post('/api/sensor/update', (req, res) => {
  const { temperature, humidity, nh3 } = req.body;
  if (temperature) sensorData.temperature = temperature;
  if (humidity) sensorData.humidity = humidity;
  if (nh3) sensorData.nh3 = nh3;
  sensorData.updateTime = new Date().toISOString();
  
  // 重新计算健康指数
  let health = 85;
  if (sensorData.temperature >= 18 && sensorData.temperature <= 26) health += 5;
  if (sensorData.humidity >= 55 && sensorData.humidity <= 75) health += 3;
  if (sensorData.nh3 < 2.0) health += 4;
  sensorData.healthIndex = Math.min(100, health);
  
  io.emit('sensorUpdate', sensorData);
  res.json(successResponse(sensorData, '传感器数据已更新'));
});

// 12. 获取服务统计信息
app.get('/api/stats', (req, res) => {
  res.json(successResponse({
    activeConnections: io.engine.clientsCount,
    apiCallsToday: apiLogs.filter(log => 
      new Date(log.timestamp).toDateString() === new Date().toDateString()
    ).length,
    totalApiLogs: apiLogs.length,
    serverStartTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
  }));
});

// 13. 捕获未处理路由
app.use('*', (req, res) => {
  res.status(404).json(errorResponse(`路由 ${req.originalUrl} 不存在`, 404));
});

// ============ WebSocket 连接处理 ============
io.on('connection', (socket) => {
  console.log(`[WebSocket] 客户端连接: ${socket.id}，当前连接数: ${io.engine.clientsCount}`);
  
  // 发送初始数据给新连接的客户端
  socket.emit('sensorUpdate', sensorData);
  socket.emit('viewerUpdate', { viewers: liveStatus.currentViewers, peak: liveStatus.peakViewers });
  socket.emit('cameraChanged', { 
    cameraId: liveStatus.currentCameraId, 
    camera: liveStatus.cameras.find(c => c.id === liveStatus.currentCameraId)
  });
  socket.emit('equipmentUpdate', equipmentList);
  
  // 接收客户端消息
  socket.on('clientMessage', (data) => {
    console.log(`[WebSocket] 收到消息 from ${socket.id}:`, data);
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`[WebSocket] 客户端断开: ${socket.id}，原因: ${reason}，剩余连接: ${io.engine.clientsCount}`);
  });
  
  socket.on('error', (error) => {
    console.error(`[WebSocket] 错误 from ${socket.id}:`, error);
  });
});

// ============ 启动服务器 ============
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║   🌿 太行鸡生态扩繁基地 · 慢直播后端服务 (Node.js)                       ║
║                                                                          ║
║   📡 RESTful API:  http://localhost:${PORT}/api                          ║
║   🔌 WebSocket:     ws://localhost:${PORT}                               ║
║   🌐 前端页面:      http://localhost:${PORT}                             ║
║   📋 API 日志:      http://localhost:${PORT}/api/logs                    ║
║   📊 服务统计:      http://localhost:${PORT}/api/stats                   ║
║                                                                          ║
║   ═══════════════════════════════════════════════════════════════════    ║
║                                                                          ║
║   ✅ 软件著作权申报技术特征:                                              ║
║   • 前后端分离架构 (Express + WebSocket)                                 ║
║   • RESTful API 设计规范                                                 ║
║   • WebSocket 实时双向通信                                               ║
║   • 定时任务模拟 IoT 数据采集                                            ║
║   • 区块链溯源存证接口                                                   ║
║   • 完整的请求日志系统                                                   ║
║   • 统一响应格式 + 错误处理                                              ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
  `);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[关闭] 正在停止服务器...');
  io.close(() => {
    server.close(() => {
      console.log('[关闭] 服务器已停止');
      process.exit(0);
    });
  });
});
