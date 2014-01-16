# vmx

A velocity template tool that can view dependencies, variables and translate it.

一个可以查看依赖、变量和翻译成其他模板的 velocity 模板工具。

[建议与反馈](https://github.com/fool2fish/vmx/issues/new)

---

## 一、快速上手

使用前请运行 `$ vmx config` 进行必要的配置。

```
{
  "directives": ["include", "parse", "cmsparse"],
  "roots": [
    "{{cashierTemplateRoot}}",
    "{{uisvrTemplateRoot}}",
    "{{cmsTemplateRoot}}"
  ]
}
```

- `directives` 指定产生依赖关系的指令，默认为  `["include", "parse"]`。
- `roots` 指定 **模板** 根目录（绝对路径），无默认值。

保存配置文件后，赶紧运行一把 `$ vmx {{yourFile}} -r` 来查看 `{{yourFile}}` 的递归依赖, 你将看到类似下图的依赖树：

![vmx](https://f.cloud.github.com/assets/340282/1929678/d0b1c9dc-7e9b-11e3-94fb-6bfb41903726.png)

查看反向依赖只需要加上配置项 `-R`。反向依赖需要进行全量遍历，速度可能较慢。

### 为多个项目配置 roots

```
{
  "roots": {
    "default": [
      "{{cashierTemplateRoot}}",
      "{{uisvrTemplateRoot}}",
      "{{cmsTemplateRoot}}"
    ],
    "wkprod": [
      "{{wkprodTemplateRoot}}",
      "{{uisvrTemplateRoot}}",
      "{{cmsTemplateRoot}}"
    ]
  }
}
```

配置后运行 `$ vmx {{yourFile}} -r`， `roots` 自动使用 `default` 的值，你还可以指定 `$ vmx {{yourFile}} -r -o wkprod` 使用 `wkprod` 的值。

更多配置项请运行 `$ vmx -h` 查看。

## 二、使用说明

### 查看依赖和反向依赖

```
# 直接依赖
$ vmx file.vm

# 递归依赖，并显示更多内容
$ vmx file.vm -rV

# 直接反向依赖
$ vmx file.vm -R

# 递归反向依赖
$ vmx file.vm -Rr

# 所有有反向依赖的文件
$ vmx

# 所有无反向依赖的文件
$ vmx -R
```

##### 注意：导致依赖不准确的情况

- 遗漏：在非内联 `#macro` 中引入依赖
- 冗余：在不解析区块 `#[[…]]#` 中引入依赖


### 查看变量使用 (实现中)

```
# 递归查看指定文件所有变量
$ vmx file.vm _ -r

# 查看指定文件中的变量
$ vmx file.vm variable

# 递归查看指定文件的变量
$ vmx file.vm variable -r

```


### 翻译模板 (实现中)

```
# 翻译指定文件到 targetdir
$ vmx file.vm -t targetdir

# 递归翻译指定文件
$ vmx file.vm -t targetdir -r

# 翻译成指定模板语言
$ vmx file.vm -t targetdir -T handbars
```
