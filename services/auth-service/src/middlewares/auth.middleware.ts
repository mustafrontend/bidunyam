import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ success: false, message: 'Server configuration error' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & { deviceId?: string };
    req.user = decoded;

    // Enforce device session matching for SELLER and CUSTOMER roles to prevent session hijacking
    if (decoded.role === 'SELLER' || decoded.role === 'CUSTOMER') {
      const clientDeviceId = req.headers['x-device-id'];
      if (!clientDeviceId || clientDeviceId !== decoded.deviceId) {
        res.status(401).json({ success: false, message: 'Invalid device session. Please log in again.' });
        return;
      }
    }

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireCustomer = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'CUSTOMER') {
    res.status(403).json({ success: false, message: 'Only customers can use favorites' });
    return;
  }

  next();
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Only super admins can access this route' });
    return;
  }

  next();
};
