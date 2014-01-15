# 开发笔记

## 依赖关系解析

#### 不处理的情况

- `#[[ unparsed content ]]#`
- `#macro`
  - 内联：仅可查找到定义中的依赖，也就是说如果依赖路径为变量，则无法获知被调用时到底传入的是哪个变量
  - 全局：无法判定

### 翻译难点

- [velocity 功能扩展](http://velocity.apache.org/engine/devel/overview.html)
  - 注入 context 的工具方法 （在新平台如何处理？）
- $obj.Name 可匹配 obj.Name 和 obj.getName （obj.name 是否也自动匹配？）
- 全局 #macro
- 指向 uisvr 和 cms 的引用

##### 注意事项

- 使用版本
- 配置项

### 基本前提

- 不检查任何语法错误，解析程序来保证。
- 不支持设值：`$user.setAddr("new address")`

### vm

- [处理 velocity 解析器由 JavaCC 生成](http://velocity.apache.org/engine/devel/overview.html)
- arg is parsed if enclosed in double quotes, and not parsed if enclosed in single quotes.
- Range operator `#set( $monkey.Numbers = \[1..3\] )`
- 支持简单的算术运算
- 定义新变量：#set, #define, #macro
- 内置变量 #foreach 中的 $foreach
- Unparsed Content: #\[\[...\]\]#
- 不太用的指令(以收银台为例)
  - 只有全局 #macro
  - 没有使用的：#include, #stop, #evaluate, #define
  - 只用了一次：#break

