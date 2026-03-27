# AI Resume TS（中文说明）

一个前后端分离的 AI 简历项目，支持用户登录注册、简历创建与编辑、模板预览、AI 文案优化、PDF 文本解析导入等功能。

## 项目特性

- 用户系统：注册、登录、鉴权（JWT）
- 简历管理：创建、查询、更新、删除
- 简历编辑：个人信息、教育经历、工作经历、项目经历、技能、职业总结
- 模板预览：多模板切换与配色
- AI 能力：
- 职业总结优化（普通/流式）
- 工作经历优化（普通/流式）
- 上传简历文本并提取结构化 JSON
- 图片处理：支持头像上传与可选背景移除（ImageKit）
- 前后端链路追踪：`x-trace-id`

## 技术栈

- 前端：React 19 + TypeScript + Vite + Redux Toolkit + Tailwind CSS + Axios
- 后端：Node.js + Express 5 + TypeScript + Mongoose + JWT + OpenAI SDK
- 数据库：MongoDB
- 文件/图片：Multer + ImageKit

## 目录结构

```text
AI-Resume-ts/
├─ client/                 # 前端应用
│  ├─ src/
│  │  ├─ components/       # 编辑器、模板、首页等组件
│  │  ├─ pages/            # 页面（Home/Dashboard/Builder/Preview）
│  │  ├─ app/              # Redux store 与切片
│  │  ├─ configs/          # axios 配置等
│  │  └─ utils/            # PDF OCR 等工具
│  └─ package.json
├─ server/                 # 后端应用
│  ├─ controllers/         # 业务控制器
│  ├─ routes/              # 路由定义
│  ├─ middlewares/         # 中间件（鉴权）
│  ├─ modules/             # Mongoose 模型
│  ├─ configs/             # DB / AI / 上传配置
│  └─ server.ts            # 服务入口
└─ README.md
```

## 环境要求

- Node.js 18+（建议 LTS）
- npm 9+
- MongoDB（本地或云端）

## 环境变量

### 1) 前端：`client/.env`

```bash
VITE_BASE_URL=http://localhost:3000
```

说明：前端 Axios 的 `baseURL` 来自 `VITE_BASE_URL`，不填时会走同源请求。

### 2) 后端：`server/.env`

```bash
# 服务
PORT=3000

# 数据库
MONGODB_URL=mongodb://127.0.0.1:27017

# 鉴权
JWT_SECRET=your_jwt_secret

# AI Provider（至少配置一组）
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# 可选：兼容其他提供商命名
QWEN_API_KEY=
QWEN_BASE_URL=
QWEN_MODEL=
GEMINI_API_KEY=

# 可选：超时与代理
AI_TIMEOUT_MS=60000
PRO_SUMMARY_TIMEOUT_MS=155000
PRO_SUMMARY_MAX_TOKENS=140
JOB_DESC_TIMEOUT_MS=55000
UPLOAD_RESUME_TIMEOUT_MS=90000
HTTP_PROXY=
HTTPS_PROXY=

# 图片服务（更新简历头像时需要）
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
```

## 本地启动

在两个终端分别启动前后端。

### 1) 启动后端

```bash
cd server
npm install
npm run dev
```

默认地址：`http://localhost:3000`

### 2) 启动前端

```bash
cd client
npm install
npm run dev
```

默认地址：`http://localhost:5173`

## 常用脚本

### 前端 `client/package.json`

- `npm run dev`：开发模式
- `npm run build`：TypeScript 构建 + Vite 打包
- `npm run lint`：ESLint 检查
- `npm run preview`：预览构建产物

### 后端 `server/package.json`

- `npm run dev`：`tsx watch server.ts`
- `npm start`：`tsx server.ts`

## API 概览

### 用户

- `POST /api/users/register` 注册
- `POST /api/users/login` 登录
- `GET /api/users/data` 获取当前用户（需鉴权）
- `GET /api/users/resumes` 获取用户简历列表（需鉴权）
- `DELETE /api/users/resumes/delete/:resumeId` 删除简历（需鉴权）

### 简历

- `POST /api/resumes/create` 创建简历（需鉴权）
- `GET /api/resumes/get/:resumeId` 获取简历详情（需鉴权）
- `PUT /api/resumes/update` 更新简历（需鉴权，可上传头像）
- `DELETE /api/resumes/delete/:resumeId` 删除简历（需鉴权）

### AI

- `POST /api/ai/enhance-pro-sum` 优化职业总结
- `POST /api/ai/enhance-pro-sum-stream` 流式优化职业总结（SSE）
- `POST /api/ai/enhance-job-desc` 优化工作经历
- `POST /api/ai/enhance-job-desc-stream` 流式优化工作经历（SSE）
- `POST /api/ai/upload-resume` 上传简历文本并抽取结构化内容

说明：AI 路由会透传/生成 `x-trace-id`，便于前后端日志定位。

## 已知注意事项

- 后端启动时会连接 `MONGODB_URL/resume_builder_db`，若数据库不可用服务会退出。
- AI 相关接口依赖模型配置（`OPENAI_MODEL` 或 `QWEN_MODEL`）。
- 若开启头像上传与背景移除，请确保 `IMAGEKIT_PRIVATE_KEY` 已配置。
- OCR 与 PDF 文本提取依赖前端运行环境与上传文件质量，扫描件质量差时识别结果会受影响。

## 许可证

当前仓库未声明明确开源许可证，如需开源发布请补充 `LICENSE` 文件。
