# Стъпки за настройка на Node.js

## 1. Затворете и отворете PowerShell като Administrator

## 2. Инсталирайте Node.js 22 LTS (препоръчвам):
```powershell
nvm install 22.12.0
nvm use 22.12.0
```

## 3. Или инсталирайте по-нова версия:
```powershell
nvm install latest
nvm use latest
```

## 4. Проверете версията:
```powershell
node --version
npm --version
```

## 5. Рестартирайте VS Code и стартирайте проекта:
```powershell
npm run dev
```

---

## Алтернатива: Директна инсталация без nvm

Ако nvm не работи, изтеглете директно от:
https://nodejs.org/

Изберете:
- **LTS версия** (препоръчвам): Node.js 22.x
- Или **Current**: най-новата версия

След инсталацията рестартирайте VS Code.
