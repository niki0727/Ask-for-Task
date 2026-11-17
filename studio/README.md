# Ask for Task Studio

Run from the repo root with Node 24+:

```sh
node studio/server.mjs
node --test studio/server.test.mjs
```

Open http://127.0.0.1:8786. Use a sample email and open the displayed access link. Join and sign-in use the same flow. Projects, profiles and tasks persist in the OS temporary directory under `a4t-studio-local`; the OS can clear it. Delete the account in the UI to remove its local data. The server binds to loopback and is intentionally unsuitable for public hosting: the local access link proves the session flow but does not verify mailbox ownership.

The assistant already provides a rule-based project guide without sending data externally. An optional integration uses the [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create). Set `STUDIO_OPENAI_KEY` and `STUDIO_OPENAI_MODEL` through your local secret environment if you have approved credentials and model access. The user must opt in per request. This sends the current question, project title, brief, date, budget and up to 20 open task titles. The integration asks the API not to store the response; this is not a guarantee of zero provider retention. Live calls are not required for local tests, which inject a mock provider. Keep secrets out of Git. The assistant has no tools that can change a project or contact anyone.

See [the phased implementation and release plan](../company-ops/studio-platform-plan-20261117.md).

For the hosted identity and database setup, see [Studio staging handoff](STAGING.md).
