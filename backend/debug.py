import urllib.request, urllib.error, json
data = json.dumps({'message': 'I do not know', 'thread_id': 'debug_user_1', 'interview_type': 'oops'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/chat', data=data, headers={'Content-Type': 'application/json'})
try:
    print(urllib.request.urlopen(req).read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('HTTP ERROR:', e.code, e.read().decode('utf-8'))
