#!/bin/zsh
set -e
cd "$(dirname "$0")"

printf '\nПроверяем исходники...\n'
grep -n "Сгенерировать фразу" "app/(tabs)/index.tsx"

printf '\nПроверяем конфигурацию Expo...\n'
npx expo config --json >/tmp/seedvault-v110-expo-config.json

printf '\nЗапускаем чистую отдельную APK-сборку...\n'
eas build --platform android --profile clean-v110-apk --clear-cache
