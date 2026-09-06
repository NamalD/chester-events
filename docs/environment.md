# Environment and GitHub Actions secrets

The static site and no-key collectors must run without secrets. Configure the following repository secrets only after obtaining the relevant free key.

| Secret name | Required? | Used by | Purpose |
| --- | --- | --- | --- |
| `TICKETMASTER_API_KEY` | Optional | Ticketmaster Discovery collector | Authenticates location/date event searches. |
| `SKIDDLE_API_KEY` | Optional | Skiddle collector | Authenticates its event API. |

Do not commit values to the public repository, generated event data, workflow logs or `.env` files. Add them in the GitHub repository’s **Settings → Secrets and variables → Actions**.

The implementation should provide an untracked local `.env` option for development, but no real credential belongs in it by default. A committed `.env.example` may contain only the variable names:

```dotenv
TICKETMASTER_API_KEY=
SKIDDLE_API_KEY=
```

## Built-in GitHub credentials

The workflow may use the built-in `GITHUB_TOKEN` to commit generated data and deploy GitHub Pages. It is provided by GitHub Actions and must not be created as a repository secret.

## Runtime configuration that is not secret

| Name | Planned value | Reason |
| --- | --- | --- |
| `CHESTER_EVENTS_USER_AGENT` | `ChesterEventsBot/1.0 (+<public-repository-url>)` | Identifies collection requests transparently. The concrete URL is filled in once the GitHub repository exists. |
| `TZ` | `Europe/London` | Normalises local event presentation and allows a scheduled job to guard for 02:00 London time across daylight-saving changes. |

No analytics, authentication, database, mail or runtime service credentials are part of the MVP.
