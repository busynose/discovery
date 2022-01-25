# discovery
本仓库实现局域网设备发现
## 实现流程
- 向IP 224.0.1.77  端口20000 ，发送包含当前设备IP 的UDP包
- 监听当前设备20001端口，下位机会发送局域网内发现的设备IP
- 发送消息格式     "92.168.13.107"
- 返回数据格式     "eth0:0:169.254.2.1 eth0:192.168.13.107 wlan0:10.10.200.77 wlan1:192.168.40.1 usb0:201.234.3.1" 

参考文档：http://172.16.50.203:8090/pages/viewpage.action?pageId=42842892
## demo
```js
const Discovery = require("../dist/discovery.js");

let Net = require("../dist/discovery.js")

let discoverInstance = new Discovery()

discoverInstance.searchMachine();
```