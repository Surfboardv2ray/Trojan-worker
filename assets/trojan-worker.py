import requests
import random
import base64
import json
from urllib.parse import urlparse, urlunparse, urlencode

# Configuration variables
NUM_CONFIGS = 100  # Number of configs to return
HOST = "YOURS.workers.dev"  # Custom host
SNI = "YOURS.workers.dev"  # Custom SNI
IP_ADDRESS = "YOUR_IP"  # Custom IP address for configs

SUB_LINKS = [
    'https://raw.githubusercontent.com/Surfboardv2ray/Proxy-sorter/main/ws_tls/proxies/wstls',
    'https://raw.githubusercontent.com/Surfboardv2ray/TGParse/refs/heads/main/configtg.txt',
    'https://raw.githubusercontent.com/soroushmirzaei/telegram-configs-collector/refs/heads/main/protocols/trojan',
    'https://raw.githubusercontent.com/soroushmirzaei/telegram-configs-collector/refs/heads/main/protocols/vmess',
    'https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/Eternity.txt',
]

def is_ip(ip_str):
    try:
        parts = ip_str.split('.')
        if len(parts) != 4 or any(not part.isdigit() or not 0 <= int(part) <= 255 for part in parts):
            return False
        return parts[-1] != '0'
    except Exception:
        return False

def should_skip_host(host):
    return "workers.dev" in host.lower() or "pages.dev" in host.lower()

def fetch_configs():
    new_configs = []
    for sub_link in SUB_LINKS:
        try:
            response = requests.get(sub_link)
            response.raise_for_status()
            sub_configs = response.text

            try:
                sub_configs = base64.b64decode(sub_configs).decode()
            except Exception:
                pass

            for sub_config in sub_configs.strip().splitlines():
                try:
                    if sub_config.startswith("vmess://"):
                        vmess_data = json.loads(base64.b64decode(sub_config[8:]).decode())
                        if (
                            vmess_data.get("sni") and not is_ip(vmess_data["sni"])
                            and vmess_data.get("net") == "ws"
                            and vmess_data.get("port") == 443
                        ):
                            if should_skip_host(vmess_data["sni"]):
                                continue
                            config_new = {
                                "v": "2",
                                "ps": f"Node-{vmess_data['sni']}",
                                "add": IP_ADDRESS,
                                "port": vmess_data["port"],
                                "id": vmess_data["id"],
                                "net": "ws",
                                "type": "none",
                                "host": HOST,
                                "path": f"/{vmess_data['sni']}{vmess_data['path']}",
                                "tls": "tls",
                                "sni": SNI,
                            }
                            new_configs.append("vmess://" + base64.b64encode(json.dumps(config_new).encode()).decode())

                    elif sub_config.startswith("vless://"):
                        parts = sub_config[8:].split("@")
                        if len(parts) != 2:
                            continue
                        uuid, rest = parts
                        ip_port, params = rest.split("?", 1)
                        ip, port = ip_port.split(":")
                        query_params = dict(param.split("=") for param in params.split("&"))

                        if (
                            query_params.get("security") == "tls"
                            and port == "443"
                            and query_params.get("type") == "ws"
                        ):
                            sni = query_params.get("sni")
                            if should_skip_host(sni):
                                continue
                            path = f"/{sni}{query_params.get('path', '')}"
                            new_vless_config = (
                                f"vless://{uuid}@{IP_ADDRESS}:{port}?encryption=none&security=tls&"
                                f"sni={SNI}&type=ws&host={HOST}&path={path}#Node-{sni}"
                            )
                            new_configs.append(new_vless_config)

                    elif sub_config.startswith("trojan://"):
                        password, rest = sub_config[9:].split("@")
                        ip_port, params = rest.split("?", 1)
                        ip, port = ip_port.split(":")
                        query_params = dict(param.split("=") for param in params.split("&"))

                        if (
                            query_params.get("security") == "tls"
                            and port == "443"
                            and query_params.get("type") == "ws"
                        ):
                            sni = query_params.get("sni")
                            if should_skip_host(sni):
                                continue
                            path = f"/{sni}{query_params.get('path', '')}"
                            new_trojan_config = (
                                f"trojan://{password}@{IP_ADDRESS}:{port}?security=tls&sni={SNI}&"
                                f"type=ws&host={HOST}&path={path}#Node-{sni}"
                            )
                            new_configs.append(new_trojan_config)

                except Exception:
                    continue

        except Exception:
            continue
    return new_configs

def get_random_configs(configs, n):
    return random.sample(configs, min(n, len(configs)))

def main():
    configs = fetch_configs()
    selected_configs = get_random_configs(configs, NUM_CONFIGS)
    with open("trw.txt", "w") as file:
        file.write("\n".join(selected_configs))

if __name__ == "__main__":
    main()
