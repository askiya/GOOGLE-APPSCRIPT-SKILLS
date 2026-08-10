/**
 * Minimal entry point. Add OAuth scopes deliberately in appsscript.json when
 * the deployment is published and the required services are known.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Apps Script Starter');
}

/**
 * Public client facade. Validate and authorize before calling domain logic.
 * @param {{name: string}} input
 * @return {{ok: boolean, data: Object|null, error: Object|null}}
 */
function greet(input) {
  try {
    const name = validateName_(input && input.name);
    return {
      ok: true,
      data: { message: `Hello, ${name}!` },
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: { code: 'INVALID_REQUEST', message: String(error.message || error) }
    };
  }
}

function validateName_(value) {
  const name = String(value || '').trim();
  if (!name || name.length > 80) {
    throw new Error('Name must contain 1 to 80 characters.');
  }
  return name;
}
