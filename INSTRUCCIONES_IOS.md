# Instrucciones para ejecutar IntuitJourney en iPhone

## 1. Configurar Signing & Capabilities en Xcode

### Pasos:
1. Abre el proyecto en Xcode:
   ```bash
   open ios/IntuitJourney.xcworkspace
   ```

2. En Xcode, selecciona el proyecto `IntuitJourney` en el navegador izquierdo

3. Ve a la pestaña "Signing & Capabilities"

4. **Importante**: Marca la casilla "Automatically manage signing"

5. Selecciona tu **Team** (tu Apple ID personal):
   - Si no tienes un equipo, añade tu Apple ID en: Xcode > Settings > Accounts
   - Para desarrollo personal NO necesitas cuenta de pago de $99/año

6. **Cambia el Bundle Identifier** a algo único (importante):
   - En lugar de: `com.juli94.IntuitJourney`
   - Usa: `com.TU-NOMBRE.IntuitJourney` (ejemplo: `com.lucia.IntuitJourney`)
   - Esto es necesario porque cada desarrollador necesita un bundle identifier único

7. Verifica que no haya errores de signing (iconos rojos)

## 2. Configurar tu iPhone como dispositivo de desarrollo

### En tu iPhone:
1. Ve a **Ajustes > Privacidad y Seguridad > Modo Desarrollador**
2. **Activa el Modo Desarrollador** (Developer Mode)
3. El iPhone se reiniciará
4. Después del reinicio, confirma que quieres activar el modo desarrollador

### Conectar el iPhone:
1. Conecta tu iPhone al Mac con cable USB
2. En el iPhone, confía en el ordenador cuando aparezca el mensaje
3. En Xcode, selecciona tu iPhone como destino (arriba al lado del botón Play)

## 3. Confiar en el certificado de desarrollador (Primera vez)

Después de instalar la app por primera vez, en tu iPhone:

1. Ve a **Ajustes > General > Gestión de dispositivos** (o VPN y gestión de dispositivos)
2. Verás tu Apple ID listado
3. Toca en tu Apple ID
4. Toca **"Confiar en [tu Apple ID]"**
5. Confirma

Ahora podrás abrir la app normalmente.

## 4. Ejecutar la aplicación

### Opción A - Desde Xcode:
```bash
open ios/IntuitJourney.xcworkspace
```
Luego presiona el botón ▶️ (Play) en Xcode

### Opción B - Desde terminal con Expo:
```bash
npm run ios -- --device
```

## 5. Actualizar Bundle Identifier en todos los archivos

Después de cambiar el Bundle Identifier en Xcode, también actualízalo en:

### app.json:
```json
"ios": {
  "bundleIdentifier": "com.TU-NOMBRE.IntuitJourney"
}
```

## Problemas comunes y soluciones

### ❌ "Untrusted Developer"
- **Solución**: Sigue el paso 3 para confiar en el certificado

### ❌ "Developer Mode Required"
- **Solución**: Activa el Modo Desarrollador (paso 2)

### ❌ "Failed to create provisioning profile"
- **Solución**: Cambia el Bundle Identifier a uno único
- Verifica que tu Apple ID esté añadido en Xcode > Settings > Accounts

### ❌ "iPhone is busy: Preparing debugger"
- **Solución**: Espera a que el iPhone termine de procesar
- Si tarda mucho, desconecta y reconecta el iPhone

### ❌ Errores de permisos de micrófono
- **Solución**: Ya están configurados correctamente en el proyecto
- La primera vez que uses el micrófono, el sistema pedirá permiso

## Verificar que todo funciona

Cuando la app se ejecute:
1. Deberías ver la pantalla de inicio
2. Al usar la función de voz, se pedirá permiso para micrófono
3. Al usar reconocimiento de voz, se pedirá ese permiso también

## Notas importantes

- ✅ NO necesitas pagar los $99/año para desarrollo personal
- ✅ Las apps instaladas así duran 7 días, luego hay que reinstalar
- ✅ El Modo Desarrollador es un requisito de iOS 16+
- ✅ Tu proyecto ya cumple con los requisitos de privacidad de Apple
