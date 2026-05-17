# Configuración del iPhone para IntuitJourney

## ⚠️ PASOS CRÍTICOS PARA QUE FUNCIONE LA VOZ

### 1. Verificar Volumen del iPhone
- **Presiona los botones de volumen** en el costado del iPhone
- Asegúrate de que el volumen esté **AL MÁXIMO**
- **NO** estés en modo silencioso (verifica que el switch lateral NO esté en naranja)

### 2. Activar Siri (OBLIGATORIO)
En iOS, el reconocimiento de voz requiere que Siri esté activado:

1. Ve a **Ajustes** → **Siri y Buscar**
2. Activa **"Oye Siri"** o al menos **"Pulsar el botón lateral para Siri"**
3. Si nunca has configurado Siri, sigue el asistente de configuración

### 3. Dar Permisos a la App

#### Al abrir la app por primera vez:
1. Aparecerá una ventana pidiendo **permiso para el micrófono** → Toca **"Permitir"**
2. Aparecerá otra ventana pidiendo **permiso para reconocimiento de voz** → Toca **"Permitir"**

#### Si ya rechazaste los permisos antes:
1. Ve a **Ajustes** → **IntuitJourney**
2. Activa:
   - ✅ **Micrófono**
   - ✅ **Reconocimiento de voz**

### 4. Verificar Idioma del iPhone
La app habla en **Español**, así que verifica:

1. Ve a **Ajustes** → **General** → **Idioma y región**
2. Si tu iPhone está en inglés, la síntesis de voz española puede sonar diferente
3. **Opcional**: Descarga voces en español:
   - **Ajustes** → **Accesibilidad** → **Contenido leído** → **Voces**
   - Toca **Español (España)** o **Español (Latinoamérica)**
   - Descarga una voz de **Calidad mejorada**

### 5. Probar la Síntesis de Voz
Para verificar que tu iPhone puede hablar en español:

1. Ve a **Ajustes** → **Accesibilidad** → **Contenido leído**
2. Activa **"Leer pantalla"** temporalmente
3. Desliza **dos dedos desde arriba** en cualquier pantalla
4. Debería empezar a leer el contenido en voz alta
5. Si funciona, desactiva "Leer pantalla" de nuevo

### 6. Ver los Logs de Debugging

Para ver qué está pasando en la app:

1. Abre **Metro Bundler** en tu Mac (donde dice "Logs for your project...")
2. Busca mensajes que empiecen con emojis:
   - 🎬 = Splash screen
   - 👋 = Saludo
   - 🔊 = Intentando hablar
   - 🗣️ = Voz iniciada
   - ❌ = Error
   - 🎤 = Reconocimiento de voz
   - 📝 = Resultado capturado

### 7. Problemas Comunes

#### No se escucha nada:
- ✅ Verifica el volumen (paso 1)
- ✅ Verifica que NO estés en modo silencio
- ✅ Verifica que Siri esté activado (paso 2)
- ✅ Cierra y vuelve a abrir la app

#### No me escucha cuando hablo:
- ✅ Verifica permisos (paso 3)
- ✅ Asegúrate de que Siri esté activado (paso 2)
- ✅ Habla **después** de que termine de hacer la pregunta
- ✅ Habla **claro y cerca** del micrófono
- ✅ Espera a que aparezca la pantalla morada con el ícono de micrófono

#### Solo funciona a veces:
- 🔄 Reinicia la app completamente (cierra desde el selector de apps)
- 🔄 Si sigue fallando, reinicia el iPhone

### 8. Flujo Esperado

1. **Splash screen** (logo morado) - 2.5 segundos
2. **Saludo**: "Hola! Bienvenido a IntuitJourney..."
3. **Pregunta**: "¿Desde qué lugar quiere partir?"
4. **Pantalla morada con micrófono** → Habla tu ubicación
5. **Pregunta**: "¿A dónde quiere ir?"
6. **Pantalla morada con micrófono** → Habla tu destino
7. Busca y te lee las rutas

## 🆘 Si Nada Funciona

1. Desinstala completamente la app del iPhone
2. En tu Mac, ejecuta:
   ```bash
   npm run ios -- --device
   ```
3. Cuando se instale, da los permisos inmediatamente
4. Verifica que Siri esté activado
5. Sube el volumen al máximo
