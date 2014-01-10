# vmx

一个简单好用的 velocity 模板工具。

---

#### 翻译模板

```
# 转换指定文件到 targetdir
$ vmx file.vm -t targetdir

# 递归转换指定文件
$ vmx file.vm -t targetdir -r

# 转换指定模板语言
$ vmx file.vm -t targetdir -T handbars
```

#### 查看变量使用

```
# 递归查看指定文件所有变量
$ vmx file.vm -ra

# 查看指定文件
$ vmx file.vm variable

# 递归查看指定文件
$ vmx file.vm variable -r

# 查看 --roots 中的目录
$ vmx variable
```

#### 查看依赖和反向依赖

```
# 直接依赖
$ vmx file.vm

# 递归依赖
$ vmx file.vm -r

# 直接反向依赖
$ vmx file.vm -R

# 递归反向依赖
$ vmx file.vm -Rr
```
