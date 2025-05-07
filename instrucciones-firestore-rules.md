# Instrucciones para implementar las reglas de seguridad de Firestore

Para que la aplicación simplificada funcione correctamente y puedas guardar menús sin necesidad de autenticación, debes actualizar las reglas de seguridad de Firestore en la consola de Firebase. Sigue estos pasos:

1. Accede a la [consola de Firebase](https://console.firebase.google.com/) y selecciona tu proyecto "comedor-empresarial".

2. En el menú lateral izquierdo, haz clic en "Firestore Database".

3. Haz clic en la pestaña "Reglas" en la parte superior.

4. Reemplaza las reglas existentes con el siguiente código:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para la colección de menús
    match /menus/{menuId} {
      allow read, write: if true; // Todos pueden leer y escribir los menús (versión simplificada sin autenticación)
    }
    
    // Reglas para la colección de coordinadores
    match /coordinators/{coordinatorId} {
      allow read: if true; // Todos pueden leer la lista de coordinadores
      allow write: if request.auth != null && request.auth.token.admin == true; // Solo administradores pueden escribir
    }
    
    // Reglas para la colección de confirmaciones de asistencia
    match /attendanceConfirmations/{confirmationId} {
      allow read: if true; // Todos pueden leer las confirmaciones
      allow create: if request.auth != null; // Usuarios autenticados pueden crear
      allow update, delete: if request.auth != null && 
                            (request.auth.token.admin == true || 
                             resource.data.coordinatorId == request.auth.uid); // Solo el coordinador que creó o un admin puede modificar
    }
    
    // Reglas para la colección de platillos
    match /dishes/{dishId} {
      allow read: if true; // Todos pueden leer los platillos
      allow write: if request.auth != null && request.auth.token.admin == true; // Solo administradores pueden escribir
    }
    
    // Reglas para la colección de órdenes
    match /orders/{orderId} {
      allow read: if request.auth != null; // Solo usuarios autenticados pueden leer
      allow create: if request.auth != null; // Usuarios autenticados pueden crear
      allow update, delete: if request.auth != null && 
                            (request.auth.token.admin == true || 
                             resource.data.userId == request.auth.uid); // Solo el usuario que creó o un admin puede modificar
    }
  }
}
```

5. Haz clic en el botón "Publicar" para guardar los cambios.

Una vez que hayas actualizado las reglas, la aplicación simplificada podrá guardar menús sin necesidad de autenticación. Esto permitirá que los menús sean visibles desde cualquier dispositivo.

## Nota importante sobre seguridad

Esta configuración permite que cualquier persona pueda leer y escribir en la colección de menús sin necesidad de autenticación. Esto es útil para una implementación rápida y sencilla, pero ten en cuenta que no es recomendable para un entorno de producción con datos sensibles.

Si en el futuro necesitas mayor seguridad, deberías implementar la autenticación de usuarios y ajustar las reglas de seguridad en consecuencia.
