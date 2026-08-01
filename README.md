# 曜石云 · 岩板报价系统

面向岩板企业的销售、合同及智能报价 Web 系统。当前版本已包含 Node.js 后端、JSON 数据持久化、多业务页面路由和可配置计价规则，不再是只能浏览的静态占位页面。

## 在 Cursor 中运行

### 1. 准备环境

安装 [Node.js](https://nodejs.org/) 18 或更高版本，然后在 Cursor 中选择 **File → Open Folder**，打开本项目根目录（能看到 `package.json` 的目录）。在 Cursor 集成终端中检查版本：

```bash
node -v
```

本项目只使用 Node.js 内置模块，不需要执行 `npm install`。

### 2. 启动服务

可以任选一种方式：

**方式 A：使用 Cursor 终端**

打开 **Terminal → New Terminal**，在项目根目录执行：

```bash
npm start
```

看到以下输出即表示启动成功：

```text
曜石云已启动：http://localhost:4173
```

**方式 B：使用已配置的 Cursor Task**

按 `Ctrl/Cmd + Shift + P`，输入并选择 **Tasks: Run Task**，然后选择 **启动曜石云**。

**方式 C：使用 Cursor 调试器**

打开左侧 **Run and Debug** 面板，选择 **调试曜石云服务**，点击运行按钮或按 `F5`。这种方式可以在 `server.js` 中设置断点。

### 3. 打开网页

浏览器访问 [http://localhost:4173](http://localhost:4173)。请勿直接双击 `index.html`，也不要使用 Live Server 打开 HTML；这两种方式不会启动本项目的后端接口。

停止服务时，在运行服务的终端按 `Ctrl + C`；调试模式下点击 Cursor 的停止按钮。

### 常见问题

- **提示 `node` 或 `npm` 不是命令**：Node.js 尚未安装，或安装后没有重启 Cursor。
- **页面提示“无法连接后端”**：确认终端中的服务仍在运行，并访问的是 `http://localhost:4173`。
- **提示端口 4173 被占用**：macOS/Linux 可执行 `PORT=4174 npm start`，Windows PowerShell 可执行 `$env:PORT=4174; npm start`，然后访问对应端口。
- **修改用户名后页面没变化**：进入“系统管理 → 企业与账号”修改并保存。用户名来自后端数据文件 `data/store.json`，而不是 `index.html`。

## 当前功能

- 工作台：经营指标、销售趋势、业务待办和产品排行
- 我的流程：审批及业务协同事项
- 客户关系：客户列表、搜索和新增客户，数据持久化保存
- 销售合同：智能报价、报价管理、合同下单和合同管理
- 产品库存：岩板材料、规格、基价和库存数据
- 统计看板：报价金额、合同转化率和业务漏斗
- 系统管理：企业资料、当前账号姓名、默认税率和定制加工价格
- 后端计价：依据产品面积、销售基价、采购数量、损耗率及加工规则核算

## 关于用户名

页面显示的当前用户由 `data/store.json` 中的企业账号配置通过后端接口提供，而不是依赖 `index.html` 中的静态文字。可在“系统管理 → 企业与账号”修改姓名，保存后会持久化并立即同步到页面各处。

## 检查

```bash
npm run check
npm test
```
