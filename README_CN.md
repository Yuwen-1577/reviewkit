# reviewkit

[![npm version](https://img.shields.io/npm/v/@yuwen_1577/reviewkit)](https://www.npmjs.com/package/@yuwen_1577/reviewkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)

[English](./README.md)

在代码提交前，自动检测安全漏洞、代码异味和风险变更。100% 本地运行，不需要 API key。

```bash
npx @yuwen_1577/reviewkit
```

## 效果演示

```
$ git add dangerous-file.ts && npx @yuwen_1577/reviewkit

ReviewKit — Code Review Report

  Summary:  1 file(s) changed, +36 -0. 3 critical issue(s) found

  Risk:     ████████████████████ 100/100

  Findings (7):

  ✖ config.ts     Possible hardcoded secret or credential    [hardcoded-secret]
  ✖ db.ts         SQL injection via string concatenation     [sql-injection]
  ✖ handler.ts    Dynamic code execution detected            [dangerous-exec]
  ▲ utils.ts      Empty catch block                          [empty-catch]
  ▲ main.ts       Recursive file deletion                    [dangerous-delete]
  ● app.ts        TODO/FIXME comment found                   [todo-comment]
  ● lib.ts        Console output left in code                [console-log]
```

## 检测能力

| 严重程度 | 检测规则 |
|----------|---------|
| 严重 | 硬编码密钥、SQL注入、危险的eval/exec调用 |
| 警告 | XSS（innerHTML）、不安全协议（HTTP）、空catch块、大规模删除、危险文件操作 |
| 提示 | 控制台日志残留、TODO/FIXME标记、lint抑制注释、大块代码变更 |

## 使用方法

```bash
# 审查暂存区的变更（默认）
reviewkit

# 审查未暂存的变更
reviewkit review --all

# 对比某个分支
reviewkit review --branch main

# 审查最近一次提交
reviewkit review --commit

# JSON格式输出（用于CI/CD）
reviewkit review --json

# 只看统计数据
reviewkit stats

# 生成changelog草稿
reviewkit changelog
```

## 安装

```bash
npm install -g @yuwen_1577/reviewkit
```

或者不安装直接跑：

```bash
npx @yuwen_1577/reviewkit
```

## CI/CD 集成

发现严重问题时 CLI 会以退出码 1 退出，可以直接当 CI 门禁用。

```yaml
# GitHub Actions
- name: Code Review
  run: npx @yuwen_1577/reviewkit review --commit --json
```

## 工作原理

reviewkit 解析 `git diff` 输出，用规则引擎匹配常见的安全和质量问题。数据不会离开你的机器，不需要 API key。

## 路线图

- [ ] AI深度审查（接入 Claude / OpenAI）
- [ ] 更多检测规则（依赖漏洞、复杂度分析）
- [ ] GitHub Actions 集成（PR自动评论）
- [ ] VS Code 插件

## 许可证

MIT
