# Quick Start: Email Нотификации

## За какво е това?

Автоматично изпраща email на `lobido1988@gmail.com` когато:
- Нов потребител се регистрира (статус: `pending`)
- Потребител качи нова снимка (статус: `pending`)

## 3 Бързи Стъпки

### 1️⃣ Създай Resend API Key

1. Отвори [resend.com/api-keys](https://resend.com/api-keys)
2. Кликни **Create API Key**
3. Копирай ключа (показва се само веднъж!)

### 2️⃣ Добави Secrets в Supabase

1. Отвори [app.supabase.com](https://app.supabase.com)
2. Избери проекта **Couple2Couple**
3. **Edge Functions** → **Manage secrets**
4. Добави:
   - `RESEND_API_KEY` = (от стъпка 1)
   - `NOTIFICATION_CRON_SECRET` = (генерирай: `openssl rand -base64 32`)

### 3️⃣ Настрой Cron

**Опция A: GitHub Actions (Препоръчано)**

Файлът вече е готов: `.github/workflows/admin-notifications.yml`

1. Отвори GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Добави Secret: `NOTIFICATION_CRON_SECRET` (същата стойност от стъпка 2)
3. Готово! GitHub ще вика функцията на всеки 5 минути

**Опция B: pg_cron (Supabase Pro)**

Суппаbase SQL Editor → изпълни:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'admin-notifications-email',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://codjrsxeqmeoscnjyeyj.supabase.co/functions/v1/admin-notifications?batch=25',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_SECRET_HERE'
    ),
    body := jsonb_build_object()
  );
  $$
);
```

**Опция C: Външен Cron Service**

Използвай [cron-job.org](https://cron-job.org) или [easycron.com](https://easycron.com):
- URL: `https://codjrsxeqmeoscnjyeyj.supabase.co/functions/v1/admin-notifications?batch=25`
- Method: POST
- Header: `Authorization: Bearer <YOUR_CRON_SECRET>`
- Frequency: Every 5 minutes

## 🧪 Тестване

```bash
# PowerShell
.\supabase\test-notifications.ps1 -CronSecret "твоят-secret"

# Bash
./supabase/test-notifications.sh "твоят-secret"
```

## 📚 Пълна Документация

Виж [ADMIN_NOTIFICATIONS_SETUP.md](./ADMIN_NOTIFICATIONS_SETUP.md) за подробности.

## ✅ Проверка че работи

1. Създай тестова нотификация в Supabase SQL Editor:
   ```sql
   INSERT INTO admin_notifications (type, status)
   VALUES ('profile_pending', 'pending');
   ```

2. Изчакай 5 минути (или извикай ръчно)

3. Провери:
   - Email в `lobido1988@gmail.com`
   - Статус `sent` в `admin_notifications` таблицата

## 🔍 Мониторинг

```sql
-- Виж изпратените emails
SELECT * FROM admin_notifications 
WHERE status = 'sent' 
ORDER BY created_at DESC 
LIMIT 10;

-- Виж грешки
SELECT * FROM admin_notifications 
WHERE status = 'error' 
ORDER BY created_at DESC;
```

Готово! 🎉
