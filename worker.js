// Developed by Surfboardv2ray, https://github.com/Surfboardv2ray/Trojan-worker
// Version 1.4.1
// Tips: Change your subLinks accordingly. Note that only ws+tls+443 configs will work.
// Your subscription link will be: 'https://{your_worker_address}.workers.dev/sub/{your_clean_ip}'
// To get xxx number of configs, use '?n=xxx' at the end of your subscription link, for instance:
// 'https://{your_worker_address}.workers.dev/sub/{your_clean_ip}?n=50' will return only 50 configs, randomly.

const subLinks = [
      'https://raw.githubusercontent.com/Surfboardv2ray/Proxy-sorter/main/ws_tls/proxies/wstls',
      'https://raw.githubusercontent.com/Surfboardv2ray/TGParse/refs/heads/main/configtg.txt',
      'https://raw.githubusercontent.com/soroushmirzaei/telegram-configs-collector/refs/heads/main/protocols/trojan',
      'https://raw.githubusercontent.com/soroushmirzaei/telegram-configs-collector/refs/heads/main/protocols/vmess',
      'https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/Eternity.txt',
    ];
    
    export default {
      async fetch(request) {
        let url = new URL(request.url);
        let pathSegments = url.pathname.split('/').filter(segment => segment !== '');
        let realhostname = pathSegments[0] || '';
        let realpathname = pathSegments[1] || '';
    
        if (url.pathname === '/') {
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
    
        let trojanPaths = new Set();
        let vlessPaths = new Set();
        let vmessPaths = new Set();
    
        if (url.pathname.startsWith('/sub')) {
          let newConfigs = '';
    
          for (let subLink of subLinks) {
            try {
              let resp = await fetch(subLink);
              if (!resp.ok) continue;
              let subConfigs = await resp.text();
              let isBase64Encoded = false;
    
              try { atob(subConfigs); isBase64Encoded = true; } catch (e) { isBase64Encoded = false; }
              if (isBase64Encoded) subConfigs = atob(subConfigs);
    
              subConfigs = subConfigs.split(/\r?\n/);
    
              for (let subConfig of subConfigs) {
                subConfig = subConfig.trim();
                if (subConfig === '') continue;
    
                try {
                  if (subConfig.startsWith('vmess://')) {
                    let vmessData = subConfig.replace('vmess://', '');
                    vmessData = atob(vmessData);
                    let vmessConfig = JSON.parse(vmessData);
    
                    if (vmessConfig.sni && !isIp(vmessConfig.sni) && vmessConfig.net === 'ws' && vmessConfig.port === 443) {
                      if (shouldSkipHost(vmessConfig.sni)) continue;
    
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
    
                      let fullPath = configNew.path;
                      if (!vmessPaths.has(fullPath)) {
                        vmessPaths.add(fullPath);
                        let encodedVmess = 'vmess://' + btoa(JSON.stringify(configNew));
                        newConfigs += encodedVmess + '\n';
                      }
                    }
                  } else if (subConfig.startsWith('vless://')) {
                        let vlessParts = subConfig.replace('vless://', '').split('@');
                        if (vlessParts.length !== 2) continue;
                    
                        let uuid = vlessParts[0];
                        let remainingParts = vlessParts[1].split('?');
                        if (remainingParts.length !== 2) continue;
                    
                        let [ipPort, params] = remainingParts;
                        let [ip, port] = ipPort.split(':');
                        if (!port) continue;
                    
                        let queryParams = new URLSearchParams(params);
                        let security = queryParams.get('security');
                        let sni = queryParams.get('sni');
                        let type = queryParams.get('type');
                        if (sni && !isIp(sni) && security === 'tls' && port === '443' && type === 'ws') {
                            if (shouldSkipHost(sni)) continue;
                    
                            let newPath = `/${sni}${decodeURIComponent(queryParams.get('path') || '')}`;
                            if (!vlessPaths.has(newPath)) {
                                vlessPaths.add(newPath);
                                let newVlessConfig = `vless://${uuid}@${realpathname === '' ? url.hostname : realpathname}:${port}?encryption=none&security=${security}&sni=${url.hostname}&alpn=http/1.1&fp=chrome&allowInsecure=1&type=ws&host=${url.hostname}&path=${newPath}#Node-${sni}`;
                                newConfigs += newVlessConfig + '\n';
                            }
                        }
                    }
                     else if (subConfig.startsWith('trojan://')) {
                    let lastHashIndex = subConfig.lastIndexOf('#');
                    let configWithoutRemark = subConfig;
                    let remark = '';
                    if (lastHashIndex !== -1) {
                      configWithoutRemark = subConfig.substring(0, lastHashIndex);
                      remark = subConfig.substring(lastHashIndex + 1);
                    }
    
                    let trojanURL = configWithoutRemark.replace('trojan://', '');
                    let [passwordAndHost, params] = trojanURL.split('?');
                    if (!params) continue;
    
                    let [password, hostAndPort] = passwordAndHost.split('@');
                    if (!hostAndPort) continue;
    
                    let [ip, port] = hostAndPort.split(':');
                    if (!port) continue;
    
                    let queryParams = new URLSearchParams(params);
                    let security = queryParams.get('security');
                    let sni = queryParams.get('sni');
                    let type = queryParams.get('type');
    
                    if (sni && !isIp(sni) && security === 'tls' && port === '443' && type === 'ws') {
                      if (shouldSkipHost(sni)) continue;
    
                      let newPath = `/${sni}${decodeURIComponent(queryParams.get('path') || '')}`;
                      if (!trojanPaths.has(newPath)) {
                        trojanPaths.add(newPath);
                        let newTrojanConfig = `trojan://${password}@${realpathname === '' ? url.hostname : realpathname}:${port}?security=${security}&sni=${url.hostname}&alpn=http/1.1&fp=chrome&allowInsecure=1&type=ws&host=${url.hostname}&path=${encodeURIComponent(newPath)}#Node-${sni}`;
                        newConfigs += newTrojanConfig + '\n';
                      }
                    }
                  }
                } catch (error) {
                  continue;
                }
              }
            } catch (error) {
              continue;
            }
          }
    
          const nParam = url.searchParams.get('n');
          let responseConfigs = newConfigs.trim().split('\n').filter(line => line !== '');
    
          if (nParam && !isNaN(nParam) && parseInt(nParam) > 0) {
            const n = Math.min(parseInt(nParam), responseConfigs.length);
            const randomConfigs = getRandomItems(responseConfigs, n);
            return new Response(randomConfigs.join('\n'), {
              headers: { 'Content-Type': 'text/plain' },
            });
          }
    
          return new Response(newConfigs, {
            headers: { 'Content-Type': 'text/plain' },
          });
        } else {
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
    
    function shouldSkipHost(host) {
      return host && (host.toLowerCase().includes("workers.dev") || host.toLowerCase().includes("pages.dev"));
    }
    
    function getRandomItems(array, count) {
      const shuffled = array.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    }
    
    function isIp(ipstr) {
      try {
        if (!ipstr) return false;
        const ipv4Regex = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){3}$/;
        if (!ipv4Regex.test(ipstr)) return false;
        let segments = ipstr.split('.');
        if (segments[3] === '0') return false;
        return true;
      } catch (e) {
        return false;
      }
    }
