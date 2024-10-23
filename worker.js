// Developed by Surfboardv2ray, https://github.com/Surfboardv2ray/Trojan-worker
// Version 1.3
// Tips: Change your subLinks accordingly. Note that only ws+tls+443 configs will work.
// Your subscription link will be: 'https://{your_worker_address}.workers.dev/sub/{your_clean_ip}'
// To get xxx number of configs, use '?n=xxx' at the end of your subscription link, for instance:
// 'https://{your_worker_address}.workers.dev/sub/{your_clean_ip}?n=50' will return only 50 configs, randomly.

const subLinks = [
  'https://raw.githubusercontent.com/Surfboardv2ray/Proxy-sorter/main/ws_tls/proxies/wstls',
  'https://raw.githubusercontent.com/itsyebekhe/HiN-VPN/main/subscription/normal/trojan',
  'https://raw.githubusercontent.com/Surfboardv2ray/TGParse/refs/heads/main/configtg.txt',
  'https://raw.githubusercontent.com/soroushmirzaei/telegram-configs-collector/refs/heads/main/protocols/trojan',
  'https://raw.githubusercontent.com/yebekhe/V2Hub/main/Split/Normal/trojan',
  'https://raw.githubusercontent.com/itsyebekhe/vpnfail/refs/heads/main/subscription',
//  'https://raw.githubusercontent.com/Surfboardv2ray/v2ray-worker-sub/refs/heads/master/providers/providers',    // Add more links here as needed
];

