# Diagrama de Clases UML - Sistema de Diagramas Colaborativos

## Descripción del Sistema
Este es un software colaborativo que permite a los usuarios crear y editar diagramas de clases UML en tiempo real. Los usuarios pueden trabajar en salas compartidas donde pueden crear diagramas de manera colaborativa.

## Diagrama de Clases

```
┌─────────────────────────────┐       ┌─────────────────────────────┐       ┌─────────────────────────────┐
│           Users             │       │         Usersala            │       │           Salas             │
├─────────────────────────────┤       ├─────────────────────────────┤       ├─────────────────────────────┤
│ - id: INT (PK) 🔑          │       │ - id: INT (PK) 🔑          │       │ - id: INT (PK) 🔑          │
│ - name: VARCHAR(255)        │       │ - userId: INT (FK)          │       │ - title: VARCHAR(100)       │
│ - email: VARCHAR(255)       │       │ - salas_id: INT (FK)        │       │ - xml: TEXT                 │
│ - password: VARCHAR(255)    │       └─────────────────────────────┤       │ - description: TEXT         │
│ - eliminar: BOOLEAN         │                                     │       │ - eliminar: BOOLEAN         │
│ - createdAt: TIMESTAMP      │                                     │       │ - userId: INT (FK)          │
│ - updatedAt: TIMESTAMP      │                                     │       │ - createdAt: TIMESTAMP      │
├─────────────────────────────┤                                     │       │ - updatedAt: TIMESTAMP      │
│ + createUser()              │                                     │       ├─────────────────────────────┤
│ + getUserById()             │                                     │       │ + createSala()              │
│ + getUserByEmail()          │                                     │       │ + getSalaById()             │
│ + verifyCredentials()       │                                     │       │ + getSala()                 │
│ + updateUser()              │                                     │       │ + updateSala()              │
│ + deleteUser()              │                                     │       │ + deleteSala()              │
└─────────────────────────────┘                                     │       └─────────────────────────────┘
              │                                                     │                         │
              │ 1                                                   │                         │ 1
              │                                                     │                         │
              │     ┌─────────────────────────────┐                │                         │
              └─────┤                             ├────────────────┘                         │
                    │  **RELACIÓN MUCHOS A MUCHOS**                                          │
                    │                             │                                          │
                    │  Un usuario puede participar                                           │
                    │  en múltiples salas, y una                                            │
                    │  sala puede tener múltiples                                           │
                    │  usuarios colaboradores.                                              │
                    │                             │                                          │
                    │  La tabla intermedia        │                                          │
                    │  "Usersala" gestiona esta   │                                          │
                    │  relación M:N               │                                          │
                    └─────────────────────────────┘                                          │
                                                                                             │
              ┌──────────────────────────────────────────────────────────────────────────────┘
              │ 1..N (Una sala pertenece a un usuario creador)
              │
              │ **RELACIÓN UNO A MUCHOS**
              │ 
              │ Un usuario puede ser el PROPIETARIO
              │ de múltiples salas, pero cada sala
              │ tiene un único propietario (userId).
              └─ Esta es una relación diferente a la 
                 colaboración gestionada por Usersala.
```

## Relaciones Detalladas

### 1. **Users ←→ Salas** (Muchos a Muchos) - Tabla intermedia: **Usersala**
- **Cardinalidad**: M:N
- **Descripción**: Un usuario puede colaborar en múltiples salas, y una sala puede tener múltiples colaboradores
- **Tabla intermedia**: `Usersala`
  - `userId` (FK → Users.id)
  - `salas_id` (FK → Salas.id)
- **Línea de conexión**: Línea segmentada (- - - -) conectando a la tabla intermedia

### 2. **Users → Salas** (Uno a Muchos) - Relación de Propiedad
- **Cardinalidad**: 1:N  
- **Descripción**: Un usuario puede ser propietario/creador de múltiples salas, pero cada sala tiene un único propietario
- **Clave foránea**: `Salas.userId` → `Users.id`
- **Línea de conexión**: Línea sólida (———) con flecha

## Características del Sistema

### **Funcionalidades Principales:**
1. **Autenticación y Registro de Usuarios**
2. **Gestión de Salas de Trabajo**
3. **Editor de Diagramas UML Colaborativo**
4. **Sincronización en Tiempo Real**
5. **Persistencia de Diagramas (XML/JSON)**

### **Flujo del Sistema:**
1. Usuario se registra/autentica → `Users`
2. Usuario crea una sala de trabajo → `Salas`
3. Usuario invita colaboradores → `Usersala` 
4. Los colaboradores trabajan en tiempo real en la pizarra
5. Los cambios se sincronizan automáticamente

### **Tecnologías:**
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: HTML5 + JavaScript + Canvas/SVG
- **Tiempo Real**: Socket.io
- **Persistencia**: XML/JSON en base de datos

## Justificación del Diseño

La relación **muchos a muchos entre Users y Salas** a través de la tabla intermedia `Usersala` es fundamental porque:

- Permite la **colaboración múltiple**: Varios usuarios pueden trabajar simultáneamente en la misma sala
- Mantiene la **separación de responsabilidades**: 
  - `Users.id ← Salas.userId`: Identifica al propietario/creador
  - `Usersala`: Gestiona los permisos de colaboración
- Facilita la **escalabilidad**: Nuevos tipos de permisos pueden agregarse a `Usersala`
- Permite **auditoría y control**: Se puede rastrear quién tiene acceso a qué salas

Esta arquitectura es típica en sistemas colaborativos como Google Docs, Figma, Miro, etc.