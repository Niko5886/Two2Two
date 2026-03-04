# Netlify Deployment Guide

## Настройка на Netlify Deployment

Този проект е конфигуриран за автоматично deploy в Netlify.

### 1. Първоначална настройка (еднократно)

Ако още не сте deploy-нали проекта в Netlify:

1. **Отворете Netlify Dashboard**: https://app.netlify.com/
2. **Импортирайте проекта**:
   - Натиснете "Add new site" > "Import an existing project"
   - Свържете GitHub repository
   - Изберете репозиторито `CoupleCouple`
3. **Build настройки** (Netlify автоматично ги взима от `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

### 2. Конфигуриране на Environment Variables

**ВАЖНО!** Трябва да добавите Supabase credentials в Netlify:

1. Отворете вашия сайт в Netlify Dashboard
2. Отидете на **Site configuration** > **Environment variables**
3. Добавете следните променливи:

```
VITE_SUPABASE_URL=https://codjrsxeqmeoscnjyeyj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZGpyc3hlcW1lb3Njbmp5ZXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Mzg3ODMsImV4cCI6MjA4NzUxNDc4M30.SI_Zmbo6X5RKHsuxLwhrG0dnjiMCr6ebIQk-9NSWInU
```

4. **Запазете** променливите

### 3. Redeploy

След като добавите environment variables:

1. Отидете на **Deploys**
2. Натиснете **Trigger deploy** > **Deploy site**

Или просто push-нете промените в GitHub - Netlify автоматично ще deploy-не.

### 4. Проверка

След успешен deployment:
- Сайтът ще бъде достъпен на: `https://couplecouple.netlify.app`
- Проверете дали можете да се регистрирате/логнете
- Проверете дали SPA routing работи (refresh на вътрешни страници)

## Файлове за Netlify

- **netlify.toml** - Build конфигурация и redirect правила
- **public/_redirects** - SPA redirect правила (backup)
- **.env.example** - Пример за нужните environment variables

## Често срещани проблеми

### Проблем: "Missing Supabase environment variables"
**Решение**: Добавете `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` в Netlify environment variables.

### Проблем: 404 грешка при refresh на вътрешни страници
**Решение**: Проверете дали `netlify.toml` и `public/_redirects` са commit-нати в репозиторито.

### Проблем: Build fail
**Решение**: 
1. Проверете build log в Netlify
2. Уверете се, че `package.json` има правилни dependencies
3. Проверете дали Node version е 18 или по-нова

## Автоматично Deploy

Netlify автоматично ще deploy-ва при всеки push в `main` branch на GitHub.

## Custom Domain (опционално)

Ако искате custom domain:
1. Отидете на **Site configuration** > **Domain management**
2. Следвайте инструкциите за добавяне на custom domain
