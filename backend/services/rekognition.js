const { RekognitionClient, IndexFacesCommand, SearchFacesByImageCommand } = require('@aws-sdk/client-rekognition');

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const COLLECTION_ID = process.env.REKOGNITION_COLLECTION_ID;

function parseImageBytes(imagen) {
  if (!imagen) {
    throw new Error('Imagen inválida');
  }

  if (typeof imagen === 'string') {
    const base64 = imagen.includes('base64,') ? imagen.split('base64,')[1] : imagen;
    return Buffer.from(base64, 'base64');
  }

  if (Buffer.isBuffer(imagen)) {
    return imagen;
  }

  throw new Error('El formato de la imagen no es soportado');
}

async function indexFace(imagen, empleadoId) {
  const imageBytes = parseImageBytes(imagen);

  const command = new IndexFacesCommand({
    CollectionId: COLLECTION_ID,
    Image: { Bytes: imageBytes },
    ExternalImageId: empleadoId,
    DetectionAttributes: [],
    QualityFilter: 'AUTO',
    MaxFaces: 1,
  });

  const response = await rekognitionClient.send(command);
  return response;
}

async function searchFace(imagen) {
  const imageBytes = parseImageBytes(imagen);

  const command = new SearchFacesByImageCommand({
    CollectionId: COLLECTION_ID,
    Image: { Bytes: imageBytes },
    FaceMatchThreshold: 95,
    MaxFaces: 1,
  });

  const response = await rekognitionClient.send(command);
  return response;
}

module.exports = {
  indexFace,
  searchFace,
};
