## Setup

### Backend (macOS / Linux)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_from_excel --path "Copia de INVENTARIO REGION XIV 2025.xlsx"
python manage.py import_inventario_excel --path "inventariop.xlsx"
python manage.py rollback_last_import
python manage.py runserver
```

### Backend (Windows PowerShell)

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_from_excel --path "Copia de INVENTARIO REGION XIV 2025.xlsx"
python manage.py import_inventario_excel --path "inventariop.xlsx"
python manage.py rollback_last_import
python manage.py runserver
```

### Backend (Windows CMD)

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_from_excel --path "Copia de INVENTARIO REGION XIV 2025.xlsx"
python manage.py import_inventario_excel --path "inventariop.xlsx"
python manage.py rollback_last_import
python manage.py runserver
```

Si no tienes el Excel de catálogos disponible, `seed_from_excel` carga un set mínimo de respaldo para dejar operativos los combos base.

### Importación desde Excel

- Catálogos:
  `python manage.py seed_from_excel --path "Copia de INVENTARIO REGION XIV 2025.xlsx"`
- Inventario completo:
  `python manage.py import_inventario_excel --path "inventariop.xlsx"`
- Revertir el último lote importado:
  `python manage.py rollback_last_import`

También puedes importar y revertir desde la interfaz en `Configuración`, usando la tarjeta `Importación`.

### Inventario

En la vista `Inventario` existe el botón `Vaciar inventario`, que elimina:
- equipos
- asignaciones
- monitores
- mantenimientos
- historiales
- bajas

Es una acción destructiva y requiere permisos administrativos.

### Frontend (macOS / Linux / Windows)

```bash
cd frontend/mop-inventario-frontend
npm install
npm run dev
```

### Variables de entorno

- Backend: crea `.env` en la raíz con `SECRET_KEY`, `DEBUG` y credenciales PostgreSQL.
- Frontend: usa `frontend/mop-inventario-frontend/.env` con `VITE_API_URL=http://127.0.0.1:8000/api`.

### QA rápido

Ejecuta validaciones automáticas mínimas del backend:

```bash
python manage.py test core.tests
```

Estas pruebas verifican validaciones críticas de RUT/teléfono, secuencia de fechas en asignaciones/mantenciones y normalización de inventario/serie.

### Git / despliegue de cambios

Después de actualizar el proyecto:

```bash
git status
git add .
git commit -m "Update Excel import, rollback and inventory management"
git push origin <tu-rama>
```

### Pre-push checklist

Antes de subir cambios a GitHub:

```bash
# Backend
python manage.py migrate
python manage.py test core.tests

# Frontend (opcional pero recomendado)
cd frontend/mop-inventario-frontend
npm run build
```

Si todo pasa, vuelve a la raíz del proyecto y realiza `git add`, `git commit` y `git push`.