export default {
  async fetch(request) {
    let url = new URL(request.url);
    let pathSegments = url.pathname.split('/').filter(segment => segment !== '');
    let realhostname = pathSegments[0] || '';
    let realpathname = pathSegments[1] || '';

    // Handle the base URL ("/")
    if (url.pathname === '/') {
      // Return the HTML content
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>Trojan-worker</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f0f8ff;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    flex-direction: column;
                }
                .container {
                    text-align: center;
                    padding: 20px;
                    border-radius: 10px;
                    background-color: #ffffff;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                a {
                    color: #007BFF;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
                p {
                    margin: 20px 0;
                }
                button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    background-color: #007BFF;
                    color: #ffffff;
                    cursor: pointer;
                    margin-top: 20px;
                }
                button:hover {
                    background-color: #0056b3;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Developed by Surfboardv2ray</h1>
                <p><a href="https://github.com/Surfboardv2ray/Trojan-worker" target="_blank">https://github.com/Surfboardv2ray/Trojan-worker</a></p>
                <p>Your Subscription link will be:</p>
                <p id="subscription-link"><strong>https://{worker-address}/sub/{clean-ip}</strong></p>
                <button id="get-clean-ip">Get Clean IP</button>
            </div>
            <script>
                document.getElementById('get-clean-ip').onclick = async function() {
                    const response = await fetch('https://raw.githubusercontent.com/ircfspace/cf2dns/refs/heads/master/list/ipv4.json');
                    const data = await response.json();
                    const randomIndex = Math.floor(Math.random() * data.length);
                    const cleanIP = data[randomIndex].ip;
                    const workerAddress = window.location.hostname;
                    const subscriptionLink = \`https://\${workerAddress}/sub/\${cleanIP}\`;
                    document.getElementById('subscription-link').innerHTML = \`<a href="\${subscriptionLink}" target="_blank">\${subscriptionLink}</a>\`;
                }
            </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Create sets to store unique paths for each protocol
    let trojanPaths = new Set();
    let vlessPaths = new Set();
    let vmessPaths = new Set();

    if (url.pathname.startsWith('/sub')) {
      let newConfigs = '';

      // Fetch configurations from all subLinks
      for (let subLink of subLinks) {
        try {
          let resp = await fetch(subLink);
          if (!resp.ok) {
            continue;  // Skip invalid responses
          }
          let subConfigs = await resp.text();

          // Check if the content is base64 encoded
          let isBase64Encoded = false;
          try {
            atob(subConfigs);  // Try to decode it
            isBase64Encoded = true;
          } catch (e) {
            isBase64Encoded = false;  // Not base64 encoded
          }

          // Decode base64 content if encoded
          if (isBase64Encoded) {
            subConfigs = atob(subConfigs);
          }

          // Split configurations by lines
          subConfigs = subConfigs.split(/\r?\n/);

          for (let subConfig of subConfigs) {
            subConfig = subConfig.trim();  // Trim any leading/trailing whitespace
            if (subConfig === '') continue;  // Skip empty lines

            try {
              if (subConfig.startsWith('vmess://')) {
                // Handle VMess configuration
                let vmessData = subConfig.replace('vmess://', '');
                vmessData = atob(vmessData);
                let vmessConfig = JSON.parse(vmessData);

                // Ensure WebSocket (ws) and port 443 for VMess
                if (
                  vmessConfig.sni &&
                  !isIp(vmessConfig.sni) &&
                  vmessConfig.net === 'ws' &&
                  vmessConfig.port === 443
                ) {
                  let configNew = {
                    v: '2',
                    ps: `Node-${vmessConfig.sni}`,
                    add: realpathname === '' ? url.hostname : realpathname,
                    port: vmessConfig.port,
                    id: vmessConfig.id,
                    net: vmessConfig.net,
                    type: 'ws',
                    host: url.hostname,
                    path: `/${vmessConfig.sni}${vmessConfig.path}`,
                    tls: vmessConfig.tls,
                    sni: url.hostname,
                    aid: '0',
                    scy: 'auto',
                    fp: 'chrome',
                    alpn: 'http/1.1',
                  };

                  // Check for unique paths and avoid duplications
                  let fullPath = configNew.path;
                  if (!vmessPaths.has(fullPath)) {
                    vmessPaths.add(fullPath);  // Add the path to the Set
                    let encodedVmess = 'vmess://' + btoa(JSON.stringify(configNew));
                    newConfigs += encodedVmess + '\n';
                  }
                }
              } else if (subConfig.startsWith('vless://')) {
                // Handle VLESS configuration
                let vlessParts = subConfig.replace('vless://', '').split('@');
                if (vlessParts.length !== 2) continue;  // Invalid format

                let uuid = vlessParts[0];
                let remainingParts = vlessParts[1].split('?');
                if (remainingParts.length !== 2) continue;  // Invalid format

                let [ipPort, params] = remainingParts;
                let [ip, port] = ipPort.split(':');
                if (!port) continue;  // Port is required

                let queryParams = new URLSearchParams(params);
                let security = queryParams.get('security');
                let sni = queryParams.get('sni');
                let alpn = queryParams.get('alpn');
                let fp = queryParams.get('fp');
                let type = queryParams.get('type');  // For WebSocket check

                // Ensure WebSocket (type=ws) and port 443 for VLESS
                if (
                  sni &&
                  !isIp(sni) &&
                  security === 'tls' &&
                  port === '443' &&
                  type === 'ws'
                ) {
                  let newPath = `/${sni}${queryParams.get('path') || ''}`;

                  // Check for unique paths and avoid duplications
                  if (!vlessPaths.has(newPath)) {
                    vlessPaths.add(newPath);  // Add the path to the Set
                    let newVlessConfig = `vless://${uuid}@${realpathname === '' ? url.hostname : realpathname}:${port}?encryption=none&security=${security}&sni=${url.hostname}&alpn=${alpn}&fp=chrome&allowInsecure=1&type=ws&host=${url.hostname}&path=${newPath}#Node-${sni}`;
                    newConfigs += newVlessConfig + '\n';
                  }
                }
              } else if (subConfig.startsWith('trojan://')) {
                // Handle Trojan configuration

                // Find the last '#' to separate the remark
                let lastHashIndex = subConfig.lastIndexOf('#');
                let configWithoutRemark = subConfig;
                let remark = '';
                if (lastHashIndex !== -1) {
                  configWithoutRemark = subConfig.substring(0, lastHashIndex);
                  remark = subConfig.substring(lastHashIndex + 1);
                }

                // Now parse configWithoutRemark
                let trojanURL = configWithoutRemark.replace('trojan://', '');
                let [passwordAndHost, params] = trojanURL.split('?');
                if (!params) continue;  // Invalid format

                let [password, hostAndPort] = passwordAndHost.split('@');
                if (!hostAndPort) continue;  // Invalid format

                let [ip, port] = hostAndPort.split(':');
                if (!port) continue;  // Port is required

                let queryParams = new URLSearchParams(params);
                let security = queryParams.get('security');
                let sni = queryParams.get('sni');
                let alpn = queryParams.get('alpn');
                let fp = queryParams.get('fp');
                let type = queryParams.get('type');  // For WebSocket check

                // Ensure WebSocket (type=ws), TLS, and port 443 for Trojan
                if (
                  sni &&
                  !isIp(sni) &&
                  security === 'tls' &&
                  port === '443' &&
                  type === 'ws'
                ) {
                  let newPath = `/${sni}${decodeURIComponent(queryParams.get('path') || '')}`;

                  // Check for unique paths and avoid duplications
                  if (!trojanPaths.has(newPath)) {
                    trojanPaths.add(newPath);  // Add the path to the Set
                    let newTrojanConfig = `trojan://${password}@${realpathname === '' ? url.hostname : realpathname}:${port}?security=${security}&sni=${url.hostname}&alpn=${alpn}&fp=chrome&allowInsecure=1&type=ws&host=${url.hostname}&path=${encodeURIComponent(newPath)}#${remark ? encodeURIComponent(remark) : `Node-${sni}`}`;
                    newConfigs += newTrojanConfig + '\n';
                  }
                }
              }
            } catch (error) {
              // Skip non-compliant configurations and move to the next
              continue;
            }
          }
        } catch (error) {
          // Handle any fetch errors for subLink
          continue;
        }
      }

      // Check for the &n=xxx parameter
      const nParam = url.searchParams.get('n');
      let responseConfigs = newConfigs.trim().split('\n').filter(line => line !== ''); // Ensure no empty lines

      if (nParam && !isNaN(nParam) && parseInt(nParam) > 0) {
        const n = Math.min(parseInt(nParam), responseConfigs.length); // Get the minimum of n and available configs
        const randomConfigs = getRandomItems(responseConfigs, n); // Get random items
        return new Response(randomConfigs.join('\n'), {
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // If no &n=xxx parameter, return the entire result
      return new Response(newConfigs, {
        headers: { 'Content-Type': 'text/plain' },
      });
      
    } else {
      // Handle non-/sub requests by proxying them
      const url = new URL(request.url);
      const splitted = url.pathname.replace(/^\/*/, '').split('/');
      const address = splitted[0];
      url.pathname = splitted.slice(1).join('/');
      url.hostname = address;
      url.protocol = 'https';
      return fetch(new Request(url, request));
    }
  },
};

// Function to get random items from an array
function getRandomItems(array, count) {
  const shuffled = array.sort(() => 0.5 - Math.random()); // Shuffle the array
  return shuffled.slice(0, count); // Return the first 'count' items
}

function isIp(ipstr) {
  try {
    if (!ipstr) return false;
    // Regular expression to validate IPv4 addresses
    const ipv4Regex = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){3}$/;
    if (!ipv4Regex.test(ipstr)) {
      return false;
    }
    let segments = ipstr.split('.');
    // Ensure the last octet is not "0"
    if (segments[3] === '0') {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}
