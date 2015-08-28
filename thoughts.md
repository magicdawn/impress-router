# Thoughts

|-------------------|
|                   |
| Router            | should auto call next
|                   |
|-------------------|

|-------------------|
|                   |
| Layer             | 在 layer 完成后的next里
|                   | 恢复 basePath & path, 查找下一个匹配
|                   | 要是 layer 没有调用next, 这个router调用完毕, 后面恢复 basePath
|-------------------|


参考 express 4.x 分支代码
https://github.com/strongloop/express/blob/4.x/lib%2Frouter%2Findex.js