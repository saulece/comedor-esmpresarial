# Configuración de Firebase para Comedor Empresarial

Este documento proporciona instrucciones detalladas para configurar Firebase en el proyecto Comedor Empresarial.

## Requisitos previos

- Cuenta de Google
- Navegador web moderno
- Acceso a Internet

## Paso 1: Crear un proyecto en Firebase

1. Visita la [consola de Firebase](https://console.firebase.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Agregar proyecto"
4. Ingresa "Comedor Empresarial" como nombre del proyecto
5. Acepta los términos de Firebase
6. Haz clic en "Continuar"
7. Desactiva Google Analytics si no lo necesitas o configúralo según tus preferencias
8. Haz clic en "Crear proyecto"
9. Espera a que se complete la creación del proyecto

## Paso 2: Registrar la aplicación web

1. En la página de inicio del proyecto, haz clic en el icono de la web (</>) para agregar una aplicación web
2. Ingresa "Comedor Empresarial Web" como nombre de la aplicación
3. No es necesario configurar Firebase Hosting por ahora
4. Haz clic en "Registrar aplicación"
5. Se mostrarán los detalles de configuración de Firebase. Copia estos valores para usarlos más adelante:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

## Paso 3: Configurar Firestore Database

1. En el menú lateral izquierdo, haz clic en "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de prueba" para desarrollo inicial
4. Haz clic en "Siguiente"
5. Selecciona la ubicación más cercana a tus usuarios (por ejemplo, "us-central")
6. Haz clic en "Habilitar"

## Paso 4: Configurar reglas de seguridad para Firestore

1. En la sección "Firestore Database", ve a la pestaña "Reglas"
2. Reemplaza las reglas predeterminadas con las reglas definidas en el archivo `firestore.rules` del proyecto
3. Haz clic en "Publicar"

## Paso 5: Configurar Authentication

1. En el menú lateral izquierdo, haz clic en "Authentication"
2. Haz clic en "Comenzar"
3. En la pestaña "Sign-in method", habilita el proveedor "Correo electrónico/contraseña"
4. Haz clic en "Guardar"

## Paso 6: Configurar la aplicación web

1. Abre el archivo `js/firebase-config.js` en un editor de texto
2. Reemplaza los valores de la configuración con los que copiaste en el Paso 2:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

3. Guarda el archivo

## Paso 7: Configurar desde la interfaz web

1. Abre la aplicación en tu navegador
2. Ve a la página "Configuración de Firebase" desde el menú principal
3. Ingresa los mismos valores de configuración que usaste en el Paso 6
4. Haz clic en "Guardar Configuración"
5. Haz clic en "Probar Conexión" para verificar que la conexión con Firebase funciona correctamente

## Paso 8: Migrar datos existentes

1. En la página "Configuración de Firebase", ve a la sección "Migración de Datos"
2. Inicia sesión con una cuenta de administrador
3. Haz clic en "Migrar Datos" para transferir los datos existentes de localStorage a Firestore
4. Espera a que se complete la migración
5. Haz clic en "Verificar Migración" para asegurarte de que todos los datos se migraron correctamente

## Solución de problemas

Si encuentras problemas durante la configuración, verifica lo siguiente:

- Asegúrate de que los valores de configuración sean exactamente los proporcionados por Firebase
- Verifica que tu navegador tenga habilitado JavaScript
- Comprueba que no haya errores en la consola del navegador (F12 > Consola)
- Asegúrate de tener una conexión a Internet estable

## Recursos adicionales

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Guía de Firestore](https://firebase.google.com/docs/firestore)
- [Guía de Authentication](https://firebase.google.com/docs/auth)
