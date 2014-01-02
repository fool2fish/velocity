# vmx

一个简单实用的 velocity 模板工具。

---

#### 查看模板的引用


```
# 直接引用
$ vmx file.vm

# 递归引用
$ vmx file.vm -r
```

#### 查看模板的反向引用

```
# 直接反向引用
$ vmx file.vm -R

# 递归反向引用
$ vmx file.vm -Rr
```

#### 查看变量使用情况

```
# 查看指定文件
$ vmx file.vm variable

# 递归查看指定文件
$ vmx file.vm variable -r

# 查看指定目录
$ vmx dir variable

# 查看当前目录
$ vmx variable
```

#### 模板转换

```
# 转换指定文件
$ vmx file.vm -t targetdir

# 递归转换指定文件

$ vmx file.vm -t targetdir -r

# 转换指定目录

$ vmx dir -t targetdir

# 转换当前目录
$ vmx -t targetdir

# 转换指定模板语言
$ vmx file.vm -t targetdir -T handbars
```