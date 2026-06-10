# reviewkit

命令行代码审查工具。自动分析 git diff，检测安全漏洞、代码异味和风险等级。不需要 API key，纯本地运行。

```
npx reviewkit
```

## 检测能力

| 严重程度 | 检测内容 |
|----------|---------|
| 严重 | 硬编码密钥、SQL注入、危险的eval/exec调用 |
| 警告 | XSS风险、不安全协议、空catch块、大规模删除 |
| 提示 | 控制台日志残留、TODO/FIXME标记、lint抑制注释 |

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
npm install -g reviewkit
```

或者不安装直接跑：

```bash
npx reviewkit
```

## CI/CD 集成

```yaml
# GitHub Actions 示例
- name: Code Review
  run: npx reviewkit review --commit --json
```

发现严重问题时 CLI 会以退出码 1 退出，可以直接当 CI 门禁用。

## 工作原理

reviewkit 100% 本地运行。解析 `git diff` 输出，用规则引擎匹配常见的安全和质量问题。数据不会离开你的机器。

## 许可证

MIT
