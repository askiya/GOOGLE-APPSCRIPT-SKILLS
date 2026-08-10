# AI integration checklist

## Data and privacy

- Classify every field before transmission.
- Remove fields unnecessary for the model task.
- Redact direct identifiers where the task permits it.
- Document provider retention/training controls from current official terms.
- Define prompt/response logging and deletion policy.

## Contract

- Provider endpoint, API version, and model are configuration, not scattered literals.
- Request and response schemas are explicit.
- Structured output is parsed and validated before use.
- Provider errors map to stable internal error codes.
- Model output is escaped before HTML and neutralized before Sheets when needed.

## Budget and reliability

- Maximum input size, output size, calls per job, and total budget are defined.
- Large inputs are selected or chunked with a stated merge strategy.
- Retries are bounded and respect idempotency.
- Timeout, throttling, refusal, schema mismatch, and outage have visible fallback states.

## Evaluation

- Representative normal cases.
- Ambiguous, missing, adversarial, and multilingual inputs.
- Sensitive-data leakage checks.
- Invalid structured output and partial response.
- Quality, latency, and estimated-cost thresholds.
- Human escalation cases for high-impact actions.
