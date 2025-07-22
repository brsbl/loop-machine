import { UIManager } from '../src/ui/UIManager.js';

describe('XSS Protection Verification', () => {
  let uiManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <pre><code id="json-editor" contenteditable="true" spellcheck="false"></code></pre>
    `;
    
    const mockStateManager = {
      getStateAsJson: jest.fn()
    };
    
    const mockAudioManager = {};
    
    uiManager = new UIManager(mockStateManager, mockAudioManager);
  });

  test('escapeHtml prevents XSS in all scenarios', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      '"><script>alert("XSS")</script>',
      "' onclick='alert(\"XSS\")'",
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
      '<select onfocus=alert("XSS") autofocus>',
      '<textarea onfocus=alert("XSS") autofocus>',
      '<keygen onfocus=alert("XSS") autofocus>',
      '<video><source onerror=alert("XSS")>',
      '<audio><source onerror=alert("XSS")>',
      '<marquee onstart=alert("XSS")>',
      '<meter onmouseover=alert("XSS")>123</meter>',
      '<!--<script>alert("XSS")</script>-->',
      '<style>@import "javascript:alert(\'XSS\')";</style>',
    ];

    xssPayloads.forEach(payload => {
      const escaped = uiManager.escapeHtml(payload);
      
      // Should not contain any HTML tags
      expect(escaped).not.toMatch(/<[^>]+>/);
      
      // Should escape key characters
      if (payload.includes('<')) expect(escaped).toContain('&lt;');
      if (payload.includes('>')) expect(escaped).toContain('&gt;');
      if (payload.includes('"')) expect(escaped).toContain('&quot;');
      if (payload.includes("'")) expect(escaped).toContain('&#039;');
      if (payload.includes('&')) expect(escaped).toContain('&amp;');
    });
  });

  test('formatJsonForDisplay escapes all user input', () => {
    const maliciousData = {
      '<script>alert(1)</script>': {
        '<img src=x onerror=alert(2)>': ['<svg onload=alert(3)>'],
        'normal': '<iframe src="javascript:alert(4)"></iframe>'
      },
      'array': ['<body onload=alert(5)>', 123, true, null],
      'string': '"><script>alert(6)</script>',
      'number': 42,
      'boolean': false,
      'null': null
    };

    const formatted = uiManager.formatJsonForDisplay(maliciousData, 0);
    
    // Should not contain any unescaped dangerous HTML
    expect(formatted).not.toContain('<script>');
    expect(formatted).not.toContain('</script>');
    expect(formatted).not.toContain('<img src=x');
    expect(formatted).not.toContain('<svg onload=');
    expect(formatted).not.toContain('<iframe src=');
    expect(formatted).not.toContain('<body onload=');
    
    // These can appear in escaped form, which is safe
    // e.g., "&lt;img src=x onerror=alert(2)&gt;" is safe
    
    // Should contain escaped versions
    expect(formatted).toContain('&lt;script&gt;');
    expect(formatted).toContain('&lt;img');
    expect(formatted).toContain('&lt;svg');
    expect(formatted).toContain('&lt;iframe');
    expect(formatted).toContain('&lt;body');
  });

  test('JSON editor innerHTML is safe from XSS', () => {
    const mockStateManager = {
      getStateAsJson: jest.fn().mockReturnValue({
        '<script>alert("XSS")</script>': 'value',
        'key': '<img src=x onerror=alert("XSS")>',
        'nested': {
          '"><script>alert("nested")</script>': true
        }
      })
    };
    
    uiManager.stateManager = mockStateManager;
    uiManager.getSliderValues = jest.fn().mockReturnValue({ bpm: 120, reverb: 0, delay: 0 });
    
    // Update JSON editor
    uiManager.updateJsonEditor();
    
    const jsonEditor = document.getElementById('json-editor');
    const content = jsonEditor.innerHTML;
    
    // Create a temporary element to test if content is safe
    const testDiv = document.createElement('div');
    testDiv.innerHTML = content;
    
    // If XSS was successful, script tags would exist in the DOM
    const scripts = testDiv.getElementsByTagName('script');
    expect(scripts.length).toBe(0);
    
    // Check for other dangerous elements
    const imgs = testDiv.getElementsByTagName('img');
    expect(imgs.length).toBe(0);
    
    const iframes = testDiv.getElementsByTagName('iframe');
    expect(iframes.length).toBe(0);
  });
});