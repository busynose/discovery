const dgram = require("dgram");
const os = require("os");
const net = require("net");
const socket = dgram.createSocket("udp4"); 

const multicastAddr = "224.0.1.77";
const serverPort = 20001;
const clientPort = 20000;

interface nInterface {
    address: string
    netmask: string
    family: string
    mac :string 
    internal: boolean
    scopeid: number
    cidr :string
}

interface deviceNet {
  wlan: Set<string>
  eth:  Set<string>
}

// 扫描局域网设备方案：
// 1、向IP 224.0.1.77  端口20000 ，发送包含当前设备IP 的UDP包
// 2、监听当前设备20001端口，下位机会发送局域网内发现的设备IP
// 发送消息格式     "92.168.13.107"
// 返回数据格式     "eth0:0:169.254.2.1 eth0:192.168.13.107 wlan0:10.10.200.77 wlan1:192.168.40.1 usb0:201.234.3.1"
module.exports = class Discovery {
  tcpServer: any;
  localNets: string[];
  deviceNets: deviceNet;

  constructor() {
    this.tcpServer = null;
    this.localNets = [];
    this.deviceNets = {wlan: new Set(), eth: new Set()};
    this.init();
  }

  init() {
    this.startServer();
  }

  getDeviceNets() : deviceNet{
    return this.deviceNets;
  }

  startServer() {
    let _self = this;
    this.tcpServer = net.createServer();

    this.tcpServer.on("connection", (conn: any) => {
      conn.setEncoding("utf-8");
      conn.on("data", (data: any) => {
        _self.parseNetList(data);
      });
    });

    this.tcpServer.listen(serverPort, function () {
      console.log("tcp服务监控端口:", serverPort);
    });
  }

  searchMachine() {
    this.sendMulticastMessage();
  }

  sendMulticastMessage() {
    this.getNetList();
    let message = this.localNets.join(" ");
    console.log("组播udp包...");
    socket.send(message, 0, message.length, clientPort, multicastAddr);
  }

  parseNetList(netListRaw: any) {
    let netListString: string = netListRaw.toString();
    let netLists = netListString.trim().split(" ");
    console.log(netListString);
    netLists.forEach((net) => {
      let addresses = net.split(":");
        for (let address of addresses) {
          if (isValidIP(address)) {
            if (net.indexOf("wlan") > -1 ) {
              this.deviceNets.wlan.add(address);
            } else if(net.indexOf("eth") > -1 ){
              this.deviceNets.eth.add(address);
            }
          }
        }
    });
    console.log("设备列表：", this.deviceNets);
  }

  getNetList() {
    let interfacesArray = os.networkInterfaces();
    let addresses: string[] = [];
    for (let interfaces in interfacesArray) {
      for (let i in interfacesArray[interfaces]) {
        let nInterface = interfacesArray[interfaces][i];
        if (this.isInterfaceValid(nInterface)) {
          addresses.push(nInterface.address);
        }
      }
    }
    this.localNets = addresses;
    console.log("本地有效网卡地址:", addresses);
  }

  isInterfaceValid(interfaceInstance: nInterface) : boolean {
    const ipv4Family = "IPv4";
    const addressFilter : string[] =  ["169.254", "201.234.3"]
    if (interfaceInstance.family !== ipv4Family) {
      return false
    }

    for (let filter of addressFilter) {
      if (interfaceInstance.address.indexOf(filter) != -1) {
        return false
      }
    }

    if (interfaceInstance.internal) {
      return false
    }

    if (!interfaceInstance.address) {
      return false
    }

    return true
  }
};

function isValidIP(ip: string) { 
  var reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/ 
  return reg.test(ip); 
}
