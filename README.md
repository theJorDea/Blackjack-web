# Blackjack Game

React-приложение Blackjack с возможностью игры против дилера. Также доступна автономная HTML-версия.

## Демо

Играть онлайн: [https://theJorDea.github.io/Blackjack-web](https://theJorDea.github.io/Blackjack-web)

## Автономная версия

Для игры без установки Node.js просто откройте файл `blackjack-standalone.html` в любом современном браузере.

## Запуск локально (React-версия)

**Требования:**  Node.js

1. Клонируйте репозиторий:
   ```
   git clone https://github.com/theJorDea/Blackjack-web.git
   cd Blackjack-web
   ```

2. Установите зависимости:
   ```
   npm install
   ```

3. Создайте файл `.env.local` и добавьте ваш Gemini API ключ (опционально):
   ```
   GEMINI_API_KEY=ваш_ключ_здесь
   ```

4. Запустите приложение в режиме разработки:
   ```
   npm run dev
   ```

5. Откройте [http://localhost:5173](http://localhost:5173) в браузере

## Деплой на GitHub Pages

1. Установите gh-pages пакет:
   ```
   npm install --save-dev gh-pages
   ```

2. Обновите package.json (уже обновлен в этом репозитории)
   ```json
   {
     "homepage": "https://theJorDea.github.io/Blackjack-web",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. Деплой вручную:
   ```
   npm run deploy
   ```

Или просто сделайте push в ветку master, и GitHub Actions автоматически выполнит деплой.
