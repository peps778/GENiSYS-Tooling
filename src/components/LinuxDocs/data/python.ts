export const pythonOneLiners = [
  ["HTTP status", "python3 -c \"import requests; print(requests.get('https://TARGET', timeout=10).status_code)\""],
  ["Read a file", "python3 -c \"print(open('file.txt', encoding='utf-8').read())\""],
  ["Filter non-empty lines", "python3 -c \"print([x.strip() for x in open('file.txt') if x.strip()])\""],
  ["Parse JSON", "python3 -c \"import json; print(json.load(open('data.json')))\""],
  ["SHA-256", "python3 -c \"import hashlib; print(hashlib.sha256(b'test').hexdigest())\""],
  ["Base64 decode", "python3 -c \"import base64; print(base64.b64decode('VEFSR0VU').decode())\""],
  ["URL decode", "python3 -c \"from urllib.parse import unquote; print(unquote('hello%20world'))\""],
];
