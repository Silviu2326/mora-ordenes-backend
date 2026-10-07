# Mora · Órdenes de trabajo · API OCR

Backend Node.js para Mistral OCR 4.1. Extrae órdenes, operarios, tiempos, troqueles, unidades buenas y mermas; adapta el esquema a los tipos y listas configurados en la web. Cuando la anotación omite unidades buenas, intenta recuperarlas del Markdown de la misma respuesta, asociadas a una orden sin ambigüedad y sin una segunda llamada al proveedor. Conserva cero y no rellena blancos con mermas.

Frontend: https://github.com/Silviu2326/mora-ordenes-frontend

API publicada: https://ocr-api-production-d100.up.railway.app/api/health

## Railway

Importar este repositorio. El Dockerfile construye worker.js durante el despliegue. Configurar MISTRAL_API_KEY, ORIGIN_SECRET, FRONTEND_ORIGIN (origen HTTPS de Vercel) y PORT=8080 en Railway. ORIGIN_SECRET debe coincidir con Vercel. El acceso directo a POST /api/ocr requiere el encabezado x-origin-secret que añade el proxy de Vercel. Nunca publicar las credenciales.

## Local

Node.js 22 o posterior. Ejecutar npm run build, npm run check y npm start con las variables del entorno configuradas. No hay dependencias npm. Node no carga .env automáticamente; puede utilizarse node --env-file=.env server.mjs después de construir.

GET /api/health devuelve el estado; GET /api/example devuelve datos ficticios. POST /api/ocr recibe JSON con data_url y field_config, o example:true. Límite: 10 MB por archivo y 10 solicitudes por minuto e identidad. La clave de Mistral permanece en el servidor. No se almacenan documentos en base de datos.

La publicación del repositorio no vincula automáticamente el servicio de Railway a GitHub; el despliegue actual está gestionado mediante CLI. El ejemplo incluido es ficticio; no se publica el historial anterior ni documentos originales.
