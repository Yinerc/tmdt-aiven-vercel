# Deploy TMDT

Project nay gom 3 dich vu:

- `admin`: Next.js admin, mac dinh chay port `3000`
- `users`: Next.js trang khach hang, mac dinh chay port `3001`
- `ai_service`: FastAPI AI service, mac dinh chay port `8000`
- Database: MySQL/MariaDB, database `tmdt_next`

## 1. Chuan bi server

Khuyen dung 1 VPS Ubuntu co Node.js 20+, Python 3.11+, MySQL/MariaDB, Nginx va PM2.

AI tao anh dung `torch`/`diffusers`, neu server khong co GPU thi van chay duoc nhung tao anh co the rat cham.

## 2. Tao database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS tmdt_next CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p tmdt_next < users/tmdt_next.sql
```

Nen tao user MySQL rieng cho app thay vi dung `root`.

## 3. Cai dependencies va build

```bash
npm ci

cd admin
npm ci
npm run build

cd ../users
npm ci
npm run build

cd ../ai_service
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 4. Cau hinh bien moi truong

Copy file mau va sua gia tri production:

```bash
cp admin/.env.local.example admin/.env.local
cp users/.env.example users/.env.local
cp ai_service/.env.example ai_service/.env
```

Vi du neu dung domain:

`admin/.env.local`

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=tmdt_user
DB_PASSWORD=your-db-password
DB_NAME=tmdt_next
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-strong-password
ADMIN_SESSION_SECRET=your-long-random-secret
NEXT_PUBLIC_AI_SERVICE_URL=https://ai.example.com
NEXT_PUBLIC_USER_SITE_URL=https://shop.example.com
```

`users/.env.local`

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=tmdt_user
DB_PASSWORD=your-db-password
DB_NAME=tmdt_next
USER_SESSION_SECRET=another-long-random-secret
NEXT_PUBLIC_APP_URL=https://shop.example.com
NEXT_PUBLIC_AI_SERVICE_URL=https://ai.example.com
ADMIN_API_URL=https://admin.example.com
RESEND_API_KEY=
```

`ai_service/.env`

```env
AI_ALLOWED_ORIGINS=https://admin.example.com
```

Sau khi doi cac bien `NEXT_PUBLIC_*`, can build lai app Next.js.

## 5. Chay production voi PM2

Tai thu muc root:

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Kiem tra log:

```bash
pm2 logs tmdt-admin
pm2 logs tmdt-users
pm2 logs tmdt-ai
```

## 6. Nginx reverse proxy

Vi du cau hinh 3 domain:

```nginx
server {
    server_name admin.example.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name shop.example.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name ai.example.com;
    client_max_body_size 8m;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Bat SSL:

```bash
certbot --nginx -d admin.example.com -d shop.example.com -d ai.example.com
```

## 7. Checklist sau deploy

- Mo `https://shop.example.com/customer` va kiem tra san pham, gio hang, dat hang.
- Mo `https://admin.example.com/admin/login` va dang nhap admin.
- Kiem tra `https://ai.example.com/health` tra ve `{"status":"ok","mode":"local-model"}`.
- Tao noi dung AI tu admin, bam luu va mo link san pham o trang user.
