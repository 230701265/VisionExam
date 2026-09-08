---
name: Python runner memory floor
description: Environment-specific incompatibility between the Python runtime and strict virtual-memory limits.
---

The current Python runtime requires more than a 64 MB virtual-address-space allowance during initialization; under that cap it exits before submitted code runs.

**Why:** The runtime fails with `fatal error: failed to reserve page summary memory`, even for a trivial function, while other language-runner tests pass.

**How to apply:** When maintaining sandbox isolation, establish a tested minimum memory allowance or use a compatible limiting mechanism/runtime rather than assuming the historical 64 MB cap remains viable.