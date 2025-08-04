# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Chain Cast seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Reporting Process

1. **DO NOT** create a public GitHub issue for the vulnerability.
2. **DO** email your findings to `chaincast@layerx.xyz` with the subject line `[SECURITY] Chain Cast Vulnerability Report`.
3. **DO** include a detailed description of the vulnerability, including:
   - Type of issue (buffer overflow, SQL injection, cross-site scripting, etc.)
   - Full paths of source file(s) related to the vulnerability
   - The location of the affected source code (tag/branch/commit or direct URL)
   - Any special configuration required to reproduce the issue
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit it

### What to Expect

- You will receive an acknowledgment within 48 hours
- We will investigate and provide updates on the progress
- Once the issue is confirmed, we will:
  - Work on a fix
  - Release a security update
  - Credit you in the security advisory (unless you prefer to remain anonymous)

### Responsible Disclosure

We ask that you:
- Give us reasonable time to respond to issues before any disclosure
- Avoid accessing or modifying other users' data
- Avoid actions that could negatively impact other users' experience
- Not attempt to gain access to our servers or infrastructure

### Security Best Practices

When using Chain Cast in production:

1. **Keep dependencies updated**: Regularly update all dependencies to their latest secure versions
2. **Use environment variables**: Never commit sensitive configuration to version control
3. **Implement proper authentication**: Use strong authentication mechanisms
4. **Monitor logs**: Regularly review application logs for suspicious activity
5. **Network security**: Use HTTPS in production and secure your database connections
6. **Regular backups**: Maintain regular backups of your data
7. **Access control**: Implement proper access controls and principle of least privilege

### Security Features

Chain Cast includes several security features:

- **Input validation**: All inputs are validated and sanitized
- **SQL injection protection**: Using parameterized queries through Prisma ORM
- **CORS protection**: Configurable CORS settings
- **Rate limiting**: Built-in rate limiting capabilities
- **Logging**: Comprehensive logging for security monitoring

### Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and will be clearly marked in the changelog. We recommend keeping your Chain Cast installation up to date.

### Contact

For security-related questions or concerns, please contact:
- **Email**: chaincast@layerx.xyz
- **PGP Key**: [Available upon request]

Thank you for helping keep Chain Cast secure!