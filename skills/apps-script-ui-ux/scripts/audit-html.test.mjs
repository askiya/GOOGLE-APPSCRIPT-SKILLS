import assert from 'node:assert/strict';
import test from 'node:test';

import { auditSource } from './audit-html.mjs';

test('reports high-value Apps Script HTML problems', () => {
  const source = `
    <html>
      <head><style>.card { animation: pulse 1s infinite; } button:focus { outline: none; }</style></head>
      <body>
        <h1>Dashboard</h1><h3>Results</h3>
        <img src="chart.png">
        <input id="query" placeholder="Search">
        <div onclick="save()">Save</div>
        <button><svg></svg></button>
        <script>
          results.innerHTML = response.html;
          google.script.run.saveForm({ apiKey: "live-secret-value" });
        </script>
      </body>
    </html>`;

  const ids = new Set(auditSource(source, 'bad.html').map(item => item.id));
  for (const expected of [
    'html-lang',
    'viewport',
    'image-alt',
    'control-name',
    'noninteractive-click',
    'button-name',
    'outline-suppressed',
    'reduced-motion',
    'html-injection-sink',
    'script-run-success',
    'script-run-failure',
    'heading-skip',
    'client-secret',
  ]) {
    assert.ok(ids.has(expected), `expected ${expected}`);
  }
});

test('accepts a representative accessible async surface', () => {
  const source = `
    <!doctype html>
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          .status { transition: opacity 180ms ease-out; }
          button:focus-visible { outline: 3px solid currentColor; }
          @media (prefers-reduced-motion: reduce) { .status { transition-duration: 1ms; } }
        </style>
      </head>
      <body>
        <main>
          <h1>Persetujuan</h1>
          <label for="request">Permintaan</label>
          <input id="request">
          <button type="button" onclick="saveRequest()">Simpan</button>
          <p class="status" role="status"></p>
        </main>
        <script>
          function saveRequest() {
            google.script.run
              .withSuccessHandler(showSuccess)
              .withFailureHandler(showFailure)
              .saveRequest();
          }
        </script>
      </body>
    </html>`;

  const findings = auditSource(source, 'good.html');
  assert.equal(findings.filter(item => item.severity === 'P1').length, 0);
  assert.equal(findings.filter(item => item.severity === 'P2').length, 0);
});

test('redacts possible credentials from evidence', () => {
  const source = '<script>const accessToken = "actual-sensitive-value";</script>';
  const finding = auditSource(source, 'secret.html').find(item => item.id === 'client-secret');
  assert.ok(finding);
  assert.equal('evidence' in finding, false);
});

test('does not treat data attributes as accessible names', () => {
  const source = '<label><input></label><input data-aria-label="not-an-accessible-name">';
  const findings = auditSource(source, 'attributes.html').filter(item => item.id === 'control-name');
  assert.equal(findings.length, 1);
});
