import { S3 } from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import { createHash } from 'crypto';

export class FileUploadService {
  private s3: S3;
  private readonly BUCKET_NAME = process.env['S3_BUCKET_NAME'] || 'your-bucket-name';
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  constructor() {
    this.s3 = new S3({
      region: process.env['AWS_REGION'] || 'us-east-1'
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    fileType: 'profile' | 'signature'
  ): Promise<string> {
    if (!this.ALLOWED_TYPES.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG and PNG files are allowed.');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File size exceeds the 5MB limit.');
    }

    const fileHash = this.generateFileHash(file.buffer);
    const key = `${userId}/${fileType}/${fileHash}-${file.originalname}`;

    try {
      const uploadResult = await this.s3
        .upload({
          Bucket: this.BUCKET_NAME,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'private'
        })
        .promise();

      return uploadResult.Location;
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error('Failed to upload file');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = this.getKeyFromUrl(fileUrl);

    try {
      await this.s3
        .deleteObject({
          Bucket: this.BUCKET_NAME,
          Key: key
        })
        .promise();
    } catch (error) {
      console.error('File deletion failed:', error);
      throw new Error('Failed to delete file');
    }
  }

  private generateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex').substring(0, 8);
  }

  private getKeyFromUrl(fileUrl: string): string {
    const url = new URL(fileUrl);
    return decodeURIComponent(url.pathname.substring(1));
  }

  async generateSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
    const key = this.getKeyFromUrl(fileUrl);

    try {
      return this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.BUCKET_NAME,
        Key: key,
        Expires: expiresIn
      });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      throw new Error('Failed to generate file access URL');
    }
  }
}
