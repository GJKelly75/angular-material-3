import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/user.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'administrator' | 'coach' | 'participant';
  };
}

export class AuthMiddleware {
  private userService: UserService;
  private readonly JWT_SECRET = process.env['JWT_SECRET']! || 'your-secret-key';

  constructor() {
    this.userService = new UserService();
  }

  authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = this.extractToken(req);
      if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
      }

      const decoded = jwt.verify(token, this.JWT_SECRET) as {
        [key: string]: string | 'administrator' | 'coach' | 'participant';
      };

      const user = await this.userService.getUserById(decoded.id);
      if (!user) {
        res.status(401).json({ message: 'Invalid token' });
        return;
      }

      req.user = {
        id: user.id,
        role: user.role
      };

      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };

  authorize = (roles: ('administrator' | 'coach' | 'participant')[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({ message: 'Insufficient permissions' });
        return;
      }

      next();
    };
  };

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
}
