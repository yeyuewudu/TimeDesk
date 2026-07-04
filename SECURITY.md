# Security

TimeDesk does not ship with any API key. Users configure their own OpenAI-compatible provider in the app settings.

Current MVP behavior:

- File text extraction happens locally.
- Text is sent to the configured LLM provider only after the user clicks the action to organize it into the timeline.
- API keys are stored locally by the MVP settings layer.

Known MVP limitation:

- API key storage should be moved to the system credential store before a production-grade release.

Please do not open public issues containing API keys, private documents, or provider credentials.

