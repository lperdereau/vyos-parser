import { expect, it } from 'vitest'
import { generateConfig } from "./generator";


const test = {
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
  "protocols": {
    "static": {
      "route 0.0.0.0/0": {
        "comment": "/* Default route */",
        "next-hop": "192.168.1.254"
      }
    }
  }
};

const assert = `container {
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
protocols {
  static {
    route 0.0.0.0/0 {
      /* Default route */
      next-hop 192.168.1.254
    }
  }
}
`;


it('generator', () => {
  const config = generateConfig(test);
  expect(config).toStrictEqual(assert);
})
