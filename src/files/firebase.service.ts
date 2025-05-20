import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.join(
  __dirname,
  '../../firebase-service-account.json',
);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

@Injectable()
export class FirebaseService {
  private bucket;

  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: 'gs://shop-2nd-hand.appspot.com',
    });

    this.bucket = admin.storage().bucket();
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileName = Date.now();
    const fileUpload = this.bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => reject(err));
      blobStream.on('finish', async () => {
        try {
          await fileUpload.makePublic();
          const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
          resolve(publicUrl);
        } catch (error) {
          reject(error);
        }
      });
      blobStream.end(file.buffer);
    });
  }
}
