import { DynamoDB } from 'aws-sdk';
import { IdGenerator } from '../utils/id-generator';
import { FileUploadService } from './file-upload.service';
import { createHash } from 'crypto';
import { Request } from 'express';

type MulterFile = Express.Multer.File;

interface UserProfile {
  id: string;
  platformId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'administrator' | 'coach' | 'participant';
  phoneNumber: string;
  idNumber: string;
  hashedPassword: string;
  isEmailVerified: boolean;
  profilePhotoUrl?: string;
  digitalSignatureUrl?: string;
  // Teacher specific fields
  subDistrict?: string;
  gradeTeaching?: string;
  subjectTeaching?: string;
  school?: string;
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export class UserService {
  private dynamoDB: DynamoDB.DocumentClient;
  private fileUploadService: FileUploadService;
  private readonly TABLE_NAME = process.env['USERS_TABLE'] || 'users';

  constructor() {
    this.dynamoDB = new DynamoDB.DocumentClient();
    this.fileUploadService = new FileUploadService();
  }

  async createUser(userData: Partial<UserProfile>, files?: {
    profilePhoto?: MulterFile;
    digitalSignature?: MulterFile;
  }): Promise<UserProfile> {
    const platformId = IdGenerator.generatePlatformId(userData.role!);
    const timestamp = new Date().toISOString();

    const userProfile: UserProfile = {
      id: createHash('sha256').update(userData.email!).digest('hex'),
      platformId,
      email: userData.email!,
      firstName: userData.firstName!,
      lastName: userData.lastName!,
      role: userData.role!,
      phoneNumber: userData.phoneNumber!,
      idNumber: userData.idNumber!,
      hashedPassword: userData.hashedPassword!,
      isEmailVerified: false,
      subDistrict: userData.subDistrict,
      gradeTeaching: userData.gradeTeaching,
      subjectTeaching: userData.subjectTeaching,
      school: userData.school,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // Handle file uploads if present
    if (files?.profilePhoto) {
      userProfile.profilePhotoUrl = await this.fileUploadService.uploadFile(
        files.profilePhoto,
        userProfile.id,
        'profile'
      );
    }

    if (files?.digitalSignature) {
      userProfile.digitalSignatureUrl = await this.fileUploadService.uploadFile(
        files.digitalSignature,
        userProfile.id,
        'signature'
      );
    }

    // Save user to DynamoDB
    try {
      await this.dynamoDB
        .put({
          TableName: this.TABLE_NAME,
          Item: userProfile,
          ConditionExpression: 'attribute_not_exists(email)'
        })
        .promise();

      return userProfile;
    } catch (error) {
      // Clean up uploaded files if user creation fails
      if (userProfile.profilePhotoUrl) {
        await this.fileUploadService.deleteFile(userProfile.profilePhotoUrl);
      }
      if (userProfile.digitalSignatureUrl) {
        await this.fileUploadService.deleteFile(userProfile.digitalSignatureUrl);
      }
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<UserProfile>, files?: {
    profilePhoto?: MulterFile;
    digitalSignature?: MulterFile;
  }): Promise<UserProfile> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Handle file updates
    if (files?.profilePhoto) {
      if (user.profilePhotoUrl) {
        await this.fileUploadService.deleteFile(user.profilePhotoUrl);
      }
      updates.profilePhotoUrl = await this.fileUploadService.uploadFile(
        files.profilePhoto,
        userId,
        'profile'
      );
    }

    if (files?.digitalSignature) {
      if (user.digitalSignatureUrl) {
        await this.fileUploadService.deleteFile(user.digitalSignatureUrl);
      }
      updates.digitalSignatureUrl = await this.fileUploadService.uploadFile(
        files.digitalSignature,
        userId,
        'signature'
      );
    }

    const updateExpression = this.buildUpdateExpression(updates);
    const timestamp = new Date().toISOString();

    try {
      const result = await this.dynamoDB
        .update({
          TableName: this.TABLE_NAME,
          Key: { id: userId },
          UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
          ExpressionAttributeValues: {
            ...this.buildExpressionAttributeValues(updates),
            ':updatedAt': timestamp
          },
          ReturnValues: 'ALL_NEW'
        })
        .promise();

      return result.Attributes as UserProfile;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new Error('Failed to update user profile');
    }
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const result = await this.dynamoDB
        .get({
          TableName: this.TABLE_NAME,
          Key: { id: userId }
        })
        .promise();

      return (result.Item as UserProfile) || null;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const result = await this.dynamoDB
        .query({
          TableName: this.TABLE_NAME,
          IndexName: 'email-index',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': email
          }
        })
        .promise();

      return (result.Items?.[0] as UserProfile) || null;
    } catch (error) {
      console.error('Failed to get user by email:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  private buildUpdateExpression(updates: Partial<UserProfile>): string {
    return Object.keys(updates)
      .map(key => `#${key} = :${key}`)
      .join(', ');
  }

  private buildExpressionAttributeValues(updates: Partial<UserProfile>): Record<string, any> {
    return Object.entries(updates).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [`:${key}`]: value
      }),
      {}
    );
  }
}
