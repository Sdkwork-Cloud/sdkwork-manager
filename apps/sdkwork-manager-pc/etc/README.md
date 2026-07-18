# Manager PC Source Configuration

`sdkwork.deployment.config.json` references the repository deployment index. `browser.runtime.json`
owns only the renderer bind and public runtime binding names. SDK Base URLs are selected from the
repository profile and may be overridden by local `.env` files or process environment variables.
