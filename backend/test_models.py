from dotenv import load_dotenv
load_dotenv()
import urllib.request, json, os
try:
    url = f'https://generativelanguage.googleapis.com/v1beta/models?key={os.environ["GEMINI_API_KEY"]}'
    req = urllib.request.Request(url)
    res = urllib.request.urlopen(req).read().decode('utf-8')
    models = json.loads(res).get('models', [])
    print([m['name'] for m in models if 'flash' in m['name']])
except Exception as e:
    print("Error:", e)
