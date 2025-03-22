import { parseConfig } from "../src/parser";

const test = `
container {
    name ui {
        allow-host-networks
        environment NODE_TLS_REJECT_UNAUTHORIZED {
            value 0
        }
        image ghcr.io/lperdereau/vyos-ui:v0.0.1-alpha4
        volume socket {
            destination /run/api.sock
            source /run/api.sock
        }
    }
}
firewall {
    ipv4 {
        name ALLOW_ALL {
            default-action accept
        }
        name DENY_ALL {
            default-action drop
        }
    }
    zone LAN {
        default-action drop
        from LOCAL {
            firewall {
                name ALLOW_ALL
            }
        }
        member {
            interface eth1
        }
    }
    zone LOCAL {
        from WAN {
            firewall {
                name ALLOW_ALL
            }
        }
        local-zone
    }
    zone WAN {
        from LOCAL {
            firewall {
                name ALLOW_ALL
            }
        }
        member {
            interface eth0
        }
    }
}
interfaces {
    ethernet eth0 {
        address dhcp
        hw-id bc:24:11:82:a3:e4
        mtu 1500
    }
    ethernet eth1 {
        hw-id bc:24:11:3b:46:93
    }
    loopback lo {
    }
}
protocols {
    bgp {
        neighbor 10.1.1.1 {
            address-family {
                ipv4-unicast {
                }
            }
            remote-as 4001
        }
        neighbor 10.1.1.2 {
            address-family {
                ipv4-multicast {
                }
            }
            remote-as 4003
        }
        parameters {
            router-id 10.14.99.190
        }
        system-as 64517
    }
}`;

const assert = {
  "container": {
    "name ui": {
      "allow-host-networks": true,
      "environment NODE_TLS_REJECT_UNAUTHORIZED": {
        "value": "0"
      },
      "image": "ghcr.io/lperdereau/vyos-ui:v0.0.1-alpha4",
      "volume socket": {
        "destination": "/run/api.sock",
        "source": "/run/api.sock"
      }
    }
  },
  "firewall": {
    "ipv4": {
      "name ALLOW_ALL": {
        "default-action": "accept"
      },
      "name DENY_ALL": {
        "default-action": "drop"
      }
    },
    "zone LAN": {
      "default-action": "drop",
      "from LOCAL": {
        "firewall": {
          "name": "ALLOW_ALL"
        }
      },
      "member": {
        "interface": "eth1"
      }
    },
    "zone LOCAL": {
      "from WAN": {
        "firewall": {
          "name": "ALLOW_ALL"
        }
      },
      "local-zone": true
    },
    "zone WAN": {
      "from LOCAL": {
        "firewall": {
          "name": "ALLOW_ALL"
        }
      },
      "member": {
        "interface": "eth0"
      }
    }
  },
  "interfaces": {
    "ethernet eth0": {
      "address": "dhcp",
      "hw-id": "bc:24:11:82:a3:e4",
      "mtu": "1500"
    },
    "ethernet eth1": {
      "hw-id": "bc:24:11:3b:46:93"
    },
    "loopback lo": {}
  },
  "protocols": {
    "bgp": {
      "neighbor 10.1.1.1": {
        "address-family": {
          "ipv4-unicast": {}
        },
        "remote-as": "4001"
      },
      "neighbor 10.1.1.2": {
        "address-family": {
          "ipv4-multicast": {}
        },
        "remote-as": "4003"
      },
      "parameters": {
        "router-id": "10.14.99.190"
      },
      "system-as": "64517"
    }
  }
};

const parsed = parseConfig(test);

const result = JSON.stringify(parsed, null, 2) === JSON.stringify(assert, null, 2);
console.log(result ? "Test parser passed" : "Test parser failed");
