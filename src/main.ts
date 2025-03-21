type Config = {
  [key: string]: Section;
};

type QuotedString = string;

type Value = {
  value: string | number | boolean | Section;
  type: "string" | "number" | "boolean" | "section";
};

type Section = { comment?: string } & {
  [key: string]: Value | Section;
};

const exampleConfig = `container {
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
firewall { // Section
    group {
        address-group ADR_NMS_ENIX_V4 {  // Named Section
            address 193.19.211.182
            description nms.enix.org
        }
        network-group NET_ENIXPRIV_V4 {
            description "Public addresses of ENIX-PRIV"
            network 193.19.208.32/29
        }
    }
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
}
service {
    https {
        allow-client {
            address 193.19.208.33/29
            address 0.0.0.0/0
        }
        api {
            graphql {
                authentication {
                    type key
                }
                introspection
            }
            keys {
                id KID {
                    key ****************
                }
                id lperdereau {
                    key ****************
                }
            }
            rest {
                debug
            }
        }
        enable-http-redirect
        port 443
    }
    ntp {
        allow-client {
            address 0.0.0.0/0
            address ::/0
        }
        server time1.vyos.net {
        }
        server time2.vyos.net {
        }
        server time3.vyos.net {
        }
    }
    ssh {
        client-keepalive-interval 180
        port 22
    }
}
system {
    config-management {
        commit-revisions 100
    }
    conntrack {
        modules {
            ftp
            h323
            nfs
            pptp
            sip
            sqlnet
            tftp
        }
    }
    domain-search enix.fr
    host-name vyos-lperdereau-1
    login {
        user vyos {
            authentication {
                encrypted-password ****************
            }
        }
    }
    name-server 8.8.8.8
    syslog {
        global {
            facility all {
                level notice
            }
            facility local7 {
                level debug
            }
        }
    }
}
`;

const parseSection = (input: string) => {
  console.log("parseSection", input);
  let currentDepth = 0;
  let breakPoint = 0;
  for(let i = 0; i < input.length; i++) {
    if(input[i] === "{") {
      currentDepth++;
      continue;
    }
    if(currentDepth <= 0){
      continue;
    }
    if(input[i] === "}") {
      currentDepth--;
    }
    if(currentDepth === 0) {
      breakPoint = i;
      break;
    }
  }
  return {section: input.substring(0, breakPoint+1), rest: input.substring(breakPoint + 2)}
};

const parseSections = (input: string) => {
  const sections: string[] = [];
  let inputLeft = input;

  while (true) {
    const {section, rest} = parseSection(inputLeft);
    sections.push(section);
    inputLeft = rest;
    if(inputLeft.length === 0) {
      break;
    }
  }
  console.log(sections);
  return sections;
};

console.log(parseSections(exampleConfig));
