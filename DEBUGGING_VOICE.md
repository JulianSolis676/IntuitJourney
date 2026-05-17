# 🔍 PASOS PARA DEBUGGING DE LA VOZ

He agregado **logs de debugging extensivos** al código para ver exactamente qué está pasando.

## ✅ Cambios Realizados

1. **Logs de debugging** con emojis para rastrear:
   - 🎬 Splash screen
   - 🔧 Inicialización del sistema de audio
   - 👋 Saludo
   - 🔊 Intentos de hablar
   - 🗣️ Cuando la voz realmente empieza
   - 🎤 Reconocimiento de voz
   - 📝 Resultados capturados
   - ❌ Errores

2. **Test de audio al inicio**: La app ahora prueba si `Speech.speak()` funciona inmediatamente al cargar

3. **Callbacks de error**: Todos los `Speech.speak()` ahora tienen callbacks `onError` para capturar fallos

## 🚀 QUÉ HACER AHORA

### Opción 1: Reinstalar la App (RECOMENDADO)

1. **Cierra la app en tu iPhone** (desliza hacia arriba desde el selector de apps)
2. **En tu Mac, ejecuta**:
   ```bash
   cd /Users/lucianita/Documents/projects/IntuitJourney
   ./reinstall.sh
   ```

3. **Cuando la app se abra en tu iPhone**:
   - Acepta los permisos de **Micrófono**
   - Acepta los permisos de **Reconocimiento de voz**
   - **VERIFICA QUE EL VOLUMEN ESTÉ AL MÁXIMO**
   - **VERIFICA QUE NO ESTÉS EN MODO SILENCIO**

4. **Mira los logs en Metro Bundler** (en tu Mac):
   - Busca mensajes que empiecen con 🔧, 🔊, 🗣️, ❌
   - Si ves `❌ Audio test failed:` → **HAY UN PROBLEMA CON EL SISTEMA DE AUDIO**
   - Si ves `✅ Audio system is working!` → **EL AUDIO FUNCIONA**

### Opción 2: Solo Recargar (Más rápido)

1. En tu iPhone, **agita el dispositivo** para abrir el menú de desarrollo
2. Toca **"Reload"**
3. Mira los logs en Metro

## 📋 CHECKLIST ANTES DE PROBAR

Verifica en tu iPhone:

- [ ] **Ajustes** → **Siri y Buscar** → **"Oye Siri"** o **"Pulsar el botón lateral para Siri"** está ACTIVADO
- [ ] **Ajustes** → **IntuitJourney** → **Micrófono** está ACTIVADO
- [ ] **Ajustes** → **IntuitJourney** → **Reconocimiento de voz** está ACTIVADO
- [ ] El **switch lateral** NO está en naranja (modo silencio)
- [ ] El **volumen** está AL MÁXIMO (presiona botones de volumen)

## 🔍 QUÉ REVISAR EN LOS LOGS

Después de abrir la app, busca en Metro los siguientes mensajes:

### ✅ Secuencia CORRECTA:
```
🔧 App mounted, testing audio system...
✅ Audio system is working!
✅ Audio test complete
🎬 Showing splash screen
⏱️ Splash timeout, fading out
✅ Splash done, starting conversation
🎤 Starting conversation, requesting permissions...
🔒 Permissions granted: true
👋 Starting greeting...
🔊 About to speak greeting...
🗣️ Speech started!
✅ Greeting speech done
```

### ❌ Si ves esto, HAY UN PROBLEMA:
```
❌ Audio test failed: [error message]
```
O
```
🔒 Permissions granted: false
```
O
```
❌ Speech error: [error message]
```

## 📞 COMPÁRTEME LOS LOGS

Después de probar, **copia y pega TODOS los logs de Metro** que empiecen con emojis (🔧, 🔊, ❌, etc.) y envíamelos para que pueda ver exactamente qué está pasando.

## 🆘 Si el Audio Test Falla

Si ves `❌ Audio test failed:` en los logs, puede ser que:

1. **Tu iPhone tiene el audio desactivado**: Verifica el switch lateral y el volumen
2. **Falta descargar la voz en español**:
   - **Ajustes** → **Accesibilidad** → **Contenido leído** → **Voces**
   - Toca **Español (España)** o **Español (Latinoamérica)**
   - Descarga una voz de **Calidad mejorada**
3. **Siri no está activado**: Ve a **Ajustes** → **Siri y Buscar** y actívalo

---

**IMPORTANTE**: El archivo [CONFIGURACION_IPHONE.md](CONFIGURACION_IPHONE.md) tiene instrucciones detalladas de configuración del iPhone.
