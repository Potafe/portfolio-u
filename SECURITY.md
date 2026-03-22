# Security Policy

## Supported Versions

Security updates are applied only to the most recent releases.

## Reporting a Vulnerability

To securely report a vulnerability, please open an advisory on the affected GitHub repository. All repositories allow reporting vulnerabilities by clicking on the "New Issue" button.

## Vulnerability Process

1. Your report will be acknowledged within two business days.
2. I will investigate and update the issue with relevant information.
3. Commits will be handled in a private repository for review and testing.
4. Release a new patch version from the private repository.
5. Issue a security advisory through GitHub.
6. Write a blog post about the vulnerability.

## Security Advisories
Security advisories are only issued when a confirmed vulnerability can be exploited by a non-local actor. Because ESLint and its related packages are primarily used as development dependencies on local machines, there are no security concerns related to regular expression performance or other problems that could bring down a public-facing server. These issues should be filed as bug reports instead of advisories.
