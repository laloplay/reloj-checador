// backend/create-collection.js
require('dotenv').config(); // Carga las variables de tu archivo .env

const { RekognitionClient, CreateCollectionCommand } = require("@aws-sdk/client-rekognition");

// IMPORTANTE: Este nombre debe ser EXACTAMENTE el mismo que usaste en app.js
const COLLECTION_ID = 'empleados_reloj_checador'; 

// Configura el cliente de AWS con tus llaves del .env
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Función que ejecuta el comando
const ejecutar = async () => {
  console.log(`Intentando crear la colección: ${COLLECTION_ID}...`);
  try {
    const command = new CreateCollectionCommand({ CollectionId: COLLECTION_ID });
    const response = await rekognitionClient.send(command);
    console.log("✅ ¡Colección creada con éxito!", response);
  } catch (error) {
    // Si la colección ya existe, no es un error. ¡Está bien!
    if (error.name === 'ResourceAlreadyExistsException') {
      console.log("✅ La colección ya existe. No se necesita hacer nada.");
    } else {
      console.error("❌ Error creando la colección:", error);
    }
  }
};

ejecutar();