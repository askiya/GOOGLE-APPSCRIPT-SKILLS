# Web app patterns

## Promise wrapper

```javascript
function callServer(name, ...args) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(error => reject(new Error(error.message || String(error))))
      [name](...args);
  });
}
```

## Thin facade

```javascript
function createRequest(input) {
  const requestId = Utilities.getUuid();
  try {
    const actor = AuthService.currentActor();
    const command = RequestValidator.create(input);
    Authorization.require(actor, 'request:create', command);
    return Result.ok(RequestService.create(command, actor), requestId);
  } catch (error) {
    console.error(JSON.stringify({ requestId, message: String(error.message || error) }));
    return Result.safeError(error, requestId);
  }
}
```

## HTML Service checklist

- Add `<base target="_top">` when navigation behavior requires it.
- Escape untrusted template values and avoid injecting raw HTML.
- Keep secrets and privileged configuration out of HTML templates.
- Bundle or deliberately load client assets; understand Content Security Policy and sandbox constraints.
- Serialize dates and server-only objects before returning them.
- Debounce search and prevent double form submission.

## HTTP checklist

- Parse `e.parameter`, `e.parameters`, and `e.postData` defensively.
- Authenticate external callers using a design suitable for the integration; a hidden URL is not authentication.
- Verify webhook signatures when the provider supports them.
- Use idempotency keys for retried mutations.
- Understand Apps Script redirects and header limitations before promising compatibility to an external client.

Official references: [Web apps](https://developers.google.com/apps-script/guides/web), [Content Service](https://developers.google.com/apps-script/guides/content), and [HTML communication](https://developers.google.com/apps-script/guides/html/communication).
