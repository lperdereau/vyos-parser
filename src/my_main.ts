type Config = {
  [key: string]: Section;
};

type QuotedString = string;

type Value = QuotedString | string | number | boolean;

type Section = { comment?: string } & {
  [key: string]: Value | Section;
};

// Matches section start `interfaces {`
const SectionRegex = /^([\w-]+) \{$/u;

// Matches named section `ethernet eth0 {`
const NamedSectionRegex = /^([\w-]+) ([".\/@:=+\w-]+) \{$/u;
// SyntaxError: Invalid regular expression: /^([\w-]+) ([\w\-\"\.\/@:=\+]+) \{$/: Invalid escape

// Matches simple key-value pair `duplex auto`
const ValueRegex = /^([\w-]+) "?([^"]+)?"?$/u;

// Matches single value (flag) `disable`
// const FlagRegex = /^([\w-]+)$/u;

// Matches comments
const CommentRegex = /^(\/\*).*(\*\/)/u;


function parseComment(comment: string): string | null {
  const matches = comment.trim().match(CommentRegex);
  if (matches) {
    return matches[0];
  }
  return null;

}

function parseValue(value: string): Value | null {
  const matches = value.trim().match(ValueRegex);
  if (matches) {
    return matches[2];
  }
  return null;
}

function parseSection(input: string): Section | null {
  let matches = input.trim().match(SectionRegex);
  if (matches) {
    return { [matches[1]]: {} };
  }

  matches = input.trim().match(NamedSectionRegex);
  if (matches) {
    return { [`${matches[1]} ${matches[2]}`]: {} };
  }
  return null;
}

function parseNode(node: string, comment: string | null = null): { section: Section, jump: number } {
  const lines = node.split("\n");
  let currentSection: Section = {};
  if (comment) {
    currentSection.comment = comment;
  }

  let currentComment: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const comment = parseComment(line);
    if (comment) {
      currentComment = comment;
      continue;
    }

    const section = parseSection(line);
    if (section) {
      const { section: childSection, jump} = parseNode(lines.slice(i+1).join("\n"), currentComment);
      currentSection[line.replace(" {", "")] = childSection;
      i += jump+1;
      continue;
    }

    if (line === "}") {
      const jump = i;
      return { section: currentSection, jump };
    }

    const key_value = line.split(" ");
    const key = key_value[0];
    const value = key_value.length === 2 ? key_value[1] : true;
    currentSection[key] = value;
  }
  return { section: currentSection, jump: 0 };
}

function parseConfig(conf: string): Config | null {
  const lines = conf.split("\n");
  let config = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const comment = parseComment(line);
    if (comment) {
      continue;
    }

    const section = parseSection(line);
    if (section) {
      const { section: childSection, jump} = parseNode(lines.slice(i+1).join("\n"), null);
      section[Object.keys(section)[0]] = childSection;
      config = { ...config, ...section };
      i += jump;
      continue;
    }
  }
  return config;
}

const test = `container {
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
    group {
        address-group ADR_NMS_ENIX_V4 {
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
    /* DNS */
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
}`;
// console.log(JSON.stringify(parseNode(test)));
console.log(JSON.stringify(parseConfig(test)));
