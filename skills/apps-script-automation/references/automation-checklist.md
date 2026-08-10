# Automation checklist

## Trigger inventory

- Name, type, event source, schedule, creator/owner, handler, and required scopes.
- Setup function is safe to run twice and does not create duplicates.
- Cleanup function removes only triggers owned by this workflow.
- Reauthorization and owner-transfer procedure is documented.

## Idempotency

- Derive a stable key from the source event or business operation.
- Claim or check the key before the external side effect.
- Record completed state after success.
- Decide how long keys must be retained.
- Make manual replay explicit and auditable.

## Retries

- Retry timeouts, throttling, and documented transient server errors.
- Do not retry invalid input, forbidden access, or permanent business rejection.
- Cap attempts and total elapsed time.
- Add jitter to avoid synchronized retries.
- Persist enough safe context for remediation.

## Continuation

- Keep batches comfortably below execution limits.
- Persist cursor and completed work before scheduling the next run.
- Prevent two workers from claiming the same range.
- Delete obsolete continuation triggers.
- Provide an operator function to inspect, resume, or abandon the job.

Official references: [Installable triggers](https://developers.google.com/apps-script/guides/triggers/installable) and [Quotas](https://developers.google.com/apps-script/guides/services/quotas).
