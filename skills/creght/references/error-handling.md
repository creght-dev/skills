# Error Handling And Retry Limits

## Purpose

Validation and runtime failures are feedback, not permission for unlimited
edits. In the local CLI workflow they come from commands you run — typecheck,
build, and the CLI's lint/validate — and from errors the user reports from their
browser preview. (The platform's `LINT_ERROR` / `BROWSER_ERROR_RENDER` events are
delivered only to the in-platform agent, not to a local CLI agent, so do not wait
for or rely on them.)

The agent may make limited, evidence-based fixes. If the error remains after the
retry limit, stop and explain why.

## General Retry Limits

For any validation or runtime error:

- Reproduce or inspect the exact error before editing.
- Try at most 3 total fix cycles for one task.
- Try at most 2 fixes for the same error family.
- Try at most 1 fix when the error is unrelated to the current task.
- Stop immediately for known non-fixable cases.

An error is the same family when it has the same command, file area, error code,
stack trace pattern, or diagnostic message pattern.

Continue only when there is new concrete evidence, such as console output, lint
or typecheck diagnostics, a stack trace, network logs, or a specific file
location.

## Browser And Runtime Errors

For browser, runtime, or network render errors the user reports from the preview:

- Try at most 2 low-risk fixes.
- Try at most 1 fix when the error points to browser compatibility, external
  resources, sandbox policy, or preview-runtime behavior.
- Stop if the user reports the same render error again after a fix.
- Stop if the error does not point to a specific project file.
- Stop if further fixes would require guessing, broad rewrites, or changing the
  build/runtime strategy.

## Allowed Attempts

- Fix an obviously wrong path or import.
- Fix a clear lint, type, or syntax issue in the changed files.
- Replace an unstable external URL.
- Add a simple fallback for resource loading failure.
- Use a more widely supported browser API.
- Adjust module loading only when project code clearly caused the issue.

## Known Non-Fixable Cases

### `Failed to resolve module specifier "react/jsx-dev-runtime"`

```text
Failed to resolve module specifier "react/jsx-dev-runtime"
```

If the user reports this from the preview, treat it as a browser/preview-runtime
compatibility issue, not project code. `react/jsx-dev-runtime` is provided by
Creght's built-in React runtime, so it is not fixed by editing components,
routes, styles, or app logic.

Do not rewrite JSX, add fake local modules, or batch-change React imports. Stop
immediately, or after at most one verification attempt.

## Stop Report

When stopping, explain:

- The error code or message.
- What was attempted, if anything.
- Why the agent is stopping.
- Why further code edits are unsafe or unlikely to help.
- For browser errors, ask the user to refresh the preview and try again, or use
  the latest Google Chrome browser.
- If needed, ask for the full browser Console log or validation output.

## Forbidden Actions

- Do not keep editing until the command passes.
- Do not rewrite large areas of the app without evidence.
- Do not hide the error or change configuration only to bypass it.
- Do not add fake modules for built-in runtime packages.
- Do not assume every failure is caused by project code.
- Do not continue after the retry limit is reached.
