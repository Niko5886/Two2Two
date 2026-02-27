# Конфигурация на Email Нотификации за Админи

Това ръководство обяснява как да настроиш автоматични email нотификации за нови потребители и снимки в Couple2Couple.

## Стъпка 1: Генериране на Resend API Key

1. Влез в [Resend.com](https://resend.com)
2. Отиди на **API Keys**
3. Кликни **Create API Key**
4. Копирай ключа (показва се само веднъж!)

> **Важно:** За продукция добави и верифицирай твоя домейн в Resend, за да можеш да пращаш от `noreply@yourdomain.com` вместо `onboarding@resend.dev`.

## Стъпка 2: Генериране на Cron Secret

Генерирай случайна стойност за защита на cron endpoint:

```bash
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Bash / Linux / Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Запази генерираната стойност за по-късно (например: `XyZ123abc...`).

## Стъпка 3: Добавяне на Secrets в Supabase Edge Functions

1. Влез в [Supabase Dashboard](https://app.supabase.com)
2. Избери проекта си **Couple2Couple**
3. Отиди на **Edge Functions** → **Manage secrets**
4. Добави следните secrets:

| Secret Name | Value | Required |
|-------------|-------|----------|
| `RESEND_API_KEY` | `re_...` (от Стъпка 1) | ✅ Да |
| `NOTIFICATION_CRON_SECRET` | `XyZ123abc...` (от Стъпка 2) | ✅ Да |
| `ADMIN_NOTIFICATION_EMAIL` | `lobido1988@gmail.com` | ❌ Не (default) |
| `EMAIL_FROM` | `Couple2Couple <noreply@yourdomain.com>` | ❌ Не (default) |
| `ADMIN_DASHBOARD_URL` | `https://couple2couple.netlify.app/admin` | ❌ Не (default) |

> **Забележка:** `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` вече са налични автоматично в Edge Functions.

## Стъпка 4: Настройка на Cron Job

Има две опции за автоматично извикване на функцията:

### Опция А: Supabase pg_cron (Препоръчано за Pro план)

1. Отиди на **SQL Editor** в Supabase Dashboard
2. Изпълни следния SQL (замени `<YOUR_CRON_SECRET>` с реалната стойност):

```sql
-- Enable pg_cron extension (Pro plan only)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every 5 minutes
SELECT cron.schedule(
  'admin-notifications-email',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://codjrsxeqmeoscnjyeyj.supabase.co/functions/v1/admin-notifications?batch=25',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <YOUR_CRON_SECRET>'
      ),
      body := jsonb_build_object()
    ) AS request_id;
  $$
);

-- Check scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Опция Б: Външен Cron Service (Free Plan)

Ако нямаш Pro план или pg_cron не е активиран, използвай външен service като:

#### 1. **cron-job.org** (Free)

1. Създай акаунт на [cron-job.org](https://cron-job.org)
2. Кликни **Create Cronjob**
3. Конфигурирай:
   - **Title:** Couple2Couple Admin Notifications
   - **URL:** `https://codjrsxeqmeoscnjyeyj.supabase.co/functions/v1/admin-notifications?batch=25`
   - **Schedule:** Every 5 minutes
   - **HTTP Method:** POST
   - **Request Headers:** 
     ```
     Content-Type: application/json
     Authorization: Bearer <YOUR_CRON_SECRET>
     ```
4. Запази и активирай

#### 2. **EasyCron** (Free tier: 10 tasks)

1. Регистрирай се на [easycron.com](https://www.easycron.com)
2. Създай нов Cron Job:
   - **URL:** `https://codjrsxeqmeoscnjyeyj.supabase.co/functions/v1/admin-notifications?batch=25`
   - **Cron Expression:** `*/5 * * * *`
   - **HTTP Method:** POST
   - **Custom Headers:**
     ```
     Authorization: Bearer <YOUR_CRON_SECRET>
     ```

#### 3. **GitHub Actions** (Безплатно за публични repo)

Добави файл `.github/workflows/admin-notifications.yml`:

```yaml
name: Admin Email Notifications

on:
  schedule:
    # Runs every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Позволява ръчно стартиране

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Admin Notifications
        run: |
          curl -X POST \
            "https://codjrsxeqmeoscnjyeyj.supabase.co/functions/v1/admin-notifications?batch=25" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.NOTIFICATION_CRON_SECRET }}"
```

Добави Secret в GitHub:
- Отиди на **Settings** → **Secrets and variables** → **Actions**
- Добави `NOTIFICATION_CRON_SECRET` с твоята стойност

## Стъпка 5: Тестване

### Ръчно извикване на функцията

```bash
# PowerShell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer <YOUR_CRON_SECRET>"
}

Invoke-RestMethod -Uri "https://codjrsxeqmeoscnjyeyj.supabase.co/functions/v1/admin-notifications?batch=25" `
    -Method POST `
    -Headers $headers

# Bash / curl
curl -X POST \
  "https://codjrsxeqmeoscnjyeyj.supabase.co/functions/v1/admin-notifications?batch=25" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_CRON_SECRET>"
```

Очакван отговор:
```json
{
  "processed": 0,
  "sent": 0,
  "failed": 0,
  "message": "No pending notifications"
}
```

### Създаване на тестова нотификация

За да тестваш дали email-ите работят, създай тестов pending запис:

```sql
-- В Supabase SQL Editor
INSERT INTO public.admin_notifications (type, target_user_id, status)
VALUES ('profile_pending', '1c409ae1-0cf6-4683-a111-aba1adb200bc', 'pending');

-- Провери таблицата
SELECT * FROM public.admin_notifications ORDER BY created_at DESC;
```

След това извикай функцията ръчно (curl команда от горе) и провери:
1. Email е получен в `lobido1988@gmail.com`
2. Статусът в `admin_notifications` е update-нат на `sent`

## Стъпка 6: Мониторинг

### Провери изпратените email-и

```sql
SELECT 
  type,
  status,
  error_message,
  created_at
FROM public.admin_notifications
WHERE status IN ('sent', 'error')
ORDER BY created_at DESC
LIMIT 20;
```

### Провери грешките

```sql
SELECT *
FROM public.admin_notifications
WHERE status = 'error'
ORDER BY created_at DESC;
```

### Edge Function logs

1. Отиди на **Edge Functions** → **admin-notifications**
2. Кликни **Logs** таб
3. Виж всички invocations и грешки

## Честоти на Cron

Препоръчани честоти според натоварването:

- **Всеки 1 минута:** `*/1 * * * *` (за високо натоварени сайтове)
- **Всеки 5 минути:** `*/5 * * * *` (балансирано)
- **Всеки 15 минути:** `*/15 * * * *` (ниско натоварване)
- **Всеки час:** `0 * * * *` (много малко потребители)

## Troubleshooting

### Email не се изпраща

1. Провери че `RESEND_API_KEY` е валиден
2. Провери Resend Dashboard → **Logs** за грешки
3. Виж Edge Function logs за детайли

### Unauthorized 401 грешка

- `NOTIFICATION_CRON_SECRET` не съвпада между Supabase Secret и cron request header

### Функцията не се извиква

- Провери cron service status/logs
- За pg_cron: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Duplicate emails

- Уверете се, че имаш само един активен cron job
- Проверете дали нямаш multiple scheduler-и

## Готово! 🎉

След завършване на тези стъпки:
- ✅ Всяка нова регистрация → автоматичен email до `lobido1988@gmail.com`
- ✅ Всяка нова снимка → автоматичен email до `lobido1988@gmail.com`
- ✅ Грешките се записват в `admin_notifications.error_message`
- ✅ История на изпратените emails в `admin_notifications` таблицата
