const { RekognitionClient, DetectFacesCommand, CompareFacesCommand } = require('@aws-sdk/client-rekognition');
const axios = require('axios');

// Initialize AWS Rekognition client
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Detect faces in an image
 * @param {Buffer} imageBuffer - Image buffer to analyze
 * @returns {Promise<Object>} - Detection result with face count and details
 */
async function detectFaces(imageBuffer) {
  try {
    const command = new DetectFacesCommand({
      Image: {
        Bytes: imageBuffer,
      },
      Attributes: ['DEFAULT'], // Can also use 'ALL' for more details
    });

    const response = await rekognitionClient.send(command);
    
    return {
      success: true,
      faceCount: response.FaceDetails.length,
      faces: response.FaceDetails,
      hasFace: response.FaceDetails.length > 0,
    };
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      success: false,
      error: error.message,
      faceCount: 0,
      hasFace: false,
    };
  }
}

/**
 * Validate that an image contains exactly one clear face
 * @param {Buffer} imageBuffer - Image buffer to validate
 * @returns {Promise<Object>} - Validation result
 */
async function validateFacePhoto(imageBuffer) {
  const detection = await detectFaces(imageBuffer);

  if (!detection.success) {
    return {
      valid: false,
      message: 'Failed to analyze image. Please try again.',
    };
  }

  if (detection.faceCount === 0) {
    return {
      valid: false,
      message: 'No face detected. Please upload a clear photo of your face.',
    };
  }

  if (detection.faceCount > 1) {
    return {
      valid: false,
      message: 'Multiple faces detected. Please upload a photo with only your face.',
    };
  }

  // Check face quality (optional - can be enhanced)
  const face = detection.faces[0];
  const confidence = face.Confidence;

  if (confidence < 90) {
    return {
      valid: false,
      message: 'Face not clear enough. Please upload a better quality photo.',
    };
  }

  return {
    valid: true,
    message: 'Face verified successfully!',
    confidence: confidence,
  };
}

/**
 * Compare two faces to check if they match
 * @param {Buffer|string} sourceImage - Source image buffer or URL (reference face)
 * @param {Buffer|string} targetImage - Target image buffer or URL (face to compare)
 * @returns {Promise<Object>} - Comparison result with similarity score
 */
async function compareFaces(sourceImage, targetImage) {
  try {
    // Helper function to get image bytes from URL or Buffer
    const getImageBytes = async (image) => {
      if (Buffer.isBuffer(image)) {
        return image;
      }
      // If it's a URL, download the image
      if (typeof image === 'string') {
        const response = await axios.get(image, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
      }
      throw new Error('Invalid image format');
    };

    const sourceBytes = await getImageBytes(sourceImage);
    const targetBytes = await getImageBytes(targetImage);

    const command = new CompareFacesCommand({
      SourceImage: { Bytes: sourceBytes },
      TargetImage: { Bytes: targetBytes },
      SimilarityThreshold: 80, // Minimum similarity threshold (0-100)
    });

    const response = await rekognitionClient.send(command);

    if (response.FaceMatches && response.FaceMatches.length > 0) {
      const match = response.FaceMatches[0];
      return {
        success: true,
        isMatch: true,
        similarity: match.Similarity,
        confidence: match.Face.Confidence,
      };
    }

    // No match found
    return {
      success: true,
      isMatch: false,
      similarity: 0,
      message: 'Faces do not match.',
    };

  } catch (error) {
    console.error('Face comparison error:', error);
    return {
      success: false,
      error: error.message,
      isMatch: false,
    };
  }
}

/**
 * Verify that a profile photo matches the reference verification photo
 * @param {string} referencePhotoUrl - URL of the reference verification photo
 * @param {Buffer} profilePhotoBuffer - Buffer of the profile photo to verify
 * @returns {Promise<Object>} - Verification result
 */
async function verifyProfilePhoto(referencePhotoUrl, profilePhotoBuffer) {
  // First, validate that the profile photo has a face
  const validation = await validateFacePhoto(profilePhotoBuffer);
  
  if (!validation.valid) {
    return {
      valid: false,
      message: validation.message,
    };
  }

  // Then compare the faces
  const comparison = await compareFaces(referencePhotoUrl, profilePhotoBuffer);

  if (!comparison.success) {
    return {
      valid: false,
      message: 'Failed to compare faces. Please try again.',
    };
  }

  if (!comparison.isMatch) {
    return {
      valid: false,
      message: 'This photo does not match your verification photo. Please upload a photo of yourself.',
    };
  }

  // Check similarity threshold (can be adjusted)
  if (comparison.similarity < 85) {
    return {
      valid: false,
      message: `Face similarity too low (${comparison.similarity.toFixed(1)}%). Please upload a clearer photo of yourself.`,
    };
  }

  return {
    valid: true,
    message: 'Profile photo verified successfully!',
    similarity: comparison.similarity,
  };
}

module.exports = {
  rekognitionClient,
  detectFaces,
  validateFacePhoto,
  compareFaces,
  verifyProfilePhoto,
};
