# 开发笔记

### vmx 的假设前提

- 不检查任何语法错误，解析程序来保证。

### vm

- [处理 velocity 解析器由 JavaCC 生成](http://velocity.apache.org/engine/devel/overview.html)
- arg is parsed if enclosed in double quotes, and not parsed if enclosed in single quotes.
- Range operator `#set( $monkey.Numbers = \[1..3\] )`
- 支持简单的算术运算
- 定义新变量：#set, #define, #macro
- 内置变量 #foreach 中的 $foreach
- Unparsed Content: #\[\[...\]\]#

### 开发注意事项

- 使用版本
- 配置项
- [Extending Velocity's Capability](http://velocity.apache.org/engine/devel/overview.html)
 - 注入 context 的工具方法（这类方法是否会返回给前端平台的请求？可以在新模板中运行？模板自动转换可能需要先修改这部分的数据输出）
- purchase.getTotal() 可能等同 purchase.Total（purchase.total 是否也会自动匹配 get 或 set 方法？）
- uisvr 和 cmsparse 需要同时迁移
