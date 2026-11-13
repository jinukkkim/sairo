import httpx

from server.app import app


async def test_serves_demo_and_local_assets():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
        response = await client.get('/')
        assert response.status_code == 200
        assert '<html lang="en">' in response.text
        assert 'id="message"' in response.text
        for path, kind in [('/assets/styles.css', 'text/css'), ('/assets/app.js', 'javascript')]:
            asset = await client.get(path)
            assert asset.status_code == 200
            assert kind in asset.headers['content-type']


async def test_does_not_serve_secrets_or_python_source():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
        for path in ['/.env', '/assets/../.env', '/core/translation.py']:
            assert (await client.get(path)).status_code == 404


async def test_four_feature_workspace_exposes_controls_and_module_assets():
    from html.parser import HTMLParser
    class Controls(HTMLParser):
        def __init__(self):
            super().__init__()
            self.controls = {}
            self.modes = []
            self.scripts = []
        def handle_starttag(self, tag, attrs):
            attrs = dict(attrs)
            if 'id' in attrs:
                self.controls[attrs['id']] = (tag, attrs)
            if tag == 'button' and 'data-mode' in attrs:
                self.modes.append(attrs['data-mode'])
            if tag == 'script':
                self.scripts.append(attrs)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
        page = Controls()
        page.feed((await client.get('/')).text)
        assert set(page.modes) == {'E', 'A', 'B', 'D'}
        for id in ['conversation', 'chat-log', 'chat-send', 'thread-editor', 'inbox-list', 'inbox-detail', 'improve', 'apply', 'restore']:
            assert id in page.controls
        assert page.controls['status'][1]['role'] == 'status'
        assert any(script.get('type') == 'module' for script in page.scripts)
        for path in ['/assets/state.mjs', '/assets/demo.mjs']:
            response = await client.get(path)
            assert response.status_code == 200
            assert 'javascript' in response.headers['content-type']


async def test_chat_is_primary_with_contextual_tools():
    from html.parser import HTMLParser
    class Page(HTMLParser):
        def __init__(self):
            super().__init__()
            self.ids = {}
        def handle_starttag(self, tag, attrs):
            attrs = dict(attrs)
            if 'id' in attrs:
                self.ids[attrs['id']] = (tag, attrs)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
        response = await client.get('/')
        page = Page()
        page.feed(response.text)
        assert page.ids['chat-message'][0] == 'textarea'
        assert 'hidden' in page.ids['tools-panel'][1]
        for control in ['chat-search', 'channel-list', 'direct-list', 'viewer', 'viewer-language', 'thread-panel', 'reply-form', 'saved-toggle']:
            assert control in page.ids
        assert 'slack' not in response.text.lower()
        assert (await client.get('/assets/chat.mjs')).status_code == 200


async def test_demo_results_are_never_presented_as_live_ai():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
        page = (await client.get('/')).text
        assert 'id="demo-mode"' in page
        assert 'real AI rewrite' not in page
        for path in ['/assets/app.js', '/assets/chat.mjs']:
            source = (await client.get(path)).text
            assert 'Live AI' not in source
            assert "provenance: 'live'" not in source


async def test_current_viewer_is_the_only_person_switch_and_language_is_read_only():
    from html.parser import HTMLParser
    class Controls(HTMLParser):
        def __init__(self):
            super().__init__()
            self.ids = {}
        def handle_starttag(self, tag, attrs):
            attrs = dict(attrs)
            if 'id' in attrs:
                self.ids[attrs['id']] = (tag, attrs)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
        page = Controls()
        page.feed((await client.get('/')).text)
        assert 'viewer-switcher' not in page.ids
        assert page.ids['viewer'][0] == 'select'
        assert 'hidden' not in page.ids['viewer'][1]
        assert page.ids['viewer-language'][0] != 'select'
