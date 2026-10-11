# Cómo compilar la caja para Android (APK)

Se hace en la laptop de Ernesto (tiene Android, Java y la clave de firma). Tarda 10–20 minutos.
La versión de Windows se compila sola en GitHub (Releases `caja-vX.Y.Z`); la de Android, todavía no.

## Lo que ya está instalado en la laptop (no tocar)
- Android SDK: `D:\Android\Sdk` (NDK `28.2.13676358`)
- Java: `C:\Program Files\Android\Android Studio\jbr`
- Clave de firma: `%APPDATA%\com.nexo.business\signing\` (`casaviva-core-release.jks` + `signing-NO-COMPARTIR.txt`).
  **Nunca subirla a GitHub ni mandarla por WhatsApp.** Con otra clave, los teléfonos no podrían actualizar sin borrar datos.

## Antes de la primera vez: Modo de desarrollador de Windows
Sin esto la compilación falla al final con "Creation symbolic link is not allowed for this system".
Windows → **Configuración → Sistema → Para programadores** (o Privacidad y seguridad → Para programadores) → activar **Modo de programador** → Sí.
Solo hay que hacerlo una vez.

## Arreglo que hay que conservar (desde la 1.0.8)
La carpeta `apps\business-pos\src-tauri\gen\` no se guarda en Git. En `gen\android\app\src\main\java\com\nexo\business\MainActivity.kt`
hay un arreglo hecho a mano: reserva el hueco de la barra de estado y de los botones del teléfono
(sin él, en Android 15+ los botones del teléfono tapan *Vender / Caja / Inventario / Más*). Si alguien
regenera Android (`tauri android init`), hay que volver a poner este bloque después de `super.onCreate(...)`:
```kotlin
val root = findViewById<View>(android.R.id.content)
ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
  val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
  view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
  WindowInsetsCompat.CONSUMED
}
```
(imports: `android.view.View`, `androidx.core.view.ViewCompat`, `androidx.core.view.WindowInsetsCompat`).

## Pasos (PowerShell, en la carpeta del proyecto)
1. Traer lo último: `git pull`
2. Subir la versión en `apps\business-pos\src-tauri\tauri.conf.json` (`"version": "1.0.X"`) si no se subió ya.
3. Ejecutar:
   ```powershell
   $env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
   $env:ANDROID_HOME="D:\Android\Sdk"
   $env:NDK_HOME="D:\Android\Sdk\ndk\28.2.13676358"
   $env:CARGO_TARGET_DIR="D:\NexoBuild\target"
   cd apps\business-pos
   npm.cmd run tauri -- android build --apk
   ```
4. El APK firmado queda en:
   `apps\business-pos\src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk`
5. Renombrarlo a `CasaViva-Caja-1.0.X.apk` y mandarlo a cada teléfono (WhatsApp o cable).

## En cada teléfono
1. Abrir el archivo y tocar **Instalar** (encima de la versión anterior: **no desinstalar**, así no se pierden las ventas sin enviar).
2. Si Android avisa de "origen desconocido", permitir solo para esa instalación.
3. Abrir la caja → Más → Sincronización: debe decir "Al día".

## Si es un equipo nuevo o se borraron los datos
La dueña crea el código en el panel: **Ajustes → Cajas → Poner una caja nueva**, y lo escriben en Más → Sincronización.
