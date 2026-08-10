# Architecture checklist

## Product and flow

- Identify actors, triggers, happy paths, rejection paths, and administrative flows.
- Define state transitions and which role may perform each transition.
- Specify duplicate, concurrent, late, and partially completed request behavior.

## Runtime and identity

- Record whether each entry point is interactive or background.
- Record web-app execution mode and access audience.
- Record the owner of every installable trigger.
- Identify functions that can run without authorization or under reduced auth modes.

## Data

- Define stable primary keys, timestamps, actor IDs, versions, and soft-delete/archive policy.
- Validate headers and schema before reading or writing.
- Define indexes or lookup maps needed to avoid repeated scans.
- Define backup, restore, migration, and retention procedures.
- Establish the threshold for migrating large or relational workloads away from Sheets.

## Reliability

- Use idempotency keys at external and scheduled boundaries.
- Bound retries and distinguish transient from permanent errors.
- Persist checkpoints for work that may exceed runtime limits.
- Define dead-letter or manual recovery for failed items.
- Ensure locks cover only the smallest critical section.

## Security

- Authenticate and authorize on the server for every protected action.
- Minimize explicit OAuth scopes for published apps.
- Keep secrets out of HTML, Sheets, source, query strings, and logs.
- Sanitize spreadsheet-bound user text that could become a formula.
- Return generic client errors while retaining safe correlation details server-side.

## Operations

- Use structured logs with a correlation ID and no sensitive payloads.
- Define health signals, alert ownership, and remediation steps.
- Separate test and production configuration and data.
- Version deployments and document rollback.
