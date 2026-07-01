# 无畏契约风格 TPS 新手训练场

基于 Web 平台（Three.js + React + TypeScript）构建的第三人称射击（TPS）新手引导场景，视觉风格严格贴合《无畏契约（Valorant）》的战术美学，包含 7 个循序渐进的教学阶段。

## 技术栈

- **前端框架**：React 18 + TypeScript 5
- **构建工具**：Vite 6
- **样式方案**：Tailwind CSS 3
- **状态管理**：Zustand 5
- **3D 渲染**：three.js + @react-three/fiber 8 + @react-three/drei 9
- **音效**：Web Audio API（程序化合成，无需外部资源）

## 文件组织结构

```
游戏kimi/
├── .trae/documents/              # PRD 与 技术架构文档
├── public/                       # 静态资源（当前无外部资源，保留扩展）
├── src/
│   ├── components/
│   │   └── ui/                   # UI 组件
│   │       ├── Crosshair.tsx     # 准星
│   │       ├── DamageNumbers.tsx # 伤害数字
│   │       ├── HUD.tsx           # 主 HUD
│   │       ├── LoadingScreen.tsx # 加载页
│   │       ├── PerformancePanel.tsx # 性能面板
│   │       ├── ResultScreen.tsx  # 结算页
│   │       └── TutorialPanel.tsx # 教学提示
│   ├── scenes/
│   │   └── TrainingGround.tsx    # 3D 训练场景
│   ├── stores/
│   │   └── gameStore.ts          # Zustand 全局状态
│   ├── systems/
│   │   ├── audioManager.ts       # 音频与震动反馈
│   │   ├── cameraController.ts   # 第三人称/第一人称相机
│   │   ├── characterController.ts# 角色移动、跳跃、碰撞
│   │   ├── effectsSystem.ts      # 弹痕、粒子特效
│   │   ├── inputManager.ts       # 键盘鼠标输入
│   │   ├── performanceMonitor.ts # FPS/内存/画质自适应
│   │   ├── targetSystem.ts       # AI 训练目标
│   │   ├── tutorialManager.ts    # 7 阶段新手引导
│   │   └── weaponSystem.ts       # 射击、换弹、命中判定
│   ├── types/
│   │   └── index.ts              # TypeScript 类型定义
│   ├── utils/
│   │   ├── constants.ts          # 游戏常量与阶段配置
│   │   ├── localStorage.ts       # 进度存档
│   │   └── math.ts               # 数学与碰撞工具
│   ├── App.tsx                   # 应用根组件
│   ├── index.css                 # 全局样式与字体
│   ├── main.tsx                  # 入口
│   └── vite-env.d.ts             # Vite 类型
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 核心模块说明

| 模块 | 职责 |
|------|------|
| `TrainingGround` | 3D 场景渲染、光照、物体摆放、主循环 |
| `CharacterController` | WASD 移动、空格跳跃、重力、场景 AABB 碰撞 |
| `CameraController` | TPS/FPS 视角切换、鼠标瞄准、平滑跟随、碰撞规避 |
| `WeaponSystem` | 左键射击、R 换弹、射线命中、材质反馈 |
| `TargetSystem` | 静止/移动训练靶生成、巡逻、受击与销毁 |
| `TutorialManager` | 7 阶段任务判定、进度保存、智能提示 |
| `EffectsSystem` | 弹痕贴花、命中粒子、枪口闪光 |
| `AudioManager` | 程序化枪声、脚步声、命中音、UI 音、震动反馈 |
| `PerformanceMonitor` | FPS/内存统计、动态画质降级 |

## 7 个教学阶段

1. **角色移动**：使用 WASD 移动至橙色标记区域。
2. **视角控制**：移动鼠标将准星对准蓝色目标并保持 2 秒。
3. **基础射击**：点击左键击毁 3 个红色固定靶。
4. **换弹操作**：按 R 换弹并继续击毁目标。
5. **掩体利用**：穿越掩体区域到达终点。
6. **精准射击**：连续命中移动靶 5 次。
7. **综合考核**：60 秒内击毁所有考核目标。

## 操作说明

| 按键 | 功能 |
|------|------|
| W / A / S / D | 前后左右移动 |
| Shift（按住） | 加速奔跑 |
| 空格 | 跳跃 |
| 鼠标移动 | 控制视角 |
| 鼠标左键 | 开火 |
| 鼠标滚轮 | 调整第三人称相机距离 |
| R | 换弹 |
| V | 切换第一/第三人称 |

## 部署与运行指南

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

开发服务器默认运行在 http://localhost:5173/

### 生产构建

```bash
# 构建生产包
npm run build

# 本地预览生产包
npm run preview
```

构建产物位于 `dist/` 目录，可部署至任意静态托管服务（Vercel、Netlify、GitHub Pages、Nginx 等）。

### 部署示例（Nginx）

```nginx
server {
    listen 80;
    server_name tutorial.example.com;
    root /var/www/tutorial/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 浏览器兼容性

| 浏览器 | 最低版本 | 运行状态 |
|--------|----------|----------|
| Google Chrome | 120+ | 完全支持 WebGL 2.0、Shadow Map、后处理 |
| Mozilla Firefox | 120+ | 完全支持 |
| Apple Safari | 17+ | 支持 WebGL 2.0，部分后处理可降级 |

> 注意：游戏需要鼠标锁定（Pointer Lock API），请在桌面浏览器中以全屏或窗口模式运行。移动端浏览器不支持完整的鼠标控制，体验受限。

## 角色移动与反馈特性

- **双速移动**：默认行走（WASD），按住 Shift 切换为奔跑，速度差异明显且过渡平滑。
- **第一人称默认**：进入训练场即为第一人称视角，V 键可随时切换第三人称。
- **相机呼吸**：静止时相机有轻微上下起伏，模拟真实呼吸节奏。
- **移动晃动**：行走与奔跑时相机会产生与步频匹配的轻微晃动，奔跑时幅度更大。
- **动态脚步声**：根据行走/奔跑状态自动调整脚步间隔、音高与音量，与移动动画同步。

## 性能指标

- 目标帧率：60 FPS
- 内存占用：典型场景约 150–300 MB
- 动态画质：当平均 FPS 低于 45 时自动降低粒子数量与阴影质量

## 扩展建议

- 替换程序化模型为外部 glTF/GLB 角色与武器模型
- 接入真实音频文件以提升沉浸感
- 增加网络对战或排行榜功能
- 添加更多武器类型与敌人 AI 行为
